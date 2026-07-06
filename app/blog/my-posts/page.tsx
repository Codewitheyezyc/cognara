import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MyPostsClient } from '@/components/blog/MyPostsClient'

export const dynamic = 'force-dynamic'

export default async function MyPostsPage() {
  const supabase = await createClient()

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?redirectTo=/blog/my-posts')
  }

  // 2. Fetch all posts written by this user
  const { data: posts } = await supabase
    .from('cognara_blog_posts')
    .select(`
      id,
      title,
      slug,
      excerpt,
      cover_image_url,
      status,
      category,
      domain,
      read_time_minutes,
      view_count,
      is_featured,
      rejection_reason,
      published_at,
      created_at
    `)
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <MyPostsClient 
      initialPosts={posts || []} 
      userId={user.id} 
    />
  )
}
