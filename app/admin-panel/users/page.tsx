'use client'

import React, { useEffect, useState } from 'react'
import html2canvas from 'html2canvas'
import { createClient } from '@/lib/supabase/client'
import { 
  Search, 
  Sparkles, 
  Mail, 
  Trash2, 
  ChevronDown, 
  ShieldCheck, 
  ArrowRight, 
  RefreshCw, 
  Eye, 
  Calendar,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react'

interface UserItem {
  id: string
  name: string | null
  email: string
  created_at: string
  subscription_tier: string
  plan: string
  avatar_url: string | null
  current_subject: string
  last_active: string
}

export default function AdminUsersList() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'free' | 'pro' | 'active_week' | 'inactive_7d'>('all')
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  
  // Drawer / View User state
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)
  const [composeEmailUser, setComposeEmailUser] = useState<UserItem | null>(null)

  const supabase = createClient()
  const [selectedUserStats, setSelectedUserStats] = useState<{
    current_streak: number
    roadmap_progress: number
  }>({ current_streak: 0, roadmap_progress: 0 })

  const [milestoneStreakDays, setMilestoneStreakDays] = useState<number | null>(null)
  const [milestoneProgressPercent, setMilestoneProgressPercent] = useState<number | null>(null)
  const [bulkUserName, setBulkUserName] = useState('')
  const [bulkGoalName, setBulkGoalName] = useState('')

  const [awardLoading, setAwardLoading] = useState('')
  const [awardMessage, setAwardMessage] = useState('')

  useEffect(() => {
    async function loadUserStats() {
      if (!selectedUser) return
      try {
        const { data: streakRow } = await supabase
          .from('streaks')
          .select('current_streak')
          .eq('user_id', selectedUser.id)
          .maybeSingle()

        const { data: activeGoal } = await supabase
          .from('learning_goals')
          .select('id')
          .eq('user_id', selectedUser.id)
          .eq('is_active', true)
          .maybeSingle()

        let progressPercent = 0
        if (activeGoal) {
          const { data: roadmap } = await supabase
            .from('roadmaps')
            .select('id')
            .eq('goal_id', activeGoal.id)
            .maybeSingle()

          if (roadmap) {
            const { count: totalCount } = await supabase
              .from('lessons')
              .select('*', { count: 'exact', head: true })
              .eq('roadmap_id', roadmap.id)

            const { count: completedCount } = await supabase
              .from('lesson_progress')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', selectedUser.id)
              .eq('status', 'completed')

            const totalLessons = totalCount || 0
            const completedLessons = completedCount || 0
            progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
          }
        }

        setSelectedUserStats({
          current_streak: streakRow?.current_streak || 0,
          roadmap_progress: progressPercent
        })
      } catch (err) {
        console.error('Failed to load user stats:', err)
      }
    }
    loadUserStats()
  }, [selectedUser])
  const generateStreakBadge = async (targetUserId: string, streakDays: number) => {
    setMilestoneStreakDays(streakDays)
    setBulkUserName(selectedUser?.name || 'Learner')
    
    await new Promise((resolve) => setTimeout(resolve, 850))

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
        user_id: targetUserId,
        streak_days: streakDays,
        badge_url_png: badgeUrl,
        admin_triggered: true,
        admin_triggered_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })

    if (dbErr) {
      console.error('[Streak Badge] Failed to save to database:', dbErr)
    }

    setMilestoneStreakDays(null)
    setBulkUserName('')
    return badgeUrl
  }

  const generateProgressCard = async (targetUserId: string, milestonePercent: number) => {
    // Try to get user active goal
    const { data: userGoal } = await supabase
      .from('learning_goals')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('is_active', true)
      .maybeSingle()

    const goalName = userGoal?.subject || userGoal?.goal_text || userGoal?.goal_name || 'My Learning Goal'
    
    setMilestoneProgressPercent(milestonePercent)
    setBulkUserName(selectedUser?.name || 'Learner')
    setBulkGoalName(goalName)
    
    await new Promise((resolve) => setTimeout(resolve, 850))

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
        user_id: targetUserId,
        milestone_percent: milestonePercent,
        card_url_png: cardUrl,
        admin_triggered: true,
        admin_triggered_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })

    if (dbErr) {
      console.error('[Progress Card] Failed to save to database:', dbErr)
    }

    setMilestoneProgressPercent(null)
    setBulkUserName('')
    setBulkGoalName('')
    return cardUrl
  }
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
      }
    } catch (err) {
      console.error('Failed to load users', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type })
    setTimeout(() => setToastMsg(null), 3000)
  }

  const handleUpdatePlan = async (userId: string, currentTier: string) => {
    const isCurrentPro = currentTier === 'pro' || currentTier === 'pro_monthly' || currentTier === 'pro_yearly'
    const nextTier = isCurrentPro ? 'free' : 'pro_monthly'
    setUpdatingUserId(userId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tier: nextTier })
      })

      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId 
          ? { ...u, subscription_tier: nextTier, plan: nextTier } 
          : u
        ))
        if (selectedUser?.id === userId) {
          setSelectedUser(prev => prev ? { ...prev, subscription_tier: nextTier, plan: nextTier } : null)
        }
        showToast(`User tier successfully updated to ${nextTier}`)
      } else {
        const errData = await res.json()
        showToast(errData.error || 'Failed to update plan', 'error')
      }
    } catch (err) {
      showToast('Connection error occurred', 'error')
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteConfirmId) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/admin/users?userId=${deleteConfirmId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== deleteConfirmId))
        if (selectedUser?.id === deleteConfirmId) {
          setSelectedUser(null)
        }
        showToast('User account has been permanently deleted')
        setDeleteConfirmId(null)
      } else {
        const errData = await res.json()
        showToast(errData.error || 'Deletion failed', 'error')
      }
    } catch (err) {
      showToast('Connection error occurred', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Filters and search logic
  const filteredUsers = users.filter(user => {
    // Search filter
    const matchesSearch = 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase()))
    
    if (!matchesSearch) return false

    // Tier filter
    const isPro = user.subscription_tier === 'pro' || user.subscription_tier === 'pro_monthly' || user.subscription_tier === 'pro_yearly'
    if (filterType === 'free' && isPro) return false
    if (filterType === 'pro' && !isPro) return false

    // Active status filters
    const lastActiveDate = new Date(user.last_active).getTime()
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

    if (filterType === 'active_week' && lastActiveDate < oneWeekAgo) return false
    if (filterType === 'inactive_7d' && lastActiveDate >= oneWeekAgo) return false

    return true
  })

  return (
    <div className="space-y-8 text-left animate-page-enter relative">
      {/* Toast Alert */}
      {toastMsg && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-2xl flex items-center gap-2 border animate-page-enter ${
          toastMsg.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
        }`}>
          <CheckCircle2 size={14} />
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-heading tracking-tight text-text-1">
            User Management
          </h1>
          <p className="text-xs sm:text-sm text-text-3 font-semibold uppercase tracking-wider mt-1">
            Manage student access, subscriptions, and profiles
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="admin-btn inline-flex items-center gap-2 rounded-xl bg-surface border border-border text-text-1 hover:bg-surface-alt font-bold text-xs uppercase tracking-wider transition cursor-pointer"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Toolbar / Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-text-3">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border/40 rounded-2xl pl-10 pr-4 py-3.5 text-xs text-text-1 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {[
            { id: 'all', label: 'All Users' },
            { id: 'pro', label: 'Pro Tier' },
            { id: 'free', label: 'Free Tier' },
            { id: 'active_week', label: 'Active (7d)' },
            { id: 'inactive_7d', label: 'Inactive (7d)' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as any)}
              className={`px-4 min-h-[44px] rounded-xl font-bold text-[10px] uppercase tracking-wider border transition cursor-pointer flex items-center justify-center ${
                filterType === f.id
                  ? 'bg-primary border-primary text-white shadow-[0_0_10px_rgba(91,142,255,0.2)]'
                  : 'bg-surface border-border/40 text-text-2 hover:bg-surface-alt hover:text-text-1'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-surface border border-border/40 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <div className="min-w-[600px] px-4 md:px-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-surface/50 text-[10px] font-bold text-text-3 uppercase tracking-wider">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Joined Date</th>
                  <th className="px-6 py-4">Current Domain</th>
                  <th className="px-6 py-4">Tier Status</th>
                  <th className="px-6 py-4">Last Activity</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-surface-alt" />
                        <div className="space-y-1">
                          <div className="h-3 w-28 bg-surface-alt rounded" />
                          <div className="h-2 w-36 bg-surface-alt rounded" />
                        </div>
                      </td>
                      <td className="px-6 py-4"><div className="h-3 w-16 bg-surface-alt rounded" /></td>
                      <td className="px-6 py-4"><div className="h-3 w-20 bg-surface-alt rounded" /></td>
                      <td className="px-6 py-4"><div className="h-4.5 w-12 bg-surface-alt rounded-full" /></td>
                      <td className="px-6 py-4"><div className="h-3 w-16 bg-surface-alt rounded" /></td>
                      <td className="px-6 py-4"><div className="h-8 w-12 bg-surface-alt rounded-lg ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-text-3 font-semibold uppercase tracking-wider">
                      No users match search filters
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isPro = user.subscription_tier === 'pro' || user.subscription_tier === 'pro_monthly' || user.subscription_tier === 'pro_yearly'
                    return (
                      <tr key={user.id} className="hover:bg-surface-alt/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover border border-border" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs uppercase">
                                {user.name ? user.name[0] : user.email[0]}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-text-1">{user.name || 'Anonymous Learner'}</p>
                              <p className="text-[10px] text-text-3 font-semibold">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-text-2 font-medium">
                          {new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-surface-alt border border-border rounded-lg font-bold text-[10px] text-text-2 uppercase tracking-wider">
                            {user.current_subject || 'None'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[9px] uppercase tracking-wider border ${
                            isPro 
                              ? 'bg-amber-500/10 border-amber-500/25 text-amber-400' 
                              : 'bg-text-3/10 border-border text-text-2'
                          }`}>
                            <Sparkles size={9} className={isPro ? 'text-amber-400' : 'text-text-3'} />
                            <span>{isPro ? 'Pro' : 'Free'}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-text-3 font-semibold uppercase tracking-wider text-[10px]">
                          {new Date(user.last_active).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="h-11 w-11 inline-flex items-center justify-center bg-surface hover:bg-surface-alt border border-border text-text-2 hover:text-text-1 rounded-xl transition cursor-pointer"
                              title="View Student details"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              onClick={() => setComposeEmailUser(user)}
                              className="h-11 w-11 inline-flex items-center justify-center bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 rounded-xl transition cursor-pointer"
                              title="Send email to user"
                            >
                              <Mail size={13} />
                            </button>
                            <button
                              onClick={() => handleUpdatePlan(user.id, user.subscription_tier)}
                              disabled={updatingUserId === user.id}
                              className={`h-11 w-11 inline-flex items-center justify-center border rounded-xl transition cursor-pointer disabled:opacity-50 ${
                                isPro 
                                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20' 
                                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
                              }`}
                              title={isPro ? 'Revoke Pro subscription' : 'Grant Pro subscription'}
                            >
                              {updatingUserId === user.id ? (
                                <RefreshCw size={13} className="animate-spin" />
                              ) : isPro ? (
                                <Lock size={13} />
                              ) : (
                                <Unlock size={13} />
                              )}
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(user.id)}
                              className="h-11 w-11 inline-flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-xl transition cursor-pointer"
                              title="Delete student account"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border/40 max-w-sm w-full rounded-3xl p-6 shadow-2xl space-y-6 text-center animate-page-enter">
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto text-rose-500">
              <AlertTriangle size={32} />
            </div>
            <div className="space-y-2">
              <h4 className="text-text-1 font-bold text-lg">Are you absolutely sure?</h4>
              <p className="text-text-2 text-xs leading-relaxed">
                This action is permanent. Deleting this account removes all certificates, progress, and goals. Normal database triggers will remove authentication.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 h-10 bg-surface hover:bg-surface-alt border border-border text-text-1 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleteLoading}
                className="flex-1 h-10 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deleteLoading ? <RefreshCw size={12} className="animate-spin" /> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Drawer Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-end">
          <div className="bg-surface border-l border-border/40 h-full max-w-md w-full p-8 shadow-2xl relative flex flex-col justify-between animate-page-enter text-left">
            <button 
              onClick={() => setSelectedUser(null)} 
              className="absolute top-6 right-6 p-2 bg-surface hover:bg-surface-alt border border-border text-text-3 hover:text-text-1 rounded-xl transition cursor-pointer"
            >
              <X size={15} />
            </button>
            
            <div className="space-y-6 overflow-y-auto flex-1 my-6 pr-2 scrollbar-thin">
              <div className="flex items-center gap-4">
                {selectedUser.avatar_url ? (
                  <img src={selectedUser.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover border-2 border-primary/20" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-primary/10 border-2 border-primary/20 text-primary flex items-center justify-center font-bold text-xl uppercase">
                    {selectedUser.name ? selectedUser.name[0] : selectedUser.email[0]}
                  </div>
                )}
                <div>
                  <h4 className="font-heading font-black text-xl text-text-1">{selectedUser.name || 'Anonymous Student'}</h4>
                  <p className="text-xs text-text-3 font-semibold uppercase tracking-wider mt-0.5">{selectedUser.email}</p>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-border/60">
                <h5 className="text-[10px] font-bold text-text-3 uppercase tracking-wider">Account Metrics</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface/50 border border-border p-4 rounded-2xl">
                    <span className="text-[9px] font-bold text-text-3 uppercase tracking-wider">Enrollment Tier</span>
                    <p className="text-xs font-bold text-text-1 mt-1 flex items-center gap-1">
                      <Sparkles size={11} className={selectedUser.subscription_tier !== 'free' ? 'text-amber-400' : 'text-text-3'} />
                      <span>{selectedUser.subscription_tier}</span>
                    </p>
                  </div>
                  <div className="bg-surface/50 border border-border p-4 rounded-2xl">
                    <span className="text-[9px] font-bold text-text-3 uppercase tracking-wider">Active Domain</span>
                    <p className="text-xs font-bold text-text-1 mt-1">{selectedUser.current_subject || 'None'}</p>
                  </div>
                </div>
                
                <div className="bg-surface/30 border border-border/80 p-5 rounded-2xl space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-2 font-medium flex items-center gap-1.5"><Calendar size={13} /> Joined Date</span>
                    <span className="text-text-1 font-bold">{new Date(selectedUser.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-2 font-medium flex items-center gap-1.5"><Calendar size={13} /> Last Session</span>
                    <span className="text-text-1 font-bold">{new Date(selectedUser.last_active).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Awards and Badges Panel */}
              <div className="bg-surface-alt/45 border border-border/60 rounded-2xl p-5 mt-4 space-y-4">
                <h5 className="text-[10px] font-bold text-text-3 uppercase tracking-wider flex items-center gap-1.5">
                  🏆 Awards and Badges
                </h5>

                {/* User stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface/50 border border-border p-3 rounded-xl text-left">
                    <p className="text-[9px] text-text-3 font-semibold uppercase tracking-wider">Current streak</p>
                    <p className="text-xs font-bold text-text-1 mt-0.5">
                      🔥 {selectedUserStats.current_streak || 0} days
                    </p>
                  </div>
                  <div className="bg-surface/50 border border-border p-3 rounded-xl text-left">
                    <p className="text-[9px] text-text-3 font-semibold uppercase tracking-wider">Roadmap progress</p>
                    <p className="text-xs font-bold text-text-1 mt-0.5">
                      🎯 {selectedUserStats.roadmap_progress || 0}%
                    </p>
                  </div>
                </div>

                {/* Streak badge triggers */}
                <div className="text-left">
                  <p className="text-[9px] text-text-3 font-semibold uppercase tracking-wider mb-2">Streak Badges</p>
                  <div className="flex gap-2 flex-wrap">
                    {[7, 30, 100].map(days => (
                      <button
                        key={days}
                        disabled={awardLoading !== ''}
                        onClick={async () => {
                          setAwardLoading(`streak_${days}`)
                          setAwardMessage('')
                          try {
                            const badgeUrl = await generateStreakBadge(selectedUser.id, days)
                            // Insert into pending awards
                            const { error: pendErr } = await supabase
                              .from('cognara_pending_awards')
                              .insert({
                                user_id: selectedUser.id,
                                award_type: 'streak_badge',
                                award_data: {
                                  badge_url: badgeUrl,
                                  streak_days: days,
                                  user_name: selectedUser.name || 'Learner'
                                },
                                is_shown: false,
                                created_at: new Date().toISOString()
                              })
                            if (pendErr) throw pendErr
                            setAwardMessage(`✓ ${days} day streak badge generated.`)
                          } catch (e: any) {
                            setAwardMessage(`Error: ${e.message}`)
                          } finally {
                            setAwardLoading('')
                          }
                        }}
                        className="px-3 py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 rounded-xl text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 min-h-[44px] flex items-center justify-center cursor-pointer flex-1"
                      >
                        {awardLoading === `streak_${days}` ? '...' : `${days}D`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Progress card triggers */}
                <div className="text-left">
                  <p className="text-[9px] text-text-3 font-semibold uppercase tracking-wider mb-2">Progress Cards</p>
                  <div className="flex gap-2 flex-wrap">
                    {[25, 50, 75].map(percent => (
                      <button
                        key={percent}
                        disabled={awardLoading !== ''}
                        onClick={async () => {
                          setAwardLoading(`progress_${percent}`)
                          setAwardMessage('')
                          try {
                            const cardUrl = await generateProgressCard(selectedUser.id, percent)
                            // Insert into pending awards
                            const { error: pendErr } = await supabase
                              .from('cognara_pending_awards')
                              .insert({
                                user_id: selectedUser.id,
                                award_type: 'progress_card',
                                award_data: {
                                  card_url: cardUrl,
                                  milestone_percent: percent,
                                  goal_name: selectedUser.current_subject || 'My Learning Goal',
                                  user_name: selectedUser.name || 'Learner'
                                },
                                is_shown: false,
                                created_at: new Date().toISOString()
                              })
                            if (pendErr) throw pendErr
                            setAwardMessage(`✓ ${percent}% progress card generated.`)
                          } catch (e: any) {
                            setAwardMessage(`Error: ${e.message}`)
                          } finally {
                            setAwardLoading('')
                          }
                        }}
                        className="px-3 py-2 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 hover:bg-indigo-500/20 rounded-xl text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 min-h-[44px] flex items-center justify-center cursor-pointer flex-1"
                      >
                        {awardLoading === `progress_${percent}` ? '...' : `${percent}%`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate all and reset buttons */}
                <div className="flex gap-2 flex-wrap pt-2">
                  <button
                    disabled={awardLoading !== ''}
                    onClick={async () => {
                      setAwardLoading('all')
                      setAwardMessage('')
                      try {
                        let generatedCount = 0
                        // Check streak milestones
                        const streakDays = selectedUserStats.current_streak || 0
                        const milestones = [7, 30, 100].filter(m => streakDays >= m)

                        for (const days of milestones) {
                          const { data: exists } = await supabase
                            .from('cognara_streak_badges')
                            .select('id')
                            .eq('user_id', selectedUser.id)
                            .eq('streak_days', days)
                            .maybeSingle()

                          if (!exists) {
                            const badgeUrl = await generateStreakBadge(selectedUser.id, days)
                            await supabase
                              .from('cognara_pending_awards')
                              .insert({
                                user_id: selectedUser.id,
                                award_type: 'streak_badge',
                                award_data: {
                                  badge_url: badgeUrl,
                                  streak_days: days,
                                  user_name: selectedUser.name || 'Learner'
                                },
                                is_shown: false,
                                created_at: new Date().toISOString()
                              })
                            generatedCount++
                          }
                        }

                        // Check progress milestones
                        const progress = selectedUserStats.roadmap_progress || 0
                        const progressMilestones = [25, 50, 75].filter(m => progress >= m)

                        for (const percent of progressMilestones) {
                          const { data: exists } = await supabase
                            .from('cognara_progress_cards')
                            .select('id')
                            .eq('user_id', selectedUser.id)
                            .eq('milestone_percent', percent)
                            .maybeSingle()

                          if (!exists) {
                            const cardUrl = await generateProgressCard(selectedUser.id, percent)
                            await supabase
                              .from('cognara_pending_awards')
                              .insert({
                                user_id: selectedUser.id,
                                award_type: 'progress_card',
                                award_data: {
                                  card_url: cardUrl,
                                  milestone_percent: percent,
                                  goal_name: selectedUser.current_subject || 'My Learning Goal',
                                  user_name: selectedUser.name || 'Learner'
                                },
                                is_shown: false,
                                created_at: new Date().toISOString()
                              })
                            generatedCount++
                          }
                        }

                        setAwardMessage(`✓ Generated ${generatedCount} missing awards.`)
                      } catch (e: any) {
                        setAwardMessage(`Error: ${e.message}`)
                      } finally {
                        setAwardLoading('')
                      }
                    }}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition disabled:opacity-50 min-h-[44px] flex items-center justify-center cursor-pointer"
                  >
                    {awardLoading === 'all' ? 'Generating...' : 'Generate All'}
                  </button>

                  <button
                    onClick={async () => {
                      setAwardMessage('')
                      try {
                        const { error: resetErr } = await supabase
                          .from('cognara_pending_awards')
                          .update({ 
                            is_shown: false,
                            shown_at: null
                          })
                          .eq('user_id', selectedUser.id)
                        if (resetErr) throw resetErr
                        setAwardMessage('✓ Pending awards reset.')
                      } catch (e: any) {
                        setAwardMessage(`Error: ${e.message}`)
                      }
                    }}
                    className="px-4 py-2.5 border border-border text-text-1 hover:bg-surface-alt font-bold text-xs uppercase tracking-wider rounded-xl min-h-[44px] flex items-center justify-center cursor-pointer"
                  >
                    Reset Shown
                  </button>
                </div>

                {/* Result message */}
                {awardMessage && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center w-full">
                    <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                      {awardMessage}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-border/60 flex flex-col gap-3">
              <button
                onClick={() => handleUpdatePlan(selectedUser.id, selectedUser.subscription_tier)}
                disabled={updatingUserId === selectedUser.id}
                className="w-full h-11 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {updatingUserId === selectedUser.id ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <>
                    <span>Toggle Pro Tier Status</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
              {bulkUserName || 'Learner'}
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
              background: 'radial-gradient(circle at 50% 50%, #5B8EFF15 0%, transparent 70%)'
            }} />
            
            <span style={{ fontSize: '100px', marginBottom: '24px', lineHeight: 1 }}>
              🎯
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
              color: '#5B8EFF',
              fontWeight: '700',
              marginBottom: '24px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}>
              {bulkGoalName || 'Learning Milestone'}
            </div>
            
            <div style={{
              fontSize: '28px',
              color: '#FFFFFF',
              fontWeight: '600',
              marginBottom: '12px'
            }}>
              {bulkUserName || 'Learner'}
            </div>
            
            <div style={{
              fontSize: '18px',
              color: '#94A3B8',
              maxWidth: '800px',
              textAlign: 'center',
              lineHeight: 1.4,
              marginBottom: '40px'
            }}>
              You are {milestoneProgressPercent}% through your learning journey. Keep pushing towards your goal!
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
      </div>

      {composeEmailUser && (
        <AdminEmailModal
          user={composeEmailUser}
          onClose={() => setComposeEmailUser(null)}
          showToast={showToast}
        />
      )}
    </div>
  )
}

interface AdminEmailModalProps {
  user: UserItem
  onClose: () => void
  showToast: (text: string, type?: 'success' | 'error') => void
}

function AdminEmailModal({ user, onClose, showToast }: AdminEmailModalProps) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)

  // Quick message templates
  const templates = [
    {
      label: 'Welcome message',
      subject: 'Welcome to Cognara',
      message: `Hi ${user.name || 'Learner'},\n\nWelcome to Cognara. We are glad you are here.\n\nIf you need any help getting started, reply to this email and our team will be happy to assist.\n\n— The Cognara Team`
    },
    {
      label: 'Check in',
      subject: 'How is your learning going?',
      message: `Hi ${user.name || 'Learner'},\n\nWe noticed you have been on Cognara for a while and wanted to check in.\n\nHow is your learning journey going? Is there anything we can help you with?\n\n— The Cognara Team`
    },
    {
      label: 'Upgrade invite',
      subject: 'Unlock everything on Cognara',
      message: `Hi ${user.name || 'Learner'},\n\nYou have been making great progress on Cognara. We wanted to let you know that upgrading to Pro unlocks unlimited goals, all phases, certificates, and unlimited access to Spark — your AI mentor.\n\nUpgrade here: cognaralearn.com/upgrade\n\n— The Cognara Team`
    },
  ]

  async function handleSend() {
    if (!subject || !message) return
    setIsSending(true)

    try {
      const res = await fetch('/api/admin/users/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          subject,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333333; line-height: 1.6;">
              ${message.replace(/\n/g, '<br/>')}
            </div>
          `,
          userId: user.id
        })
      })

      if (res.ok) {
        setSent(true)
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to send email. Try again.', 'error')
      }
    } catch (e) {
      showToast('Failed to send email. Try again.', 'error')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border/40 rounded-3xl shadow-2xl p-6 mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto text-left">
        {sent ? (
          <div className="text-center py-8 space-y-4">
            <span className="text-4xl">✉️</span>
            <h3 className="text-text-1 font-bold text-xl mt-4 mb-2">
              Email sent
            </h3>
            <p className="text-text-2 text-sm mb-6">
              Your message was sent to <strong className="text-text-1">{user.email}</strong>
            </p>
            <button
              onClick={onClose}
              className="bg-primary hover:bg-primary-hover text-white font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer min-h-[44px]"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-text-1 font-bold text-lg">
                  Send email
                </h3>
                <p className="text-text-3 text-xs font-semibold uppercase tracking-wider mt-0.5">
                  To: {user.name || 'Anonymous'} · {user.email}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-text-3 hover:text-text-1 transition p-2 cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Quick templates */}
            <p className="text-xs font-bold text-text-2 uppercase tracking-wider mb-2">
              Quick templates:
            </p>
            <div className="flex gap-2 flex-wrap mb-4">
              {templates.map((t, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSubject(t.subject)
                    setMessage(t.message)
                  }}
                  className="text-[10px] font-bold uppercase tracking-wider px-3 py-2 border border-border hover:border-primary text-text-2 hover:text-text-1 rounded-xl transition cursor-pointer min-h-[44px]"
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Subject */}
            <input
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-surface-alt border border-border rounded-xl px-4 py-3 text-text-1 text-sm mb-3 focus:border-primary outline-none"
            />

            {/* Message */}
            <textarea
              placeholder="Write your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="w-full bg-surface-alt border border-border rounded-xl px-4 py-3 text-text-1 text-sm mb-4 resize-none focus:border-primary outline-none"
            />

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!subject || !message || isSending}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl disabled:opacity-50 mb-3 transition cursor-pointer min-h-[44px]"
            >
              {isSending ? 'Sending...' : 'Send email'}
            </button>

            <button
              onClick={onClose}
              className="w-full text-text-3 hover:text-text-2 font-bold text-xs uppercase tracking-wider py-2 cursor-pointer"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  )
}
