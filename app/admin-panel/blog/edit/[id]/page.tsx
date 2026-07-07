'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CloudinaryUpload } from '@/components/blog/CloudinaryUpload'
import { RichTextEditor } from '@/components/blog/RichTextEditor'
import { ArrowLeft, Loader2, Save } from 'lucide-react'

export default function AdminBlogEdit() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('general-knowledge')
  const [domain, setDomain] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function loadPost() {
      try {
        const supabase = createClient()
        const { data, error: fetchErr } = await supabase
          .from('cognara_blog_posts')
          .select('*')
          .eq('id', id)
          .maybeSingle()

        if (fetchErr || !data) {
          setError('Post not found.')
          router.push('/admin-panel/blog')
          return
        }

        setTitle(data.title || '')
        setExcerpt(data.excerpt || '')
        setContent(data.content || '')
        setCategory(data.category || 'general-knowledge')
        setDomain(data.domain || '')
        setCoverImageUrl(data.cover_image_url || '')
        setTagsInput(data.tags?.join(', ') || '')
        setIsFeatured(data.is_featured || false)
      } catch (err) {
        console.error(err)
        setError('Failed to retrieve post.')
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      loadPost()
    }
  }, [id, router])

  const handleAdminUpdate = async (e: React.FormEvent) => {
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
      const res = await fetch('/api/admin/blog/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: id,
          title,
          excerpt,
          content,
          coverImageUrl,
          category,
          domain: domain || 'General',
          tags,
          isFeatured
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update post.')
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'An error occurred during save.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-text-3 font-semibold">Loading post details...</span>
      </div>
    )
  }

  if (success) {
    return (
      <div className="max-w-md w-full mx-auto bg-surface border border-border/40 p-8 rounded-3xl space-y-6 text-center my-16 shadow-2xl animate-page-enter">
        <span className="text-4xl inline-block animate-bounce">🎉</span>
        <div className="space-y-2">
          <h2 className="text-text-1 font-bold text-2xl">Changes Saved!</h2>
          <p className="text-text-2 text-sm">
            Your modifications have been applied and are live on the blog.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push('/blog')}
            className="w-full h-11 bg-primary hover:bg-primary-hover text-white flex items-center justify-center rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer"
          >
            View Live Feed
          </button>
          <button
            onClick={() => router.push('/admin-panel/blog')}
            className="w-full h-11 border border-border hover:bg-surface-alt text-text-1 flex items-center justify-center rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer"
          >
            Back to Moderator List
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-page-enter text-left">
      {/* Back Link */}
      <div className="flex items-center space-x-2 text-text-2">
        <Link href="/admin-panel/blog" className="hover:text-text-1 text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer">
          <ArrowLeft size={13} />
          <span>Admin Blog</span>
        </Link>
        <span className="text-text-3 font-bold">/</span>
        <span className="text-xs font-bold uppercase tracking-wider text-text-1">Edit Post</span>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-black font-heading tracking-tight text-text-1">
          Edit Blog Post
        </h1>
        <p className="text-xs sm:text-sm text-text-3 font-semibold uppercase tracking-wider">
          Writer Studio (Administrator edit mode)
        </p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/25 p-4 rounded-xl text-xs font-bold text-rose-500">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleAdminUpdate} className="space-y-6">
        
        {/* Cover Image */}
        <CloudinaryUpload
          value={coverImageUrl}
          onChange={setCoverImageUrl}
          label="Cover Image (optional)"
        />

        {/* Title */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-text-2 uppercase tracking-wider">Title</label>
          <input
            type="text"
            required
            placeholder="Post title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-11 px-4 bg-surface border border-border rounded-xl text-sm text-text-1 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Category & Domain */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-2 uppercase tracking-wider">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-11 px-3 bg-surface border border-border rounded-xl text-sm text-text-1 focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
            >
              <option value="general-knowledge">General Knowledge</option>
              <option value="learning-tips">Learning Tips</option>
              <option value="success-story">Success Story</option>
              <option value="subject-guide">Subject Guide</option>
              <option value="product-update">Product Update</option>
              <option value="industry-insights">Industry Insights</option>
              <option value="cognara-news">Cognara News</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-2 uppercase tracking-wider">Domain (Optional)</label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full h-11 px-3 bg-surface border border-border rounded-xl text-sm text-text-1 focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
            >
              <option value="">No specific domain (general post)</option>
              <option value="Technology">Technology</option>
              <option value="Business">Business</option>
              <option value="Marketing">Marketing</option>
              <option value="Design">Design</option>
              <option value="Medicine">Medicine</option>
              <option value="Finance">Finance</option>
              <option value="Language">Language</option>
            </select>
          </div>
        </div>

        {/* Excerpt */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-text-2 uppercase tracking-wider">Short Summary</label>
          <textarea
            placeholder="Brief summary of your post..."
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            maxLength={200}
            rows={2}
            className="w-full h-20 p-4 bg-surface border border-border rounded-xl text-sm text-text-1 focus:outline-none focus:border-primary/50 transition-colors resize-none"
          />
        </div>

        {/* Tiptap Rich Text Editor */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-1 block mb-1">Your Post</label>
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Write your article here..."
          />
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

        {/* Homepage Feature Toggle */}
        <div className="flex items-center gap-3 bg-surface border border-border/40 p-4 rounded-2xl">
          <input
            type="checkbox"
            id="featured"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
          />
          <label htmlFor="featured" className="text-xs font-bold text-text-2 uppercase tracking-wider cursor-pointer select-none">
            Feature this post on the homepage
          </label>
        </div>

        {/* Submission CTA */}
        <div className="pt-6 border-t border-border/40 flex items-center justify-between">
          <p className="text-[10px] text-text-3 font-semibold uppercase tracking-wider">
            ⚡ Admin Action — Post publishes instantly on save
          </p>

          <button
            type="submit"
            disabled={isSubmitting || !title || !content}
            className="h-11 px-8 inline-flex items-center justify-center rounded-xl font-bold text-xs uppercase tracking-wider bg-primary hover:bg-primary-hover text-white transition-all shadow-[0_0_15px_rgba(91,142,255,0.25)] gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>Save Changes</span>
                <Save size={13} />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  )
}
