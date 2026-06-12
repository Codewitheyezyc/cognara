import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateInsight } from '@/lib/ai/insight'
import { checkRateLimit } from '@/lib/ai/rateLimit'

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

    // 2. Fetch User Profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, learning_style, main_goal, occupation, preferred_study_time, daily_study_minutes')
      .eq('id', user.id)
      .maybeSingle()

    // 3. Fetch Active Streak
    const { data: streak } = await supabase
      .from('streaks')
      .select('current_streak')
      .eq('user_id', user.id)
      .maybeSingle()

    // 4. Fetch Active Goal
    const { data: goal } = await supabase
      .from('learning_goals')
      .select('id, goal_text')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    // 5. Fetch Completed Lessons Count
    const { count: completedCount, error: countErr } = await supabase
      .from('lesson_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed')

    // 6. Fetch Total Lessons Count
    const { count: totalCount } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // 7. Fetch Recent Quiz Attempts (last 5)
    const { data: quizAttempts } = await supabase
      .from('quiz_attempts')
      .select('score, passed, quiz_id')
      .eq('user_id', user.id)
      .order('attempted_at', { ascending: false })
      .limit(5)

    // 8. Determine Weakest Topics based on failed attempts
    let weakTopics = ''
    const failedAttempts = quizAttempts?.filter((a) => !a.passed) || []
    
    if (failedAttempts.length > 0) {
      // Fetch the quiz to find the associated lesson
      const { data: quizData } = await supabase
        .from('quizzes')
        .select('lesson_id')
        .eq('id', failedAttempts[0].quiz_id)
        .maybeSingle()

      if (quizData?.lesson_id) {
        const { data: lessonData } = await supabase
          .from('lessons')
          .select('title')
          .eq('id', quizData.lesson_id)
          .maybeSingle()

        if (lessonData?.title) {
          // Clean the title from adaptive labels if present (e.g. removes " (Intermediate)")
          weakTopics = lessonData.title.split(' (')[0]
        }
      }
    }

    // 9. Generate Coach Insight
    const insightParams = {
      name: profile?.name || user.email || 'Learner',
      goalText: goal?.goal_text || 'Self Mastery',
      completedCount: completedCount || 0,
      totalCount: totalCount || 8,
      scores: quizAttempts?.map((a) => a.score) || [],
      weakTopics,
      streak: streak?.current_streak || 0,
      profile: profile ? {
        learning_style: profile.learning_style || undefined,
        main_goal: profile.main_goal || undefined,
        occupation: profile.occupation || undefined,
        preferred_study_time: profile.preferred_study_time || undefined,
        daily_study_minutes: profile.daily_study_minutes || undefined,
      } : undefined
    }

    // Enforce Rate Limit (3 per day) - fall back to mock if exceeded
    const rateLimit = await checkRateLimit(supabase, user.id, 'insight', 3)

    const coachInsight = await generateInsight(insightParams, !rateLimit.allowed)

    return NextResponse.json({ insight: coachInsight })
  } catch (err) {
    console.error('[API Generate Insight Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
