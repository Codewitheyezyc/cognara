'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Bookmark, Eye, Trash2, BookOpen, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'

interface BookmarkedSection {
  id: string
  user_id: string
  lesson_id: string
  lesson_title: string
  section_index: number
  section_heading: string
  section_body: string
  note: string | null
  created_at: string
}

interface GroupedLesson {
  lessonId: string
  lessonTitle: string
  bookmarks: BookmarkedSection[]
}

export default function NotesPage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [bookmarks, setBookmarks] = useState<BookmarkedSection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBookmarks() {
      try {
        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        const { data, error } = await supabase
          .from('lesson_bookmarks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setBookmarks(data || [])
      } catch (err) {
        console.error('Error fetching bookmarks:', err)
        toast('Failed to load your notes', 'error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBookmarks()
  }, [supabase, router, toast])

  const handleDeleteBookmark = async (id: string) => {
    setDeletingId(id)
    try {
      const { error } = await supabase
        .from('lesson_bookmarks')
        .delete()
        .eq('id', id)

      if (error) throw error

      setBookmarks(prev => prev.filter(b => b.id !== id))
      toast('Bookmark deleted successfully')
    } catch (err) {
      console.error('Error deleting bookmark:', err)
      toast('Failed to delete bookmark', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  // Group bookmarks by lesson
  const grouped: Record<string, GroupedLesson> = {}
  bookmarks.forEach(b => {
    if (!grouped[b.lesson_id]) {
      grouped[b.lesson_id] = {
        lessonId: b.lesson_id,
        lessonTitle: b.lesson_title,
        bookmarks: [],
      }
    }
    grouped[b.lesson_id].bookmarks.push(b)
  })
  
  const groupedLessons = Object.values(grouped)

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse max-w-4xl">
        <div className="h-8 w-48 bg-surface-alt rounded-sm" />
        <div className="h-4 w-72 bg-surface-alt rounded-sm" />
        <div className="space-y-4 mt-8">
          {[1, 2].map(i => (
            <div key={i} className="h-48 bg-surface-alt rounded-[10px] border border-border" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-page-enter max-w-4xl pb-16">
      {/* Page Heading */}
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-text-1">My Notes</h1>
        <p className="text-text-2 text-sm mt-1">
          Access your personal bookmark notes and saved key concepts from completed lessons.
        </p>
      </div>

      {groupedLessons.length === 0 ? (
        <div className="rounded-[10px] border border-border bg-surface p-12 text-center space-y-4 shadow-sm">
          <div className="inline-flex p-4 bg-primary/10 text-primary border border-primary/15 rounded-full">
            <Bookmark className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-sm font-semibold text-text-1">No bookmarked notes yet</h3>
            <p className="text-xs text-text-2 leading-relaxed">
              When reviewing your lessons, click the bookmark icon in the top right of any section to save key concepts and write personal notes.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/dashboard/path"
              className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-sm shadow-sm transition-all"
            >
              Go to Learning Path
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedLessons.map(group => (
            <div
              key={group.lessonId}
              className="rounded-[10px] border border-border bg-surface shadow-sm overflow-hidden"
            >
              {/* Lesson Header */}
              <div className="px-6 py-4 bg-surface-alt/40 border-b border-border/60 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <BookOpen className="h-4 w-4 text-primary shrink-0" strokeWidth={1.5} />
                  <h2 className="font-heading text-sm font-bold text-text-1 truncate max-w-lg">
                    {group.lessonTitle}
                  </h2>
                </div>
                <Link
                  href={`/dashboard/lesson/${group.lessonId}`}
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-bold uppercase tracking-wider cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View Lesson
                </Link>
              </div>

              {/* Saved Sections list */}
              <div className="divide-y divide-border/40">
                {group.bookmarks.map(bookmark => (
                  <div key={bookmark.id} className="p-6 space-y-4">
                    {/* Section Detail */}
                    <div className="pl-4 border-l-2 border-primary/30 space-y-1.5">
                      <h3 className="text-xs font-semibold text-text-1">
                        "{bookmark.section_heading}"
                      </h3>
                      {bookmark.section_body && (
                        <p className="text-[11px] text-text-3 leading-relaxed line-clamp-2">
                          {bookmark.section_body}...
                        </p>
                      )}
                    </div>

                    {/* User Personal Note */}
                    <div className="p-3 bg-surface-alt/30 border border-border/30 rounded-lg space-y-1">
                      <span className="text-[9px] font-semibold text-text-3 uppercase tracking-wider block">
                        Personal Note
                      </span>
                      <p className="text-xs text-text-2 italic leading-relaxed">
                        {bookmark.note || 'No note added. Bookmarked for reference.'}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleDeleteBookmark(bookmark.id)}
                        disabled={deletingId === bookmark.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-error/15 bg-error/5 hover:bg-error/10 text-error text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors disabled:opacity-50"
                      >
                        {deletingId === bookmark.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Delete Bookmark
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
