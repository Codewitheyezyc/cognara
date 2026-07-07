import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canUserWriteBlog } from '@/lib/blog/eligibility'
import { EditBlogClient } from '@/components/blog/EditBlogClient'

export const dynamic = 'force-dynamic'

interface EditBlogPageProps {
  params: Promise<{ id: string }>
}

export default async function EditBlogPage({ params }: EditBlogPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/login?redirectTo=/blog/edit/${id}`)
  }

  // 2. Fetch post and ensure user is the author
  const { data: post, error } = await supabase
    .from('cognara_blog_posts')
    .select('*')
    .eq('id', id)
    .eq('author_id', user.id)
    .maybeSingle()

  if (error || !post) {
    redirect('/blog/my-posts')
  }

  // 3. Resolve blog writing eligibility (for allowed domains etc.)
  const eligibility = await canUserWriteBlog(user.id, supabase)

  return (
    <EditBlogClient
      post={post}
      eligibility={eligibility}
      userId={user.id}
    />
  )
}
