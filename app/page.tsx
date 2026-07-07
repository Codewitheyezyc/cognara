import { Metadata } from 'next'
import { MarketingPageClient } from '@/components/marketing/MarketingPageClient'
import { createClient } from '@/lib/supabase/server'
import { batchResolveBlogPostAuthors } from '@/lib/blog/author'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Cognara — Your goal. Your roadmap. Your AI mentor.",
  description: "Cognara builds your personalised learning path, teaches you at your exact level, and keeps you accountable every single day until you achieve your goal. Start free.",
  keywords: [
    "AI learning platform Nigeria", "online learning Nigeria", 
    "personalised learning", "AI mentor", "learning roadmap", 
    "achieve your goals", "structured learning", "Cognara"
  ],
  openGraph: {
    title: "Cognara — Your goal. Your roadmap. Your AI mentor.",
    description: "Whatever you want to achieve, Cognara builds your personalised path and keeps you on it. Start free today.",
    url: "https://cognaralearn.com",
    siteName: "Cognara",
    images: [
      {
        url: "https://cognaralearn.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Cognara — Your goal. Your roadmap. Your AI mentor."
      }
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@CognaraLearn",
    title: "Cognara — Your goal. Your roadmap. Your AI mentor.",
    description: "Whatever you want to achieve, Cognara builds your personalised path and keeps you on it.",
    images: ["https://cognaralearn.com/og-image.png"],
  }
}

async function getFeaturedBlogPosts(supabase: any) {
  try {
    const { data: posts } = await supabase
      .from('cognara_blog_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        cover_image_url,
        category,
        read_time_minutes,
        published_at,
        author_type,
        author_id
      `)
      .eq('status', 'published')
      .eq('is_featured', true)
      .order('published_at', { ascending: false })
      .limit(3);

    if (!posts || posts.length === 0) return [];

    // Get author info for each post
    // Use the batch resolver to avoid incorrect columns (profiles.full_name) and single queries in loop
    const resolvedPosts = await batchResolveBlogPostAuthors(posts, supabase);

    return resolvedPosts.map((post: any) => ({
      ...post,
      author: {
        full_name: post.profiles?.name || 'The Cognara Team',
        avatar_url: post.profiles?.avatar_url
      }
    }));
  } catch (err) {
    console.error('Error fetching featured blog posts:', err);
    return [];
  }
}

export default async function MarketingPage() {
  const supabase = await createClient()
  const featuredPosts = await getFeaturedBlogPosts(supabase)

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Cognara",
    "url": "https://cognaralearn.com",
    "logo": "https://cognaralearn.com/logo.png",
    "description": "AI Achievement Platform that builds personalised learning roadmaps and keeps users accountable until they achieve their goals.",
    "sameAs": [
      "https://twitter.com/CognaraLearn",
      "https://linkedin.com/company/cognara-learn",
      "https://facebook.com/cognaralearn"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "hello@cognaralearn.com",
      "contactType": "customer support"
    }
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Cognara",
    "url": "https://cognaralearn.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://cognaralearn.com/blog?search={search_term}"
      },
      "query-input": "required name=search_term"
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <MarketingPageClient featuredPosts={featuredPosts} />
    </>
  )
}
