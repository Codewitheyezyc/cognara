'use client'

import React, { useEffect, useState } from 'react'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  BookOpen, 
  Clock, 
  ChevronRight 
} from 'lucide-react'

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true)
  const [userGrowth, setUserGrowth] = useState<any[]>([])
  const [topSubjects, setTopSubjects] = useState<any[]>([])

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        await new Promise(r => setTimeout(r, 800))
        setUserGrowth([
          { name: 'Jan', users: 10 },
          { name: 'Feb', users: 18 },
          { name: 'Mar', users: 30 },
          { name: 'Apr', users: 48 },
          { name: 'May', users: 62 },
          { name: 'Jun', users: 72 },
        ])
        setTopSubjects([
          { subject: 'React Basics', completions: 42 },
          { subject: 'TypeScript', completions: 34 },
          { subject: 'Next.js App Router', completions: 28 },
          { subject: 'Supabase DB', completions: 22 },
          { subject: 'CSS/HTML Layouts', completions: 18 },
        ])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  return (
    <div className="space-y-8 text-left animate-page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-heading tracking-tight text-text-1">
            System Analytics
          </h1>
          <p className="text-xs sm:text-sm text-text-3 font-semibold uppercase tracking-wider mt-1">
            Deep dive into user registrations, learning subjects, and progress trends
          </p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: User Growth Chart */}
        <div className="bg-surface border border-border/40 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-text-1 uppercase tracking-wider mb-6 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            <span>Student Registration Growth</span>
          </h3>

          {loading ? (
            <div className="h-64 bg-surface-alt rounded-2xl animate-pulse" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowth} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" stroke="var(--color-text-3)" fontSize={10} tickLine={false} />
                  <YAxis stroke="var(--color-text-3)" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '12px' }}
                    labelStyle={{ color: 'var(--color-text-1)', fontWeight: 'bold', fontSize: '10px' }}
                    itemStyle={{ color: 'var(--color-primary)', fontSize: '11px' }}
                  />
                  <Line type="monotone" dataKey="users" stroke="var(--color-primary)" strokeWidth={3} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right: Top Learning Subjects */}
        <div className="bg-surface border border-border/40 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-text-1 uppercase tracking-wider mb-6 flex items-center gap-2">
            <BookOpen size={16} className="text-primary" />
            <span>Most Active Subject Roadmaps</span>
          </h3>

          {loading ? (
            <div className="h-64 bg-surface-alt rounded-2xl animate-pulse" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSubjects} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="subject" stroke="var(--color-text-3)" fontSize={8} tickLine={false} />
                  <YAxis stroke="var(--color-text-3)" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '12px' }}
                    labelStyle={{ color: 'var(--color-text-1)', fontWeight: 'bold', fontSize: '10px' }}
                    itemStyle={{ color: 'var(--color-accent)', fontSize: '11px' }}
                  />
                  <Bar dataKey="completions" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
