'use client'

import React, { useEffect, useState } from 'react'
import { 
  Users, UserPlus, Activity, Sparkles, 
  BookOpen, Award, Percent, Flame, RefreshCw
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

interface Stats {
  totalUsers: number
  newUsers7d: number
  activeUsers7d: number
  proUsers: number
  lessonsToday: number
  quizzesToday: number
  avgScore: number
  avgStreak: number
}

interface ActivityItem {
  id: string
  type: 'signup' | 'quiz' | 'lesson'
  user: string
  email: string
  text: string
  timestamp: number
  timeStr: string
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [userGrowth, setUserGrowth] = useState<any[]>([])
  const [topSubjects, setTopSubjects] = useState<any[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [mounted, setMounted] = useState(false)

  const fetchData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true)
    try {
      const res = await fetch('/api/admin/overview')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setUserGrowth(data.charts.userGrowth)
        setTopSubjects(data.charts.topSubjects)
        setActivities(data.activities)
      }
    } catch (err) {
      console.error('Failed to fetch admin overview data', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    fetchData()

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchData(true)
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins} mins ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} hours ago`
    const days = Math.floor(hours / 24)
    return `${days} days ago`
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-xs font-semibold text-text-2">Loading statistics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header section with manual refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-1">Overview Dashboard</h1>
          <p className="text-xs text-text-2 mt-1">Real-time platform updates (refreshes automatically every 60 seconds)</p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 bg-surface hover:bg-surface-alt text-xs font-bold text-text-2 hover:text-text-1 border border-border rounded-lg transition disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* STATS ROW 1 - Business Metrics */}
      <div>
        <h2 className="text-xs font-bold text-primary uppercase tracking-wider mb-3.5">Business Metrics</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Users */}
          <div className="bg-surface p-5 rounded-2xl border border-border flex flex-col justify-between h-32 hover:border-primary/20 transition-all duration-300">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-text-2 uppercase tracking-wide">Total Users</span>
              <div className="p-1.5 bg-primary/5 rounded-lg border border-primary/10">
                <Users className="h-4.5 w-4.5 text-primary" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-text-1 font-heading">{stats?.totalUsers || 0}</p>
              <p className="text-[10px] text-text-3 font-semibold mt-1">Registered accounts</p>
            </div>
          </div>

          {/* Card 2: New (7 days) */}
          <div className="bg-surface p-5 rounded-2xl border border-border flex flex-col justify-between h-32 hover:border-primary/20 transition-all duration-300">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-text-2 uppercase tracking-wide">New (7 days)</span>
              <div className="p-1.5 bg-primary/5 rounded-lg border border-primary/10">
                <UserPlus className="h-4.5 w-4.5 text-primary" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-text-1 font-heading">+{stats?.newUsers7d || 0}</p>
              <p className="text-[10px] text-emerald-500 font-bold mt-1">↑ Growth vs last week</p>
            </div>
          </div>

          {/* Card 3: Active Users */}
          <div className="bg-surface p-5 rounded-2xl border border-border flex flex-col justify-between h-32 hover:border-primary/20 transition-all duration-300">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-text-2 uppercase tracking-wide">Active Users</span>
              <div className="p-1.5 bg-primary/5 rounded-lg border border-primary/10">
                <Activity className="h-4.5 w-4.5 text-primary" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-text-1 font-heading">{stats?.activeUsers7d || 0}</p>
              <p className="text-[10px] text-text-3 font-semibold mt-1">Last 7 days active</p>
            </div>
          </div>

          {/* Card 4: Pro Users */}
          <div className="bg-surface p-5 rounded-2xl border border-border flex flex-col justify-between h-32 hover:border-primary/20 transition-all duration-300">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-text-2 uppercase tracking-wide">Pro Users</span>
              <div className="p-1.5 bg-primary/5 rounded-lg border border-primary/10">
                <Sparkles className="h-4.5 w-4.5 text-primary" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-text-1 font-heading">{stats?.proUsers || 0}</p>
              <p className="text-[10px] text-primary font-bold mt-1">
                {stats?.totalUsers ? Math.round((stats.proUsers / stats.totalUsers) * 100) : 0}% of all users
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* STATS ROW 2 - Learning Metrics */}
      <div>
        <h2 className="text-xs font-bold text-primary uppercase tracking-wider mb-3.5">Learning Metrics</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Lessons Today */}
          <div className="bg-surface p-5 rounded-2xl border border-border flex flex-col justify-between h-32 hover:border-primary/20 transition-all duration-300">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-text-2 uppercase tracking-wide">Lessons Today</span>
              <div className="p-1.5 bg-primary/5 rounded-lg border border-primary/10">
                <BookOpen className="h-4.5 w-4.5 text-primary" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-text-1 font-heading">{stats?.lessonsToday || 0}</p>
              <p className="text-[10px] text-text-3 font-semibold mt-1">Started last 24h</p>
            </div>
          </div>

          {/* Card 2: Quizzes Today */}
          <div className="bg-surface p-5 rounded-2xl border border-border flex flex-col justify-between h-32 hover:border-primary/20 transition-all duration-300">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-text-2 uppercase tracking-wide">Quizzes Today</span>
              <div className="p-1.5 bg-primary/5 rounded-lg border border-primary/10">
                <Award className="h-4.5 w-4.5 text-primary" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-text-1 font-heading">{stats?.quizzesToday || 0}</p>
              <p className="text-[10px] text-text-3 font-semibold mt-1">Completed last 24h</p>
            </div>
          </div>

          {/* Card 3: Avg Score */}
          <div className="bg-surface p-5 rounded-2xl border border-border flex flex-col justify-between h-32 hover:border-primary/20 transition-all duration-300">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-text-2 uppercase tracking-wide">Avg Score</span>
              <div className="p-1.5 bg-primary/5 rounded-lg border border-primary/10">
                <Percent className="h-4.5 w-4.5 text-primary" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-text-1 font-heading">{stats?.avgScore || 0}%</p>
              <p className="text-[10px] text-text-3 font-semibold mt-1">Across all attempts</p>
            </div>
          </div>

          {/* Card 4: Avg Streak */}
          <div className="bg-surface p-5 rounded-2xl border border-border flex flex-col justify-between h-32 hover:border-primary/20 transition-all duration-300">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-text-2 uppercase tracking-wide">Avg Streak</span>
              <div className="p-1.5 bg-primary/5 rounded-lg border border-primary/10">
                <Flame className="h-4.5 w-4.5 text-primary" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-text-1 font-heading">{stats?.avgStreak || 0} days</p>
              <p className="text-[10px] text-text-3 font-semibold mt-1">Active daily learners</p>
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Growth Trend */}
        <div className="bg-surface p-6 rounded-2xl border border-border">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-text-1">User Growth Trend</h3>
            <p className="text-[11px] text-text-2">New user registrations over the last 30 days</p>
          </div>
          <div className="h-72">
            {mounted && userGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                    name="Signups" 
                    stroke="var(--color-primary)" 
                    strokeWidth={2.5} 
                    dot={{ r: 4, strokeWidth: 1.5, fill: 'var(--color-surface)' }}
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-text-3">No growth data available</div>
            )}
          </div>
        </div>

        {/* CHART 2: Top Subjects */}
        <div className="bg-surface p-6 rounded-2xl border border-border">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-text-1">Popular Learning Subjects</h3>
            <p className="text-[11px] text-text-2">Top 10 subjects by active user engagement</p>
          </div>
          <div className="h-72">
            {mounted && topSubjects.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSubjects} layout="vertical" margin={{ top: 5, right: 10, left: 15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} horizontal={false} />
                  <XAxis type="number" stroke="var(--color-text-2)" fontSize={10} tickLine={false} allowDecimals={false} />
                  <YAxis dataKey="subject" type="category" stroke="var(--color-text-2)" fontSize={10} tickLine={false} width={100} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--color-surface)', 
                      borderColor: 'var(--color-border)', 
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: 'var(--color-text-1)'
                    }} 
                  />
                  <Bar dataKey="users" name="Active Users" fill="var(--color-primary)" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-text-3">No subject data available</div>
            )}
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY FEED */}
      <div className="bg-surface rounded-2xl border border-border">
        <div className="p-6 border-b border-border">
          <h3 className="text-sm font-bold text-text-1">Recent Activity Feed</h3>
          <p className="text-[11px] text-text-2">Last 10 learning and registration events across the platform</p>
        </div>
        <div className="divide-y divide-border/60">
          {activities.length > 0 ? (
            activities.map((act) => (
              <div key={act.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-surface-alt/40 transition-colors duration-150">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    act.type === 'signup' ? 'bg-primary' :
                    act.type === 'quiz' ? 'bg-emerald-500' : 'bg-indigo-500'
                  }`} />
                  <div className="flex flex-col">
                    <span className="font-semibold text-text-1">{act.text}</span>
                    <span className="text-[10px] text-text-3">User: {act.user} ({act.email})</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-text-3 shrink-0 self-start sm:self-center">
                  {formatTimeAgo(act.timeStr)}
                </span>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-text-3">No recent activities logged</div>
          )}
        </div>
      </div>
    </div>
  )
}
