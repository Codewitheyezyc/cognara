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
      return NextResponse.json({ error: 'Admin account inactive' }, { status: 401 })
    }

    // 2. Parse payload
    const body = await request.json()
    const {
      postId,
      title,
      excerpt,
      content,
      coverImageUrl,
      category,
      domain,
      tags = [],
      isFeatured = false
    } = body

    if (!postId || !title || !content) {
      return NextResponse.json({ error: 'Post ID, title, and content are required' }, { status: 400 })
    }

    // 3. Fetch existing post
    const { data: post, error: fetchError } = await supabase
      .from('cognara_blog_posts')
      .select('*')
      .eq('id', postId)
      .maybeSingle()

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 })
    }

    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length
    const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200))

    // 4. Update database record
    const { data: updatedPost, error: updateError } = await supabase
      .from('cognara_blog_posts')
      .update({
        title,
        excerpt: excerpt || null,
        content,
        cover_image_url: coverImageUrl || null,
        category: category || 'general-knowledge',
        domain: domain || 'General',
        tags,
        is_featured: isFeatured,
        read_time_minutes: readTimeMinutes,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating blog post by admin:', updateError)
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
    }

    // 5. Insert audit log entry
    await supabase.from('cognara_admin_audit_log').insert({
      admin_id: adminId,
      action: 'edit_blog_post',
      target_type: 'blog_post',
      target_id: postId,
      details: { title, category, domain },
      created_at: new Date().toISOString()
    })

    return NextResponse.json({ success: true, post: updatedPost })
  } catch (err: any) {
    console.error('[Admin Blog Update API Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
