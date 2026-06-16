'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  BookOpen, Award, Flame, Zap, HelpCircle, 
  ChevronRight, RefreshCw, AlertTriangle, ShieldCheck
} from 'lucide-react'
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'

interface ActivityStats {
  lessonsGenerated: number
  quizzesTaken: number
  avgQuizScore: number
  regeneratedCount: number
  confusedClicks: number
}

interface SubjectStat {
  subject: string
  users: number
  lessons: number
  avgScore: number
  completions: number
}

interface LowScoringLesson {
  lesson_id: string
  title: string
  subject: string
  avgScore: number
  attempts: number
}

export default function AdminActivity() {
  const [range, setRange] = useState<'today' | '7days' | '30days' | 'all'>('7days')
  const [stats, setStats] = useState<ActivityStats | null>(null)
  const [subjectPopularity, setSubjectPopularity] = useState<SubjectStat[]>([])
  const [lowestScoringLessons, setLowestScoringLessons] = useState<LowScoringLesson[]>([])
  const [dailyActiveUsers, setDailyActiveUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [mounted, setMounted] = useState(false)

  const loadData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    try {
      const res = await fetch(`/api/admin/activity?range=${range}`)
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setSubjectPopularity(data.subjectPopularity)
        setLowestScoringLessons(data.lowestScoringLessons)
        setDailyActiveUsers(data.dailyActiveUsers)
      }
    } catch (err) {
      console.error('Failed to load activity details', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [range])

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-xs font-semibold text-text-2">Loading learning statistics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Filter Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-1">Learning Analytics</h1>
          <p className="text-xs text-text-2 mt-1">Review lesson generation volumes, quiz accuracy, and subject completion stats.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Range filter */}
          <div className="flex bg-surface p-1 rounded-xl border border-border">
            {[
              { label: 'Today', value: 'today' },
              { label: '7 Days', value: '7days' },
              { label: '30 Days', value: '30days' },
              { label: 'All Time', value: 'all' },
            ].map(btn => (
              <button
                key={btn.value}
                onClick={() => {
                  setRange(btn.value as any)
                  setLoading(true)
                }}
                className={`
                  px-3 py-1.5 rounded-lg text-[10px] font-bold border transition cursor-pointer
                  ${range === btn.value
                    ? 'bg-primary/10 text-primary border-primary/20 shadow-xs'
                    : 'bg-transparent text-text-2 border-transparent hover:text-text-1'
                  }
                `}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 bg-surface hover:bg-surface-alt border border-border rounded-xl text-text-2 hover:text-text-1 transition disabled:opacity-50 cursor-pointer"
            title="Refresh statistics"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: Lessons generated */}
        <div className="bg-surface p-4.5 rounded-2xl border border-border flex flex-col justify-between h-28">
          <span className="text-[10px] font-bold text-text-2 uppercase tracking-wider">Lessons Generated</span>
          <div>
            <p className="text-xl font-black text-text-1 font-heading">{stats?.lessonsGenerated || 0}</p>
            <p className="text-[9px] text-text-3 font-semibold mt-1">Claude completions</p>
          </div>
        </div>

        {/* Metric 2: Quizzes taken */}
        <div className="bg-surface p-4.5 rounded-2xl border border-border flex flex-col justify-between h-28">
          <span className="text-[10px] font-bold text-text-2 uppercase tracking-wider">Quizzes Taken</span>
          <div>
            <p className="text-xl font-black text-text-1 font-heading">{stats?.quizzesTaken || 0}</p>
            <p className="text-[9px] text-text-3 font-semibold mt-1">Total quiz submissions</p>
          </div>
        </div>

        {/* Metric 3: Avg Quiz Score */}
        <div className="bg-surface p-4.5 rounded-2xl border border-border flex flex-col justify-between h-28">
          <span className="text-[10px] font-bold text-text-2 uppercase tracking-wider">Average Score</span>
          <div>
            <p className="text-xl font-black text-text-1 font-heading">{stats?.avgQuizScore || 0}%</p>
            <p className="text-[9px] text-text-3 font-semibold mt-1">Platform accuracy</p>
          </div>
        </div>

        {/* Metric 4: Lessons Regenerated */}
        <div className="bg-surface p-4.5 rounded-2xl border border-border flex flex-col justify-between h-28">
          <span className="text-[10px] font-bold text-text-2 uppercase tracking-wider">Regenerations</span>
          <div>
            <p className="text-xl font-black text-text-1 font-heading">{stats?.regeneratedCount || 0}</p>
            <p className="text-[9px] text-orange-500 font-bold mt-1">
              {stats?.lessonsGenerated ? Math.round((stats.regeneratedCount / stats.lessonsGenerated) * 100) : 0}% of total
            </p>
          </div>
        </div>

        {/* Metric 5: Confusion Clicks */}
        <div className="bg-surface p-4.5 rounded-2xl border border-border flex flex-col justify-between h-28 col-span-2 lg:col-span-1">
          <span className="text-[10px] font-bold text-text-2 uppercase tracking-wider">"Confused?" clicks</span>
          <div>
            <p className="text-xl font-black text-text-1 font-heading">💡 {stats?.confusedClicks || 0}</p>
            <p className="text-[9px] text-text-3 font-semibold mt-1">Simplify requests</p>
          </div>
        </div>
      </div>

      {/* DAILY ACTIVE USERS (DAU) TREND */}
      <div className="bg-surface p-6 rounded-2xl border border-border">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-text-1">Daily Active Users (DAU) Trend</h3>
          <p className="text-[11px] text-text-2">Unique users active per day over the last 30 days</p>
        </div>
        <div className="h-64">
          {mounted && dailyActiveUsers.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyActiveUsers} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                <XAxis dataKey="date" stroke="var(--color-text-2)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--color-text-2)" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--color-surface)', 
                    borderColor: 'var(--color-border)', 
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: 'var(--color-text-1)'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  name="Active Users" 
                  stroke="var(--color-primary)" 
                  strokeWidth={2.5} 
                  dot={{ r: 4, strokeWidth: 1.5, fill: 'var(--color-surface)' }}
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-text-3 font-semibold">
              No daily activity logs found
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SUBJECT POPULARITY TABLE (Col-Span 2) */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden lg:col-span-2">
          <div className="p-5 border-b border-border bg-surface-alt/45 select-none">
            <h3 className="text-xs font-bold text-text-1 uppercase tracking-wider">Subject Popularity & Output</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/80 text-[10px] uppercase font-bold tracking-wider text-text-2 bg-surface-alt/10 select-none">
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Active Learners</th>
                  <th className="py-3 px-4">Lessons</th>
                  <th className="py-3 px-4">Avg Quiz Score</th>
                  <th className="py-3 px-4">Completions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {subjectPopularity.length > 0 ? (
                  subjectPopularity.map((sub, i) => (
                    <tr key={i} className="hover:bg-surface-alt/20 transition">
                      <td className="py-3 px-4 font-bold text-text-1">{sub.subject}</td>
                      <td className="py-3 px-4 text-text-2 font-medium">{sub.users}</td>
                      <td className="py-3 px-4 text-text-2 font-medium">{sub.lessons}</td>
                      <td className="py-3 px-4">
                        <span className={`font-bold font-mono ${sub.avgScore >= 80 ? 'text-emerald-400' : sub.avgScore >= 65 ? 'text-amber-400' : 'text-rose-400'}`}>
                          {sub.avgScore > 0 ? `${sub.avgScore}%` : 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-2 font-medium">{sub.completions}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-text-3 font-semibold">No subject statistics found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* LOW QUIZ ACCURACY WARNINGS */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-border bg-surface-alt/45 select-none flex items-center justify-between">
              <h3 className="text-xs font-bold text-text-1 uppercase tracking-wider">Low-Scoring Quizzes</h3>
              <AlertTriangle className="h-4.5 w-4.5 text-rose-500" />
            </div>

            <div className="divide-y divide-border/60">
              {lowestScoringLessons.length > 0 ? (
                lowestScoringLessons.map((l, i) => (
                  <div key={i} className="p-4.5 space-y-2 hover:bg-surface-alt/20 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-bold text-text-1 truncate max-w-[200px]">{l.title}</h4>
                        <p className="text-[10px] text-text-3">{l.subject}</p>
                      </div>
                      <span className="font-bold font-mono text-rose-400 shrink-0">
                        {l.avgScore}%
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-text-3 font-semibold">{l.attempts} student attempts</span>
                      <Link
                        href={`/admin/users`} // Redirect to user list or review
                        className="text-primary hover:underline font-bold flex items-center gap-0.5"
                      >
                        <span>Review lesson</span>
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-text-3 font-semibold flex flex-col items-center justify-center gap-2">
                  <ShieldCheck className="h-7 w-7 text-emerald-500" />
                  <span>All quiz averages are above 70% accuracy!</span>
                </div>
              )}
            </div>
          </div>
          
          {lowestScoringLessons.length > 0 && (
            <div className="p-4 bg-surface-alt border-t border-border select-none">
              <p className="text-[9px] text-text-3 leading-relaxed font-semibold">
                ⚠️ Lessons showing averages under 65% indicate content gaps or confusing phrasing. Reviewing content is recommended.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
