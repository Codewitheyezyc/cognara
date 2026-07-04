import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: Request) {
  try {
    // 1. Verify this is called by Vercel cron
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // 2. Find paused subscriptions where pause period has ended
    const { data: expiredPauses, error: queryError } = await supabase
      .from('cognara_subscriptions')
      .select('*')
      .eq('status', 'paused')
      .lte('pause_ends_at', new Date().toISOString())

    if (queryError) {
      console.error('[Resume Cron Error] DB select failed:', queryError)
      return NextResponse.json({ error: queryError.message }, { status: 500 })
    }

    if (!expiredPauses || expiredPauses.length === 0) {
      return NextResponse.json({ resumed: 0 })
    }

    let resumed = 0

    for (const subscription of expiredPauses) {
      try {
        // A. Reactivate subscription
        const { error: subUpdateError } = await supabase
          .from('cognara_subscriptions')
          .update({
            status: 'active',
            status_detail: 'auto_resumed',
            paused_at: null,
            pause_ends_at: null
          })
          .eq('id', subscription.id)

        if (subUpdateError) {
          console.error(`[Resume Cron Error] Failed to reactivate sub ${subscription.id}:`, subUpdateError)
          continue
        }

        // B. Restore Pro access in profile
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({ subscription_status: 'pro' })
          .eq('id', subscription.user_id)

        if (profileUpdateError) {
          console.error(`[Resume Cron Error] Failed to restore Pro status for user ${subscription.user_id}:`, profileUpdateError)
          // Continue anyway, but log
        }

        // C. Fetch profile info for email
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, name')
          .eq('id', subscription.user_id)
          .maybeSingle()

        const emailAddress = profile?.email
        const displayName = profile?.name || 'Learner'

        // D. Send resume email
        if (emailAddress) {
          await resend.emails.send({
            from: 'Cognara <noreply@cognaralearn.com>',
            to: emailAddress,
            subject: 'Your Cognara Pro is back ✅',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #5B8EFF; margin-bottom: 20px;">🎉 Welcome Back to Pro!</h2>
                <p style="font-size: 15px; color: #4a5568; line-height: 1.6;">Hi ${displayName},</p>
                <p style="font-size: 15px; color: #4a5568; line-height: 1.6;">
                  Your Cognara Pro subscription has automatically resumed today.
                </p>
                <p style="font-size: 15px; color: #4a5568; line-height: 1.6;">
                  All your Pro features are unlocked and ready again. Your learning progress remains exactly where you left it.
                </p>
                <div style="margin: 25px 0;">
                  <a href="https://www.cognaralearn.com/dashboard" style="background-color: #5B8EFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    Pick up where I left off →
                  </a>
                </div>
                <p style="font-size: 12px; color: #a0aec0; margin-top: 30px; border-top: 1px solid #edf2f7; padding-top: 15px;">
                  — The Cognara Team
                </p>
              </div>
            `
          })
          console.log(`[Resume Cron] Auto-resumed and emailed user ${subscription.user_id} (${emailAddress})`)
        }

        resumed++
      } catch (subErr) {
        console.error(`[Resume Cron Error] Error processing sub ${subscription.id}:`, subErr)
      }
    }

    return NextResponse.json({ resumed })
  } catch (err: any) {
    console.error('[Resume Cron Error] Uncaught exception:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
