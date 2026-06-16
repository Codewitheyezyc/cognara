import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Verify admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== process.env.ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse Date Range filter
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '7days' // 'today' | '7days' | '30days' | 'all'

    let startDate = new Date()
    if (range === 'today') {
      startDate.setHours(0, 0, 0, 0)
    } else if (range === '7days') {
      startDate.setDate(startDate.getDate() - 7)
    } else if (range === '30days') {
      startDate.setDate(startDate.getDate() - 30)
    } else {
      startDate = new Date(0) // all time
    }

    // 3. Fetch Basic counts in range
    // Lessons generated
    const { count: lessonsGenerated } = await supabase
      .from('api_usage_log')
      .select('*', { count: 'exact', head: true })
      .eq('api_type', 'lesson')
      .gte('created_at', startDate.toISOString())

    // Quizzes taken
    const { count: quizzesTaken } = await supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .gte('attempted_at', startDate.toISOString())

    // Average Quiz Score in range
    const { data: quizScores } = await supabase
      .from('quiz_attempts')
      .select('score')
      .gte('attempted_at', startDate.toISOString())

    const avgQuizScore = quizScores && quizScores.length > 0
      ? Math.round(quizScores.reduce((sum, item) => sum + item.score, 0) / quizScores.length)
      : 0

    // Confused button clicks in range (simplify logs)
    const { count: confusedClicks } = await supabase
      .from('api_usage_log')
      .select('*', { count: 'exact', head: true })
      .eq('api_type', 'simplify')
      .gte('created_at', startDate.toISOString())

    // Regenerated lessons count
    // Calculated as: Total Lesson logs in range minus unique lessons generated in range
    const { data: lessonLogs } = await supabase
      .from('api_usage_log')
      .select('created_at')
      .eq('api_type', 'lesson')
      .gte('created_at', startDate.toISOString())

    const { data: uniqueLessons } = await supabase
      .from('lessons')
      .select('id')
      .not('content', 'is', null)
      .gte('generated_at', startDate.toISOString())

    const totalLessonCalls = lessonLogs?.length || 0
    const uniqueLessonCount = uniqueLessons?.length || 0
    const regeneratedCount = Math.max(0, totalLessonCalls - uniqueLessonCount)

    // 4. Subject Popularity table
    // Query learning goals, lessons progress and quiz attempts grouped by subject
    const { data: goals } = await supabase
      .from('learning_goals')
      .select('subject, user_id, is_active')
      .eq('is_active', true)

    const { data: allRoadmaps } = await supabase
      .from('roadmaps')
      .select('id, goal_id')

    const { data: allLessons } = await supabase
      .from('lessons')
      .select('id, roadmap_id')

    const { data: allLessonProgress } = await supabase
      .from('lesson_progress')
      .select('lesson_id, status, user_id')

    const { data: allQuizAttempts } = await supabase
      .from('quiz_attempts')
      .select('score, quiz_id')

    const { data: allQuizzes } = await supabase
      .from('quizzes')
      .select('id, lesson_id')

    // Maps to link objects
    const goalToSubject = new Map<string, string>() // goal_id -> subject
    goals?.forEach(g => {
      // Find goal ID later
    })

    // Let's do aggregation in JS for accuracy and simplicity
    const subjectStats: Record<string, {
      subject: string
      users: Set<string>
      lessons: Set<string>
      scores: number[]
      completions: number
    }> = {}

    // Initialize stats with active subjects
    goals?.forEach(g => {
      if (!g.subject) return
      if (!subjectStats[g.subject]) {
        subjectStats[g.subject] = {
          subject: g.subject,
          users: new Set(),
          lessons: new Set(),
          scores: [],
          completions: 0
        }
      }
      subjectStats[g.subject].users.add(g.user_id)
    })

    // Build helper maps
    const roadmapIdToSubject = new Map<string, string>() // roadmap_id -> subject
    const lessonIdToSubject = new Map<string, string>() // lesson_id -> subject
    const quizIdToSubject = new Map<string, string>() // quiz_id -> subject

    const goalIdToSubject = new Map<string, string>()
    // Helper query for goals
    const { data: goalsAll } = await supabase
      .from('learning_goals')
      .select('id, subject')
    goalsAll?.forEach(g => {
      if (g.subject) goalIdToSubject.set(g.id, g.subject)
    })

    allRoadmaps?.forEach(r => {
      const sub = goalIdToSubject.get(r.goal_id)
      if (sub) roadmapIdToSubject.set(r.id, sub)
    })

    allLessons?.forEach(l => {
      const sub = roadmapIdToSubject.get(l.roadmap_id)
      if (sub) {
        lessonIdToSubject.set(l.id, sub)
        if (subjectStats[sub]) subjectStats[sub].lessons.add(l.id)
      }
    })

    allQuizzes?.forEach(q => {
      const sub = lessonIdToSubject.get(q.lesson_id)
      if (sub) quizIdToSubject.set(q.id, sub)
    })

    // Count completions and scores per subject
    allLessonProgress?.forEach(p => {
      const sub = lessonIdToSubject.get(p.lesson_id)
      if (sub && p.status === 'completed') {
        if (!subjectStats[sub]) {
          subjectStats[sub] = { subject: sub, users: new Set(), lessons: new Set(), scores: [], completions: 0 }
        }
        subjectStats[sub].completions++
      }
    })

    allQuizAttempts?.forEach(a => {
      const sub = quizIdToSubject.get(a.quiz_id)
      if (sub) {
        if (!subjectStats[sub]) {
          subjectStats[sub] = { subject: sub, users: new Set(), lessons: new Set(), scores: [], completions: 0 }
        }
        subjectStats[sub].scores.push(a.score)
      }
    })

    const subjectPopularityTable = Object.values(subjectStats).map(s => {
      const avgScore = s.scores.length > 0
        ? Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length)
        : 0
      return {
        subject: s.subject,
        users: s.users.size,
        lessons: s.lessons.size,
        avgScore,
        completions: s.completions
      }
    }).sort((a, b) => b.users - a.users)

    // 5. Quiz Performance (lowest scoring lessons)
    const lessonScoresMap: Record<string, {
      lesson_id: string
      title: string
      subject: string
      scores: number[]
    }> = {}

    // Fetch quiz attempts with lesson titles
    const { data: attemptsWithLesson } = await supabase
      .from('quiz_attempts')
      .select(`
        score,
        quizzes (
          lesson_id,
          lessons (
            title,
            roadmap_id
          )
        )
      `)

    attemptsWithLesson?.forEach((a: any) => {
      const lessonId = a.quizzes?.lesson_id
      const title = a.quizzes?.lessons?.title
      const roadmapId = a.quizzes?.lessons?.roadmap_id
      const subject = roadmapIdToSubject.get(roadmapId) || 'General'

      if (lessonId && title) {
        if (!lessonScoresMap[lessonId]) {
          lessonScoresMap[lessonId] = {
            lesson_id: lessonId,
            title,
            subject,
            scores: []
          }
        }
        lessonScoresMap[lessonId].scores.push(a.score)
      }
    })

    const lowestScoringLessons = Object.values(lessonScoresMap)
      .map(l => {
        const avgScore = Math.round(l.scores.reduce((a, b) => a + b, 0) / l.scores.length)
        return {
          lesson_id: l.lesson_id,
          title: l.title,
          subject: l.subject,
          avgScore,
          attempts: l.scores.length
        }
      })
      // Show lessons with at least 1 attempt, sorted by score ascending (lowest first)
      .filter(l => l.attempts > 0)
      .sort((a, b) => a.avgScore - b.avgScore)
      .slice(0, 5) // top 5 lowest scoring

    // 6. Daily Active Users (DAU) over last 30 days
    const dauMap: Record<string, Set<string>> = {}
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Query activity logs in last 30 days
    const { data: lpActive } = await supabase
      .from('lesson_progress')
      .select('user_id, started_at, completed_at')
      .gte('started_at', thirtyDaysAgo.toISOString())

    const { data: qaActive } = await supabase
      .from('quiz_attempts')
      .select('user_id, attempted_at')
      .gte('attempted_at', thirtyDaysAgo.toISOString())

    // Initialize map
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      dauMap[dateStr] = new Set()
    }

    lpActive?.forEach(a => {
      if (a.started_at) {
        const dateStr = new Date(a.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        if (dauMap[dateStr]) dauMap[dateStr].add(a.user_id)
      }
      if (a.completed_at) {
        const dateStr = new Date(a.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        if (dauMap[dateStr]) dauMap[dateStr].add(a.user_id)
      }
    })

    qaActive?.forEach(a => {
      const dateStr = new Date(a.attempted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (dauMap[dateStr]) dauMap[dateStr].add(a.user_id)
    })

    const dailyActiveUsers = Object.keys(dauMap).map(date => ({
      date,
      count: dauMap[date].size
    }))

    return NextResponse.json({
      stats: {
        lessonsGenerated,
        quizzesTaken,
        avgQuizScore,
        regeneratedCount,
        confusedClicks
      },
      subjectPopularity: subjectPopularityTable,
      lowestScoringLessons,
      dailyActiveUsers
    })

  } catch (err: any) {
    console.error('[Admin Activity GET Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
