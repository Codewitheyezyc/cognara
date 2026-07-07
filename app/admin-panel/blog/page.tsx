'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Check, 
  X, 
  Star, 
  Calendar, 
  Eye, 
  Loader2, 
  ArrowRight, 
  AlertCircle, 
  PlusCircle,
  RefreshCw,
  Edit
} from 'lucide-react'

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  cover_image_url: string | null
  author_type: string
  status: string
  category: string
  domain: string
  tags: string[] | null
  read_time_minutes: number
  view_count: number
  is_featured: boolean
  rejection_reason: string | null
  published_at: string | null
  created_at: string
  profiles: {
    name: string | null
    email: string | null
    avatar_url: string | null
  } | null
}

export default function AdminBlogManagement() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'published' | 'rejected'>('pending')
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null)
  
  // Rejection Modal
  const [rejectingPostId, setRejectingPostId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/blog/posts')
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts)
      } else {
        // Fallback mock posts if endpoint is not built yet
        setPosts([])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const handleAction = async (postId: string, action: 'approve' | 'reject' | 'feature', reason?: string) => {
    setLoadingActionId(postId)
    try {
      const res = await fetch('/api/admin/blog/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, action, reason }),
      })

      if (res.ok) {
        const data = await res.json()
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return { ...p, ...data.post }
          }
          if (data.unfeaturedPostId && p.id === data.unfeaturedPostId) {
            return { ...p, is_featured: false }
          }
          return p
        }))
        if (action === 'reject') {
          setRejectingPostId(null)
          setRejectionReason('')
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingActionId(null)
    }
  }

  const pending = posts.filter(p => p.status === 'pending_review')
  const published = posts.filter(p => p.status === 'published')
  const rejected = posts.filter(p => p.status === 'rejected')
  const featuredCount = published.filter(p => p.is_featured).length

  const activeList = activeTab === 'published' ? published : activeTab === 'rejected' ? rejected : pending

  return (
    <div className="space-y-8 text-left animate-page-enter relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-heading tracking-tight text-text-1">
            Blog Moderation
          </h1>
          <p className="text-xs sm:text-sm text-text-3 font-semibold uppercase tracking-wider mt-1">
            Review community drafts and manage published articles
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/admin-panel/blog/write')}
            className="h-10 px-5 inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-[0_0_15px_rgba(91,142,255,0.2)]"
          >
            <PlusCircle size={13} />
            <span>Write Article</span>
          </button>
          <button
            onClick={fetchPosts}
            className="h-10 px-4 inline-flex items-center gap-2 rounded-xl bg-surface border border-border text-text-1 hover:bg-surface-alt font-bold text-xs uppercase tracking-wider transition cursor-pointer"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/60 pb-px">
        {[
          { id: 'pending', label: 'Pending Review', count: pending.length },
          { id: 'published', label: 'Published', count: published.length },
          { id: 'rejected', label: 'Rejected', count: rejected.length },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-text-3 hover:text-text-1'
            }`}
          >
            <span>{t.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
              activeTab === t.id ? 'bg-primary/10 text-primary' : 'bg-surface border border-border text-text-2'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Featured Slots Alert Banner */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-5 py-4 flex items-center gap-3">
        <span className="text-amber-500 text-lg">★</span>
        <p className="text-amber-500 text-xs font-bold uppercase tracking-wider leading-relaxed">
          <strong>{featuredCount} of 3</strong> featured slots used on the homepage.
          {featuredCount >= 3 && (
            <span className="block sm:inline sm:ml-1 opacity-90 font-medium">
              (Featuring a new post will automatically replace the oldest featured post).
            </span>
          )}
        </p>
      </div>

      {/* Content List */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-surface border border-border/40 p-6 rounded-3xl animate-pulse space-y-4">
              <div className="h-4 w-1/4 bg-surface-alt rounded" />
              <div className="h-6 w-3/4 bg-surface-alt rounded" />
              <div className="h-3 w-1/2 bg-surface-alt rounded" />
            </div>
          ))
        ) : activeList.length === 0 ? (
          <div className="bg-surface border border-border/40 rounded-3xl p-12 text-center text-text-3 font-semibold uppercase tracking-wider flex flex-col items-center justify-center gap-2.5">
            <AlertCircle size={24} className="text-text-3" />
            <span>No articles in this queue</span>
          </div>
        ) : (
          activeList.map(post => (
            <div key={post.id} className="bg-surface border border-border/40 rounded-3xl p-6 relative group overflow-hidden hover:border-primary/20 transition-all flex flex-col md:flex-row gap-6">
              
              {/* Cover Image Preview */}
              {post.cover_image_url && (
                <div className="w-full md:w-48 aspect-video md:aspect-square rounded-2xl overflow-hidden shrink-0 border border-border/80">
                  <img src={post.cover_image_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Text Fields */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 bg-surface-alt border border-border rounded-lg font-bold text-[9px] text-text-2 uppercase tracking-wider">
                    {post.category}
                  </span>
                  <span className="px-2.5 py-1 bg-surface border border-border rounded-lg font-bold text-[9px] text-text-3 uppercase tracking-wider">
                    {post.domain}
                  </span>
                  {post.is_featured && (
                    <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/25 text-amber-400 rounded-lg font-bold text-[9px] uppercase tracking-wider flex items-center gap-1">
                      <Star size={9} fill="currentColor" />
                      <span>Featured</span>
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-heading font-black text-xl text-text-1 leading-tight group-hover:text-primary transition duration-150">
                    {post.title}
                  </h3>
                  <p className="text-text-2 text-xs leading-relaxed mt-1.5 max-w-2xl">
                    {post.excerpt || 'No short summary provided.'}
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-text-3 font-semibold uppercase tracking-wider border-t border-border/40">
                  <span>✍️ {post.profiles?.name || 'Cognara Writer'}</span>
                  <span>📅 {new Date(post.created_at).toLocaleDateString()}</span>
                  <span>⏱️ {post.read_time_minutes} min read</span>
                  <span>👁️ {post.view_count || 0} views</span>
                </div>

                {post.status === 'rejected' && post.rejection_reason && (
                  <div className="mt-3 bg-rose-500/5 border border-rose-500/15 p-3 rounded-2xl text-xs text-rose-400 font-medium">
                    <strong>Rejection reason:</strong> {post.rejection_reason}
                  </div>
                )}
              </div>

              {/* Actions panel */}
              <div className="flex md:flex-col items-center justify-end gap-2.5 shrink-0 border-t md:border-t-0 md:border-l border-border/40 pt-4 md:pt-0 md:pl-6">
                <Link
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  className="p-3 bg-surface hover:bg-surface-alt border border-border text-text-2 hover:text-text-1 rounded-xl transition cursor-pointer flex items-center justify-center"
                  title="Preview article"
                >
                  <Eye size={14} />
                </Link>

                <Link
                  href={`/admin-panel/blog/edit/${post.id}`}
                  className="p-3 bg-surface hover:bg-surface-alt border border-border text-text-2 hover:text-text-1 rounded-xl transition cursor-pointer flex items-center justify-center"
                  title="Edit article"
                >
                  <Edit size={14} />
                </Link>

                {post.status === 'pending_review' && (
                  <>
                    <button
                      onClick={() => handleAction(post.id, 'approve')}
                      disabled={loadingActionId === post.id}
                      className="p-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-xl transition cursor-pointer flex items-center justify-center disabled:opacity-50"
                      title="Approve & Publish"
                    >
                      {loadingActionId === post.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    </button>
                    <button
                      onClick={() => setRejectingPostId(post.id)}
                      className="p-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-xl transition cursor-pointer flex items-center justify-center"
                      title="Reject submission"
                    >
                      <X size={14} />
                    </button>
                  </>
                )}

                {post.status === 'published' && (
                  <button
                    onClick={() => handleAction(post.id, 'feature')}
                    disabled={loadingActionId === post.id}
                    className={`p-3 border rounded-xl transition cursor-pointer flex items-center justify-center disabled:opacity-50 ${
                      post.is_featured 
                        ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' 
                        : 'bg-surface hover:bg-surface-alt border border-border text-text-3 hover:text-text-2'
                    }`}
                    title="Toggle Homepage Feature"
                  >
                    <Star size={14} fill={post.is_featured ? 'currentColor' : 'none'} />
                  </button>
                )}
              </div>

            </div>
          ))
        )}
      </div>

      {/* Reject Modal */}
      {rejectingPostId && (() => {
        const rejectingPost = posts.find(p => p.id === rejectingPostId)
        const authorName = rejectingPost?.profiles?.name || 'Community Member'
        const quickReasons = [
          'The post is too short. Please add more detail about what you learned.',
          'The post contains inaccurate information. Please review and correct it.',
          'The post does not relate to your learning domain on Cognara.',
          'The post needs better structure. Please add headings and break it into sections.',
          'The post contains promotional content which is not allowed.',
          'The writing needs more clarity. Please simplify and explain your points better.',
        ]

        return (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface border border-border/40 max-w-lg w-full rounded-3xl p-6 shadow-2xl space-y-5 text-left animate-page-enter max-h-[90vh] overflow-y-auto">
              <div>
                <h4 className="text-text-1 font-bold text-lg">Reject Article Submission</h4>
                <p className="text-text-3 text-xs font-semibold mt-1">
                  Tell the author what needs to be changed. Be specific and helpful — they will see this message directly on their dashboard and email.
                </p>
              </div>

              {/* Post details reminder */}
              {rejectingPost && (
                <div className="bg-surface-alt/60 border border-border/40 rounded-xl p-3.5 space-y-1">
                  <p className="text-text-1 text-sm font-bold truncate">
                    &ldquo;{rejectingPost.title}&rdquo;
                  </p>
                  <p className="text-text-3 text-[10px] font-mono uppercase font-bold">
                    by {authorName}
                  </p>
                </div>
              )}

              {/* Quick reason options */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-3 uppercase tracking-wider block">
                  Quick feedback suggestions (Click to use)
                </label>
                <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {quickReasons.map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRejectionReason(r)}
                      className={`w-full text-left text-xs p-2.5 rounded-xl border transition-all duration-150 cursor-pointer font-medium
                        ${rejectionReason === r
                          ? 'border-rose-500/50 bg-rose-500/10 text-rose-400'
                          : 'border-border/40 bg-surface hover:border-rose-500/30 text-text-2 hover:text-text-1'
                        }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom feedback message */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-text-3 uppercase tracking-wider block">
                    Custom message
                  </label>
                  <span className="text-[10px] font-mono text-text-3 font-semibold">
                    {rejectionReason.length}/500
                  </span>
                </div>
                <textarea
                  placeholder="Tell the author exactly what needs to be changed..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value.slice(0, 500))}
                  rows={4}
                  className="w-full p-4 bg-surface border border-border rounded-xl text-xs text-text-1 focus:outline-none focus:border-primary/50 resize-none font-medium"
                />
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => handleAction(rejectingPostId, 'reject', rejectionReason)}
                  disabled={loadingActionId === rejectingPostId || !rejectionReason.trim()}
                  className="w-full h-11 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                >
                  {loadingActionId === rejectingPostId ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Rejecting...</span>
                    </>
                  ) : (
                    <span>Reject and Send Message</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRejectingPostId(null)
                    setRejectionReason('')
                  }}
                  className="w-full py-2 bg-transparent text-text-3 hover:text-text-2 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      })()}

    </div>
  )
}
