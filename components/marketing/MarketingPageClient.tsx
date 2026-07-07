'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { LandingHeader } from '@/components/marketing/LandingHeader'
import { HeroSection } from '@/components/marketing/HeroSection'
import { ProblemSection } from '@/components/marketing/ProblemSection'
import { TestimonialsSection } from '@/components/marketing/TestimonialsSection'
import { ComparisonSection } from '@/components/marketing/ComparisonSection'
import { FinalCtaSection } from '@/components/marketing/FinalCtaSection'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { PricingSection } from '@/components/marketing/PricingSection'
import { FaqSection } from '@/components/marketing/FaqSection'
import { ContactSection } from '@/components/marketing/ContactSection'
import { LandingFooter } from '@/components/marketing/LandingFooter'

interface MarketingPageClientProps {
  featuredPosts?: any[]
}

export function MarketingPageClient({ featuredPosts = [] }: MarketingPageClientProps) {
  // Mobile Hamburger Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Custom JS smooth scroll handler to prevent default browser hash jump & Next.js scroll restoration
  const handleScrollToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  React.useEffect(() => {
    // Check if URL has a hash when page loads
    const hash = window.location.hash
    if (hash) {
      // Small delay to ensure page is fully rendered
      setTimeout(() => {
        const id = hash.replace('#', '')
        const target = document.getElementById(id)
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' })
        }
      }, 300)
    }
  }, [])

  return (
    <div id="home" className="min-h-screen bg-bg text-text-1 flex flex-col relative transition-colors duration-200">
      {/* Background container for glows to prevent overflow from creating vertical whitespace */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/10 to-accent/15 blur-[120px] opacity-60 animate-learning-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-accent/10 to-primary/15 blur-[100px] opacity-50" />
      </div>

      <LandingHeader
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        handleScrollToSection={handleScrollToSection}
      />

      <main className="relative z-10 max-w-6xl w-full mx-auto px-6 mt-12 md:mt-20 flex-1 flex flex-col justify-center">
        <HeroSection />
        <ProblemSection />
        <HowItWorks />
        <TestimonialsSection />
        <ComparisonSection />
        <PricingSection />
        {featuredPosts && featuredPosts.length > 0 && (
          <section id="blog" className="py-16 md:py-24 max-w-5xl mx-auto px-4 border-t border-border/40 scroll-mt-24 w-full">
            {/* Section header */}
            <div className="text-center mb-12">
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-text-1 tracking-tight mb-2">
                From the Cognara Blog
              </h2>
              <p className="text-text-2 text-xs sm:text-sm font-semibold">
                Real stories and lessons from real learners
              </p>
            </div>

            {/* Posts grid — 1, 2, or 3 columns */}
            <div className={`grid gap-6 ${
              featuredPosts.length === 1
                ? 'grid-cols-1 max-w-xl mx-auto'
                : featuredPosts.length === 2
                ? 'grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}>
              {featuredPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-200 hover:shadow-lg group flex flex-col h-full cursor-pointer"
                >
                  {/* Cover image */}
                  {post.cover_image_url ? (
                    <div className="relative h-48 w-full overflow-hidden bg-[#0F1629]">
                      <img
                        src={post.cover_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center border-b border-border/40">
                      <span className="text-4xl">✍️</span>
                    </div>
                  )}

                  <div className="p-5 flex flex-col flex-1 justify-between">
                    <div className="space-y-3">
                      {/* Category badge */}
                      <span className="text-[10px] text-primary font-mono font-bold uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 inline-block">
                        {post.category
                          ?.replace(/-/g, ' ')
                          ?.replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </span>

                      {/* Title */}
                      <h3 className="text-text-1 font-heading font-extrabold text-base sm:text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-text-2 text-xs leading-relaxed line-clamp-2">
                        {post.excerpt}
                      </p>
                    </div>

                    {/* Author and read time */}
                    <div className="flex items-center gap-2 pt-4 mt-4 border-t border-border/40">
                      {post.author?.avatar_url ? (
                        <img
                          src={post.author.avatar_url}
                          alt={post.author?.full_name}
                          className="w-6 h-6 rounded-full object-cover flex-shrink-0 border border-border"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold uppercase">
                            {post.author?.full_name?.charAt(0) || 'C'}
                          </span>
                        </div>
                      )}

                      <span className="text-xs text-text-1 font-bold truncate">
                        {post.author?.full_name || 'The Cognara Team'}
                      </span>

                      {post.author_type === 'community' && (
                        <span className="text-xs text-primary font-extrabold shrink-0" title="Community Writer">
                          ✓
                        </span>
                      )}

                      <span className="text-[10px] text-text-3 font-semibold uppercase tracking-wider ml-auto flex-shrink-0">
                        {post.read_time_minutes} min read
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* View all posts */}
            <div className="text-center mt-12">
              <Link
                href="/blog"
                className="inline-block bg-surface border border-border text-text-1 font-bold px-6 py-3 rounded-xl hover:border-primary transition-colors text-xs uppercase tracking-wider cursor-pointer"
              >
                Read all posts on the blog →
              </Link>
            </div>
          </section>
        )}
        <FaqSection />
        <ContactSection />
        <FinalCtaSection />
      </main>

      <LandingFooter />
    </div>
  )
}
