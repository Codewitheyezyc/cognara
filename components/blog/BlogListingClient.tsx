'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { LandingHeader } from '@/components/marketing/LandingHeader'
import { LandingFooter } from '@/components/marketing/LandingFooter'
import { Search, BookOpen, Clock, Tag, Award, Sparkles, Plus } from 'lucide-react'

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image_url: string | null
  author_id: string
  author_type: string
  category: string
  domain: string
  tags: string[] | null
  read_time_minutes: number
  view_count: number
  is_featured: boolean
  published_at: string
  profiles: {
    name: string | null
    avatar_url: string | null
  } | null
}

interface BlogListingClientProps {
  initialPosts: Post[]
  userId: string | null
}

const CATEGORIES = [
  { id: 'all', label: 'All Topics' },
  { id: 'learning-tips', label: 'Learning Tips' },
  { id: 'success-story', label: 'Success Stories' },
  { id: 'subject-guide', label: 'Subject Guides' },
  { id: 'product-update', label: 'Updates' }
]

const DOMAINS = [
  { id: 'all', label: 'All Domains' },
  { id: 'technology', label: 'Technology' },
  { id: 'business', label: 'Business' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'general', label: 'General' }
]

export function BlogListingClient({ initialPosts, userId }: BlogListingClientProps) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDomain, setSelectedDomain] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Empty handler since we are on an independent page, scrolling not needed
  const handleScrollToSection = () => {}

  // Image URL parser matching Supabase and Cloudinary gracefully (verbatim User Rule)
  const getImageUrl = (url: string | null) => {
    if (!url) return '/og-image.png'
    return url
  }

  // Filter posts
  const filteredPosts = initialPosts.filter((post) => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory
    const matchesDomain = selectedDomain === 'all' || post.domain?.toLowerCase() === selectedDomain.toLowerCase()
    
    const term = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !term ||
      post.title.toLowerCase().includes(term) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(term)) ||
      (post.tags && post.tags.some((t) => t.toLowerCase().includes(term)))

    return matchesCategory && matchesDomain && matchesSearch
  })

  // Identify featured hero post
  const featuredPost = filteredPosts.find((p) => p.is_featured) || filteredPosts[0]
  const listPosts = featuredPost ? filteredPosts.filter((p) => p.id !== featuredPost.id) : filteredPosts

  return (
    <div className="min-h-screen bg-bg text-text-1 flex flex-col relative transition-colors duration-200">
      {/* Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/10 to-accent/15 blur-[120px] opacity-40 animate-learning-pulse" />
        <div className="absolute bottom-[20%] right-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-accent/10 to-primary/15 blur-[100px] opacity-30" />
      </div>

      <LandingHeader
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        handleScrollToSection={handleScrollToSection}
      />

      <main className="relative z-10 max-w-6xl w-full mx-auto px-6 mt-28 sm:mt-36 flex-1 flex flex-col">
        
        {/* Title Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 text-left">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono font-bold text-primary uppercase tracking-wider">
              <Sparkles size={11} />
              <span>Cognara Insights</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black font-heading tracking-tight leading-tight text-text-1">
              Stories and lessons from people just like you.
            </h1>
            <p className="text-sm sm:text-base text-text-2 font-medium max-w-xl">
              Real stories from real learners. Find tips and lessons to help you along the way.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {userId && (
              <>
                <Link
                  href="/blog/my-posts"
                  className="h-10 px-4 inline-flex items-center justify-center rounded-xl font-bold text-xs uppercase tracking-wider border border-border bg-surface hover:bg-surface-alt text-text-1 transition-all"
                >
                  My Posts
                </Link>
                <Link
                  href="/blog/write"
                  className="h-10 px-4 inline-flex items-center justify-center rounded-xl font-bold text-xs uppercase tracking-wider bg-primary hover:bg-primary-hover text-white transition-all shadow-[0_0_12px_rgba(91,142,255,0.2)] gap-1.5"
                >
                  <Plus size={14} />
                  <span>Write a post</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 bg-surface-alt/40 border border-border/80 p-4 rounded-2xl">
          {/* Categories Horizontal Scrolling Container */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 md:pb-0 scrollbar-none select-none text-xs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-surface hover:bg-surface-alt border border-border text-text-2 hover:text-text-1'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            {/* Domain selector */}
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="h-9 px-3 bg-surface border border-border rounded-lg text-xs font-bold text-text-2 focus:text-text-1 focus:outline-none cursor-pointer"
            >
              {DOMAINS.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.label}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-3" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-4 bg-surface border border-border rounded-lg text-xs text-text-1 placeholder-text-3 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredPosts.length === 0 && (
          <div className="flex flex-col items-center justify-center p-16 border border-border/65 rounded-2xl bg-surface/30 my-8 text-center animate-page-enter">
            <BookOpen className="h-12 w-12 text-text-3 mb-4" />
            <h3 className="font-heading text-lg font-bold text-text-1">No articles found</h3>
            <p className="text-xs text-text-2 mt-1">Try relaxing your search terms or filters.</p>
          </div>
        )}

        {/* Featured Post (Hero card) */}
        {featuredPost && searchQuery.trim() === '' && (
          <div className="mb-12 animate-page-enter text-left">
            <Link href={`/blog/${featuredPost.slug}`} className="group flex flex-col lg:flex-row items-stretch border border-border hover:border-primary/30 rounded-3xl overflow-hidden bg-surface hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300">
              <div className="lg:w-7/12 relative aspect-video lg:aspect-auto min-h-[260px] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getImageUrl(featuredPost.cover_image_url)}
                  alt={featuredPost.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-primary/95 text-white text-[10px] font-mono font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                  <Award size={11} />
                  <span>Featured</span>
                </div>
              </div>
              <div className="lg:w-5/12 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] text-text-2 font-mono tracking-wider">
                    <span className="text-[#A78BFA] font-black uppercase">{featuredPost.category.replace('-', ' ')}</span>
                    <span>•</span>
                    <span className="font-bold text-text-3 uppercase">{featuredPost.domain}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-text-1 group-hover:text-primary transition-colors leading-tight">
                    {featuredPost.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-text-2 leading-relaxed font-medium">
                    {featuredPost.excerpt}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/40 text-[11px] text-text-3 font-semibold">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-surface-alt border border-border flex items-center justify-center text-xs overflow-hidden shrink-0">
                      {featuredPost.profiles?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={featuredPost.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span>👤</span>
                      )}
                    </div>
                    <span className="text-text-2 font-bold">{featuredPost.profiles?.name || 'Cognara Author'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock size={12} />
                    <span>{featuredPost.read_time_minutes} min read</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Regular Posts Grid */}
        {listPosts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20 text-left">
            {listPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group flex flex-col justify-between border border-border hover:border-primary/20 rounded-2xl overflow-hidden bg-surface hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 animate-page-enter"
              >
                <div className="space-y-4">
                  <div className="relative aspect-video overflow-hidden border-b border-border/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getImageUrl(post.cover_image_url)}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="px-5 space-y-2">
                    <div className="flex items-center gap-2 text-[9.5px] text-text-3 font-mono tracking-wider">
                      <span className="text-primary font-black uppercase">{post.category.replace('-', ' ')}</span>
                      <span>•</span>
                      <span className="font-bold uppercase">{post.domain}</span>
                    </div>
                    <h3 className="text-lg font-heading font-black tracking-tight text-text-1 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-xs text-text-2 leading-relaxed font-medium line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-4 flex items-center justify-between border-t border-border/40 mt-5 text-[10px] text-text-3 font-semibold">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-surface-alt border border-border flex items-center justify-center text-[10px] overflow-hidden shrink-0">
                      {post.profiles?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span>👤</span>
                      )}
                    </div>
                    <span className="text-text-2 font-bold">{post.profiles?.name || 'Writer'}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Clock size={11} />
                    <span>{post.read_time_minutes} min read</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </main>

      <LandingFooter />
    </div>
  )
}
