import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST() {
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

    // 2. Fetch active subscription
    const { data: subscription, error: subError } = await supabase
      .from('cognara_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (subError || !subscription) {
      return NextResponse.json({ error: 'no_active_subscription' }, { status: 400 })
    }

    // 3. Check if pause was already used this year
    if (subscription.pause_used_this_year) {
      return NextResponse.json({ error: 'pause_already_used' }, { status: 400 })
    }

    const pauseEndsAt = new Date()
    pauseEndsAt.setDate(pauseEndsAt.getDate() + 30)

    // 4. Update subscription status to paused
    const { error: updateSubError } = await supabase
      .from('cognara_subscriptions')
      .update({
        status: 'paused',
        status_detail: 'user_requested_pause',
        paused_at: new Date().toISOString(),
        pause_ends_at: pauseEndsAt.toISOString(),
        pause_used_this_year: true
      })
      .eq('id', subscription.id)

    if (updateSubError) {
      console.error('[Pause Subscription Error] Failed to update subscription status:', updateSubError)
      return NextResponse.json({ error: 'failed_to_update_subscription' }, { status: 500 })
    }

    // 5. Revert user to free plan during pause in profiles
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({ subscription_status: 'free' })
      .eq('id', user.id)

    if (updateProfileError) {
      console.error('[Pause Subscription Error] Failed to downgrade profile:', updateProfileError)
      // Attempt rollback of subscription status
      await supabase
        .from('cognara_subscriptions')
        .update({
          status: 'active',
          status_detail: null,
          paused_at: null,
          pause_ends_at: null,
          pause_used_this_year: false
        })
        .eq('id', subscription.id)
      return NextResponse.json({ error: 'failed_to_update_profile' }, { status: 500 })
    }

    // 6. Fetch profile info for email personalization
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', user.id)
      .maybeSingle()

    const displayName = profile?.name || user.user_metadata?.full_name || 'Learner'
    const emailAddress = profile?.email || user.email

    // 7. Send pause confirmation email via Resend
    if (emailAddress) {
      try {
        const formattedDate = pauseEndsAt.toLocaleDateString('en-NG', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })

        await resend.emails.send({
          from: 'Cognara <noreply@cognaralearn.com>',
          to: emailAddress,
          subject: 'Your Cognara subscription is paused',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #5B8EFF; margin-bottom: 20px;">⏸️ Subscription Paused</h2>
              <p style="font-size: 15px; color: #4a5568; line-height: 1.6;">Hi ${displayName},</p>
              <p style="font-size: 15px; color: #4a5568; line-height: 1.6;">
                Your Cognara Pro subscription has been successfully paused until <strong>${formattedDate}</strong>.
              </p>
              <p style="font-size: 15px; color: #4a5568; line-height: 1.6;">
                No charge will be made during this period. Your learning progress, streak, CXP, and certificates are all perfectly safe and will be waiting for you.
              </p>
              <p style="font-size: 15px; color: #4a5568; line-height: 1.6;">
                Your subscription will resume automatically on that date. Come back whenever you are ready — your path is waiting!
              </p>
              <div style="margin: 25px 0;">
                <a href="https://www.cognaralearn.com/dashboard" style="background-color: #5B8EFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Go to my dashboard →
                </a>
              </div>
              <p style="font-size: 12px; color: #a0aec0; margin-top: 30px; border-top: 1px solid #edf2f7; padding-top: 15px;">
                — The Cognara Team
              </p>
            </div>
          `
        })
      } catch (emailError) {
        console.error('[Pause Subscription Error] Failed to send pause email:', emailError)
      }
    }

    return NextResponse.json({ success: true, pauseEndsAt })
  } catch (error: any) {
    console.error('[Pause Subscription Error] Uncaught error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
