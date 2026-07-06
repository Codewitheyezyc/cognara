'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { LandingHeader } from '@/components/marketing/LandingHeader'
import { LandingFooter } from '@/components/marketing/LandingFooter'
import { Check, X, Star, Calendar, MessageSquare, AlertCircle, Eye, Loader2, ArrowLeft, ShieldAlert } from 'lucide-react'

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  cover_image_url: string | null
  author_id: string
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

interface AdminBlogClientProps {
  initialPosts: Post[]
  userId: string
}

export function AdminBlogClient({ initialPosts, userId }: AdminBlogClientProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'pending' | 'published' | 'rejected'>('pending')

  // Reject Modal State
  const [rejectingPostId, setRejectingPostId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  
  // Loading state mapping by post ID
  const [loadingState, setLoadingState] = useState<Record<string, boolean>>({})

  const handleScrollToSection = () => {}

  // Filter posts based on active tab
  const pendingPosts = posts.filter((p) => p.status === 'pending_review')
  const publishedPosts = posts.filter((p) => p.status === 'published')
  const rejectedPosts = posts.filter((p) => p.status === 'rejected')

  const handleAction = async (postId: string, action: 'approve' | 'reject' | 'feature', reason?: string) => {
    setLoadingState((prev) => ({ ...prev, [postId]: true }))
    try {
      const response = await fetch('/api/blog/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, action, reason }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Operation failed')

      // Update local state list
      setPosts((prevPosts) =>
        prevPosts.map((p) => (p.id === postId ? { ...p, ...data.post } : p))
      )

      if (action === 'reject') {
        setRejectingPostId(null)
        setRejectionReason('')
      }
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Action failed.')
    } finally {
      setLoadingState((prev) => ({ ...prev, [postId]: false }))
    }
  }

  const getActiveList = () => {
    if (activeTab === 'published') return publishedPosts
    if (activeTab === 'rejected') return rejectedPosts
    return pendingPosts
  }

  const activeList = getActiveList()

  return (
    <div className="min-h-screen bg-bg text-text-1 flex flex-col relative transition-colors duration-200">
      <LandingHeader
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        handleScrollToSection={handleScrollToSection}
      />

      <main className="relative z-10 max-w-4xl w-full mx-auto px-6 mt-28 sm:mt-36 flex-1 flex flex-col text-left">
        
        {/* Title Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-border/40">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs font-mono font-bold text-rose-500 uppercase tracking-wider">
              <ShieldAlert size={11} />
              <span>Admin Moderation</span>
            </div>
            <h1 className="text-3xl font-black font-heading tracking-tight text-text-1">Blog Review Dashboard</h1>
            <p className="text-xs text-text-2 font-medium">Approve, reject, or feature community and administrator posts.</p>
          </div>
          <Link
            href="/admin"
            className="h-9 px-4 inline-flex items-center justify-center rounded-xl border border-border bg-surface hover:bg-surface-alt text-text-2 hover:text-text-1 font-bold text-xs uppercase tracking-wider transition gap-1.5 cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Admin Main</span>
          </Link>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-border/60 mb-6 gap-6 select-none">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 text-xs uppercase font-extrabold tracking-wider transition-all relative cursor-pointer ${
              activeTab === 'pending'
                ? 'text-primary'
                : 'text-text-3 hover:text-text-2'
            }`}
          >
            Pending Queue ({pendingPosts.length})
            {activeTab === 'pending' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
          </button>

          <button
            onClick={() => setActiveTab('published')}
            className={`pb-3 text-xs uppercase font-extrabold tracking-wider transition-all relative cursor-pointer ${
              activeTab === 'published'
                ? 'text-primary'
                : 'text-text-3 hover:text-text-2'
            }`}
          >
            Published ({publishedPosts.length})
            {activeTab === 'published' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
          </button>

          <button
            onClick={() => setActiveTab('rejected')}
            className={`pb-3 text-xs uppercase font-extrabold tracking-wider transition-all relative cursor-pointer ${
              activeTab === 'rejected'
                ? 'text-primary'
                : 'text-text-3 hover:text-text-2'
            }`}
          >
            Rejected ({rejectedPosts.length})
            {activeTab === 'rejected' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
          </button>
        </div>

        {/* Queue Items */}
        {activeList.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 border border-border/60 rounded-3xl bg-surface/30 text-center animate-page-enter">
            <Check size={28} className="text-emerald-500 mb-3" />
            <h3 className="font-heading text-lg font-bold text-text-1">Queue is empty</h3>
            <p className="text-xs text-text-2 mt-1">No articles found in this section.</p>
          </div>
        ) : (
          <div className="space-y-4 mb-20 animate-page-enter">
            {activeList.map((post) => (
              <div
                key={post.id}
                className="flex flex-col border border-border bg-surface/80 p-5 rounded-2xl gap-4 hover:border-primary/10 transition-colors"
              >
                {/* Upper block Details */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] text-primary font-mono font-black uppercase tracking-wider">
                        {post.category.replace('-', ' ')}
                      </span>
                      <span className="text-text-3 font-mono font-bold">•</span>
                      <span className="text-[10px] text-text-3 font-mono font-bold uppercase">
                        {post.domain}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-heading font-black text-text-1 leading-snug">
                      {post.title}
                    </h3>
                    
                    {post.excerpt && (
                      <p className="text-xs text-text-2 font-medium leading-relaxed max-w-2xl">
                        {post.excerpt}
                      </p>
                    )}
                  </div>

                  {/* Author badge */}
                  <div className="flex items-center space-x-2 shrink-0 bg-surface-alt border border-border p-2.5 rounded-xl">
                    <div className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center text-xs overflow-hidden">
                      {post.profiles?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span>👤</span>
                      )}
                    </div>
                    <div className="text-left leading-none">
                      <p className="text-xs font-bold text-text-1">{post.profiles?.name || 'Writer'}</p>
                      <span className="text-[9px] text-text-3 font-semibold uppercase">{post.author_type}</span>
                    </div>
                  </div>
                </div>

                {/* Cover Image preview if available */}
                {post.cover_image_url && (
                  <div className="aspect-video w-full max-w-xs rounded-xl border border-border overflow-hidden bg-surface-alt">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={post.cover_image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Subcontent block / preview */}
                <div className="border border-border/60 bg-surface-alt/25 rounded-xl p-4">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-3">
                    <span className="text-[10px] text-text-3 font-mono font-black uppercase">Article Content Snippet</span>
                    <Link
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      className="text-[10px] text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open Preview</span>
                      <ArrowLeft className="rotate-180 h-2.5 w-2.5" />
                    </Link>
                  </div>
                  <div 
                    className="prose dark:prose-invert max-w-none text-xs line-clamp-4 leading-relaxed font-medium text-left"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                </div>

                {/* Rejection context if available */}
                {post.status === 'rejected' && post.rejection_reason && (
                  <div className="flex items-start gap-2 bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl text-xs text-rose-400">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[9px] uppercase tracking-wider mb-0.5">Rejection feedback logged:</p>
                      <p className="leading-relaxed font-medium">{post.rejection_reason}</p>
                    </div>
                  </div>
                )}

                {/* Action buttons footer */}
                <div className="flex flex-wrap items-center justify-between border-t border-border/40 pt-4 gap-4">
                  <div className="flex items-center gap-2 text-[10px] text-text-3 font-mono font-bold uppercase">
                    <Calendar size={12} />
                    <span>
                      {new Date(post.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Approve Action */}
                    {post.status === 'pending_review' && (
                      <button
                        onClick={() => handleAction(post.id, 'approve')}
                        disabled={loadingState[post.id]}
                        className="h-8 px-3.5 inline-flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
                      >
                        {loadingState[post.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Approve'}
                      </button>
                    )}

                    {/* Reject Trigger */}
                    {post.status === 'pending_review' && (
                      <button
                        onClick={() => setRejectingPostId(post.id)}
                        disabled={loadingState[post.id]}
                        className="h-8 px-3.5 inline-flex items-center justify-center rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
                      >
                        Reject
                      </button>
                    )}

                    {/* Feature Action toggle */}
                    {post.status === 'published' && (
                      <button
                        onClick={() => handleAction(post.id, 'feature')}
                        disabled={loadingState[post.id]}
                        className={`h-8 px-3.5 inline-flex items-center justify-center rounded-xl border font-bold text-xs uppercase tracking-wider transition cursor-pointer gap-1.5 disabled:opacity-50 ${
                          post.is_featured
                            ? 'bg-amber-500/10 border-amber-500/35 text-amber-500 hover:bg-amber-500/20'
                            : 'border-border bg-surface hover:bg-surface-alt text-text-2 hover:text-text-1'
                        }`}
                      >
                        <Star size={11} className={post.is_featured ? 'fill-current' : ''} />
                        <span>{post.is_featured ? 'Featured' : 'Feature'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      <LandingFooter />

      {/* Reject Modal */}
      {rejectingPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in-celebrate">
          <div className="bg-surface border border-border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left animate-modal">
            <h3 className="font-heading text-lg font-black text-text-1">Reject Submission</h3>
            <p className="text-xs text-text-2 leading-relaxed">
              Please provide feedback explaining why this post is being rejected. This feedback will be emailed to the author.
            </p>

            <textarea
              required
              placeholder="e.g. Please clarify the technical implementation details in Section 2..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full h-24 p-3 bg-surface-alt border border-border rounded-xl text-xs text-text-1 placeholder-text-3 focus:outline-none focus:border-primary/50 resize-none font-medium"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setRejectingPostId(null)
                  setRejectionReason('')
                }}
                className="h-9 px-4 border border-border hover:bg-surface-alt text-text-2 hover:text-text-1 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(rejectingPostId, 'reject', rejectionReason)}
                disabled={!rejectionReason.trim() || loadingState[rejectingPostId]}
                className="h-9 px-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
              >
                {loadingState[rejectingPostId] ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
