import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const supabase = await createClient()

    // 1. Verify admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== process.env.ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Fetch User Profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // 3. Fetch Active Learning Goal
    const { data: activeGoal } = await supabase
      .from('learning_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle()

    // 4. Fetch Streak
    const { data: streak } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    // 5. Fetch Completed vs Total Lessons for the active roadmap
    let completedLessons = 0
    let totalLessons = 0
    let activeRoadmapTitle = 'None'
    let currentPhaseNumber = 0
    let totalPhasesCount = 0

    if (activeGoal) {
      const { data: roadmap } = await supabase
        .from('roadmaps')
        .select('id, title')
        .eq('goal_id', activeGoal.id)
        .maybeSingle()

      if (roadmap) {
        activeRoadmapTitle = roadmap.title

        // Total lessons count
        const { count: totalCount } = await supabase
          .from('lessons')
          .select('*', { count: 'exact', head: true })
          .eq('roadmap_id', roadmap.id)

        totalLessons = totalCount || 0

        // Completed lessons count
        const { count: completedCount } = await supabase
          .from('lesson_progress')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'completed')

        completedLessons = completedCount || 0

        // Get current phase details
        const { data: phases } = await supabase
          .from('roadmap_phases')
          .select('id, phase_number')
          .eq('roadmap_id', roadmap.id)
          .order('phase_number', { ascending: true })

        if (phases) {
          totalPhasesCount = phases.length
          
          // Find phase of the first uncompleted lesson
          const { data: lessons } = await supabase
            .from('lessons')
            .select('id, phase_id, order_index')
            .eq('roadmap_id', roadmap.id)
            .order('order_index', { ascending: true })

          if (lessons) {
            const { data: completedProgress } = await supabase
              .from('lesson_progress')
              .select('lesson_id')
              .eq('user_id', userId)
              .eq('status', 'completed')

            const completedSet = new Set(completedProgress?.map(p => p.lesson_id) || [])
            const firstUncompleted = lessons.find(l => !completedSet.has(l.id))
            
            if (firstUncompleted) {
              const currentPhase = phases.find(p => p.id === firstUncompleted.phase_id)
              currentPhaseNumber = currentPhase?.phase_number || 1
            } else {
              currentPhaseNumber = totalPhasesCount // completed all
            }
          }
        }
      }
    }

    // 6. Fetch Average Quiz Score
    const { data: quizAttempts } = await supabase
      .from('quiz_attempts')
      .select('score, passed, attempted_at, quiz_id')
      .eq('user_id', userId)
      .order('attempted_at', { ascending: false })

    const totalQuizzesTaken = quizAttempts?.length || 0
    const avgQuizScore = (quizAttempts && totalQuizzesTaken > 0)
      ? Math.round(quizAttempts.reduce((sum, item) => sum + item.score, 0) / totalQuizzesTaken)
      : 0

    // 7. Recent quiz attempts details (join quiz and lesson)
    const recentQuizAttempts: any[] = []
    if (quizAttempts && quizAttempts.length > 0) {
      // Load quiz metadata to fetch lesson title
      const { data: quizzesData } = await supabase
        .from('quizzes')
        .select(`
          id,
          lessons (
            title
          )
        `)
        .in('id', quizAttempts.map(q => q.quiz_id))

      const quizToLessonMap = new Map<string, string>()
      quizzesData?.forEach((qz: any) => {
        if (qz.lessons?.title) {
          quizToLessonMap.set(qz.id, qz.lessons.title)
        }
      })

      quizAttempts.slice(0, 10).forEach(q => {
        recentQuizAttempts.push({
          attempted_at: q.attempted_at,
          score: q.score,
          passed: q.passed,
          lesson_title: quizToLessonMap.get(q.quiz_id) || 'Quiz'
        })
      })
    }

    // 8. Fetch Badges Earned
    const { data: badges } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })

    // Return compiled stats
    return NextResponse.json({
      profile,
      streak: {
        current: streak?.current_streak || 0,
        record: streak?.record_streak || 0,
        lastActive: streak?.last_active_at || profile.created_at
      },
      learningJourney: {
        subject: activeGoal?.subject || 'None',
        roadmapTitle: activeRoadmapTitle,
        currentPhase: currentPhaseNumber,
        totalPhases: totalPhasesCount,
        lessonsCompleted: completedLessons,
        lessonsTotal: totalLessons,
        avgScore: avgQuizScore,
        quizzesTaken: totalQuizzesTaken
      },
      recentQuizzes: recentQuizAttempts,
      badges: badges || []
    })

  } catch (err: any) {
    console.error('[Admin User Detail GET Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
