import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

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
      .select('id, name, daily_reminder_time')
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

      sent++
    }

    return NextResponse.json({ sent })
  } catch (err: any) {
    console.error('[Cron Reminders Error]', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
