import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canUserWriteBlog } from '@/lib/blog/eligibility'
import { WriteBlogClient } from '@/components/blog/WriteBlogClient'

export const dynamic = 'force-dynamic'

interface WriteBlogPageProps {
  searchParams: Promise<{ title?: string }>
}

export default async function WriteBlogPage({ searchParams }: WriteBlogPageProps) {
  const { title } = await searchParams
  const supabase = await createClient()

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?redirectTo=/blog/write')
  }

  // 2. Resolve blog writing eligibility
  const eligibility = await canUserWriteBlog(user.id, supabase)

  return (
    <WriteBlogClient 
      eligibility={eligibility} 
      initialTitle={title || ''} 
      userId={user.id} 
    />
  )
}
