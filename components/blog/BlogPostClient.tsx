'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { LandingHeader } from '@/components/marketing/LandingHeader'
import { LandingFooter } from '@/components/marketing/LandingFooter'
import { Clock, Eye, Share2, MessageSquare, ArrowLeft, Check } from 'lucide-react'

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  cover_image_url: string | null
  author_id: string
  author_type: string
  category: string
  domain: string
  tags: string[] | null
  read_time_minutes: number
  view_count: number
  published_at: string | null
  created_at: string
  profiles: {
    name: string | null
    avatar_url: string | null
  } | null
}

interface BlogPostClientProps {
  post: Post
  relatedPosts: Omit<Post, 'content'>[]
}

export function BlogPostClient({ post, relatedPosts }: BlogPostClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleScrollToSection = () => {}

  // Image URL parser (verbatim User Rule)
  const getImageUrl = (url: string | null) => {
    if (!url) return '/og-image.png'
    return url
  }

  const postUrl = typeof window !== 'undefined' ? window.location.href : `https://cognaralearn.com/blog/${post.slug}`

  // Social Share handlers
  const handleCopyLink = () => {
    navigator.clipboard.writeText(postUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const shareWebAPI = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt || 'Read this article on Cognara Insights.',
          url: postUrl
        })
      } catch (err) {
        // Cancelled by user
      }
    } else {
      handleCopyLink()
    }
  }

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Draft Mode'

  return (
    <div className="min-h-screen bg-bg text-text-1 flex flex-col relative transition-colors duration-200">
      
      {/* Background container for glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/10 to-accent/15 blur-[120px] opacity-35" />
      </div>

      <LandingHeader
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        handleScrollToSection={handleScrollToSection}
      />

      <main className="relative z-10 max-w-4xl w-full mx-auto px-6 mt-28 sm:mt-36 flex-1 flex flex-col">
        
        {/* Back Button */}
        <Link
          href="/blog"
          className="inline-flex items-center space-x-2 text-text-2 hover:text-text-1 font-bold text-xs uppercase tracking-wider mb-8 transition-colors self-start cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Articles</span>
        </Link>

        {/* Article Meta Header */}
        <article className="space-y-8 text-left animate-page-enter">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono tracking-wider">
              <span className="text-[#A78BFA] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#A78BFA]/10 border border-[#A78BFA]/20">
                {post.category.replace('-', ' ')}
              </span>
              <span className="text-text-3 font-bold uppercase">•</span>
              <span className="text-text-2 font-bold uppercase">{post.domain}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black font-heading tracking-tight leading-tight text-text-1">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-base sm:text-lg text-text-2 leading-relaxed font-medium">
                {post.excerpt}
              </p>
            )}
          </div>

          {/* Author Details row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6 border-y border-border/60">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-surface-alt border border-border flex items-center justify-center text-lg overflow-hidden shrink-0">
                {post.profiles?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>👤</span>
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-text-1">{post.profiles?.name || 'Cognara Writer'}</p>
                <p className="text-[11px] text-text-3 font-semibold uppercase tracking-wider">{formattedDate}</p>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-xs text-text-3 font-mono font-bold uppercase">
              <div className="flex items-center space-x-1.5">
                <Clock size={13} />
                <span>{post.read_time_minutes} min read</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Eye size={13} />
                <span>{post.view_count || 0} views</span>
              </div>
            </div>
          </div>

          {/* Cover Image */}
          {post.cover_image_url && (
            <div className="w-full aspect-video rounded-3xl overflow-hidden border border-border bg-surface-alt/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getImageUrl(post.cover_image_url)}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content Body (Render using custom styled prose classes) */}
          <div 
            className="prose dark:prose-invert max-w-none py-6 border-b border-border/40"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Sharing Controls Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 py-8">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-text-1">Share this article</h4>
              <p className="text-xs text-text-3 font-semibold">Spread the knowledge with your colleagues.</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={shareWebAPI}
                className="p-2.5 bg-surface-alt hover:bg-border border border-border rounded-xl text-text-2 hover:text-text-1 transition cursor-pointer"
                title="Share using device options"
              >
                <Share2 size={16} />
              </button>
              
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(postUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-surface-alt hover:bg-border border border-border rounded-xl text-text-2 hover:text-text-1 transition flex items-center justify-center"
                title="Share to Twitter"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>

              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-surface-alt hover:bg-border border border-border rounded-xl text-text-2 hover:text-text-1 transition flex items-center justify-center"
                title="Share to LinkedIn"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z"/></svg>
              </a>

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${post.title} - ${postUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-surface-alt hover:bg-border border border-border rounded-xl text-text-2 hover:text-text-1 transition"
                title="Share to WhatsApp"
              >
                <MessageSquare size={16} />
              </a>

              <button
                onClick={handleCopyLink}
                className="h-10 px-4 inline-flex items-center justify-center border border-border bg-surface hover:bg-surface-alt text-text-1 font-bold text-xs uppercase tracking-wider rounded-xl transition gap-1.5 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={12} className="text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <span>Copy Link</span>
                )}
              </button>
            </div>
          </div>
        </article>

        {/* Related Posts Section */}
        {relatedPosts.length > 0 && (
          <div className="mt-16 mb-24 border-t border-border/80 pt-16 text-left animate-page-enter">
            <h3 className="text-2xl font-black font-heading text-text-1 mb-8">Related Articles</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((rPost) => (
                <Link
                  key={rPost.id}
                  href={`/blog/${rPost.slug}`}
                  className="group flex flex-col justify-between border border-border hover:border-primary/20 rounded-2xl overflow-hidden bg-surface hover:shadow-lg hover:shadow-primary/5 transition duration-300"
                >
                  <div className="space-y-3.5">
                    <div className="relative aspect-video overflow-hidden border-b border-border/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getImageUrl(rPost.cover_image_url)}
                        alt={rPost.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="px-4 space-y-1">
                      <p className="text-[9px] text-[#A78BFA] font-mono font-black uppercase tracking-wider">
                        {rPost.category.replace('-', ' ')}
                      </p>
                      <h4 className="text-sm font-heading font-black tracking-tight text-text-1 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {rPost.title}
                      </h4>
                    </div>
                  </div>

                  <div className="px-4 pb-4 pt-3 flex items-center justify-between border-t border-border/30 mt-4 text-[9.5px] text-text-3 font-semibold">
                    <span className="text-text-2 font-bold">{rPost.profiles?.name || 'Writer'}</span>
                    <div className="flex items-center space-x-1">
                      <Clock size={11} />
                      <span>{rPost.read_time_minutes} min read</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </main>

      <LandingFooter />
    </div>
  )
}
