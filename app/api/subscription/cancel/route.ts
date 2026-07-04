import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse request body
    const body = await request.json()
    const { reason, additionalText, subscriptionPlan, startedAt, starRating, testimonialText, goalName } = body

    if (!reason) {
      return NextResponse.json({ error: 'Missing parameter: reason' }, { status: 400 })
    }

    // 3. Fetch active subscription to get accurate started_at and plan details
    const { data: subscription } = await supabase
      .from('cognara_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    const actualStartedAt = subscription?.started_at || subscription?.start_date || subscription?.created_at || startedAt || new Date().toISOString()
    const actualPlan = subscription?.plan || subscriptionPlan || 'pro'
    
    // Calculate subscription duration
    const durationDays = Math.max(0, Math.floor(
      (new Date().getTime() - new Date(actualStartedAt).getTime()) / (1000 * 60 * 60 * 24)
    ))

    // 4. Save cancellation reason
    const { error: insertReasonError } = await supabase
      .from('cognara_cancellation_reasons')
      .insert({
        user_id: user.id,
        reason: reason,
        additional_text: additionalText || testimonialText || null,
        subscription_plan: actualPlan,
        subscription_duration_days: durationDays,
        created_at: new Date().toISOString()
      })

    if (insertReasonError) {
      console.error('[Cancel Subscription Error] Failed to insert cancellation reason:', insertReasonError)
      // Non-blocking error, we still proceed with cancellation
    }

    // 4.5 Save goal completion testimonial if provided
    if (reason === 'achieved_goal' && starRating) {
      try {
        // Fetch profile to get user details
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .maybeSingle()

        const displayName = profile?.name || user.user_metadata?.full_name || 'Learner'
        const parts = displayName.split(' ')
        const firstName = parts[0] || 'Learner'
        const lastInitial = parts[1] ? parts[1][0] : ''

        await supabase
          .from('cognara_testimonials')
          .insert({
            user_id: user.id,
            first_name: firstName,
            last_initial: lastInitial,
            learning_goal: goalName || 'My Goal',
            testimonial_text: testimonialText || '',
            star_rating: starRating,
            is_approved: false,
            created_at: new Date().toISOString()
          })

        // Notify Isaac via email
        await resend.emails.send({
          from: 'Cognara Testimonials <testimonials@cognaralearn.com>',
          to: 'hello@cognaralearn.com',
          subject: '🎉 Goal completion testimonial received',
          html: `
            <div style="font-family: sans-serif; padding: 20px;">
              <h3>🎉 New Testimonial from Goal Achiever</h3>
              <p><strong>User:</strong> ${displayName}</p>
              <p><strong>Goal:</strong> ${goalName || 'My Goal'}</p>
              <p><strong>Rating:</strong> ${starRating}/5</p>
              <p><strong>Story:</strong> "${testimonialText || 'No story text provided'}"</p>
              <p><a href="https://www.cognaralearn.com/admin">Review and approve on admin panel</a></p>
            </div>
          `
        })
      } catch (testimonialErr) {
        console.error('[Cancel Subscription Error] Failed to process testimonial:', testimonialErr)
      }
    }

    // 5. Update subscription status in Supabase to cancelled
    const { error: updateSubError } = await supabase
      .from('cognara_subscriptions')
      .update({
        status: 'cancelled',
        status_detail: 'user_requested',
        cancelled_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (updateSubError) {
      console.error('[Cancel Subscription Error] Failed to update subscription status:', updateSubError)
      return NextResponse.json({ error: 'failed_to_update_subscription' }, { status: 500 })
    }

    // 6. Downgrade profile to free
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({ subscription_status: 'free' })
      .eq('id', user.id)

    if (updateProfileError) {
      console.error('[Cancel Subscription Error] Failed to downgrade profile:', updateProfileError)
      return NextResponse.json({ error: 'failed_to_update_profile' }, { status: 500 })
    }

    // 7. Fetch user details for notification emails
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', user.id)
      .maybeSingle()

    const displayName = profile?.name || user.user_metadata?.full_name || 'Learner'
    const emailAddress = profile?.email || user.email

    // 8. Send cancellation confirmation email to user
    if (emailAddress) {
      try {
        await resend.emails.send({
          from: 'Cognara <noreply@cognaralearn.com>',
          to: emailAddress,
          subject: 'Your Cognara subscription has been cancelled',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #ef4444; margin-bottom: 20px;">ℹ️ Subscription Cancelled</h2>
              <p style="font-size: 15px; color: #4a5568; line-height: 1.6;">Hi ${displayName},</p>
              <p style="font-size: 15px; color: #4a5568; line-height: 1.6;">
                Your Cognara Pro subscription has been cancelled. You will not be charged again.
              </p>
              <p style="font-size: 15px; color: #4a5568; line-height: 1.6;">
                Your learning progress, streaks, CXP, and earned certificates are all completely safe. You can continue learning on our free plan.
              </p>
              <p style="font-size: 15px; color: #4a5568; line-height: 1.6;">
                If you ever want to continue your Pro journey and unlock all roadmaps, depth explanation levels, and certificates again, we will be right here waiting.
              </p>
              <div style="margin: 25px 0;">
                <a href="https://www.cognaralearn.com" style="background-color: #5B8EFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Return to Cognara
                </a>
              </div>
              <p style="font-size: 12px; color: #a0aec0; margin-top: 30px; border-top: 1px solid #edf2f7; padding-top: 15px;">
                — The Cognara Team
              </p>
            </div>
          `
        })
      } catch (emailError) {
        console.error('[Cancel Subscription Error] Failed to send user cancellation email:', emailError)
      }
    }

    // 9. Notify Isaac (Admin notification)
    try {
      await resend.emails.send({
        from: 'Cognara Alerts <alerts@cognaralearn.com>',
        to: 'hello@cognaralearn.com',
        subject: `Pro subscriber cancelled — reason: ${reason}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h3>🚨 Pro Subscription Cancelled</h3>
            <p><strong>User:</strong> ${displayName} (${emailAddress || 'No Email'})</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p><strong>Duration of Subscription:</strong> ${durationDays} days</p>
            <p><strong>Plan Tier:</strong> ${actualPlan}</p>
            ${additionalText ? `<p><strong>Feedback:</strong> "${additionalText}"</p>` : ''}
          </div>
        `
      })
    } catch (adminEmailError) {
      console.error('[Cancel Subscription Error] Failed to send admin alert email:', adminEmailError)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Cancel Subscription Error] Uncaught exception:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
