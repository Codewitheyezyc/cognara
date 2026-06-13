'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { BarChart2, Flame, Award, BookOpen, CheckCircle, Clock } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts'
import AICoachInsight from '@/components/dashboard/AICoachInsight'


export default function ProgressPage() {
  const router = useRouter()
  const supabase = createClient()

  // Data states
  const [streak, setStreak] = useState({ current: 0, longest: 0 })
  const [attempts, setAttempts] = useState<any[]>([])
  const [completedCount, setCompletedCount] = useState(0)
  const [totalLessons, setTotalLessons] = useState(0)
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({})
  const [chartLineData, setChartLineData] = useState<any[]>([])
  const [chartBarData, setChartBarData] = useState<any[]>([])
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true)
  const [isPro, setIsPro] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }



        // 1. Fetch Streak
        const { data: streakData } = await supabase
          .from('streaks')
          .select('current_streak, longest_streak')
          .eq('user_id', user.id)
          .maybeSingle()
        if (streakData) {
          setStreak({
            current: streakData.current_streak || 0,
            longest: streakData.longest_streak || 0,
          })
        }

        // 2. Fetch completed progress count
        const { count: compCount } = await supabase
          .from('lesson_progress')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed')
        setCompletedCount(compCount || 0)

        // 3. Fetch total lessons
        const { count: totLessons } = await supabase
          .from('lessons')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
        setTotalLessons(totLessons || 0)

        // 4. Fetch all quiz attempts
        const { data: quizAttempts } = await supabase
          .from('quiz_attempts')
          .select(`
            id,
            score,
            passed,
            attempted_at,
            quiz_id,
            quizzes (
              id,
              lessons (
                id,
                title
              )
            )
          `)
          .eq('user_id', user.id)
          .order('attempted_at', { ascending: true })

        const rawAttempts = quizAttempts || []
        setAttempts(rawAttempts)

        // 5. Line Chart Data: Scores over time (last 10)
        const last10Attempts = rawAttempts.slice(-10)
        const lineData = last10Attempts.map((attempt: any, index: number) => {
          const quizInfo = attempt.quizzes as any
          const lessonTitle = quizInfo?.lessons?.title?.split(' (')[0] || `Quiz ${index + 1}`
          return {
            name: lessonTitle.length > 15 ? lessonTitle.substring(0, 12) + '...' : lessonTitle,
            score: attempt.score,
            fullName: lessonTitle,
          }
        })
        setChartLineData(lineData)

        // 6. Bar Chart Data: Performance per lesson topic (lowest first)
        const scoresByTopic: Record<string, { sum: number; count: number }> = {}
        rawAttempts.forEach((attempt: any) => {
          const quizInfo = attempt.quizzes as any
          const lessonTitle = quizInfo?.lessons?.title?.split(' (')[0] || 'General Concepts'
          if (!scoresByTopic[lessonTitle]) {
            scoresByTopic[lessonTitle] = { sum: 0, count: 0 }
          }
          scoresByTopic[lessonTitle].sum += attempt.score
          scoresByTopic[lessonTitle].count += 1
        })

        const barData = Object.entries(scoresByTopic)
          .map(([name, stats]) => ({
            name: name.length > 18 ? name.substring(0, 15) + '...' : name,
            score: Math.round(stats.sum / stats.count),
            fullName: name,
          }))
          .sort((a, b) => a.score - b.score) // Sort ascending: lowest score at the top
        setChartBarData(barData)

        // 7. Heatmap Calendar (Past 6 months: 168 days)
        // Fetch lesson completed dates
        const { data: lessonLogs } = await supabase
          .from('lesson_progress')
          .select('completed_at')
          .eq('user_id', user.id)
          .eq('status', 'completed')
        
        const activityCounts: Record<string, number> = {}

        lessonLogs?.forEach((log: any) => {
          if (log.completed_at) {
            const dateStr = log.completed_at.split('T')[0]
            activityCounts[dateStr] = (activityCounts[dateStr] || 0) + 1
          }
        })

        // Fetch quiz attempt dates
        rawAttempts.forEach((attempt: any) => {
          if (attempt.attempted_at) {
            const dateStr = attempt.attempted_at.split('T')[0]
            activityCounts[dateStr] = (activityCounts[dateStr] || 0) + 1
          }
        })

        setHeatmapData(activityCounts)
        setIsLoading(false)
      } catch (err) {
        console.error(err)
        setIsLoading(false)
      }
    }

    loadData()
  }, [supabase, router])

  // Heatmap generation
  const renderHeatmap = () => {
    const days = 168 // 24 weeks
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const gridCells = []

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(today.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const count = heatmapData[dateStr] || 0

      // Color opacity based on activity count
      let bgStyle = 'bg-border/40' // Empty
      if (count === 1) bgStyle = 'bg-primary/25 border border-primary/10'
      if (count === 2) bgStyle = 'bg-primary/50'
      if (count >= 3) bgStyle = 'bg-primary'

      gridCells.push(
        <div
          key={dateStr}
          title={`${d.toLocaleDateString()}: ${count} activity logs`}
          className={`w-2.5 h-2.5 rounded-sm cursor-pointer transition-colors duration-150 hover:border-text-1 hover:scale-110 ${bgStyle}`}
        />
      )
    }

    return (
      <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
        <div className="min-w-[480px]">
          {/* Header Row: Months */}
          <div className="flex justify-between text-[9px] text-text-3 font-mono mb-1.5 px-6">
            <span>6 Months Ago</span>
            <span>3 Months Ago</span>
            <span>Today</span>
          </div>

          <div className="flex items-start gap-1.5">
            {/* Days indicator column */}
            <div className="flex flex-col justify-between h-[80px] text-[8px] text-text-3 font-mono select-none pr-1">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
              <span>Sun</span>
            </div>

            {/* Grid display: 7 rows, auto columns flowing columns */}
            <div className="grid grid-rows-7 grid-flow-col gap-1.5 h-[80px]">
              {gridCells}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Calculate Average score across all attempts
  const overallAvg = attempts.length > 0
    ? Math.round(attempts.reduce((acc, curr) => acc + curr.score, 0) / attempts.length)
    : 0

  if (isLoading) {
    return (
      <div className="space-y-8 animate-page-enter">
        <div className="space-y-2">
          <div className="h-8 bg-surface-alt rounded w-48 animate-pulse" />
          <div className="h-4 bg-surface-alt rounded w-72 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-surface rounded-[10px] border border-border animate-pulse" />
          ))}
        </div>
        <div className="h-32 bg-surface rounded-[10px] border border-border animate-pulse" />
      </div>
    )
  }



  return (
    <div className="space-y-8 animate-page-enter">
      {/* Page Title & Heading */}
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-text-1">
          Progress & Analytics
        </h1>
        <p className="text-text-2 text-sm mt-1">
          Detailed metrics of your learning streak, quiz history, and skill breakdown.
        </p>
      </div>

      {/* Vitals Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Streak Card */}
        <div className="bg-surface border border-border rounded-[10px] p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-accent-warm/10 text-accent-warm border border-accent-warm/15 rounded-md">
            <Flame className="h-5 w-5 fill-current" />
          </div>
          <div>
            <span className="text-[10px] text-text-2 font-mono uppercase tracking-wider block">Active Streak</span>
            <p className="text-xl font-bold text-text-1 font-mono mt-0.5">{streak.current} days</p>
          </div>
        </div>

        {/* Longest Streak */}
        <div className="bg-surface border border-border rounded-[10px] p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-accent/10 text-accent border border-accent/15 rounded-md">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-text-2 font-mono uppercase tracking-wider block">Record Streak</span>
            <p className="text-xl font-bold text-text-1 font-mono mt-0.5">{streak.longest} days</p>
          </div>
        </div>

        {/* Completed Lessons */}
        <div className="bg-surface border border-border rounded-[10px] p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-success/10 text-success border border-success/15 rounded-md">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-text-2 font-mono uppercase tracking-wider block">Completed</span>
            <p className="text-xl font-bold text-text-1 font-mono mt-0.5">{completedCount} / {totalLessons}</p>
          </div>
        </div>

        {/* Avg Quiz Score */}
        <div className="bg-surface border border-border rounded-[10px] p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-primary/10 text-primary border border-primary/15 rounded-md">
            <BarChart2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-text-2 font-mono uppercase tracking-wider block">Average Accuracy</span>
            <p className="text-xl font-bold text-text-1 font-mono mt-0.5">{overallAvg}%</p>
          </div>
        </div>
      </div>

      {/* AI Coach Insights Panel */}
      <AICoachInsight />

      {/* Activity Heatmap Grid */}
      <div className="bg-surface border border-border rounded-[10px] p-6 shadow-sm space-y-4">
        <div>
          <h3 className="font-heading text-base font-bold text-text-1">Activity Heatmap</h3>
          <p className="text-[11px] text-text-2 mt-0.5">Your daily study and assessment logs over the past 24 weeks.</p>
        </div>
        {renderHeatmap()}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Over Time Line Chart */}
        <div className="bg-surface border border-border rounded-[10px] p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-heading text-base font-bold text-text-1">Quiz Score Trajectory</h3>
            <p className="text-[11px] text-text-2 mt-0.5">Plot of your recent quiz assessment percentage trends.</p>
          </div>
          <div className="w-full h-[250px] mt-4">
            {chartLineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartLineData} margin={{ left: -20, right: 10, top: 10, bottom: 5 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--color-text-3)" fontSize={10} tickLine={false} />
                  <YAxis stroke="var(--color-text-3)" fontSize={10} domain={[0, 100]} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-surface-alt)',
                      borderColor: 'var(--color-border)',
                      borderRadius: '8px',
                    }}
                    labelClassName="text-text-1 font-bold font-heading text-xs"
                    itemStyle={{ color: 'var(--color-primary)', fontSize: '12px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                    dot={{ strokeWidth: 2, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-text-3 text-xs">
                <span>Complete quiz assessments to display your trajectory.</span>
              </div>
            )}
          </div>
        </div>

        {/* Weak Areas Breakdown Bar Chart */}
        <div className="bg-surface border border-border rounded-[10px] p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-heading text-base font-bold text-text-1">Topics Breakdown (Lowest First)</h3>
            <p className="text-[11px] text-text-2 mt-0.5">Identifying concepts you might need to review on your path.</p>
          </div>
          <div className="w-full h-[250px] mt-4">
            {chartBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={chartBarData}
                  margin={{ left: -10, right: 10, top: 10, bottom: 5 }}
                >
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} stroke="var(--color-text-3)" fontSize={10} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke="var(--color-text-3)" fontSize={10} tickLine={false} width={100} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-surface-alt)',
                      borderColor: 'var(--color-border)',
                      borderRadius: '8px',
                    }}
                    labelClassName="text-text-1 font-bold font-heading text-xs"
                    itemStyle={{ color: 'var(--color-error)', fontSize: '12px' }}
                  />
                  <Bar dataKey="score" fill="var(--color-error)" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-text-3 text-xs">
                <span>Complete quiz assessments to visualize topic scores.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
