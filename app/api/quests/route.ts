import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Define Date Boundaries (UTC midnight start of today, and Sunday start of week)
    const now = new Date()
    
    // Start of today
    const todayStart = new Date(now)
    todayStart.setUTCHours(0, 0, 0, 0)
    const todayStr = todayStart.toISOString().split('T')[0]

    // Start of the week (Sunday)
    const dayOfWeek = now.getUTCDay() // 0 = Sunday
    const weekStart = new Date(now)
    weekStart.setUTCDate(now.getUTCDate() - dayOfWeek)
    weekStart.setUTCHours(0, 0, 0, 0)
    const weekStartStr = weekStart.toISOString().split('T')[0]

    // 3. Query Activity Data from database
    
    // Lessons completed today
    const { count: completedLessonsToday } = await supabase
      .from('lesson_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('completed_at', todayStart.toISOString())

    // Lessons completed this week
    const { count: completedLessonsThisWeek } = await supabase
      .from('lesson_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('completed_at', weekStart.toISOString())

    // Quizzes passed today
    const { count: quizPassesToday } = await supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('passed', true)
      .gte('attempted_at', todayStart.toISOString())

    // Quizzes passed this week
    const { count: quizPassesThisWeek } = await supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('passed', true)
      .gte('attempted_at', weekStart.toISOString())

    // Perfect quiz scores (100%) today
    const { count: perfectQuizzesToday } = await supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('score', 100)
      .gte('attempted_at', todayStart.toISOString())

    // Current active streak
    const { data: streakData } = await supabase
      .from('streaks')
      .select('current_streak')
      .eq('user_id', user.id)
      .maybeSingle()
    const currentStreak = streakData?.current_streak || 0

    // 4. Fetch claimed quests
    const { data: claimedQuests } = await supabase
      .from('user_quests')
      .select('quest_key, reset_date, claimed')
      .eq('user_id', user.id)
      .in('reset_date', [todayStr, weekStartStr])

    const claimedSet = new Set(
      claimedQuests?.filter(q => q.claimed).map(q => `${q.quest_key}_${q.reset_date}`) || []
    )

    // 5. Build daily quests list
    const dailyQuests = [
      {
        key: 'daily_explorer',
        title: 'Daily Explorer 🗺️',
        description: 'Complete 1 lesson today',
        progress: Math.min(1, completedLessonsToday || 0),
        target: 1,
        xpReward: 50,
        resetDate: todayStr,
        completed: (completedLessonsToday || 0) >= 1,
        claimed: claimedSet.has(`daily_explorer_${todayStr}`)
      },
      {
        key: 'daily_quiz',
        title: 'Active Thinker ⚡',
        description: 'Pass 1 quiz today',
        progress: Math.min(1, quizPassesToday || 0),
        target: 1,
        xpReward: 50,
        resetDate: todayStr,
        completed: (quizPassesToday || 0) >= 1,
        claimed: claimedSet.has(`daily_quiz_${todayStr}`)
      },
      {
        key: 'daily_perfect',
        title: 'Perfect Mind 🧠',
        description: 'Score 100% on any quiz today',
        progress: Math.min(1, perfectQuizzesToday || 0),
        target: 1,
        xpReward: 100,
        resetDate: todayStr,
        completed: (perfectQuizzesToday || 0) >= 1,
        claimed: claimedSet.has(`daily_perfect_${todayStr}`)
      }
    ]

    // 6. Build weekly quests list
    const weeklyQuests = [
      {
        key: 'weekly_lessons',
        title: 'Roadmap Raider 🏆',
        description: 'Complete 3 lessons this week',
        progress: Math.min(3, completedLessonsThisWeek || 0),
        target: 3,
        xpReward: 200,
        resetDate: weekStartStr,
        completed: (completedLessonsThisWeek || 0) >= 3,
        claimed: claimedSet.has(`weekly_lessons_${weekStartStr}`)
      },
      {
        key: 'weekly_quizzes',
        title: 'Quiz Champion 🎓',
        description: 'Pass 2 quizzes this week',
        progress: Math.min(2, quizPassesThisWeek || 0),
        target: 2,
        xpReward: 200,
        resetDate: weekStartStr,
        completed: (quizPassesThisWeek || 0) >= 2,
        claimed: claimedSet.has(`weekly_quizzes_${weekStartStr}`)
      },
      {
        key: 'weekly_streak',
        title: 'Dedication Elite 🔥',
        description: 'Maintain a 3-day active streak',
        progress: Math.min(3, currentStreak),
        target: 3,
        xpReward: 300,
        resetDate: weekStartStr,
        completed: currentStreak >= 3,
        claimed: claimedSet.has(`weekly_streak_${weekStartStr}`)
      }
    ]

    return NextResponse.json({
      daily: dailyQuests,
      weekly: weeklyQuests
    })
  } catch (err: any) {
    console.error('[Quests API Error]', err)
    return NextResponse.json({ error: 'Failed to fetch quests' }, { status: 500 })
  }
}
