import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

let resendInstance: Resend | null = null
function getResend() {
  if (!resendInstance) {
    const key = process.env.RESEND_API_KEY || 'mock_resend_api_key'
    resendInstance = new Resend(key)
  }
  return resendInstance
}

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getHourInTimezone(date: Date, timeZone?: string): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone || 'Africa/Lagos',
      hour: 'numeric',
      hour12: false
    })
    return parseInt(formatter.format(date), 10)
  } catch (err) {
    const fallbackFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Lagos',
      hour: 'numeric',
      hour12: false
    })
    return parseInt(fallbackFormatter.format(date), 10)
  }
}

function isSameDayInTimezone(date1: Date, date2: Date, timeZone?: string): boolean {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || 'Africa/Lagos',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
    return formatter.format(date1) === formatter.format(date2)
  } catch (err) {
    return date1.toISOString().split('T')[0] === date2.toISOString().split('T')[0]
  }
}

function isWithinDays(dateStr: string | null, days: number): boolean {
  if (!dateStr) return false
  const now = new Date().getTime()
  const past = new Date(dateStr).getTime()
  const diffDays = (now - past) / (1000 * 60 * 60 * 24)
  return diffDays < days
}

export async function GET(request: Request) {
  console.log('=== NUDGE CRON STARTED ===')

  // Verify Vercel Cron Authorization if provided
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Check if internal dev call or bypass
    const url = new URL(request.url)
    const secretParam = url.searchParams.get('secret')
    if (secretParam !== process.env.CRON_SECRET) {
      console.warn('[Cron Nudge] Unauthorized cron invocation attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = createAdminClient()
  const now = new Date()

  // 1. Grant monthly streak shields & reset monthly notifications if 1st of month
  try {
    await supabase.rpc('grant_monthly_shields')
  } catch (shieldErr) {
    console.error('[Cron Nudge] Shield grant RPC failed (non-critical):', shieldErr)
  }

  // 2. Fetch all profiles for notification evaluations
  const { data: allUsers, error: usersError } = await supabase
    .from('profiles')
    .select(`
      id, email, name,
      daily_reminder_enabled, reminder_enabled,
      daily_reminder_time, reminder_time,
      streak_alerts_enabled,
      weekly_summary_enabled,
      timezone, reminder_timezone,
      last_daily_reminder_sent,
      last_weekly_summary_sent,
      last_streak_alert_sent
    `)

  if (usersError || !allUsers) {
    console.error('[Cron Nudge] Failed to fetch users:', usersError)
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
  }

  // Pre-fetch all user streak records
  const { data: allStreaks } = await supabase
    .from('streaks')
    .select('user_id, current_streak, last_activity_at')

  const streakMap = new Map<string, { current_streak: number; last_activity_at: string | null }>()
  allStreaks?.forEach(s => streakMap.set(s.user_id, s))

  let dailySent = 0
  let streakAlertsSent = 0
  let weeklySummariesSent = 0

  for (const user of allUsers) {
    if (!user.email) continue

    const userTz = user.timezone || user.reminder_timezone || 'Africa/Lagos'
    const userHourInTz = getHourInTimezone(now, userTz)
    const firstName = user.name?.split(' ')[0] || 'there'
    const userStreakInfo = streakMap.get(user.id) || { current_streak: 0, last_activity_at: null }

    // ─── 1. DAILY MISSION REMINDER ───
    const isDailyEnabled = user.daily_reminder_enabled ?? user.reminder_enabled ?? true
    if (isDailyEnabled) {
      const preferredTimeStr = user.daily_reminder_time || user.reminder_time || '09:00'
      const [reminderHourStr] = preferredTimeStr.split(':')
      const reminderHour = parseInt(reminderHourStr, 10) || 9

      const alreadySentToday = user.last_daily_reminder_sent &&
        isSameDayInTimezone(new Date(user.last_daily_reminder_sent), now, userTz)

      if (userHourInTz === reminderHour && !alreadySentToday) {
        // Check if user already studied today (UTC / Tz day)
        const todayStartStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
        const { data: studiedProgress } = await supabase
          .from('lesson_progress')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('completed_at', todayStartStr)
          .maybeSingle()

        if (!studiedProgress) {
          console.log(`[Cron Nudge] Sending Daily Mission Reminder to ${user.email} (Local Hour: ${userHourInTz})`)
          try {
            const resend = getResend()
            await resend.emails.send({
              from: 'Cognara <noreply@cognaralearn.com>',
              to: user.email,
              subject: 'Time for your daily lesson 📚',
              html: `
                <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; background-color: #111520; color: #F0F4FF; border-radius: 16px; border: 1px solid #1E2540;">
                  <h2 style="color: #5B8EFF; margin-top: 0; font-size: 20px;">Time for your daily lesson 📚</h2>
                  <p style="font-size: 15px; color: #8B95B3;">Hi ${firstName},</p>
                  <p style="font-size: 15px; color: #8B95B3; line-height: 1.6;">Just a friendly reminder — your next lesson on Cognara is ready whenever you are.</p>
                  <p style="font-size: 15px; color: #8B95B3; line-height: 1.6;">Even 10 minutes today keeps your momentum going.</p>
                  <div style="margin: 28px 0;">
                    <a href="https://www.cognaralearn.com/dashboard" style="background-color: #5B8EFF; color: #ffffff; padding: 13px 26px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block;">
                      Continue learning →
                    </a>
                  </div>
                  <p style="color: #4A5272; font-size: 12px; margin-top: 24px; border-top: 1px solid #1E2540; padding-top: 16px;">— The Cognara Team</p>
                </div>
              `
            })

            await supabase
              .from('profiles')
              .update({ last_daily_reminder_sent: now.toISOString() })
              .eq('id', user.id)

            dailySent++
          } catch (emailErr) {
            console.error(`[Cron Nudge] Failed to send daily reminder to ${user.email}:`, emailErr)
          }
        } else {
          console.log(`[Cron Nudge] User ${user.email} already completed a lesson today. Skipping daily reminder.`)
        }
      }
    }

    // ─── 2. STREAK ALERT ───
    const isStreakAlertsEnabled = user.streak_alerts_enabled ?? true
    const currentStreak = userStreakInfo.current_streak || 0
    if (isStreakAlertsEnabled && currentStreak > 0) {
      const alreadyAlertedToday = user.last_streak_alert_sent &&
        isSameDayInTimezone(new Date(user.last_streak_alert_sent), now, userTz)

      // Send evening alert (around 18:00 / 6 PM local time) if not active today
      if (userHourInTz === 18 && !alreadyAlertedToday) {
        let hasActiveToday = false
        if (userStreakInfo.last_activity_at) {
          hasActiveToday = isSameDayInTimezone(new Date(userStreakInfo.last_activity_at), now, userTz)
        }

        if (!hasActiveToday) {
          console.log(`[Cron Nudge] Sending Streak Alert to ${user.email} (Streak: ${currentStreak}d, Hour: ${userHourInTz})`)
          try {
            const resend = getResend()
            await resend.emails.send({
              from: 'Cognara <noreply@cognaralearn.com>',
              to: user.email,
              subject: `Your ${currentStreak} day streak is at risk 🔥`,
              html: `
                <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; background-color: #111520; color: #F0F4FF; border-radius: 16px; border: 1px solid #1E2540;">
                  <h2 style="color: #F59E0B; margin-top: 0; font-size: 20px;">Your ${currentStreak} day streak is at risk 🔥</h2>
                  <p style="font-size: 15px; color: #8B95B3;">Hi ${firstName},</p>
                  <p style="font-size: 15px; color: #8B95B3; line-height: 1.6;">Your ${currentStreak} day streak is still alive — but the day is almost over.</p>
                  <p style="font-size: 15px; color: #8B95B3; line-height: 1.6;">Come back today to keep it going.</p>
                  <div style="margin: 28px 0;">
                    <a href="https://www.cognaralearn.com/dashboard" style="background-color: #F59E0B; color: #ffffff; padding: 13px 26px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block;">
                      Save my streak →
                    </a>
                  </div>
                  <p style="color: #4A5272; font-size: 12px; margin-top: 24px; border-top: 1px solid #1E2540; padding-top: 16px;">— The Cognara Team</p>
                </div>
              `
            })

            await supabase
              .from('profiles')
              .update({ last_streak_alert_sent: now.toISOString() })
              .eq('id', user.id)

            streakAlertsSent++
          } catch (emailErr) {
            console.error(`[Cron Nudge] Failed to send streak alert to ${user.email}:`, emailErr)
          }
        }
      }
    }

    // ─── 3. WEEKLY SUMMARY ───
    const isWeeklySummaryEnabled = user.weekly_summary_enabled ?? true
    if (isWeeklySummaryEnabled) {
      // Send Sunday morning (10:00 AM local time) if not sent in last 6 days
      const isSunday = now.getDay() === 0
      const alreadySentThisWeek = isWithinDays(user.last_weekly_summary_sent, 6)

      if (isSunday && userHourInTz === 10 && !alreadySentThisWeek) {
        console.log(`[Cron Nudge] Calculating weekly summary stats for ${user.email}`)
        try {
          const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)).toISOString()
          const { count: lessonsCompleted } = await supabase
            .from('lesson_progress')
            .select('id', { count: 'exact' })
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .gte('completed_at', sevenDaysAgo)

          const resend = getResend()
          await resend.emails.send({
            from: 'Cognara <noreply@cognaralearn.com>',
            to: user.email,
            subject: 'Your week on Cognara 📊',
            html: `
              <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; background-color: #111520; color: #F0F4FF; border-radius: 16px; border: 1px solid #1E2540;">
                <h2 style="color: #5B8EFF; margin-top: 0; font-size: 20px;">Your week on Cognara 📊</h2>
                <p style="font-size: 15px; color: #8B95B3;">Hi ${firstName},</p>
                <p style="font-size: 15px; color: #8B95B3; line-height: 1.6;">Here's your week on Cognara:</p>
                <ul style="font-size: 15px; color: #F0F4FF; line-height: 2;">
                  <li><strong style="color: #5B8EFF;">${lessonsCompleted || 0}</strong> lessons completed</li>
                  <li><strong style="color: #F59E0B;">${currentStreak}</strong> day streak</li>
                </ul>
                <p style="font-size: 15px; color: #8B95B3; line-height: 1.6;">Keep it going next week.</p>
                <div style="margin: 28px 0;">
                  <a href="https://www.cognaralearn.com/dashboard" style="background-color: #5B8EFF; color: #ffffff; padding: 13px 26px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block;">
                    Continue learning →
                  </a>
                </div>
                <p style="color: #4A5272; font-size: 12px; margin-top: 24px; border-top: 1px solid #1E2540; padding-top: 16px;">— The Cognara Team</p>
              </div>
            `
          })

          await supabase
            .from('profiles')
            .update({ last_weekly_summary_sent: now.toISOString() })
            .eq('id', user.id)

          weeklySummariesSent++
        } catch (emailErr) {
          console.error(`[Cron Nudge] Failed to send weekly summary to ${user.email}:`, emailErr)
        }
      }
    }
  }

  console.log('=== NUDGE CRON FINISHED ===')
  console.log({
    dailySent,
    streakAlertsSent,
    weeklySummariesSent
  })

  return NextResponse.json({
    status: 'completed',
    dailySent,
    streakAlertsSent,
    weeklySummariesSent
  })
}
