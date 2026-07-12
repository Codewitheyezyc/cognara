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

    // 5. Check if this is a retake (any previous attempt on this quiz)
    const { data: previousAttempt } = await supabase
      .from('quiz_attempts')
      .select('id, cxp_awarded')
      .eq('user_id', user.id)
      .eq('quiz_id', quizId)
      .order('attempted_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    const isRetake = !!previousAttempt

    // 6. Calculate CXP/XP — FIRST ATTEMPT ONLY
    const normalizedCorrect = questions.length > 0 ? Math.round((correctCount / questions.length) * 5) : 0
    let xpAward = 0
    let cxpToAward = 0

    if (!isRetake) {
      if (normalizedCorrect === 5)      { xpAward = 100; cxpToAward = 100 }
      else if (normalizedCorrect === 4) { xpAward = 80;  cxpToAward = 80  }
      else if (normalizedCorrect === 3) { xpAward = 60;  cxpToAward = 60  }
      else if (normalizedCorrect === 2) { xpAward = 40;  cxpToAward = 40  }
      else if (normalizedCorrect === 1) { xpAward = 20;  cxpToAward = 20  }
      else                              { xpAward = 10;  cxpToAward = 10  } // minimum for attempting
    }
    // Retake — both stay 0

    // 7. Insert attempt log (includes is_retake + cxp_awarded)
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: quizId,
        user_id: user.id,
        answers,
        score,
        passed,
        time_spent_secs: Number(timeSpentSecs || 0),
        is_retake: isRetake,
        cxp_awarded: cxpToAward,
      })
      .select('id')
      .single()

    if (attemptError || !attempt) {
      console.error('Error recording attempt:', attemptError)
      return NextResponse.json({ error: 'Failed to record quiz attempt' }, { status: 500 })
    }

    // 8. Handle Streak updates if passed
    let newCurrentStreak = 0
    let newLongestStreak = 0

    if (passed) {
      const todayStr = new Date().toISOString().split('T')[0]

      const { data: streak } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!streak) {
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
        let brokeAtUpdate: any = {}

        if (streak.broke_at) {
          newCurrentStreak = 1
          newLongestStreak = Math.max(newLongestStreak, 1)
          brokeAtUpdate = {
            broke_at: null,
            days_before_break: 0,
            is_active: true
          }
        } else if (!lastActivity) {
          newCurrentStreak = 1
          newLongestStreak = Math.max(newLongestStreak, 1)
        } else {
          const today = new Date(todayStr)
          today.setUTCHours(0, 0, 0, 0)
          const lastDate = new Date(lastActivity)
          lastDate.setUTCHours(0, 0, 0, 0)

          const diffTime = today.getTime() - lastDate.getTime()
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

          if (diffDays === 1) {
            newCurrentStreak += 1
            newLongestStreak = Math.max(newLongestStreak, newCurrentStreak)
          } else if (diffDays === 2 && (streak.shields_available || 0) > 0) {
            newCurrentStreak += 1
            newLongestStreak = Math.max(newLongestStreak, newCurrentStreak)
            await supabase
              .from('streaks')
              .update({
                shields_available: (streak.shields_available || 0) - 1,
                shields_used_this_month: (streak.shields_used_this_month || 0) + 1
              })
              .eq('user_id', user.id)
          } else if (diffDays > 1) {
            newCurrentStreak = 1
            newLongestStreak = Math.max(newLongestStreak, newCurrentStreak)
            const brokenDate = new Date(lastActivity)
            brokenDate.setDate(brokenDate.getDate() + 1)
            await supabase
              .from('streaks')
              .update({ streak_broken_at: brokenDate.toISOString() })
              .eq('user_id', user.id)
          } else if (diffDays === 0 && newCurrentStreak === 0) {
            newCurrentStreak = 1
            newLongestStreak = Math.max(newLongestStreak, 1)
          }
        }

        await supabase
          .from('streaks')
          .update({
            current_streak: newCurrentStreak,
            longest_streak: newLongestStreak,
            last_activity_at: todayStr,
            updated_at: new Date().toISOString(),
            ...brokeAtUpdate
          })
          .eq('user_id', user.id)
      }
    } else {
      const { data: streak } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      newCurrentStreak = streak?.current_streak || 0
      newLongestStreak = streak?.longest_streak || 0
    }

    // 9. Check if entire roadmap is fully completed
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
        const { data: roadmapLessons } = await supabase
          .from('lessons')
          .select('id')
          .eq('roadmap_id', roadmapId)

        const roadmapLessonIds = roadmapLessons?.map(l => l.id) || []

        if (roadmapLessonIds.length > 0) {
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

    // 10. Award XP — FIRST ATTEMPT ONLY
    let xpData: any = null
    if (!isRetake && xpAward > 0) {
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
    }

    return NextResponse.json({
      attemptId: attempt.id,
      score,
      passed,
      correctCount,
      totalCount: questions.length,
      isRetake,
      cxpAwarded: cxpToAward,
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
