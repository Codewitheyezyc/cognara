import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Verify admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== process.env.ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Fetch Stats Row 1: Business Metrics
    // Total Users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // New users in last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const { count: newUsers7d } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())

    // Active Users (last 7 days - completed a lesson or quiz attempt)
    const { data: activeLessonUsers } = await supabase
      .from('lesson_progress')
      .select('user_id')
      .gte('started_at', sevenDaysAgo.toISOString())
    
    const { data: activeQuizUsers } = await supabase
      .from('quiz_attempts')
      .select('user_id')
      .gte('attempted_at', sevenDaysAgo.toISOString())

    const activeUsersSet = new Set<string>()
    activeLessonUsers?.forEach(u => activeUsersSet.add(u.user_id))
    activeQuizUsers?.forEach(u => activeUsersSet.add(u.user_id))
    const activeUsersCount = activeUsersSet.size

    // Pro Users
    const { count: proUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .neq('subscription_tier', 'free')

    // 3. Fetch Stats Row 2: Learning Metrics
    // Lessons Today
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)
    const { count: lessonsToday } = await supabase
      .from('lesson_progress')
      .select('*', { count: 'exact', head: true })
      .gte('started_at', oneDayAgo.toISOString())

    // Quizzes Today
    const { count: quizzesToday } = await supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .gte('attempted_at', oneDayAgo.toISOString())

    // Average Quiz Score
    const { data: scoresData } = await supabase
      .from('quiz_attempts')
      .select('score')
    
    const avgScore = scoresData && scoresData.length > 0
      ? Math.round(scoresData.reduce((sum, item) => sum + item.score, 0) / scoresData.length)
      : 0

    // Average Streak
    const { data: streaksData } = await supabase
      .from('streaks')
      .select('current_streak')
    
    const avgStreak = streaksData && streaksData.length > 0
      ? Number((streaksData.reduce((sum, item) => sum + (item.current_streak || 0), 0) / streaksData.length).toFixed(1))
      : 0

    // 4. Chart 1: New Users over last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: recentUsers } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())

    // Group users by date
    const userGrowthMap: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      userGrowthMap[dateStr] = 0
    }

    recentUsers?.forEach(u => {
      const dateStr = new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (userGrowthMap[dateStr] !== undefined) {
        userGrowthMap[dateStr]++
      }
    })

    const userGrowthChart = Object.keys(userGrowthMap).map(date => ({
      date,
      count: userGrowthMap[date]
    }))

    // 5. Chart 2: Top 10 subjects being learned
    const { data: activeGoals } = await supabase
      .from('learning_goals')
      .select('subject, user_id')
      .eq('is_active', true)

    const subjectMap: Record<string, Set<string>> = {}
    activeGoals?.forEach(g => {
      if (!g.subject) return
      if (!subjectMap[g.subject]) {
        subjectMap[g.subject] = new Set()
      }
      subjectMap[g.subject].add(g.user_id)
    })

    const topSubjects = Object.keys(subjectMap)
      .map(subject => ({
        subject,
        users: subjectMap[subject].size
      }))
      .sort((a, b) => b.users - a.users)
      .slice(0, 10)

    // 6. Recent Activity Feed (Merge last 10 signups, quiz completions, lesson completions)
    // Recent Signups
    const { data: recentSignups } = await supabase
      .from('profiles')
      .select('name, email, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    // Recent Quiz completions
    const { data: recentQuizzes } = await supabase
      .from('quiz_attempts')
      .select(`
        score,
        passed,
        attempted_at,
        profiles (name, email),
        quizzes (
          lessons (title)
        )
      `)
      .order('attempted_at', { ascending: false })
      .limit(10)

    // Recent Lesson progress
    const { data: recentLessons } = await supabase
      .from('lesson_progress')
      .select(`
        completed_at,
        status,
        profiles (name, email),
        lessons (title)
      `)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(10)

    // Format and combine
    const activities: any[] = []

    recentSignups?.forEach(u => {
      activities.push({
        id: `signup-${u.created_at}-${u.email}`,
        type: 'signup',
        user: u.name || 'Learner',
        email: u.email,
        text: `New user signed up: ${u.email}`,
        timestamp: new Date(u.created_at).getTime(),
        timeStr: u.created_at
      })
    })

    recentQuizzes?.forEach((q: any) => {
      const name = q.profiles?.name || 'Learner'
      const email = q.profiles?.email || ''
      const title = q.quizzes?.lessons?.title || 'Lesson'
      activities.push({
        id: `quiz-${q.attempted_at}-${email}`,
        type: 'quiz',
        user: name,
        email,
        text: `Quiz completed: ${q.score}% score (${title})`,
        timestamp: new Date(q.attempted_at).getTime(),
        timeStr: q.attempted_at
      })
    })

    recentLessons?.forEach((l: any) => {
      const name = l.profiles?.name || 'Learner'
      const email = l.profiles?.email || ''
      const title = l.lessons?.title || 'Lesson'
      activities.push({
        id: `lesson-${l.completed_at}-${email}`,
        type: 'lesson',
        user: name,
        email,
        text: `Lesson completed: ${title}`,
        timestamp: new Date(l.completed_at).getTime(),
        timeStr: l.completed_at
      })
    })

    // Sort by timestamp descending and take top 10
    const sortedActivities = activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)

    // Return combined data
    return NextResponse.json({
      stats: {
        totalUsers: totalUsers || 0,
        newUsers7d: newUsers7d || 0,
        activeUsers7d: activeUsersCount || 0,
        proUsers: proUsers || 0,
        lessonsToday: lessonsToday || 0,
        quizzesToday: quizzesToday || 0,
        avgScore,
        avgStreak
      },
      charts: {
        userGrowth: userGrowthChart,
        topSubjects
      },
      activities: sortedActivities
    })

  } catch (err: any) {
    console.error('[Admin Overview API Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
