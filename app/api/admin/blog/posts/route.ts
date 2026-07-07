import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient as createBaseClient } from '@supabase/supabase-js'
import { batchResolveBlogPostAuthors } from '@/lib/blog/author'

export const dynamic = 'force-dynamic'

const getAdminClient = () => {
  return createBaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'placeholder_service_role_key_for_dev'
      ? process.env.SUPABASE_SERVICE_ROLE_KEY
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET() {
  try {
    // 1. Authenticate Admin Session JWT
    const cookieStore = await cookies()
    const adminToken = cookieStore.get('cognara_admin_session')?.value

    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const secretStr = process.env.ADMIN_JWT_SECRET || 'cognara_admin_fallback_secret_key_for_development_39281'
    const secret = new TextEncoder().encode(secretStr)

    try {
      await jwtVerify(adminToken, secret)
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
    }

    const supabase = getAdminClient()

    // 2. Fetch all posts joined with profile details
    const { data: posts, error: dbError } = await supabase
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

    if (dbError) {
      console.error('Database error fetching admin posts:', dbError)
      return NextResponse.json({ error: 'Failed to retrieve posts' }, { status: 500 })
    }

    // Map profile values safely
    const mappedPosts = await batchResolveBlogPostAuthors(posts || [], supabase)

    return NextResponse.json({ posts: mappedPosts })
  } catch (err: any) {
    console.error('[Admin Blog List Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
