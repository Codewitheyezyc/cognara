import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BlogPostClient } from '@/components/blog/BlogPostClient'
import { getBlogPostAuthor, batchResolveBlogPostAuthors } from '@/lib/blog/author'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('cognara_blog_posts')
    .select('title, excerpt, cover_image_url')
    .eq('slug', slug)
    .maybeSingle()

  if (!post) {
    return {
      title: 'Article Not Found — Cognara Blog',
      description: 'The specified article could not be found.'
    }
  }

  const imageUrl = post.cover_image_url || 'https://cognaralearn.com/og-image.png'

  return {
    title: `${post.title} — Cognara Blog`,
    description: post.excerpt || 'Read this post on Cognara Insights.',
    openGraph: {
      title: post.title,
      description: post.excerpt || 'Read this post on Cognara Insights.',
      url: `https://cognaralearn.com/blog/${slug}`,
      siteName: 'Cognara',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title
        }
      ],
      type: 'article'
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || 'Read this post on Cognara Insights.',
      images: [imageUrl]
    }
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // 1. Fetch current post
  const { data: post } = await supabase
    .from('cognara_blog_posts')
    .select(`
      *,
      profiles (
        name,
        avatar_url
      )
    `)
    .eq('slug', slug)
    .maybeSingle()

  if (!post || (post.status !== 'published')) {
    // If not published, verify if current user is the author or admin to allow drafts preview
    const { data: { user } } = await supabase.auth.getUser()
    const isAdmin =
      user?.id === process.env.ADMIN_USER_ID ||
      user?.id === process.env.NEXT_PUBLIC_ADMIN_USER_ID

    const isAuthor = user?.id === post?.author_id

    if (!post || (!isAdmin && !isAuthor)) {
      notFound()
    }
  }

  // 2. Increment view count asynchronously in background (fail-silent)
  (async () => {
    try {
      await supabase
        .from('cognara_blog_posts')
        .update({ view_count: (post.view_count || 0) + 1 })
        .eq('id', post.id)
    } catch (e) {}
  })()

  // 3. Fetch 3 related posts (excluding current post)
  const { data: related } = await supabase
    .from('cognara_blog_posts')
    .select(`
      id,
      title,
      slug,
      excerpt,
      cover_image_url,
      category,
      domain,
      read_time_minutes,
      profiles (
        name,
        avatar_url
      )
    `)
    .eq('status', 'published')
    .neq('id', post.id)
    .or(`category.eq.${post.category},domain.eq.${post.domain}`)
    .limit(3)

  const authorData = await getBlogPostAuthor(post.author_id, post.author_type, supabase)

  const mappedPost = {
    ...post,
    profiles: authorData || { name: 'Cognara Author', avatar_url: null }
  }

  const mappedRelated = await batchResolveBlogPostAuthors(related || [], supabase)

  return (
    <BlogPostClient 
      post={mappedPost} 
      relatedPosts={mappedRelated} 
    />
  )
}
