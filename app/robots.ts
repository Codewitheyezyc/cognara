import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://cognaralearn.com'

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/blog/'],
      disallow: ['/dashboard/', '/admin/', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
