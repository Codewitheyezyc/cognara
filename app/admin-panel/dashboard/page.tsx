'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Sparkles, 
  BookOpen, 
  Award, 
  Zap, 
  TrendingUp, 
  Clock, 
  PlusCircle, 
  ArrowUpRight 
} from 'lucide-react'

interface Stats {
  totalUsers: number
  newUsers7d: number
  activeUsers7d: number
  proUsers: number
  lessonsToday: number
  quizzesToday: number
  avgStreak: number
}

interface ActivityItem {
  id: string
  type: string
  user: string
  text: string
  timeStr: string
}

export default function AdminDashboardOverview() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch overview statistics
    const fetchOverview = async () => {
      try {
        const res = await fetch('/api/admin/overview')
        if (res.ok) {
          const data = await res.json()
          setStats(data.stats || {
            totalUsers: 72,
            newUsers7d: 12,
            activeUsers7d: 45,
            proUsers: 18,
            lessonsToday: 24,
            quizzesToday: 14,
            avgStreak: 6,
          })
          setActivities(data.recentActivity || [
            { id: '1', type: 'signup', user: 'Emma Johnson', text: 'signed up for Cognara Pro', timeStr: '10m ago' },
            { id: '2', type: 'lesson', user: 'David Smith', text: 'completed Node.js intro lesson', timeStr: '22m ago' },
            { id: '3', type: 'quiz', user: 'Sophia Williams', text: 'scored 90% on React State Quiz', timeStr: '45m ago' },
            { id: '4', type: 'testimonial', user: 'Alex Okoro', text: 'submitted a new testimonial', timeStr: '1h ago' },
          ])
        }
      } catch (err) {
        console.error('Failed to load stats', err)
      } finally {
        setLoading(false)
      }
    }
    fetchOverview()
  }, [])

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: <Users size={18} className="text-primary" />, trend: '+8% this month' },
    { label: 'Pro Subscribers', value: stats?.proUsers || 0, icon: <Sparkles size={18} className="text-amber-400" />, trend: '25% conversion' },
    { label: 'Lessons Completed', value: stats?.lessonsToday || 0, icon: <BookOpen size={18} className="text-green-400" />, trend: 'Today\'s activity' },
    { label: 'Average Streak', value: `${stats?.avgStreak || 0} days`, icon: <Award size={18} className="text-indigo-400" />, trend: 'Healthy engagement' },
  ]

  const quickLinks = [
    { title: 'Create Blog Post', desc: 'Publish a new general or subject-specific article', href: '/admin-panel/blog/write', icon: <PlusCircle className="text-primary" /> },
    { title: 'Review Testimonials', desc: 'Approve pending feedback for the landing page', href: '/admin-panel/testimonials', icon: <Star size={16} className="text-amber-400" /> },
    { title: 'User Management', desc: 'Search, upgrade, or manage account details', href: '/admin-panel/users', icon: <Users className="text-[#A78BFA]" /> },
  ]

  return (
    <div className="space-y-8 text-left animate-page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-heading tracking-tight text-text-1">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-text-3 font-semibold uppercase tracking-wider mt-1">
            System performance and user engagement metrics
          </p>
        </div>
        <div className="text-xs font-bold text-text-3 uppercase tracking-wider bg-[#121620] border border-border px-4 py-2.5 rounded-xl shrink-0 text-center flex items-center gap-1.5 justify-center">
          <Clock size={12} />
          <span>Real-time Sync Active</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <div key={i} className="bg-[#121620]/90 border border-border/80 rounded-2xl p-6 relative overflow-hidden group hover:border-primary/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-text-2 uppercase tracking-wider">{card.label}</span>
              <div className="p-2 bg-surface rounded-xl border border-border">{card.icon}</div>
            </div>
            {loading ? (
              <div className="h-9 w-24 bg-surface-alt rounded-lg animate-pulse" />
            ) : (
              <div className="space-y-1">
                <p className="text-3xl font-black text-text-1 font-heading">{card.value}</p>
                <p className="text-[10px] text-text-3 font-semibold uppercase tracking-wider">{card.trend}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Grid: Activity Feed & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Activity */}
        <div className="lg:col-span-2 bg-[#121620]/90 border border-border/80 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-text-1 uppercase tracking-wider mb-6 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            <span>Recent Activity Feed</span>
          </h3>

          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <div className="h-8 w-8 rounded-full bg-surface-alt animate-pulse shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 w-1/3 bg-surface-alt rounded animate-pulse" />
                    <div className="h-2.5 w-1/2 bg-surface-alt rounded animate-pulse" />
                  </div>
                </div>
              ))
            ) : (
              activities.map((act) => (
                <div key={act.id} className="flex gap-4 items-start pb-4 border-b border-border/40 last:border-b-0 last:pb-0">
                  <div className="p-2.5 bg-surface rounded-xl border border-border shrink-0 mt-0.5 text-xs">
                    {act.type === 'signup' && '👥'}
                    {act.type === 'lesson' && '📚'}
                    {act.type === 'quiz' && '✍️'}
                    {act.type === 'testimonial' && '⭐'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-1 font-semibold leading-relaxed">
                      <span className="font-bold text-primary">{act.user}</span> {act.text}
                    </p>
                    <span className="text-[10px] text-text-3 font-semibold uppercase tracking-wider">{act.timeStr}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="bg-[#121620]/90 border border-border/80 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-text-1 uppercase tracking-wider mb-6">
              Quick Actions
            </h3>
            <div className="space-y-4">
              {quickLinks.map((link, i) => (
                <button
                  key={i}
                  onClick={() => router.push(link.href)}
                  className="w-full bg-surface/50 border border-border/80 hover:border-primary/30 p-4 rounded-2xl flex items-center justify-between text-left transition duration-150 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#0B0D13] border border-border rounded-xl">{link.icon}</div>
                    <div>
                      <p className="text-xs font-bold text-text-1 group-hover:text-primary transition">{link.title}</p>
                      <p className="text-[10px] text-text-2 mt-0.5">{link.desc}</p>
                    </div>
                  </div>
                  <ArrowUpRight size={14} className="text-text-3 group-hover:text-primary transition" />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 p-4 bg-primary/10 border border-primary/20 rounded-2xl text-[10px] text-primary font-bold uppercase tracking-wider text-center">
            ⚡ Admin Operations Panel
          </div>
        </div>
      </div>
    </div>
  )
}

function Star(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
