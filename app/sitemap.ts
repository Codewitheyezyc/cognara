import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://cognaralearn.com'
  const today = new Date()

  const sitemapEntries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: today,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: today,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: today,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]

  try {
    const supabase = await createClient()
    const { data: posts } = await supabase
      .from('cognara_blog_posts')
      .select('slug, updated_at')
      .eq('status', 'published')

    if (posts) {
      posts.forEach((post) => {
        sitemapEntries.push({
          url: `${baseUrl}/blog/${post.slug}`,
          lastModified: post.updated_at ? new Date(post.updated_at) : today,
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      })
    }
  } catch (err) {
    console.error('Error generating sitemap blog entries:', err)
  }

  return sitemapEntries
}
