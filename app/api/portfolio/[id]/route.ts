import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    const supabase = await createClient()

    // 1. Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, occupation, country, linkedin_url, twitter_url, instagram_url, facebook_url, portfolio_public, created_at')
      .eq('id', userId)
      .maybeSingle()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // 2. Enforce privacy
    if (!profile.portfolio_public) {
      return NextResponse.json({ error: 'This learning portfolio is private.' }, { status: 403 })
    }

    // 3. Fetch stats
    // A. Total Completed Lessons
    const { count: completedLessonsCount } = await supabase
      .from('lesson_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')

    // B. Average Quiz Score
    const { data: quizAttempts } = await supabase
      .from('quiz_attempts')
      .select('score')
      .eq('user_id', userId)
    
    const avgQuiz = quizAttempts && quizAttempts.length > 0
      ? Math.round(quizAttempts.reduce((sum: number, item: any) => sum + item.score, 0) / quizAttempts.length)
      : 0

    // C. Streak
    const { data: streakRow } = await supabase
      .from('streaks')
      .select('longest_streak, current_streak')
      .eq('user_id', userId)
      .maybeSingle()

    // D. Fetch Completed Roadmaps
    const { data: roadmaps } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('user_id', userId)

    const completedList: any[] = []

    if (roadmaps && roadmaps.length > 0) {
      // Fetch all user's lesson progress to cross reference
      const { data: progress } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', userId)
        .eq('status', 'completed')
      
      const completedLessonIds = new Set(progress?.map((p: any) => p.lesson_id) || [])

      for (const rm of roadmaps) {
        // Fetch lessons in this roadmap
        const { data: rmLessons } = await supabase
          .from('lessons')
          .select('id')
          .eq('roadmap_id', rm.id)

        if (rmLessons && rmLessons.length > 0) {
          const lessonsCount = rmLessons.length
          const completedInRoadmap = rmLessons.filter((l: any) => completedLessonIds.has(l.id)).length
          
          if (completedInRoadmap === lessonsCount) {
            // Calculate average quiz score inside this roadmap
            const { data: quizzes } = await supabase
              .from('quizzes')
              .select('id')
              .in('lesson_id', rmLessons.map((l: any) => l.id))
            
            let rmAvgScore = 0
            const quizIds = quizzes?.map((q: any) => q.id) || []
            if (quizIds.length > 0) {
              const { data: rmAttempts } = await supabase
                .from('quiz_attempts')
                .select('score')
                .eq('user_id', userId)
                .in('quiz_id', quizIds)
              
              if (rmAttempts && rmAttempts.length > 0) {
                rmAvgScore = Math.round(rmAttempts.reduce((sum: number, item: any) => sum + item.score, 0) / rmAttempts.length)
              }
            }

            completedList.push({
              id: rm.id,
              title: rm.title,
              description: rm.description || '',
              created_at: rm.created_at,
              lessonsCount,
              avgScore: rmAvgScore
            })
          }
        }
      }
    }

    // E. Badges
    const { data: badges } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })

    return NextResponse.json({
      profile,
      stats: {
        totalLessonsCompleted: completedLessonsCount || 0,
        avgQuizScore: avgQuiz,
        recordStreak: streakRow?.longest_streak || 0,
        currentStreak: streakRow?.current_streak || 0
      },
      completedRoadmaps: completedList,
      badges: badges || []
    })

  } catch (err: any) {
    console.error('[Public Portfolio API Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
