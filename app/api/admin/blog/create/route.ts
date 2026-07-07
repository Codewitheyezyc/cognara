import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient as createBaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const getAdminClient = () => {
  return createBaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'placeholder_service_role_key_for_dev'
      ? process.env.SUPABASE_SERVICE_ROLE_KEY
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function getReadTimeMinutes(html: string): number {
  const textOnly = html.replace(/<[^>]*>/g, ' ') // Strip tags
  const words = textOnly.trim().split(/\s+/).filter(w => w.length > 0)
  const count = words.length
  return Math.max(1, Math.ceil(count / 200)) // 200 words per minute average
}

async function generateUniqueSlug(title: string, supabase: any): Promise<string> {
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove special characters
    .replace(/[\s_-]+/g, '-') // replace spaces/underscores with dashes
    .replace(/^-+|-+$/g, '') // trim leading/trailing dashes

  let slug = baseSlug
  let count = 0
  let isUnique = false

  while (!isUnique && count < 10) {
    const checkSlug = count === 0 ? slug : `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`
    const { data } = await supabase
      .from('cognara_blog_posts')
      .select('id')
      .eq('slug', checkSlug)
      .maybeSingle()

    if (!data) {
      slug = checkSlug
      isUnique = true
    }
    count++
  }

  if (!isUnique) {
    slug = `${baseSlug}-${Date.now().toString(36)}`
  }

  return slug
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate Admin Session JWT
    const cookieStore = await cookies()
    const adminToken = cookieStore.get('cognara_admin_session')?.value

    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const secretStr = process.env.ADMIN_JWT_SECRET || 'cognara_admin_fallback_secret_key_for_development_39281'
    const secret = new TextEncoder().encode(secretStr)

    let payload: any
    try {
      const decoded = await jwtVerify(adminToken, secret)
      payload = decoded.payload
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
    }

    const adminId = payload.adminId
    const supabase = getAdminClient()

    // Verify admin is active
    const { data: admin } = await supabase
      .from('cognara_admin_users')
      .select('*')
      .eq('id', adminId)
      .eq('is_active', true)
      .maybeSingle()

    if (!admin) {
      return NextResponse.json({ error: 'Admin account inactive or deleted' }, { status: 401 })
    }

    // 2. Parse payload
    const body = await request.json()
    const {
      title,
      excerpt,
      content,
      coverImageUrl,
      category,
      domain,
      tags = [],
      isFeatured = false
    } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    // 3. Generate Slug and Read Time
    const slug = await generateUniqueSlug(title, supabase)
    const readTimeMinutes = getReadTimeMinutes(content)

    // 4. Insert Post into Database
    // Admin posts are published immediately without review
    const { data: post, error: insertError } = await supabase
      .from('cognara_blog_posts')
      .insert({
        title,
        slug,
        excerpt: excerpt || null,
        content,
        cover_image_url: coverImageUrl || null,
        author_id: null, // decoupled admin users don't have user profiles, so author_id is null
        author_type: 'admin',
        status: 'published',
        category: category || 'general-knowledge',
        domain: domain || 'General',
        tags: tags.map((t: string) => t.trim()).filter((t: string) => t.length > 0),
        seo_title: title,
        seo_description: excerpt || null,
        read_time_minutes: readTimeMinutes,
        is_featured: isFeatured,
        published_at: new Date().toISOString()
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Error inserting admin blog post:', insertError)
      return NextResponse.json({ error: 'Failed to save blog post' }, { status: 500 })
    }

    // 5. Audit Log
    await supabase.from('cognara_admin_audit_log').insert({
      admin_id: adminId,
      action: 'published_blog_post',
      target_type: 'blog_post',
      target_id: post.id,
      details: { title: post.title, category: post.category, domain: post.domain },
      created_at: new Date().toISOString()
    })

    return NextResponse.json({ success: true, post, message: 'Article published successfully' })
  } catch (err: any) {
    console.error('[Admin Blog Create Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
