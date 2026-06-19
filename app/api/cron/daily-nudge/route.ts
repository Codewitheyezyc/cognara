import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendDailyNudge } from '@/lib/email/sendDailyNudge'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    // 1. Verify Vercel Cron authorization
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Grant monthly streak shields for Pro users
    await supabase.rpc('grant_monthly_shields')

    // 2. Fetch all profiles with reminders enabled
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, name, email, reminder_time, timezone')
      .eq('reminder_enabled', true)

    if (usersError || !users || users.length === 0) {
      return NextResponse.json({ sent: 0, reason: 'No users with reminders enabled' })
    }

    // 3. Determine current hour in UTC
    const currentUtc = new Date()
    let sentCount = 0

    for (const user of users) {
      try {
        if (!user.reminder_time || !user.email) continue

        // Parse user preferred reminder hour (format: 'HH:MM')
        const [reminderHour] = user.reminder_time.split(':')

        // Determine current hour in user's timezone
        const userTimezone = user.timezone || 'UTC'
        let userLocalHourStr = ''
        try {
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: userTimezone,
            hour: '2-digit',
            hour12: false
          })
          userLocalHourStr = formatter.format(currentUtc).padStart(2, '0')
        } catch (tzErr) {
          // Fallback to server hour
          userLocalHourStr = currentUtc.getHours().toString().padStart(2, '0')
        }

        // Only send if the user's local hour matches their preferred reminder hour
        if (userLocalHourStr !== reminderHour) {
          continue
        }

        // Check if user has already studied today (UTC day)
        const todayStr = new Date().toISOString().split('T')[0]
        const { data: studiedProgress } = await supabase
          .from('lesson_progress')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('completed_at', `${todayStr}T00:00:00.000Z`)
          .maybeSingle()

        if (studiedProgress) {
          // Already completed a lesson today, skip reminder
          continue
        }

        // Fetch user's active goal
        const { data: activeGoal } = await supabase
          .from('learning_goals')
          .select('id, subject')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle()

        if (!activeGoal) continue

        // Fetch roadmap for the goal
        const { data: roadmap } = await supabase
          .from('roadmaps')
          .select('id')
          .eq('goal_id', activeGoal.id)
          .maybeSingle()

        if (!roadmap) continue

        // Fetch lessons for the roadmap
        const { data: lessons } = await supabase
          .from('lessons')
          .select('id, title')
          .eq('roadmap_id', roadmap.id)
          .order('order_index', { ascending: true })

        if (!lessons || lessons.length === 0) continue

        // Fetch completed lesson IDs
        const { data: completedProgress } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('user_id', user.id)
          .eq('status', 'completed')

        const completedSet = new Set(completedProgress?.map(p => p.lesson_id) || [])

        // Find first incomplete lesson
        const nextLesson = lessons.find(l => !completedSet.has(l.id))
        if (!nextLesson) continue

        // Fetch streak info
        const { data: streakRow } = await supabase
          .from('streaks')
          .select('current_streak')
          .eq('user_id', user.id)
          .maybeSingle()

        const streakDays = streakRow?.current_streak || 0

        // Send nudge email
        await sendDailyNudge({
          to: user.email,
          userName: user.name,
          nextLessonTitle: nextLesson.title,
          nextLessonId: nextLesson.id,
          streakDays,
          subject: activeGoal.subject
        })

        sentCount++
      } catch (userErr) {
        console.error(`Error processing reminder nudge for user ${user.id}:`, userErr)
      }
    }

    return NextResponse.json({ sent: sentCount })
  } catch (err) {
    console.error('[Cron Daily Nudge Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
