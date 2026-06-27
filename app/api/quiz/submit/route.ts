import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { QuizQuestion } from '@/types/ai'

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
    const { quizId, answers, timeSpentSecs } = body

    if (!quizId || !answers) {
      return NextResponse.json(
        { error: 'Missing required parameters: quizId or answers' },
        { status: 400 }
      )
    }

    // 3. Fetch quiz record to retrieve original questions and check access
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (quizError || !quiz) {
      return NextResponse.json({ error: 'Quiz not found or access denied' }, { status: 404 })
    }

    // 4. Calculate score
    const questions = quiz.questions as unknown as QuizQuestion[]
    let correctCount = 0

    questions.forEach((question) => {
      const userAnswer = (answers[question.id] || '').trim().toLowerCase()
      const correctAnswer = question.correct_answer.trim().toLowerCase()
      if (userAnswer === correctAnswer) {
        correctCount++
      }
    })

    const score = Math.round((correctCount / questions.length) * 100)
    const passed = score >= 60

    // 5. Insert attempt log
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: quizId,
        user_id: user.id,
        answers,
        score,
        passed,
        time_spent_secs: Number(timeSpentSecs || 0),
      })
      .select('id')
      .single()

    if (attemptError || !attempt) {
      console.error('Error recording attempt:', attemptError)
      return NextResponse.json({ error: 'Failed to record quiz attempt' }, { status: 500 })
    }

    // 6. Handle Streak updates if passed
    let newCurrentStreak = 0
    let newLongestStreak = 0

    if (passed) {
      const todayStr = new Date().toISOString().split('T')[0] // YYYY-MM-DD in UTC

      const { data: streak } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!streak) {
        // Fallback insert if trigger failed or was bypassed
        newCurrentStreak = 1
        newLongestStreak = 1
        await supabase.from('streaks').insert({
          user_id: user.id,
          current_streak: 1,
          longest_streak: 1,
          last_activity_at: todayStr,
        })
      } else {
        newCurrentStreak = streak.current_streak || 0
        newLongestStreak = streak.longest_streak || 0
        const lastActivity = streak.last_activity_at

        if (!lastActivity) {
          newCurrentStreak = 1
          newLongestStreak = Math.max(newLongestStreak, 1)
        } else {
          const today = new Date(todayStr)
          today.setUTCHours(0, 0, 0, 0)

          const lastDate = new Date(lastActivity)
          lastDate.setUTCHours(0, 0, 0, 0)

          const diffTime = today.getTime() - lastDate.getTime()
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

          let shieldUsed = false
          if (diffDays === 1) {
            // Consecutive day
            newCurrentStreak += 1
            newLongestStreak = Math.max(newLongestStreak, newCurrentStreak)
          } else if (diffDays === 2 && (streak.shields_available || 0) > 0) {
            // Missed 1 day, auto-consume shield
            newCurrentStreak += 1
            newLongestStreak = Math.max(newLongestStreak, newCurrentStreak)
            shieldUsed = true

            await supabase
              .from('streaks')
              .update({
                shields_available: (streak.shields_available || 0) - 1,
                shields_used_this_month: (streak.shields_used_this_month || 0) + 1
              })
              .eq('user_id', user.id)
          } else if (diffDays > 1) {
            // Streak broken
            newCurrentStreak = 1
            newLongestStreak = Math.max(newLongestStreak, newCurrentStreak)

            // Record when the streak broke
            const brokenDate = new Date(lastActivity)
            brokenDate.setDate(brokenDate.getDate() + 1)
            const brokenStr = brokenDate.toISOString()

            await supabase
              .from('streaks')
              .update({
                streak_broken_at: brokenStr
              })
              .eq('user_id', user.id)
          } else if (diffDays === 0 && newCurrentStreak === 0) {
            // Activity occurred today but streak starts today (first attempt)
            newCurrentStreak = 1
            newLongestStreak = Math.max(newLongestStreak, 1)
          }
          // Note: If diffDays === 0 and newCurrentStreak > 0, they already passed a quiz today, so retain current streak count.
        }

        await supabase
          .from('streaks')
          .update({
            current_streak: newCurrentStreak,
            longest_streak: newLongestStreak,
            last_activity_at: todayStr,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
      }
    } else {
      // If failed, read existing streak for return info
      const { data: streak } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      newCurrentStreak = streak?.current_streak || 0
      newLongestStreak = streak?.longest_streak || 0
    }

    // Check if the entire roadmap is fully completed
    let roadmapCompleted = false
    let roadmapId = null

    if (passed && quiz.lesson_id) {
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('roadmap_id')
        .eq('id', quiz.lesson_id)
        .maybeSingle()

      if (lessonData?.roadmap_id) {
        roadmapId = lessonData.roadmap_id

        // Fetch all lesson IDs in the roadmap
        const { data: roadmapLessons } = await supabase
          .from('lessons')
          .select('id')
          .eq('roadmap_id', roadmapId)

        const roadmapLessonIds = roadmapLessons?.map(l => l.id) || []

        if (roadmapLessonIds.length > 0) {
          // Fetch completed lessons from lesson_progress for this user
          const { count: completedCount } = await supabase
            .from('lesson_progress')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .in('lesson_id', roadmapLessonIds)

          if (completedCount === roadmapLessonIds.length) {
            roadmapCompleted = true
          }
        }
      }
    }

    // 7. Award XP dynamically based on performance mapping
    const normalizedCorrect = questions.length > 0 ? Math.round((correctCount / questions.length) * 5) : 0
    let xpAward = 10
    if (normalizedCorrect === 5) xpAward = 100
    else if (normalizedCorrect === 4) xpAward = 80
    else if (normalizedCorrect === 3) xpAward = 60
    else if (normalizedCorrect === 2) xpAward = 40
    else if (normalizedCorrect === 1) xpAward = 20

    let xpData: any = null
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('add_xp', {
        user_id: user.id,
        amount: xpAward
      })
      if (!rpcError && rpcData) {
        xpData = rpcData
      }
    } catch (xpErr) {
      console.error('[Quiz Submit] Error calling add_xp RPC:', xpErr)
    }

    return NextResponse.json({
      attemptId: attempt.id,
      score,
      passed,
      correctCount,
      totalCount: questions.length,
      streak: {
        current: newCurrentStreak,
        longest: newLongestStreak,
      },
      roadmapCompleted,
      roadmapId,
      xp: xpData ? {
        xpGained: xpData.xp_gained,
        newXp: xpData.xp,
        newLevel: xpData.level,
        leveledUp: xpData.leveled_up
      } : null
    })
  } catch (err) {
    console.error('[API Submit Quiz Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
