import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Mapping of valid quest keys to their XP values for verification
const QUEST_REWARDS: Record<string, number> = {
  daily_explorer: 50,
  daily_quiz: 50,
  daily_perfect: 100,
  weekly_lessons: 200,
  weekly_quizzes: 200,
  weekly_streak: 300
}

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
    const { questKey, resetDate } = body

    if (!questKey || !resetDate) {
      return NextResponse.json(
        { error: 'Missing parameters: questKey and resetDate' },
        { status: 400 }
      )
    }

    const xpReward = QUEST_REWARDS[questKey]
    if (!xpReward) {
      return NextResponse.json({ error: 'Invalid quest key' }, { status: 400 })
    }

    // 2.5 Verify completion criteria before claim
    const now = new Date()
    
    // Start of today
    const todayStart = new Date(now)
    todayStart.setUTCHours(0, 0, 0, 0)

    // Start of the week (Sunday)
    const dayOfWeek = now.getUTCDay()
    const weekStart = new Date(now)
    weekStart.setUTCDate(now.getUTCDate() - dayOfWeek)
    weekStart.setUTCHours(0, 0, 0, 0)

    // Fetch active goal & active roadmap
    const { data: goalData } = await supabase
      .from('learning_goals')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    let activeLessonIds: string[] = []
    let activeQuizIds: string[] = []

    if (goalData) {
      const { data: roadmapData } = await supabase
        .from('roadmaps')
        .select('id')
        .eq('goal_id', goalData.id)
        .maybeSingle()

      if (roadmapData) {
        const { data: lessonsData } = await supabase
          .from('lessons')
          .select('id')
          .eq('roadmap_id', roadmapData.id)
        activeLessonIds = lessonsData?.map((l: any) => l.id) || []

        if (activeLessonIds.length > 0) {
          const { data: quizzesData } = await supabase
            .from('quizzes')
            .select('id')
            .in('lesson_id', activeLessonIds)
          activeQuizIds = quizzesData?.map((q: any) => q.id) || []
        }
      }
    }

    let progressCount = 0
    let targetCount = 1

    if (questKey === 'daily_explorer') {
      targetCount = 1
      if (activeLessonIds.length > 0) {
        const { count } = await supabase
          .from('lesson_progress')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .in('lesson_id', activeLessonIds)
          .gte('completed_at', todayStart.toISOString())
        progressCount = count || 0
      }
    } else if (questKey === 'daily_quiz') {
      targetCount = 1
      if (activeQuizIds.length > 0) {
        const { count } = await supabase
          .from('quiz_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('passed', true)
          .in('quiz_id', activeQuizIds)
          .gte('attempted_at', todayStart.toISOString())
        progressCount = count || 0
      }
    } else if (questKey === 'daily_perfect') {
      targetCount = 1
      if (activeQuizIds.length > 0) {
        const { count } = await supabase
          .from('quiz_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('score', 100)
          .in('quiz_id', activeQuizIds)
          .gte('attempted_at', todayStart.toISOString())
        progressCount = count || 0
      }
    } else if (questKey === 'weekly_lessons') {
      targetCount = 3
      if (activeLessonIds.length > 0) {
        const { count } = await supabase
          .from('lesson_progress')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .in('lesson_id', activeLessonIds)
          .gte('completed_at', weekStart.toISOString())
        progressCount = count || 0
      }
    } else if (questKey === 'weekly_quizzes') {
      targetCount = 2
      if (activeQuizIds.length > 0) {
        const { count } = await supabase
          .from('quiz_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('passed', true)
          .in('quiz_id', activeQuizIds)
          .gte('attempted_at', weekStart.toISOString())
        progressCount = count || 0
      }
    } else if (questKey === 'weekly_streak') {
      targetCount = 3
      const { data: streakData } = await supabase
        .from('streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .maybeSingle()
      progressCount = streakData?.current_streak || 0
    }

    if (progressCount < targetCount) {
      return NextResponse.json(
        { error: `Quest completion criteria not met: ${progressCount}/${targetCount}` },
        { status: 400 }
      )
    }

    // 3. Insert claim entry (UNIQUE constraint user_id + quest_key + reset_date will reject duplicates)
    const { error: claimError } = await supabase
      .from('user_quests')
      .insert({
        user_id: user.id,
        quest_key: questKey,
        reset_date: resetDate,
        claimed: true
      })

    if (claimError) {
      // If it unique constraint violations code is 23505 in Postgres
      if (claimError.code === '23505') {
        return NextResponse.json({ error: 'Quest reward already claimed' }, { status: 400 })
      }
      throw claimError
    }

    // 4. Award the XP using the database RPC
    let xpData: any = null
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('add_xp', {
        user_id: user.id,
        amount: xpReward
      })
      if (!rpcError && rpcData) {
        xpData = rpcData
      } else if (rpcError) {
        throw rpcError
      }
    } catch (xpErr) {
      console.error('[Quests Claim] Error calling add_xp RPC:', xpErr)
    }

    return NextResponse.json({
      success: true,
      xp: xpData ? {
        xpGained: xpReward,
        newXp: xpData.xp,
        newLevel: xpData.level,
        leveledUp: xpData.leveled_up
      } : null
    })
  } catch (err: any) {
    console.error('[Quests Claim Error]', err)
    return NextResponse.json({ error: 'Claim failed' }, { status: 500 })
  }
}
