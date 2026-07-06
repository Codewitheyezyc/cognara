'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { LandingHeader } from '@/components/marketing/LandingHeader'
import { LandingFooter } from '@/components/marketing/LandingFooter'
import { Clock, Eye, AlertCircle, FileText, ArrowUpRight, Plus, Calendar } from 'lucide-react'

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image_url: string | null
  status: string
  category: string
  domain: string
  read_time_minutes: number
  view_count: number
  is_featured: boolean
  rejection_reason: string | null
  published_at: string | null
  created_at: string
}

interface MyPostsClientProps {
  initialPosts: Post[]
  userId: string
}

export function MyPostsClient({ initialPosts, userId }: MyPostsClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const handleScrollToSection = () => {}

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
            Published
          </span>
        )
      case 'pending_review':
        return (
          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
            Pending Review
          </span>
        )
      case 'rejected':
        return (
          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full">
            Rejected
          </span>
        )
      default:
        return (
          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-text-3 bg-surface-alt border border-border px-2.5 py-0.5 rounded-full">
            Draft
          </span>
        )
    }
  }

  return (
    <div className="min-h-screen bg-bg text-text-1 flex flex-col relative transition-colors duration-200">
      <LandingHeader
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        handleScrollToSection={handleScrollToSection}
      />

      <main className="relative z-10 max-w-4xl w-full mx-auto px-6 mt-28 sm:mt-36 flex-1 flex flex-col text-left">
        
        {/* Header Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-border/40">
          <div className="space-y-2">
            <h1 className="text-3xl font-black font-heading tracking-tight text-text-1">My Dashboard</h1>
            <p className="text-xs text-text-2 font-medium">Track your community blog posts, view counts, and approvals.</p>
          </div>
          <Link
            href="/blog/write"
            className="h-10 px-4 inline-flex items-center justify-center rounded-xl font-bold text-xs uppercase tracking-wider bg-primary hover:bg-primary-hover text-white transition-all shadow-[0_0_12px_rgba(91,142,255,0.2)] gap-1.5 self-start"
          >
            <Plus size={14} />
            <span>Write New Post</span>
          </Link>
        </div>

        {/* Posts List container */}
        {initialPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 border border-border/60 rounded-3xl bg-surface/30 text-center animate-page-enter">
            <FileText className="h-12 w-12 text-text-3 mb-4" />
            <h3 className="font-heading text-lg font-bold text-text-1">No posts found</h3>
            <p className="text-xs text-text-2 mt-1">You haven't written any posts yet. Start by sharing what you learned!</p>
          </div>
        ) : (
          <div className="space-y-4 mb-20 animate-page-enter">
            {initialPosts.map((post) => (
              <div
                key={post.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border border-border hover:border-primary/20 bg-surface/70 hover:bg-surface p-5 rounded-2xl transition duration-150"
              >
                {/* Details Section */}
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(post.status)}
                    <span className="text-[10px] text-text-3 font-mono font-bold uppercase">
                      {post.category.replace('-', ' ')}
                    </span>
                    <span className="text-text-3">•</span>
                    <span className="text-[10px] text-text-3 font-mono font-bold uppercase">
                      {post.domain}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-heading font-black text-text-1 truncate leading-tight">
                    {post.title}
                  </h3>

                  {post.status === 'rejected' && post.rejection_reason && (
                    <div className="flex items-start gap-2 bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl text-xs text-rose-400">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-[10px] uppercase tracking-wider mb-0.5">Rejection Feedback:</p>
                        <p className="leading-relaxed font-medium">{post.rejection_reason}</p>
                      </div>
                    </div>
                  )}

                  {/* Stats list */}
                  <div className="flex items-center gap-4 text-[10px] text-text-3 font-mono font-bold uppercase select-none">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>
                        {new Date(post.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{post.read_time_minutes} min read</span>
                    </div>
                    {post.status === 'published' && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Eye size={12} />
                          <span>{post.view_count || 0} views</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions Section */}
                <div className="flex items-center gap-3 shrink-0">
                  {post.status === 'published' && (
                    <Link
                      href={`/blog/${post.slug}`}
                      className="h-9 px-4 inline-flex items-center justify-center rounded-xl border border-border bg-surface-alt/45 hover:bg-border text-text-1 font-bold text-xs uppercase tracking-wider transition gap-1 cursor-pointer"
                    >
                      <span>View Live</span>
                      <ArrowUpRight size={12} />
                    </Link>
                  )}
                  {post.status === 'draft' && (
                    <Link
                      href={`/blog/write?id=${post.id}`}
                      className="h-9 px-4 inline-flex items-center justify-center rounded-xl bg-[#1E2540] hover:bg-[#2E3750] border border-border text-text-1 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                    >
                      Edit Draft
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      <LandingFooter />
    </div>
  )
}
