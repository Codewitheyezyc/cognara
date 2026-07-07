import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { BlogListingClient } from '@/components/blog/BlogListingClient'
import { batchResolveBlogPostAuthors } from '@/lib/blog/author'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Blog — Cognara Learning Insights',
  description: 'Discover learning tips, success stories, and subject guides from the Cognara community and AI mentors. Achieve your goals with expert guidance.',
  openGraph: {
    title: 'Blog — Cognara Learning Insights',
    description: 'Discover learning tips, success stories, and subject guides from the Cognara community and AI mentors.',
    url: 'https://cognaralearn.com/blog',
    siteName: 'Cognara',
    type: 'website'
  }
}

export default async function BlogListingPage() {
  const supabase = await createClient()

  // 1. Fetch published blog posts from DB, joined with author profiles
  const { data: posts } = await supabase
    .from('cognara_blog_posts')
    .select(`
      id,
      title,
      slug,
      excerpt,
      cover_image_url,
      author_id,
      author_type,
      category,
      domain,
      tags,
      read_time_minutes,
      view_count,
      is_featured,
      published_at,
      profiles (
        name,
        avatar_url
      )
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  // 2. Fetch authenticated session to determine user's dashboard links
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id || null

  const mappedPosts = await batchResolveBlogPostAuthors(posts || [], supabase)

  return (
    <BlogListingClient 
      initialPosts={mappedPosts} 
      userId={userId} 
    />
  )
}
