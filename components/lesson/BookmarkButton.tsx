'use client'

import React, { useState } from 'react'
import { Bookmark, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'

interface BookmarkButtonProps {
  lessonId: string
  lessonTitle: string
  sectionIndex: number
  sectionHeading: string
  sectionBody: string
  userId: string
  initialBookmark: any
  onBookmarkChange: (newBookmark: any) => void
  /** 'absolute' = fixed top-right overlay (default). 'inline' = renders inside a flex row, no absolute positioning. */
  variant?: 'absolute' | 'inline'
}

export function BookmarkButton({
  lessonId,
  lessonTitle,
  sectionIndex,
  sectionHeading,
  sectionBody,
  userId,
  initialBookmark,
  onBookmarkChange,
  variant = 'absolute',
}: BookmarkButtonProps) {
  const supabase = createClient()
  const { toast } = useToast()
  
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isBookmarked = !!initialBookmark

  const handleIconClick = async () => {
    if (isBookmarked) {
      // Toggle off: Delete bookmark
      setIsDeleting(true)
      try {
        const { error } = await supabase
          .from('lesson_bookmarks')
          .delete()
          .eq('id', initialBookmark.id)

        if (error) throw error

        onBookmarkChange(null)
        toast('Bookmark removed successfully')
      } catch (err) {
        console.error('Error removing bookmark:', err)
        toast('Failed to remove bookmark', 'error')
      } finally {
        setIsDeleting(false)
      }
    } else {
      // Toggle on: Open note input
      setNote('')
      setShowNoteInput(true)
    }
  }

  const handleSaveBookmark = async () => {
    setIsSaving(true)
    try {
      const { data, error } = await supabase
        .from('lesson_bookmarks')
        .insert({
          user_id: userId,
          lesson_id: lessonId,
          lesson_title: lessonTitle,
          section_index: sectionIndex,
          section_heading: sectionHeading,
          section_body: sectionBody,
          note: note.trim() || null,
        })
        .select()
        .single()

      if (error) throw error

      onBookmarkChange(data)
      setShowNoteInput(false)
      toast('Section bookmarked successfully!')
    } catch (err) {
      console.error('Error saving bookmark:', err)
      toast('Failed to save bookmark', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const inner = (
    <>
      <button
        type="button"
        onClick={handleIconClick}
        disabled={isDeleting}
        className="p-1.5 rounded-full hover:bg-surface-alt transition-colors duration-150 group cursor-pointer focus:outline-none flex items-center justify-center"
      >
        {isDeleting ? (
          <Loader2 className="h-4 w-4 animate-spin text-text-3" />
        ) : (
          <Bookmark
            className={`h-4 w-4 transition-all duration-150 ${
              isBookmarked
                ? 'fill-primary text-primary scale-110'
                : 'text-text-3 group-hover:text-text-1'
            }`}
          />
        )}
      </button>

      {showNoteInput && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setShowNoteInput(false)}
          />
          <div className="absolute right-0 top-8 mt-1 w-64 p-3 bg-surface border border-border rounded-lg shadow-xl z-40 space-y-2.5 animate-page-enter">
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-text-1">Add a note (optional)</h4>
              <p className="text-[10px] text-text-3 font-medium truncate">
                Section: &quot;{sectionHeading}&quot;
              </p>
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Think of it like a labeled box..."
              className="w-full text-xs p-2 border border-border bg-surface-alt rounded-md resize-none outline-none focus:border-primary text-text-1"
              rows={3}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNoteInput(false)}
                className="px-2.5 py-1 text-[10px] text-text-2 hover:bg-surface-alt rounded-sm cursor-pointer font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBookmark}
                disabled={isSaving}
                className="px-2.5 py-1 text-[10px] bg-primary hover:bg-primary/95 text-white rounded-sm font-semibold cursor-pointer flex items-center gap-1"
              >
                {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )

  // Inline variant: no absolute overlay — sits inside a flex row alongside other buttons
  if (variant === 'inline') {
    return <div className="relative">{inner}</div>
  }

  // Default: absolutely positioned in the top-right corner of a relative parent
  return (
    <div className="absolute top-[2px] right-2 z-20">
      {inner}
    </div>
  )
}
