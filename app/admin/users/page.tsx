'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Search, ShieldAlert, Sparkles, Mail, Trash2, 
  ChevronDown, ShieldCheck, ArrowRight, RefreshCw, Eye
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
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const fetchUsers = async () => {
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
    const nextTier = currentTier === 'pro' ? 'free' : 'pro'
    setUpdatingUserId(userId)
    setActiveDropdownId(null)
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
        showToast(`User successfully upgraded/downgraded to ${nextTier}`)
      } else {
        const errData = await res.json()
        showToast(errData.error || 'Failed to update plan', 'error')
      }
    } catch (err) {
      showToast('Error sending update request', 'error')
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
        showToast('User account successfully deleted')
      } else {
        const errData = await res.json()
        showToast(errData.error || 'Failed to delete user', 'error')
      }
    } catch (err) {
      showToast('Error sending delete request', 'error')
    } finally {
      setDeleteLoading(false)
      setDeleteConfirmId(null)
    }
  }

  const formatLastActive = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Today (Just now)'
    if (mins < 60) return 'Today'
    
    const hours = Math.floor(mins / 60)
    if (hours < 24) return 'Today'
    
    const days = Math.floor(hours / 24)
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Filter and Search logic
  const filteredUsers = users.filter(user => {
    // 1. Search Query filter
    const query = searchQuery.toLowerCase().trim()
    const matchesSearch = 
      user.email.toLowerCase().includes(query) || 
      (user.name && user.name.toLowerCase().includes(query))

    if (!matchesSearch) return false

    // 2. Button filter
    const now = Date.now()
    const lastActiveTime = new Date(user.last_active).getTime()
    const diffDays = (now - lastActiveTime) / (1000 * 60 * 60 * 24)

    if (filterType === 'free') {
      return user.subscription_tier === 'free'
    }
    if (filterType === 'pro') {
      return user.subscription_tier !== 'free'
    }
    if (filterType === 'active_week') {
      return diffDays <= 7
    }
    if (filterType === 'inactive_7d') {
      return diffDays > 7
    }

    return true
  })

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-xs font-semibold text-text-2">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 relative">
      {/* Toast Alert */}
      {toastMsg && (
        <div className={`
          fixed bottom-6 right-6 px-4 py-2.5 rounded-xl border shadow-lg z-50 text-xs font-bold animate-page-enter flex items-center gap-2
          ${toastMsg.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }
        `}>
          {toastMsg.type === 'success' ? <ShieldCheck className="h-4.5 w-4.5 text-emerald-400" /> : <ShieldAlert className="h-4.5 w-4.5 text-rose-400" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-1">User Management</h1>
        <p className="text-xs text-text-2 mt-1">Review accounts, grant Pro access, and audit student learning journeys.</p>
      </div>

      {/* SEARCH AND FILTERS BAR */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-surface p-4 rounded-2xl border border-border">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-3" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-surface-alt border border-border rounded-lg text-xs text-text-1 placeholder-text-3 focus:outline-none focus:border-primary transition"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {[
            { label: 'All', value: 'all' },
            { label: 'Free Tier', value: 'free' },
            { label: 'Pro Tier', value: 'pro' },
            { label: 'Active (7d)', value: 'active_week' },
            { label: 'Inactive (7d+)', value: 'inactive_7d' },
          ].map(btn => (
            <button
              key={btn.value}
              onClick={() => setFilterType(btn.value as any)}
              className={`
                px-3 py-1.5 rounded-lg text-[10px] font-bold border transition cursor-pointer
                ${filterType === btn.value
                  ? 'bg-primary/10 text-primary border-primary/20 shadow-xs'
                  : 'bg-surface-alt text-text-2 border-border hover:text-text-1'
                }
              `}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/80 text-[10px] uppercase font-bold tracking-wider text-text-2 bg-surface-alt/45 select-none">
                <th className="py-3.5 px-5">Name / Email</th>
                <th className="py-3.5 px-4">Joined</th>
                <th className="py-3.5 px-4">Plan</th>
                <th className="py-3.5 px-4">Active Subject</th>
                <th className="py-3.5 px-4">Last Active</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const initialName = user.name || 'Learner'
                  const initialsUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(initialName)}`
                  const isPro = user.subscription_tier !== 'free'
                  const lastActiveTime = new Date(user.last_active).getTime()
                  const isInactive = (Date.now() - lastActiveTime) / (1000 * 60 * 60 * 24) > 7

                  return (
                    <tr key={user.id} className="hover:bg-surface-alt/25 transition">
                      {/* Name & Email */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar_url || initialsUrl}
                            alt={initialName}
                            className="w-8 h-8 rounded-full border border-border/80 object-cover"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-text-1 truncate max-w-[150px]">{initialName}</span>
                            <span className="text-[10px] text-text-3 truncate max-w-[180px]">{user.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="py-4 px-4 text-text-2 font-medium">
                        {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>

                      {/* Plan Badge */}
                      <td className="py-4 px-4">
                        <span className={`
                          px-2 py-0.5 rounded-full text-[9px] font-bold border
                          ${isPro 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                            : 'bg-surface-alt text-text-2 border-border'
                          }
                        `}>
                          {isPro ? 'Pro' : 'Free'}
                        </span>
                      </td>

                      {/* Current Subject */}
                      <td className="py-4 px-4 text-text-2 font-medium">
                        {user.current_subject}
                      </td>

                      {/* Last Active */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className={`font-semibold ${isInactive ? 'text-text-3' : 'text-text-1'}`}>
                            {formatLastActive(user.last_active)}
                          </span>
                          <span className="text-[9px] text-text-3 font-mono">
                            {new Date(user.last_active).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right relative">
                        <div className="flex justify-end items-center gap-1.5">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="p-1.5 bg-surface-alt hover:bg-border border border-border text-text-2 hover:text-text-1 rounded-lg transition"
                            title="View Profile Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>

                          <div className="relative">
                            <button
                              onClick={() => setActiveDropdownId(activeDropdownId === user.id ? null : user.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-surface-alt hover:bg-border border border-border text-[10px] font-bold text-text-2 hover:text-text-1 rounded-lg transition cursor-pointer"
                            >
                              <span>Manage</span>
                              <ChevronDown className="h-3 w-3 shrink-0" />
                            </button>

                            {/* Dropdown Menu */}
                            {activeDropdownId === user.id && (
                              <div
                                className="absolute right-0 mt-1.5 bg-surface-alt border border-border rounded-xl p-1 w-44 shadow-xl z-20 text-left animate-page-enter"
                                style={{ minWidth: '176px' }}
                              >
                                <button
                                  onClick={() => handleUpdatePlan(user.id, user.subscription_tier)}
                                  disabled={updatingUserId === user.id}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-text-1 hover:bg-surface rounded-lg transition disabled:opacity-50 text-left border-none bg-transparent cursor-pointer"
                                >
                                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                                  <span>{isPro ? 'Downgrade to Free' : 'Upgrade to Pro'}</span>
                                </button>

                                <a
                                  href={`mailto:${user.email}`}
                                  onClick={() => setActiveDropdownId(null)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-text-1 hover:bg-surface rounded-lg transition text-left no-underline"
                                >
                                  <Mail className="h-3.5 w-3.5 text-text-2" />
                                  <span>Send Email</span>
                                </a>

                                <div className="h-px bg-border my-1" />

                                <button
                                  onClick={() => {
                                    setDeleteConfirmId(user.id)
                                    setActiveDropdownId(null)
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-error hover:bg-error/5 rounded-lg transition text-left border-none bg-transparent cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-error" />
                                  <span>Delete Account</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-3 font-semibold">
                    No users found matching search query
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl animate-page-enter">
            <div className="flex items-center space-x-3 text-error">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="text-sm font-bold text-text-1">Confirm Account Deletion</h3>
            </div>
            <p className="text-xs text-text-2 leading-relaxed">
              Are you sure you want to permanently delete this user? This will delete their learning goals, roadmaps, quiz attempts, and streaks. This action is irreversible.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleteLoading}
                className="px-3 py-1.5 bg-surface-alt hover:bg-border border border-border text-xs font-bold text-text-2 hover:text-text-1 rounded-lg transition disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleteLoading}
                className="px-3.5 py-1.5 bg-error hover:bg-error/90 text-xs font-bold text-white rounded-lg transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {deleteLoading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete User</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
