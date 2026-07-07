import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      seoTitle,
      seoDescription
    } = body

    if (!postId || !title || !content) {
      return NextResponse.json({ error: 'Post ID, title, and content are required.' }, { status: 400 })
    }

    // 3. Fetch existing post and verify ownership
    const { data: post, error: fetchError } = await supabase
      .from('cognara_blog_posts')
      .select('*')
      .eq('id', postId)
      .eq('author_id', user.id)
      .maybeSingle()

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Blog post not found or access denied.' }, { status: 404 })
    }

    // 4. Compute fields
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length
    const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200))

    let newStatus = post.status
    let clearRejection = false

    if (post.status === 'rejected') {
      newStatus = 'pending_review'
      clearRejection = true
    }

    const updateFields: any = {
      title,
      excerpt: excerpt || null,
      content,
      cover_image_url: coverImageUrl || null,
      category: category || 'learning-tips',
      domain: domain || post.domain || 'General',
      tags,
      seo_title: seoTitle || title,
      seo_description: seoDescription || excerpt || null,
      read_time_minutes: readTimeMinutes,
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    if (clearRejection) {
      updateFields.rejection_reason = null
    }

    // 5. Update DB
    const { error: updateError } = await supabase
      .from('cognara_blog_posts')
      .update(updateFields)
      .eq('id', postId)

    if (updateError) {
      console.error('Error updating blog post:', updateError)
      return NextResponse.json({ error: 'Failed to save changes.' }, { status: 500 })
    }

    // 6. Notify admin if resubmitted
    if (post.status === 'rejected' && process.env.RESEND_API_KEY) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .maybeSingle()

        const authorName = profile?.name || 'A Cognara user'

        await resend.emails.send({
          from: 'Cognara Alerts <alerts@cognaralearn.com>',
          to: 'hello@cognaralearn.com',
          subject: '📝 Blog post resubmitted after edits',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px; background: #ffffff; color: #333333;">
              <h2 style="color: #3D6AFF; border-bottom: 2px solid #eaeaea; padding-bottom: 10px;">Blog Post Resubmitted</h2>
              <p>A user has edited and resubmitted their blog post after rejection.</p>
              <p><strong>Title:</strong> ${title}</p>
              <p><strong>Author:</strong> ${authorName}</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://cognaralearn.com'}/admin-panel/blog" style="display: inline-block; padding: 10px 20px; color: #ffffff; background: #3D6AFF; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 10px;">Review in Admin Panel</a></p>
            </div>
          `
        })
      } catch (err: any) {
        console.error('[Resend Resubmit Email Error]', err.message)
      }
    }

    let successMessage = 'Your changes have been saved.'
    if (post.status === 'rejected') {
      successMessage = 'Your updated post has been submitted for review again. We will let you know when it is approved.'
    } else if (post.status === 'published') {
      successMessage = 'Your changes have been saved and are now live on the blog.'
    }

    return NextResponse.json({ success: true, message: successMessage })
  } catch (err: any) {
    console.error('[Blog Update API Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
