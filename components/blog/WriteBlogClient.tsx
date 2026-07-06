'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LandingHeader } from '@/components/marketing/LandingHeader'
import { LandingFooter } from '@/components/marketing/LandingFooter'
import { RichTextEditor } from './RichTextEditor'
import { CloudinaryUpload } from './CloudinaryUpload'
import { BlogEligibilityResult } from '@/lib/blog/eligibility'
import { Lock, Award, CheckCircle2, ChevronRight, Loader2, ArrowLeft, PenTool } from 'lucide-react'

interface WriteBlogClientProps {
  eligibility: BlogEligibilityResult
  initialTitle: string
  userId: string
}

export function WriteBlogClient({ eligibility, initialTitle, userId }: WriteBlogClientProps) {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Form states
  const [title, setTitle] = useState(initialTitle)
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('learning-tips')
  const [domain, setDomain] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const handleScrollToSection = () => {}

  // Prepopulate domain choice based on allowed domains
  useEffect(() => {
    if (eligibility.eligible && eligibility.allowed_domains && eligibility.allowed_domains.length > 0) {
      setDomain(eligibility.allowed_domains[0])
    }
  }, [eligibility])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required fields.')
      return
    }

    setIsSubmitting(true)
    setError('')

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    try {
      const res = await fetch('/api/blog/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          excerpt,
          content,
          coverImageUrl,
          category,
          domain,
          tags,
          seoTitle: seoTitle || title,
          seoDescription: seoDescription || excerpt
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit article.')
      }

      setSuccessMessage(data.message)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- LOCKED RENDER: NOT ELIGIBLE ---
  if (!eligibility.eligible) {
    return (
      <div className="min-h-screen bg-bg text-text-1 flex flex-col relative transition-colors duration-200">
        <LandingHeader
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          handleScrollToSection={handleScrollToSection}
        />
        
        <main className="relative z-10 max-w-xl w-full mx-auto px-6 mt-36 flex-1 flex flex-col justify-center items-center text-center">
          {eligibility.reason === 'pro_required' ? (
            // Pro Upgrade Paywall Card
            <div className="bg-surface border border-border p-8 rounded-3xl space-y-6 shadow-2xl animate-page-enter">
              <div className="mx-auto w-14 h-14 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-center justify-center text-amber-500">
                <Lock className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="font-heading text-2xl font-black text-text-1">Unlock Writer Dashboard</h2>
                <p className="text-xs text-text-2 leading-relaxed">
                  Sharing your lessons, projects, and learning insights with the Cognara community is a Pro feature. Level up your profile to start writing.
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard/settings')}
                className="w-full h-11 bg-primary hover:bg-primary-hover text-white flex items-center justify-center rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(91,142,255,0.25)] cursor-pointer"
              >
                Upgrade to Cognara Pro
              </button>
            </div>
          ) : (
            // Phase Completion Required Card
            <div className="bg-surface border border-border p-8 rounded-3xl space-y-6 shadow-2xl animate-page-enter">
              <div className="mx-auto w-14 h-14 bg-[#5B8EFF]/10 border border-[#5B8EFF]/25 rounded-2xl flex items-center justify-center text-primary">
                <Award className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="font-heading text-2xl font-black text-text-1">Complete a Phase First</h2>
                <p className="text-xs text-text-2 leading-relaxed">
                  We keep publishing standards high by restricting blog writing to learners who have completed at least one phase in their active roadmaps.
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard/path')}
                className="w-full h-11 bg-primary hover:bg-primary-hover text-white flex items-center justify-center rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(91,142,255,0.25)] cursor-pointer"
              >
                Continue Learning
              </button>
            </div>
          )}
        </main>

        <LandingFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg text-text-1 flex flex-col relative transition-colors duration-200">
      <LandingHeader
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        handleScrollToSection={handleScrollToSection}
      />

      <main className="relative z-10 max-w-4xl w-full mx-auto px-6 mt-28 sm:mt-36 flex-1 flex flex-col">
        {success ? (
          // --- SUCCESS SCREEN ---
          <div className="max-w-md w-full mx-auto bg-surface border border-border p-8 rounded-3xl space-y-6 text-center my-16 shadow-2xl animate-page-enter">
            <div className="mx-auto w-14 h-14 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h2 className="font-heading text-2xl font-black text-text-1">Post Submitted!</h2>
              <p className="text-xs text-text-2 leading-relaxed">
                {successMessage}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push('/blog/my-posts')}
                className="w-full h-11 bg-primary hover:bg-primary-hover text-white flex items-center justify-center rounded-xl font-bold text-xs uppercase tracking-wider transition duration-150 cursor-pointer"
              >
                Manage My Posts
              </button>
              <button
                onClick={() => router.push('/blog')}
                className="w-full h-11 border border-border hover:bg-surface-alt text-text-1 flex items-center justify-center rounded-xl font-bold text-xs uppercase tracking-wider transition duration-150 cursor-pointer"
              >
                Back to Feed
              </button>
            </div>
          </div>
        ) : (
          // --- ARTICLE EDITOR FORM ---
          <div className="w-full text-left space-y-8 mb-20 animate-page-enter">
            <div className="flex items-center space-x-2 text-text-2">
              <Link href="/blog" className="hover:text-text-1 text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer">
                <ArrowLeft size={13} />
                <span>Blog</span>
              </Link>
              <span className="text-text-3 font-bold">/</span>
              <span className="text-xs font-bold uppercase tracking-wider text-text-1">Create Article</span>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono font-bold text-primary uppercase tracking-wider">
                <PenTool size={11} />
                <span>Writer Studio</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black font-heading tracking-tight text-text-1">
                Create new article
              </h1>
              <p className="text-xs sm:text-sm text-text-2 font-medium">
                Draft insights, code walkthroughs, or learning logs to share with the community.
              </p>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/25 p-4 rounded-xl text-xs font-bold text-rose-500 animate-page-enter">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Title & Category Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-text-2 uppercase tracking-wider">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter post title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-11 px-4 bg-surface border border-border rounded-xl text-sm text-text-1 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-2 uppercase tracking-wider">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-11 px-3 bg-surface border border-border rounded-xl text-sm text-text-1 focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
                  >
                    <option value="learning-tips">Learning Tips</option>
                    <option value="success-story">Success Story</option>
                    <option value="subject-guide">Subject Guide</option>
                    <option value="product-update">Product Update</option>
                  </select>
                </div>
              </div>

              {/* Domain Restriction Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-2 uppercase tracking-wider block">Domain Category</label>
                <div className="flex items-center gap-2">
                  <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="h-11 px-3 bg-surface border border-border rounded-xl text-sm text-text-1 focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
                  >
                    {eligibility.allowed_domains?.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-text-3 font-semibold uppercase tracking-wider bg-surface-alt border border-border px-3 py-2 rounded-xl">
                    🔒 Locked to your completed phase domains
                  </span>
                </div>
              </div>

              {/* Excerpt */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-2 uppercase tracking-wider">Excerpt</label>
                <textarea
                  placeholder="Summarise what this post covers..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="w-full h-20 p-4 bg-surface border border-border rounded-xl text-sm text-text-1 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                />
              </div>

              {/* Cloudinary Cover Image */}
              <CloudinaryUpload value={coverImageUrl} onChange={setCoverImageUrl} />

              {/* Custom Rich Text Editor */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-2 uppercase tracking-wider">Post Body Content</label>
                <RichTextEditor value={content} onChange={setContent} placeholder="Write about what you learned..." />
              </div>

              {/* Tags Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-2 uppercase tracking-wider">Tags</label>
                <input
                  type="text"
                  placeholder="learning, coding, backend (separated by commas)"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full h-11 px-4 bg-surface border border-border rounded-xl text-sm text-text-1 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              {/* SEO Optimisation accordion */}
              <div className="border border-border bg-surface-alt/15 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-mono font-black text-[#A78BFA] uppercase tracking-wider">
                  SEO Meta Fields (Optional)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-3 uppercase tracking-wider">SEO Title</label>
                    <input
                      type="text"
                      placeholder={title || 'Custom SEO Title'}
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      className="w-full h-10 px-4 bg-surface border border-border rounded-xl text-xs text-text-1 focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-3 uppercase tracking-wider">SEO Description</label>
                    <input
                      type="text"
                      placeholder={excerpt || 'Custom SEO Description'}
                      value={seoDescription}
                      onChange={(e) => setSeoDescription(e.target.value)}
                      className="w-full h-10 px-4 bg-surface border border-border rounded-xl text-xs text-text-1 focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>
              </div>

              {/* Submission CTA */}
              <div className="pt-6 border-t border-border flex items-center justify-between gap-4">
                <p className="text-[10px] text-text-3 font-semibold leading-relaxed max-w-sm">
                  {eligibility.author_type === 'admin'
                    ? 'Publishing as Administrator. Post will go live instantly.'
                    : 'Publishing as Community Member. Your post will go through admin review before publishing.'}
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 px-8 inline-flex items-center justify-center rounded-xl font-bold text-xs uppercase tracking-wider bg-primary hover:bg-primary-hover text-white transition-all shadow-[0_0_15px_rgba(91,142,255,0.25)] gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Article</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        )}
      </main>

      <LandingFooter />
    </div>
  )
}
