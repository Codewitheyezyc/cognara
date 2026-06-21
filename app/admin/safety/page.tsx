'use client'

import React, { useEffect, useState } from 'react'
import { 
  ShieldAlert, AlertTriangle, CheckCircle2, 
  Activity, Calendar, Users, RefreshCw, Search,
  UserCheck, AlertOctagon, UserX
} from 'lucide-react'

interface LogEntry {
  id: string
  goal_text: string
  rejection_reason: string
  created_at: string
  user: {
    id: string
    name: string
    email: string
  }
  flaggedRepeat: boolean
  flaggedAbuse: boolean
}

interface Stats {
  totalGoalsToday: number
  totalGoalsThisWeek: number
  totalRejectionsCount: number
  rejectionPercentage: number
  rejectionsToday: number
  rejectionsThisWeek: number
}

export default function AdminSafetyDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'flagged' | 'abuse'>('all')

  const fetchData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true)
    try {
      const res = await fetch('/api/admin/safety')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setLogs(data.logs)
      }
    } catch (err) {
      console.error('Failed to fetch safety admin data:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  // Filter logs based on search query and tab filter
  const filteredLogs = logs.filter(log => {
    // 1. Text filter
    const matchesSearch = 
      log.goal_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.rejection_reason && log.rejection_reason.toLowerCase().includes(searchQuery.toLowerCase()))

    if (!matchesSearch) return false

    // 2. Tab filter
    if (filterType === 'flagged') return log.flaggedRepeat
    if (filterType === 'abuse') return log.flaggedAbuse

    return true
  })

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-xs font-semibold text-text-2">Loading safety logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header section with manual refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-1">Content Safety Audit</h1>
          <p className="text-xs text-text-2 mt-1">Review validation stats, safety rejections, and flag policy violations.</p>
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

      {/* STATS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Submissions Today */}
        <div className="bg-surface p-5 rounded-2xl border border-border flex flex-col justify-between h-32 hover:border-primary/20 transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-text-2 uppercase tracking-wide">Goals Submitted Today</span>
            <div className="p-1.5 bg-primary/5 rounded-lg border border-primary/10">
              <Calendar className="h-4.5 w-4.5 text-primary" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-text-1 font-heading">{stats?.totalGoalsToday || 0}</p>
            <p className="text-[10px] text-text-3 font-semibold mt-1">Approved & Rejected today</p>
          </div>
        </div>

        {/* Card 2: Rejections Today */}
        <div className="bg-surface p-5 rounded-2xl border border-border flex flex-col justify-between h-32 hover:border-primary/20 transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-text-2 uppercase tracking-wide">Rejections Today</span>
            <div className="p-1.5 bg-primary/5 rounded-lg border border-primary/10">
              <ShieldAlert className="h-4.5 w-4.5 text-primary" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-text-1 font-heading">{stats?.rejectionsToday || 0}</p>
            <p className="text-[10px] text-error font-bold mt-1">Blocked harmful requests</p>
          </div>
        </div>

        {/* Card 3: Goals This Week */}
        <div className="bg-surface p-5 rounded-2xl border border-border flex flex-col justify-between h-32 hover:border-primary/20 transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-text-2 uppercase tracking-wide">Goals Submitted This Week</span>
            <div className="p-1.5 bg-primary/5 rounded-lg border border-primary/10">
              <Activity className="h-4.5 w-4.5 text-primary" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-text-1 font-heading">{stats?.totalGoalsThisWeek || 0}</p>
            <p className="text-[10px] text-text-3 font-semibold mt-1">Approved & Rejected this week</p>
          </div>
        </div>

        {/* Card 4: Total Lifetime Rejections */}
        <div className="bg-surface p-5 rounded-2xl border border-border flex flex-col justify-between h-32 hover:border-primary/20 transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-text-2 uppercase tracking-wide">Lifetime Rejections</span>
            <div className="p-1.5 bg-primary/5 rounded-lg border border-primary/10">
              <AlertTriangle className="h-4.5 w-4.5 text-primary" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-text-1 font-heading">{stats?.totalRejectionsCount || 0}</p>
            <p className="text-[10px] text-primary font-bold mt-1">
              {stats?.rejectionPercentage ? Math.round(stats.rejectionPercentage) : 0}% of all submissions
            </p>
          </div>
        </div>
      </div>

      {/* FILTER & SAFETY LOG TABLE */}
      <div className="bg-surface rounded-2xl border border-border">
        {/* Table Filter Menu */}
        <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                filterType === 'all'
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-text-2 hover:text-text-1 hover:bg-surface-alt/50 border border-transparent'
              }`}
            >
              All Rejections ({logs.length})
            </button>
            <button
              onClick={() => setFilterType('flagged')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer flex items-center gap-1.5 ${
                filterType === 'flagged'
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  : 'text-text-2 hover:text-text-1 hover:bg-surface-alt/50 border border-transparent'
              }`}
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Repeat Offenders ({logs.filter(l => l.flaggedRepeat).length})</span>
            </button>
            <button
              onClick={() => setFilterType('abuse')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer flex items-center gap-1.5 ${
                filterType === 'abuse'
                  ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                  : 'text-text-2 hover:text-text-1 hover:bg-surface-alt/50 border border-transparent'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5 animate-pulse" />
              <span>Daily Abuse ({logs.filter(l => l.flaggedAbuse).length})</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-3" />
            <input
              type="text"
              placeholder="Search user, goal, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-lg bg-surface-alt border border-border text-xs text-text-1 placeholder-text-3 focus:outline-none focus:border-primary transition"
            />
          </div>
        </div>

        {/* Rejection Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-alt/25 text-text-2 font-bold uppercase tracking-wider">
                <th className="p-4 pl-6">User details</th>
                <th className="p-4">Rejected Goal</th>
                <th className="p-4">Rejection Reason</th>
                <th className="p-4">Time</th>
                <th className="p-4 pr-6 text-right">Investigation Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-alt/30 transition-colors duration-150">
                    {/* User profile details */}
                    <td className="p-4 pl-6 max-w-[200px]">
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-text-1 truncate">{log.user.name}</span>
                        <span className="text-[10px] text-text-3 truncate mt-0.5" title={log.user.email}>{log.user.email}</span>
                      </div>
                    </td>

                    {/* Rejected Goal Text */}
                    <td className="p-4 max-w-[280px]">
                      <p className="text-text-1 font-medium leading-relaxed break-words" title={log.goal_text}>
                        &ldquo;{log.goal_text}&rdquo;
                      </p>
                    </td>

                    {/* AI Rejection Reason */}
                    <td className="p-4 max-w-[320px]">
                      <p className="text-text-2 leading-relaxed break-words">
                        {log.rejection_reason || 'Inappropriate learning goal pattern.'}
                      </p>
                    </td>

                    {/* Timestamp */}
                    <td className="p-4 whitespace-nowrap text-text-3 font-mono">
                      <span title={new Date(log.created_at).toLocaleString()}>
                        {formatTimeAgo(log.created_at)}
                      </span>
                    </td>

                    {/* Badges/Actions */}
                    <td className="p-4 pr-6 text-right whitespace-nowrap">
                      <div className="inline-flex flex-wrap gap-1.5 justify-end">
                        {log.flaggedAbuse ? (
                          <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[9px] font-bold uppercase rounded-sm flex items-center gap-1">
                            <AlertOctagon className="w-2.5 h-2.5" />
                            <span>Daily Abuse Flag (5+)</span>
                          </span>
                        ) : log.flaggedRepeat ? (
                          <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-bold uppercase rounded-sm flex items-center gap-1">
                            <UserX className="w-2.5 h-2.5" />
                            <span>Repeat Offender (3+)</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-bold uppercase rounded-sm flex items-center gap-1">
                            <UserCheck className="w-2.5 h-2.5" />
                            <span>First Offense</span>
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-3">
                    No safety violations found matching current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
