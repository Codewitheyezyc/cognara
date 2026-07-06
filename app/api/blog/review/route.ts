import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

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

    // 2. Verify admin status
    const isAdmin =
      user.id === process.env.ADMIN_USER_ID ||
      user.id === process.env.NEXT_PUBLIC_ADMIN_USER_ID

    if (!isAdmin) {
      // Cross check profiles table role just in case
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .maybeSingle()

      if (profile?.subscription_tier !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // 3. Parse request
    const body = await request.json()
    const { postId, action, reason } = body

    if (!postId || !action) {
      return NextResponse.json({ error: 'Post ID and action are required.' }, { status: 400 })
    }

    // 4. Fetch the target post
    const { data: post, error: fetchError } = await supabase
      .from('cognara_blog_posts')
      .select('*')
      .eq('id', postId)
      .maybeSingle()

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Blog post not found.' }, { status: 404 })
    }

    // Fetch author details
    const { data: author } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', post.author_id)
      .maybeSingle()

    const authorName = author?.name || 'Cognara Writer'
    const authorEmail = author?.email

    // 5. Execute moderation actions
    let updateFields: any = {}
    let notificationSubject = ''
    let notificationHtml = ''

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

      // 6. Award "Blog Author" badge if this is their first approved post
      const { data: existingBadge } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', post.author_id)
        .eq('badge_key', 'blog_author')
        .maybeSingle()

      if (!existingBadge) {
        // Insert badge
        await supabase.from('user_badges').insert({
          user_id: post.author_id,
          badge_key: 'blog_author',
          badge_label: 'Blog Author',
          badge_emoji: '✍️',
          subject: 'General'
        })

        // Queue in pending awards modal so user gets a celebration modal on dashboard
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
      // Toggle featuring flag
      updateFields = {
        is_featured: !post.is_featured
      }
    } else {
      return NextResponse.json({ error: 'Invalid action parameter.' }, { status: 400 })
    }

    // 7. Update database record
    const { data: updatedPost, error: updateError } = await supabase
      .from('cognara_blog_posts')
      .update(updateFields)
      .eq('id', postId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating blog post status:', updateError)
      return NextResponse.json({ error: 'Failed to update post status.' }, { status: 500 })
    }

    // 8. Send notification email to author if status changed
    if (authorEmail && (action === 'approve' || action === 'reject') && process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: 'Cognara Editorial <editorial@cognaralearn.com>',
          to: authorEmail,
          subject: notificationSubject,
          html: notificationHtml
        })
        console.log(`[Resend Review] Notification email sent to ${authorEmail} for action: ${action}`)
      } catch (err: any) {
        console.error('[Resend Review Error] Failed to send email:', err.message)
      }
    }

    return NextResponse.json({
      success: true,
      post: updatedPost,
      message: `Post has been successfully updated with action: ${action}`
    })
  } catch (err: any) {
    console.error('Unhandled blog review API error:', err)
    return NextResponse.json({ error: 'Server error occurred.' }, { status: 500 })
  }
}
