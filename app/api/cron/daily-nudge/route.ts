import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const MAX_DAILY_EMAILS = 90 // Stay safely under Resend's 100/day free limit

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

interface CombinedEmailContent {
  subject: string
  html: string
}

async function buildCombinedEmail(
  supabase: SupabaseClient,
  user: any,
  reasons: string[],
  currentStreak: number,
  now: Date
): Promise<CombinedEmailContent> {
  const firstName = user.name?.split(' ')[0] || user.full_name?.split(' ')[0] || 'there'

  let subject = ''
  const sectionHtmls: string[] = []

  // Section 1: Streak Alert
  if (reasons.includes('streak_alert')) {
    subject = `Your ${currentStreak} day streak is at risk 🔥`
    sectionHtmls.push(`
      <div style="margin-bottom: 20px;">
        <h3 style="color: #F59E0B; margin: 0 0 8px 0; font-size: 18px;">Your ${currentStreak} day streak is at risk 🔥</h3>
        <p style="font-size: 15px; color: #8B95B3; line-height: 1.6; margin: 0;">
          Your ${currentStreak} day streak is still alive — but the day is almost over. Come back today to keep it going.
        </p>
      </div>
    `)
  }

  // Section 2: Daily Mission Reminder
  if (reasons.includes('daily_reminder')) {
    if (!subject) {
      subject = 'Time for your daily lesson 📚'
    }
    sectionHtmls.push(`
      <div style="margin-bottom: 20px;">
        <h3 style="color: #5B8EFF; margin: 0 0 8px 0; font-size: 18px;">Time for your daily lesson 📚</h3>
        <p style="font-size: 15px; color: #8B95B3; line-height: 1.6; margin: 0;">
          Just a friendly reminder — your next lesson on Cognara is ready whenever you are. Even 10 minutes today keeps your momentum going.
        </p>
      </div>
    `)
  }

  // Section 3: Weekly Summary
  if (reasons.includes('weekly_summary')) {
    if (!subject) {
      subject = 'Your week on Cognara 📊'
    }

    let lessonsCompleted = 0
    try {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { count } = await supabase
        .from('lesson_progress')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('completed_at', sevenDaysAgo)

      lessonsCompleted = count || 0
    } catch (err) {
      console.error(`[Cron Nudge] Error fetching weekly stats for ${user.email}:`, err)
    }

    sectionHtmls.push(`
      <div style="margin-bottom: 20px;">
        <h3 style="color: #5B8EFF; margin: 0 0 8px 0; font-size: 18px;">Your week on Cognara 📊</h3>
        <p style="font-size: 15px; color: #8B95B3; line-height: 1.6; margin: 0 0 10px 0;">Here's your week on Cognara:</p>
        <ul style="font-size: 15px; color: #F0F4FF; line-height: 2; margin: 0; padding-left: 20px;">
          <li><strong style="color: #5B8EFF;">${lessonsCompleted}</strong> lessons completed</li>
          <li><strong style="color: #F59E0B;">${currentStreak}</strong> day streak</li>
        </ul>
      </div>
    `)
  }

  // Primary CTA Button Color
  const buttonBgColor = reasons.includes('streak_alert') ? '#F59E0B' : '#5B8EFF'

  const html = `
    <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; background-color: #111520; color: #F0F4FF; border-radius: 16px; border: 1px solid #1E2540;">
      <p style="font-size: 16px; color: #F0F4FF; margin-top: 0; font-weight: 600;">Hi ${firstName},</p>
      ${sectionHtmls.join('')}
      <div style="margin: 28px 0 20px 0;">
        <a href="https://www.cognaralearn.com/dashboard" style="background-color: ${buttonBgColor}; color: #ffffff; padding: 13px 26px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block;">
          Continue learning →
        </a>
      </div>
      <p style="color: #4A5272; font-size: 12px; margin-top: 24px; border-top: 1px solid #1E2540; padding-top: 16px;">— The Cognara Team</p>
    </div>
  `

  return { subject, html }
}

export async function GET(request: Request) {
  console.log('=== NUDGE CRON STARTED ===')

  // Verify Vercel Cron Authorization if provided
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    const url = new URL(request.url)
    const secretParam = url.searchParams.get('secret')
    if (secretParam !== process.env.CRON_SECRET) {
      console.warn('[Cron Nudge] Unauthorized cron invocation attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = createAdminClient()
  const now = new Date()

  // 1. Grant monthly streak shields if 1st of month
  try {
    await supabase.rpc('grant_monthly_shields')
  } catch (shieldErr) {
    console.error('[Cron Nudge] Shield grant RPC failed (non-critical):', shieldErr)
  }

  // 2. Fetch all profiles for notification evaluations
  const { data: allUsers, error: usersError } = await supabase
    .from('profiles')
    .select(`
      id, email, name, full_name,
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

  let emailsSent = 0
  let usersSkippedAlreadyActive = 0
  let usersSkippedAlreadyEmailedToday = 0

  for (const user of allUsers) {
    if (!user.email) continue

    // Safety Cap Check
    if (emailsSent >= MAX_DAILY_EMAILS) {
      console.log(
        `[Cron Nudge] Approaching daily email limit (${MAX_DAILY_EMAILS}/day safety cap) — stopping for safety. Remaining users will be covered on tomorrow's run.`
      )
      break
    }

    const userTz = user.timezone || user.reminder_timezone || 'Africa/Lagos'
    const userHourInTz = getHourInTimezone(now, userTz)
    const userStreakInfo = streakMap.get(user.id) || { current_streak: 0, last_activity_at: null }

    // RULE 1 — Skip if already emailed today in user's timezone
    const alreadyEmailedToday =
      user.last_daily_reminder_sent &&
      isSameDayInTimezone(new Date(user.last_daily_reminder_sent), now, userTz)

    if (alreadyEmailedToday) {
      usersSkippedAlreadyEmailedToday++
      continue
    }

    // RULE 2 — Skip if user was already active today (learned/logged in)
    let wasActiveToday = false
    if (userStreakInfo.last_activity_at) {
      wasActiveToday = isSameDayInTimezone(new Date(userStreakInfo.last_activity_at), now, userTz)
    }

    if (wasActiveToday) {
      usersSkippedAlreadyActive++
      continue
    }

    // Evaluate notification conditions for user
    const reasonsToEmail: string[] = []

    // Condition 1 — Daily Mission Reminder
    const isDailyEnabled = user.daily_reminder_enabled ?? user.reminder_enabled ?? true
    if (isDailyEnabled) {
      const preferredTimeStr = user.daily_reminder_time || user.reminder_time || '09:00'
      const [reminderHourStr] = preferredTimeStr.split(':')
      const reminderHour = parseInt(reminderHourStr, 10) || 9

      if (userHourInTz === reminderHour) {
        reasonsToEmail.push('daily_reminder')
      }
    }

    // Condition 2 — Streak Alert (Evening 18:00, active streak > 0, inactive today)
    const isStreakAlertsEnabled = user.streak_alerts_enabled ?? true
    const currentStreak = userStreakInfo.current_streak || 0
    if (isStreakAlertsEnabled && currentStreak > 0 && userHourInTz === 18) {
      reasonsToEmail.push('streak_alert')
    }

    // Condition 3 — Weekly Progress Summary (Sunday 10:00 AM, not sent in last 6 days)
    const isWeeklySummaryEnabled = user.weekly_summary_enabled ?? true
    const isSunday = now.getDay() === 0
    const alreadySentWeeklyThisWeek = isWithinDays(user.last_weekly_summary_sent, 6)

    if (isWeeklySummaryEnabled && isSunday && userHourInTz === 10 && !alreadySentWeeklyThisWeek) {
      reasonsToEmail.push('weekly_summary')
    }

    // If no conditions apply, skip this user
    if (reasonsToEmail.length === 0) {
      continue
    }

    // Build ONE combined email for all applicable reasons
    console.log(`[Cron Nudge] Sending combined email to ${user.email} (Reasons: ${reasonsToEmail.join(', ')})`)
    try {
      const emailContent = await buildCombinedEmail(
        supabase,
        user,
        reasonsToEmail,
        currentStreak,
        now
      )

      const resend = getResend()
      await resend.emails.send({
        from: 'Cognara <noreply@cognaralearn.com>',
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html
      })

      // Mark as emailed today in profiles
      await supabase
        .from('profiles')
        .update({
          last_daily_reminder_sent: now.toISOString(),
          ...(reasonsToEmail.includes('weekly_summary') && {
            last_weekly_summary_sent: now.toISOString()
          }),
          ...(reasonsToEmail.includes('streak_alert') && {
            last_streak_alert_sent: now.toISOString()
          })
        })
        .eq('id', user.id)

      emailsSent++
    } catch (emailErr) {
      console.error(`[Cron Nudge] Failed to send email to ${user.email}:`, emailErr)
    }
  }

  console.log('=== NUDGE CRON FINISHED ===')
  console.log({
    emailsSent,
    usersSkippedAlreadyActive,
    usersSkippedAlreadyEmailedToday
  })

  return NextResponse.json({
    status: 'completed',
    emailsSent,
    usersSkippedAlreadyActive,
    usersSkippedAlreadyEmailedToday
  })
}
