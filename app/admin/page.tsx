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

  // Testimonial approvals states
  const [adminTestimonials, setAdminTestimonials] = useState<any[]>([])
  const [loadingTestimonials, setLoadingTestimonials] = useState(true)

  // User management states
  const [searchQuery, setSearchQuery] = useState('')
  const [searchedUser, setSearchedUser] = useState<any | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [regResult, setRegResult] = useState<any | null>(null)
  const [regError, setRegError] = useState<string | null>(null)

  const handleUserSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearchLoading(true)
    setSearchError(null)
    setSearchedUser(null)
    setRegResult(null)
    setRegError(null)
    try {
      const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(searchQuery.trim())}`)
      if (res.ok) {
        const data = await res.json()
        setSearchedUser(data.user)
      } else {
        const data = await res.json()
        setSearchError(data.error || 'Failed to find user')
      }
    } catch (err) {
      setSearchError('An error occurred during search')
    } finally {
      setSearchLoading(false)
    }
  }

  const handleForceRegenerate = async () => {
    if (!searchedUser) return
    setIsRegenerating(true)
    setRegResult(null)
    setRegError(null)
    try {
      const res = await fetch('/api/admin/users/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: searchedUser.id })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setRegResult(data)
        // Refresh searchedUser phase count
        setSearchedUser((prev: any) => prev ? { ...prev, phaseCount: data.newPhaseCount, version: 'Upgraded (v3)' } : null)
      } else {
        setRegError(data.error || 'Failed to regenerate roadmap')
      }
    } catch (err: any) {
      setRegError(err.message || 'An error occurred')
    } finally {
      setIsRegenerating(false)
      setShowConfirmModal(false)
    }
  }

  const fetchTestimonials = async () => {
    try {
      const res = await fetch('/api/admin/testimonials')
      if (res.ok) {
        const data = await res.json()
        setAdminTestimonials(data.testimonials || [])
      }
    } catch (err) {
      console.error('Failed to fetch testimonials', err)
    } finally {
      setLoadingTestimonials(false)
    }
  }

  const handleTestimonialAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/admin/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action })
      })
      if (res.ok) {
        if (action === 'approve') {
          setAdminTestimonials(prev =>
            prev.map(t => t.id === id ? { ...t, is_approved: true } : t)
          )
        } else {
          setAdminTestimonials(prev => prev.filter(t => t.id !== id))
        }
      }
    } catch (err) {
      console.error('Failed to update testimonial', err)
    }
  }

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
    fetchTestimonials()

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchData(true)
      fetchTestimonials()
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

      {/* USER MANAGEMENT SECTION */}
      <div className="bg-surface rounded-2xl border border-border p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-text-1">User Management</h2>
          <p className="text-[11px] text-text-2">Search users and force regenerate their custom roadmaps</p>
        </div>

        <form onSubmit={handleUserSearch} className="flex gap-2 max-w-md">
          <input
            type="text"
            placeholder="Enter user ID or email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 bg-surface-alt border border-border rounded-xl text-xs text-text-1 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={searchLoading}
            className="px-4 py-2 bg-primary hover:bg-primary/95 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            {searchLoading ? 'Searching...' : 'Find User'}
          </button>
        </form>

        {searchError && (
          <p className="text-xs text-rose-500">{searchError}</p>
        )}

        {searchedUser && (
          <div className="border border-border/80 rounded-xl p-4 bg-surface-alt/20 space-y-4 max-w-xl">
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
              <div>
                <span className="text-text-3 block text-[10px]">User Name</span>
                <span className="font-semibold text-text-1">{searchedUser.name}</span>
              </div>
              <div>
                <span className="text-text-3 block text-[10px]">User Email</span>
                <span className="font-semibold text-text-1">{searchedUser.email}</span>
              </div>
              <div className="col-span-2">
                <span className="text-text-3 block text-[10px]">Current Goal</span>
                <span className="font-semibold text-text-1">{searchedUser.goal}</span>
              </div>
              <div>
                <span className="text-text-3 block text-[10px]">Current Phase Count</span>
                <span className="font-semibold text-text-1">{searchedUser.phaseCount} phases</span>
              </div>
              <div>
                <span className="text-text-3 block text-[10px]">Roadmap Version</span>
                <span className="font-semibold text-text-1">{searchedUser.version}</span>
              </div>
              <div>
                <span className="text-text-3 block text-[10px]">Roadmap Generated Date</span>
                <span className="font-semibold text-text-1">
                  {searchedUser.roadmapDate ? new Date(searchedUser.roadmapDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-border/40">
              <button
                type="button"
                onClick={() => {
                  setRegResult(null)
                  setRegError(null)
                  setShowConfirmModal(true)
                }}
                className="px-3 py-1.5 border border-rose-500/30 text-rose-500 hover:bg-rose-500/5 text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Force Regenerate Roadmap
              </button>
              <a
                href={`/admin/users/${searchedUser.id}`}
                className="px-3 py-1.5 bg-surface border border-border text-text-2 hover:text-text-1 text-xs font-bold rounded-lg transition"
              >
                View User Progress
              </a>
            </div>

            {/* Regeneration Results Display */}
            {regResult && (
              <div className="p-3 border border-emerald-500/20 bg-emerald-500/5 rounded-lg space-y-1">
                <p className="text-xs font-bold text-emerald-500">✓ Roadmap regenerated</p>
                <div className="text-[11px] text-text-2 space-y-0.5 font-semibold">
                  <p>Old phases: 4</p>
                  <p>New phases: {regResult.newPhaseCount}</p>
                  <p>User continues from: Phase {regResult.userStartsFrom}</p>
                </div>
              </div>
            )}

            {regError && (
              <div className="p-3 border border-rose-500/20 bg-rose-500/5 rounded-lg space-y-1">
                <p className="text-xs font-bold text-rose-500">Regeneration failed. User's original roadmap and progress are intact.</p>
                <p className="text-[11px] text-text-3">Snapshot saved for manual review.</p>
                <p className="text-[10px] text-rose-400 italic">Error details: {regError}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && searchedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="relative bg-surface rounded-xl border border-border shadow-2xl p-6 mx-4 w-full max-w-md max-h-[90vh] overflow-y-auto space-y-4 animate-scale-up">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-text-1">Force regenerate roadmap for {searchedUser.name}?</h3>
              <p className="text-xs text-text-2">
                This will trigger a clean roadmap regeneration using the latest LLM system prompts.
              </p>
              <p className="text-[10px] text-primary font-bold">
                * Force regenerate always runs regardless of current version.
              </p>
            </div>

            <div className="space-y-2 text-xs text-text-2 bg-surface-alt/30 p-3.5 rounded-xl border border-border/40">
              <p className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> Generate a new roadmap with current prompt quality
              </p>
              <p className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> Preserve all completed phases and lessons
              </p>
              <p className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> Preserve streak, CXP, and badges
              </p>
              <p className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> Reset position to start of first incomplete phase
              </p>
              <p className="text-[10px] text-rose-500 font-bold mt-2">
                ⚠ This cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-bold text-text-2 hover:text-text-1 transition bg-transparent border-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRegenerating}
                onClick={handleForceRegenerate}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-lg cursor-pointer"
              >
                {isRegenerating ? 'Regenerating...' : 'Yes, regenerate'}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* TESTIMONIAL REVIEW CENTER */}
      <div className="bg-surface rounded-2xl border border-border">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-text-1">Testimonial Review Center</h3>
            <p className="text-[11px] text-text-2">Review, approve, or reject user testimonials submitted across the platform</p>
          </div>
          <button 
            onClick={fetchTestimonials}
            className="text-[10px] font-bold text-primary hover:underline bg-transparent border-none cursor-pointer"
            type="button"
          >
            Reload
          </button>
        </div>
        <div className="divide-y divide-border/60">
          {loadingTestimonials ? (
            <div className="p-8 text-center text-xs text-text-3">Loading testimonials...</div>
          ) : adminTestimonials.length > 0 ? (
            adminTestimonials.map((t) => (
              <div key={t.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-alt/20 transition">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-text-1 text-xs">{t.first_name} {t.last_initial}.</span>
                    <span className="text-[10px] text-text-3 font-mono">Goal: {t.learning_goal}</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-amber-500/10 text-amber-500">
                      {'★'.repeat(t.star_rating)}
                    </span>
                    {t.is_approved ? (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-500/10 text-emerald-400">Approved</span>
                    ) : (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-yellow-500/10 text-yellow-400">Pending Review</span>
                    )}
                  </div>
                  <p className="text-text-2 text-xs leading-relaxed italic">&ldquo;{t.testimonial_text}&rdquo;</p>
                  <span className="text-[9px] text-text-3 font-mono block">Submitted: {new Date(t.created_at).toLocaleDateString()}</span>
                </div>
                
                {/* One click approve/reject buttons */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {!t.is_approved && (
                    <button
                      onClick={() => handleTestimonialAction(t.id, 'approve')}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold shadow-sm transition cursor-pointer"
                      type="button"
                    >
                      Approve
                    </button>
                  )}
                  <button
                    onClick={() => handleTestimonialAction(t.id, 'reject')}
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-[10px] font-bold border border-rose-500/20 transition cursor-pointer"
                    type="button"
                  >
                    {t.is_approved ? 'Delete' : 'Reject'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-text-3">No testimonials submitted yet</div>
          )}
        </div>
      </div>
    </div>
  )
}
