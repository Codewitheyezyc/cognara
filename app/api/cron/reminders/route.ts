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

// Mock push notification sender
async function sendPushNotification(userId: string, payload: { title: string; body: string; url: string }) {
  console.log(`[Push Notification Mock] Sent to user ${userId}:`, payload)
  return { success: true }
}

export async function GET(request: Request) {
  try {
    // Verify this is called by Vercel cron
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Get current hour in Nigeria time (2-digit hour)
    const nigeriaTime = new Date().toLocaleString('en-NG', {
      timeZone: 'Africa/Lagos',
      hour: '2-digit',
      hour12: false
    })

    const currentHour = nigeriaTime.trim().padStart(2, '0')

    // Find users whose reminder time matches current hour
    const { data: usersToRemind, error } = await supabase
      .from('profiles')
      .select('id, name, email, daily_reminder_time')
      .eq('reminder_enabled', true)
      .like('daily_reminder_time', `${currentHour}:%`)

    if (error) {
      console.error('[Cron Reminders Error] DB select failed:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!usersToRemind || usersToRemind.length === 0) {
      return NextResponse.json({ sent: 0 })
    }

    let sent = 0
    for (const user of usersToRemind) {
      const displayName = user.name || 'Learner'
      
      // 1. Send mock push notification
      await sendPushNotification(user.id, {
        title: `🔥 Time to learn, ${displayName}`,
        body: 'Your daily learning session is waiting. Keep your streak alive.',
        url: '/dashboard'
      })

      // 2. Insert real in-app notification in cognara_notifications
      await supabase
        .from('cognara_notifications')
        .insert({
          user_id: user.id,
          type: 'daily_reminder',
          title: `🔥 Daily Study Reminder`,
          message: `Time for your daily study session! Keep your streak alive.`,
          is_read: false,
          action_url: '/dashboard',
          created_at: new Date().toISOString()
        })

      // 3. Send email study reminder via Resend
      if (user.email) {
        try {
          await resend.emails.send({
            from: 'Cognara <noreply@cognaralearn.com>',
            to: user.email,
            subject: `🔔 Daily Study Reminder — Time to learn, ${displayName}!`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
                <h2 style="color: #5B8EFF; margin-bottom: 10px;">🔥 Time to learn, ${displayName}</h2>
                <p style="font-size: 15px; color: #4a5568; line-height: 1.6;">
                  This is your daily study reminder to keep your momentum going on Cognara. Your daily learning session is waiting for you.
                </p>
                <div style="margin: 25px 0;">
                  <a href="https://www.cognaralearn.com/dashboard" style="background-color: #5B8EFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    Go to my dashboard →
                  </a>
                </div>
                <p style="font-size: 12px; color: #a0aec0; margin-top: 30px; border-t: 1px solid #edf2f7; padding-top: 15px;">
                  You are receiving this email because you opted in to daily study reminders on Cognara. You can change your reminder preferences at any time in your settings.
                </p>
              </div>
            `
          })
          console.log(`[Cron Reminders] Email sent to user ${user.id} (${user.email})`)
        } catch (emailErr) {
          console.error(`[Cron Reminders] Failed to send email to user ${user.id}:`, emailErr)
        }
      }

      sent++
    }

    return NextResponse.json({ sent })
  } catch (err: any) {
    console.error('[Cron Reminders Error]', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
