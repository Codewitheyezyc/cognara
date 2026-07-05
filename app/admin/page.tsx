'use client'

import React, { useEffect, useState } from 'react'
import html2canvas from 'html2canvas'
import { createClient } from '@/lib/supabase/client'
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

  const supabase = createClient()

  // Retroactive Awards & Badges States
  const [loadingAwards, setLoadingAwards] = useState('')
  const [awardsMessage, setAwardsMessage] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkProgress, setBulkProgress] = useState(0)
  const [bulkMessage, setBulkMessage] = useState('')
  const [milestoneStreakDays, setMilestoneStreakDays] = useState<number | null>(null)
  const [milestoneProgressPercent, setMilestoneProgressPercent] = useState<number | null>(null)
  const [bulkUserName, setBulkUserName] = useState('')
  const [bulkGoalName, setBulkGoalName] = useState('')

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

  const generateStreakBadgeForUser = async (userId: string, streakDays: number, userName: string) => {
    setMilestoneStreakDays(streakDays)
    setBulkUserName(userName)
    
    await new Promise((resolve) => setTimeout(resolve, 800))

    const element = document.getElementById(`streak-badge-${streakDays}`)
    if (!element) {
      throw new Error(`Element #streak-badge-${streakDays} not found in DOM`)
    }

    const canvas = await html2canvas(element, {
      scale: 1,
      useCORS: true,
      backgroundColor: '#0F1629'
    })

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/png', 1.0)
    })

    if (!blob) {
      throw new Error('Canvas conversion to Blob failed')
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'pdzutmcceyvglgijorvn'
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'cognara_badges'

    const formData = new FormData()
    formData.append('file', blob)
    formData.append('upload_preset', uploadPreset)
    formData.append('folder', 'cognara/streak-badges')

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData }
    )

    if (!cloudinaryResponse.ok) {
      const errData = await cloudinaryResponse.json()
      throw new Error(errData?.error?.message || 'Cloudinary upload failed')
    }

    const cloudinaryData = await cloudinaryResponse.json()
    const badgeUrl = cloudinaryData.secure_url

    // Save to Supabase
    const { error: dbErr } = await supabase
      .from('cognara_streak_badges')
      .insert({
        user_id: userId,
        streak_days: streakDays,
        badge_url_png: badgeUrl,
        created_at: new Date().toISOString()
      })

    if (dbErr) {
      console.error('[Streak Badge] Failed to save to database:', dbErr)
    } else {
      // Add to pending awards queue
      await supabase
        .from('cognara_pending_awards')
        .insert({
          user_id: userId,
          award_type: 'streak_badge',
          award_data: {
            badge_url: badgeUrl,
            streak_days: streakDays,
            user_name: userName
          },
          is_shown: false,
          created_at: new Date().toISOString()
        })
    }

    setMilestoneStreakDays(null)
    setBulkUserName('')
    return badgeUrl
  }

  const generateProgressCardForUser = async (userId: string, milestonePercent: number, userGoal: any, userName: string) => {
    const goalName = userGoal.subject || userGoal.goal_text || userGoal.goal_name || 'My Learning Goal'
    
    setMilestoneProgressPercent(milestonePercent)
    setBulkUserName(userName)
    setBulkGoalName(goalName)
    
    await new Promise((resolve) => setTimeout(resolve, 800))

    const element = document.getElementById(`progress-card-${milestonePercent}`)
    if (!element) {
      throw new Error(`Element #progress-card-${milestonePercent} not found in DOM`)
    }

    const canvas = await html2canvas(element, {
      scale: 1,
      useCORS: true,
      backgroundColor: '#0F1629'
    })

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/png', 1.0)
    })

    if (!blob) {
      throw new Error('Canvas conversion to Blob failed')
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'pdzutmcceyvglgijorvn'
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'cognara_badges'

    const formData = new FormData()
    formData.append('file', blob)
    formData.append('upload_preset', uploadPreset)
    formData.append('folder', 'cognara/progress-cards')

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData }
    )

    if (!cloudinaryResponse.ok) {
      const errData = await cloudinaryResponse.json()
      throw new Error(errData?.error?.message || 'Cloudinary upload failed')
    }

    const cloudinaryData = await cloudinaryResponse.json()
    const cardUrl = cloudinaryData.secure_url

    // Save to Supabase
    const { error: dbErr } = await supabase
      .from('cognara_progress_cards')
      .insert({
        user_id: userId,
        milestone_percent: milestonePercent,
        card_url_png: cardUrl,
        created_at: new Date().toISOString()
      })

    if (dbErr) {
      console.error('[Progress Card] Failed to save to database:', dbErr)
    } else {
      // Add to pending awards queue
      await supabase
        .from('cognara_pending_awards')
        .insert({
          user_id: userId,
          award_type: 'progress_card',
          award_data: {
            card_url: cardUrl,
            milestone_percent: milestonePercent,
            goal_name: goalName,
            user_name: userName
          },
          is_shown: false,
          created_at: new Date().toISOString()
        })
    }

    setMilestoneProgressPercent(null)
    setBulkUserName('')
    setBulkGoalName('')
    return cardUrl
  }

  const handleTriggerStreakBadge = async (userId: string, streakDays: number) => {
    setLoadingAwards(`streak_${streakDays}`)
    setAwardsMessage('')

    try {
      const { data: existing } = await supabase
        .from('cognara_streak_badges')
        .select('id, created_at')
        .eq('user_id', userId)
        .eq('streak_days', streakDays)
        .maybeSingle()

      if (existing) {
        setAwardsMessage(
          `${streakDays} day badge already exists for this user. Generated on ${new Date(existing.created_at).toLocaleDateString()}.`
        )
        return
      }

      const userName = searchedUser?.name || 'Learner'
      await generateStreakBadgeForUser(userId, streakDays, userName)

      await supabase
        .from('cognara_streak_badges')
        .update({ 
          admin_triggered: true,
          admin_triggered_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('streak_days', streakDays)

      setAwardsMessage(
        `✓ ${streakDays} day streak badge generated and saved successfully. User will see it on their profile.`
      )

    } catch (error: any) {
      setAwardsMessage(`Error: ${error.message}`)
    } finally {
      setLoadingAwards('')
    }
  }

  const handleTriggerProgressCard = async (userId: string, progressPercent: number) => {
    setLoadingAwards(`progress_${progressPercent}`)
    setAwardsMessage('')

    try {
      const { data: existing } = await supabase
        .from('cognara_progress_cards')
        .select('id, created_at')
        .eq('user_id', userId)
        .eq('milestone_percent', progressPercent)
        .maybeSingle()

      if (existing) {
        setAwardsMessage(
          `${progressPercent}% progress card already exists for this user. Generated on ${new Date(existing.created_at).toLocaleDateString()}.`
        )
        return
      }

      const { data: userGoal } = await supabase
        .from('learning_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle()

      if (!userGoal) {
        setAwardsMessage('User has no active goal.')
        return
      }

      const userName = searchedUser?.name || 'Learner'
      await generateProgressCardForUser(userId, progressPercent, userGoal, userName)

      await supabase
        .from('cognara_progress_cards')
        .update({ 
          admin_triggered: true,
          admin_triggered_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('milestone_percent', progressPercent)

      setAwardsMessage(
        `✓ ${progressPercent}% progress card generated successfully. User will see it on their profile.`
      )

    } catch (error: any) {
      setAwardsMessage(`Error: ${error.message}`)
    } finally {
      setLoadingAwards('')
    }
  }

  const handleGenerateAll = async (userId: string, userData: any) => {
    setLoadingAwards('all')
    setAwardsMessage('')

    const results = []

    try {
      const streakMilestones = [7, 30, 100]

      for (const days of streakMilestones) {
        if (userData.streak >= days || userData.longestStreak >= days) {
          const { data: existing } = await supabase
            .from('cognara_streak_badges')
            .select('id')
            .eq('user_id', userId)
            .eq('streak_days', days)
            .maybeSingle()

          if (!existing) {
            const userName = searchedUser?.name || 'Learner'
            await generateStreakBadgeForUser(userId, days, userName)
            
            await supabase
              .from('cognara_streak_badges')
              .update({
                admin_triggered: true,
                admin_triggered_at: new Date().toISOString()
              })
              .eq('user_id', userId)
              .eq('streak_days', days)

            results.push(`${days} day streak badge`)
          }
        }
      }

      const progressMilestones = [25, 50, 75]

      for (const percent of progressMilestones) {
        if (userData.progress >= percent) {
          const { data: existing } = await supabase
            .from('cognara_progress_cards')
            .select('id')
            .eq('user_id', userId)
            .eq('milestone_percent', percent)
            .maybeSingle()

          if (!existing) {
            const { data: userGoal } = await supabase
              .from('learning_goals')
              .select('*')
              .eq('user_id', userId)
              .eq('is_active', true)
              .maybeSingle()

            if (userGoal) {
              const userName = searchedUser?.name || 'Learner'
              await generateProgressCardForUser(userId, percent, userGoal, userName)

              await supabase
                .from('cognara_progress_cards')
                .update({
                  admin_triggered: true,
                  admin_triggered_at: new Date().toISOString()
                })
                .eq('user_id', userId)
                .eq('milestone_percent', percent)

              results.push(`${percent}% progress card`)
            }
          }
        }
      }

      if (results.length === 0) {
        setAwardsMessage(
          'All earned awards already exist for this user. Nothing new to generate.'
        )
      } else {
        setAwardsMessage(
          `✓ Generated successfully:\n${results.join('\n')}\n\nUser will see all awards on their profile.`
        )
      }

    } catch (error: any) {
      setAwardsMessage(`Error: ${error.message}`)
    } finally {
      setLoadingAwards('')
    }
  }

  const handleBulkGenerate = async () => {
    setBulkLoading(true)
    setBulkProgress(0)
    setBulkMessage('')

    try {
      const { data: allUsers, error: usersErr } = await supabase
        .from('profiles')
        .select('id, name')

      if (usersErr || !allUsers) {
        throw new Error(usersErr?.message || 'Failed to load user profiles')
      }

      let processed = 0
      let totalGenerated = 0

      for (const user of allUsers) {
        const { data: streakRow } = await supabase
          .from('streaks')
          .select('current_streak, record_streak, longest_streak')
          .eq('user_id', user.id)
          .maybeSingle()

        const { data: activeGoalRow } = await supabase
          .from('learning_goals')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle()

        let progressPercent = 0
        if (activeGoalRow) {
          const { data: roadmapRow } = await supabase
            .from('roadmaps')
            .select('id')
            .eq('goal_id', activeGoalRow.id)
            .maybeSingle()

          if (roadmapRow) {
            const { count: totalCount } = await supabase
              .from('lessons')
              .select('*', { count: 'exact', head: true })
              .eq('roadmap_id', roadmapRow.id)

            const { count: completedCount } = await supabase
              .from('lesson_progress')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .eq('status', 'completed')

            const totalLessons = totalCount || 0
            const completedLessons = completedCount || 0
            progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
          }
        }

        const streak = streakRow?.current_streak || 0
        const longestStreak = streakRow?.record_streak || streakRow?.longest_streak || 0

        const userData = { 
          streak, 
          longestStreak, 
          progress: progressPercent 
        }

        const generated = await generateMissingAwards(user.id, userData, user.name || 'Learner')
        totalGenerated += generated
        processed++
        setBulkProgress(processed)
      }

      setBulkMessage(
        `✓ Processed ${processed} users. Generated ${totalGenerated} new awards total.`
      )

    } catch (error: any) {
      setBulkMessage(`Error: ${error.message}`)
    } finally {
      setBulkLoading(false)
    }
  }

  const generateMissingAwards = async (userId: string, userData: any, userName: string) => {
    let generatedCount = 0

    const streakMilestones = [7, 30, 100]
    for (const days of streakMilestones) {
      if (userData.streak >= days || userData.longestStreak >= days) {
        const { data: existing } = await supabase
          .from('cognara_streak_badges')
          .select('id')
          .eq('user_id', userId)
          .eq('streak_days', days)
          .maybeSingle()

        if (!existing) {
          await generateStreakBadgeForUser(userId, days, userName)
          
          await supabase
            .from('cognara_streak_badges')
            .update({
              admin_triggered: true,
              admin_triggered_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('streak_days', days)

          generatedCount++
        }
      }
    }

    const progressMilestones = [25, 50, 75]
    for (const percent of progressMilestones) {
      if (userData.progress >= percent) {
        const { data: existing } = await supabase
          .from('cognara_progress_cards')
          .select('id')
          .eq('user_id', userId)
          .eq('milestone_percent', percent)
          .maybeSingle()

        if (!existing) {
          const { data: userGoal } = await supabase
            .from('learning_goals')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .maybeSingle()

          if (userGoal) {
            await generateProgressCardForUser(userId, percent, userGoal, userName)

            await supabase
              .from('cognara_progress_cards')
              .update({
                admin_triggered: true,
                admin_triggered_at: new Date().toISOString()
              })
              .eq('user_id', userId)
              .eq('milestone_percent', percent)

            generatedCount++
          }
        }
      }
    }

    return generatedCount
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

        {/* Bulk Action Card */}
        <div className="bg-surface-alt/25 border border-border rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-text-1 text-sm">
            Bulk Award Generation
          </h3>
          <p className="text-text-3 text-xs leading-relaxed">
            Generate all earned but missing awards for every user on Cognara. 
            Use this once to retroactively award badges and cards to existing users.
          </p>
          <button
            type="button"
            disabled={bulkLoading}
            onClick={handleBulkGenerate}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition cursor-pointer"
          >
            {bulkLoading 
              ? `Processing... (${bulkProgress} users done)`
              : 'Generate All Missing Awards For All Users'}
          </button>

          {bulkMessage && (
            <p className="text-xs text-emerald-400 font-semibold mt-3">
              {bulkMessage}
            </p>
          )}
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
            {/* Retroactive Awards & Badges Section */}
            <div className="admin-awards-section border-t border-border/45 pt-4 mt-4 space-y-4">
              <h3 className="font-bold text-text-1 text-sm">
                Awards and Badges
              </h3>

              {/* Current stats */}
              <div className="flex gap-4 text-xs font-semibold text-text-2 mb-4 bg-surface-alt/35 p-3.5 rounded-xl border border-border/40">
                <span>Current streak: {searchedUser.streak || 0} days</span>
                <span>Roadmap progress: {searchedUser.progress || 0}%</span>
                <span>Phases completed: {searchedUser.phasesCompleted || 0}</span>
              </div>

              {/* Streak Badge Triggers */}
              <div className="trigger-section mb-4">
                <p className="text-xs text-text-3 font-semibold mb-2">
                  Streak Badges
                </p>
                <div className="flex gap-2 flex-wrap">
                  {[7, 30, 100].map((days) => (
                    <button
                      key={days}
                      type="button"
                      disabled={loadingAwards === `streak_${days}`}
                      onClick={() => handleTriggerStreakBadge(searchedUser.id, days)}
                      className="px-3.5 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      {loadingAwards === `streak_${days}` 
                        ? 'Generating...' 
                        : `Generate ${days} Day Badge`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress Card Triggers */}
              <div className="trigger-section mb-4">
                <p className="text-xs text-text-3 font-semibold mb-2">
                  Progress Cards
                </p>
                <div className="flex gap-2 flex-wrap">
                  {[25, 50, 75].map((percent) => (
                    <button
                      key={percent}
                      type="button"
                      disabled={loadingAwards === `progress_${percent}`}
                      onClick={() => handleTriggerProgressCard(searchedUser.id, percent)}
                      className="px-3.5 py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      {loadingAwards === `progress_${percent}` 
                        ? 'Generating...' 
                        : `Generate ${percent}% Card`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate All Button */}
              <button
                type="button"
                disabled={loadingAwards === 'all'}
                onClick={() => handleGenerateAll(searchedUser.id, searchedUser)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition disabled:opacity-50 cursor-pointer"
              >
                {loadingAwards === 'all' 
                  ? 'Generating all earned awards...' 
                  : 'Generate All Earned Awards'}
              </button>

              {/* Result message */}
              {awardsMessage && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mt-3">
                  <p className="text-emerald-400 text-xs font-semibold whitespace-pre-line">
                    {awardsMessage}
                  </p>
                </div>
              )}
            </div>
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

      {/* Hidden Templates for html2canvas Capture */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        {milestoneStreakDays !== null && (
          <div
            id={`streak-badge-${milestoneStreakDays}`}
            style={{
              width: '1200px',
              height: '630px',
              backgroundColor: '#0F1629',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Inter, sans-serif',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at 50% 50%, #5B8EFF15 0%, transparent 70%)'
            }} />
            
            <span style={{ fontSize: '100px', marginBottom: '24px', lineHeight: 1 }}>
              {milestoneStreakDays === 7 ? '🔥' : milestoneStreakDays === 30 ? '⚡' : '👑'}
            </span>
            
            <div style={{
              fontSize: '48px',
              fontWeight: '900',
              color: '#FFFFFF',
              marginBottom: '12px',
              letterSpacing: '0.05em'
            }}>
              {milestoneStreakDays} DAY STREAK
            </div>
            
            <div style={{
              fontSize: '24px',
              color: '#5B8EFF',
              fontWeight: '700',
              marginBottom: '24px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}>
              Streak Milestone Badge
            </div>
            
            <div style={{
              fontSize: '28px',
              color: '#FFFFFF',
              fontWeight: '600',
              marginBottom: '12px'
            }}>
              {bulkUserName || searchedUser?.name || 'Learner'}
            </div>
            
            <div style={{
              fontSize: '18px',
              color: '#94A3B8',
              maxWidth: '800px',
              textAlign: 'center',
              lineHeight: 1.4,
              marginBottom: '40px'
            }}>
              {milestoneStreakDays === 7 
                ? 'Showing absolute dedication with a 7-day streak! The habit is formed.'
                : milestoneStreakDays === 30
                ? 'Unstoppable consistency! 30 days of learning and growing every single day.'
                : 'A legendary achievement! 100 days of pure focus, dedication, and passion.'}
            </div>

            <div style={{
              fontSize: '16px',
              color: '#5B8EFF',
              fontWeight: '600',
              letterSpacing: '0.15em'
            }}>
              COGNARALEARN.COM
            </div>
          </div>
        )}

        {milestoneProgressPercent !== null && (
          <div
            id={`progress-card-${milestoneProgressPercent}`}
            style={{
              width: '1200px',
              height: '630px',
              backgroundColor: '#0F1629',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Inter, sans-serif',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at 50% 50%, ${
                milestoneProgressPercent === 25 ? '#3B82F6' : milestoneProgressPercent === 50 ? '#8B5CF6' : '#EC4899'
              }15 0%, transparent 70%)`
            }} />
            
            <span style={{ fontSize: '100px', marginBottom: '24px', lineHeight: 1 }}>
              {milestoneProgressPercent === 25 ? '🚀' : milestoneProgressPercent === 50 ? '⚡' : '🏆'}
            </span>
            
            <div style={{
              fontSize: '48px',
              fontWeight: '900',
              color: '#FFFFFF',
              marginBottom: '12px',
              letterSpacing: '0.05em'
            }}>
              {milestoneProgressPercent}% COMPLETE
            </div>
            
            <div style={{
              fontSize: '24px',
              color: milestoneProgressPercent === 25 ? '#3B82F6' : milestoneProgressPercent === 50 ? '#8B5CF6' : '#EC4899',
              fontWeight: '700',
              marginBottom: '24px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}>
              Goal Progress Card
            </div>
            
            <div style={{
              fontSize: '28px',
              color: '#FFFFFF',
              fontWeight: '600',
              marginBottom: '12px'
            }}>
              {bulkUserName || searchedUser?.name || 'Learner'}
            </div>

            <div style={{
              fontSize: '20px',
              color: '#E2E8F0',
              fontWeight: '500',
              maxWidth: '800px',
              textAlign: 'center',
              lineHeight: '1.4',
              marginBottom: '24px'
            }}>
              {bulkGoalName || searchedUser?.goal || 'My Learning Goal'}
            </div>
            
            <div style={{
              fontSize: '18px',
              color: '#94A3B8',
              maxWidth: '800px',
              textAlign: 'center',
              lineHeight: 1.4,
              marginBottom: '40px'
            }}>
              {milestoneProgressPercent === 25 
                ? 'One-quarter of the way to mastering this goal!'
                : milestoneProgressPercent === 50
                ? 'Halfway mark! Consistency is turning into mastery.'
                : 'Three-quarters complete. The finish line is in sight!'}
            </div>

            <div style={{
              fontSize: '16px',
              color: milestoneProgressPercent === 25 ? '#3B82F6' : milestoneProgressPercent === 50 ? '#8B5CF6' : '#EC4899',
              fontWeight: '600',
              letterSpacing: '0.15em'
            }}>
              COGNARALEARN.COM
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
