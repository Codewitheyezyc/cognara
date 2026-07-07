import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient as createBaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

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
    const { postId, action, reason } = body

    if (!postId || !action) {
      return NextResponse.json({ error: 'Post ID and action are required' }, { status: 400 })
    }

    // 3. Fetch target post
    const { data: post, error: fetchError } = await supabase
      .from('cognara_blog_posts')
      .select('*')
      .eq('id', postId)
      .maybeSingle()

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 })
    }

    // Fetch author details (if community post)
    let authorName = 'Cognara Writer'
    let authorEmail = ''
    if (post.author_id) {
      const { data: author } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', post.author_id)
        .maybeSingle()
      if (author) {
        authorName = author.name || 'Cognara Writer'
        authorEmail = author.email || ''
      }
    }

    // 4. Moderate post
    let updateFields: any = {}
    let notificationSubject = ''
    let notificationHtml = ''
    let unfeaturedPostId: string | null = null

    if (action === 'approve') {
      updateFields = {
        status: 'published',
        published_at: new Date().toISOString(),
        rejection_reason: null
      }

      notificationSubject = '🎉 Your Cognara blog post has been published!'
      notificationHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px; background: #ffffff; color: #333333;">
          <h2 style="color: #3D6AFF; border-bottom: 2px solid #eaeaea; padding-bottom: 10px;">Post Approved & Published!</h2>
          <p>Hi ${authorName},</p>
          <p>We are excited to let you know that your blog post, <strong>"${post.title}"</strong>, has been approved by the admin team and is now live on our public blog feed!</p>
          <p>You can view it now at the link below:</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://cognaralearn.com'}/blog/${post.slug}" style="display: inline-block; padding: 10px 20px; color: #ffffff; background: #3D6AFF; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 10px;">View Your Live Post</a>
          <p style="margin-top: 20px;">Keep sharing your learning insights — you are inspiring the community!</p>
        </div>
      `

      // Award "Blog Author" badge if this is their first approved post and has author_id
      if (post.author_id) {
        const { data: existingBadge } = await supabase
          .from('user_badges')
          .select('id')
          .eq('user_id', post.author_id)
          .eq('badge_key', 'blog_author')
          .maybeSingle()

        if (!existingBadge) {
          await supabase.from('user_badges').insert({
            user_id: post.author_id,
            badge_key: 'blog_author',
            badge_label: 'Blog Author',
            badge_emoji: '✍️',
            subject: 'General'
          })

          await supabase.from('cognara_pending_awards').insert({
            user_id: post.author_id,
            award_type: 'badge',
            award_data: {
              badge_key: 'blog_author',
              badge_label: 'Blog Author',
              badge_emoji: '✍️',
              badge_description: 'Published your first approved community blog post'
            },
            is_shown: false
          })
        }
      }
    } else if (action === 'reject') {
      updateFields = {
        status: 'rejected',
        rejection_reason: reason || 'Post did not meet our community publishing guidelines.'
      }

      notificationSubject = 'Update on your Cognara blog post submission'
      notificationHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px; background: #ffffff; color: #333333;">
          <h2 style="color: #F87171; border-bottom: 2px solid #eaeaea; padding-bottom: 10px;">Blog Post Update</h2>
          <p>Hi ${authorName},</p>
          <p>Thank you for submitting your post <strong>"${post.title}"</strong> to the Cognara blog.</p>
          <p>Our editorial team has reviewed your submission. Unfortunately, we cannot publish it in its current form due to the following reason:</p>
          <div style="background: #fff5f5; padding: 15px; border-left: 4px solid #F87171; font-style: italic; margin: 20px 0; border-radius: 4px; color: #c53030;">
            "${reason || 'No specific reason provided.'}"
          </div>
          <p>You can revise your post inside your writer dashboard and submit it again for review.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://cognaralearn.com'}/blog/my-posts" style="display: inline-block; padding: 10px 20px; color: #ffffff; background: #4A5272; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 10px;">Go to My Dashboard</a>
        </div>
      `
    } else if (action === 'feature') {
      const nextFeatured = !post.is_featured
      updateFields = {
        is_featured: nextFeatured
      }

      if (nextFeatured) {
        // Count currently featured posts
        const { count } = await supabase
          .from('cognara_blog_posts')
          .select('id', { count: 'exact', head: true })
          .eq('is_featured', true)
          .eq('status', 'published')

        if (count && count >= 3) {
          // Find the oldest featured post
          const { data: oldest } = await supabase
            .from('cognara_blog_posts')
            .select('id, title')
            .eq('is_featured', true)
            .eq('status', 'published')
            .order('published_at', { ascending: true })
            .limit(1)
            .maybeSingle()

          if (oldest) {
            await supabase
              .from('cognara_blog_posts')
              .update({ is_featured: false })
              .eq('id', oldest.id)

            unfeaturedPostId = oldest.id
            console.log('Auto-unfeatured oldest post:', oldest.title)
          }
        }
      }
    } else {
      return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 })
    }

    // 5. Update database record
    const { data: updatedPost, error: updateError } = await supabase
      .from('cognara_blog_posts')
      .update(updateFields)
      .eq('id', postId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating blog post:', updateError)
      return NextResponse.json({ error: 'Failed to update post status' }, { status: 500 })
    }

    // 6. Send email notification to author
    if (authorEmail && (action === 'approve' || action === 'reject') && process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: 'Cognara Editorial <editorial@cognaralearn.com>',
          to: authorEmail,
          subject: notificationSubject,
          html: notificationHtml
        })
      } catch (err: any) {
        console.error('[Resend Review Email Error]', err.message)
      }
    }

    // 7. Audit Log
    await supabase.from('cognara_admin_audit_log').insert({
      admin_id: adminId,
      action: `${action}_blog_post`,
      target_type: 'blog_post',
      target_id: postId,
      details: { action, title: post.title, reason },
      created_at: new Date().toISOString()
    })

    return NextResponse.json({ success: true, post: updatedPost, unfeaturedPostId })
  } catch (err: any) {
    console.error('[Admin Blog Review Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
