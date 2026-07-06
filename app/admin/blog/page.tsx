import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminBlogClient } from '@/components/blog/AdminBlogClient'

export const dynamic = 'force-dynamic'

export default async function AdminBlogPage() {
  const supabase = await createClient()

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?redirectTo=/admin/blog')
  }

  // 2. Verify admin role status (either matching process.env.ADMIN_USER_ID or role === admin in profiles)
  const isAdmin =
    user.id === process.env.ADMIN_USER_ID ||
    user.id === process.env.NEXT_PUBLIC_ADMIN_USER_ID

  if (!isAdmin) {
    // Cross check profiles table tier just in case
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.subscription_tier !== 'admin') {
      redirect('/dashboard')
    }
  }

  // 3. Fetch blog posts (pending, published, and rejected)
  const { data: posts } = await supabase
    .from('cognara_blog_posts')
    .select(`
      *,
      profiles (
        name,
        email,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false })

  return (
    <AdminBlogClient 
      initialPosts={posts || []} 
      userId={user.id} 
    />
  )
}
