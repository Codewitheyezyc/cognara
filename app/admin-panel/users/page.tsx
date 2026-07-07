'use client'

import React, { useEffect, useState } from 'react'
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
          className="h-10 px-4 inline-flex items-center gap-2 rounded-xl bg-surface border border-border text-text-1 hover:bg-surface-alt font-bold text-xs uppercase tracking-wider transition cursor-pointer"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Toolbar / Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-text-3">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border/40 rounded-2xl pl-10 pr-4 py-3 text-xs text-text-1 focus:outline-none focus:border-primary/50 transition-colors"
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
              className={`px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider border transition cursor-pointer ${
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
        <div className="overflow-x-auto">
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
                            className="p-2 bg-surface hover:bg-surface-alt border border-border text-text-2 hover:text-text-1 rounded-xl transition cursor-pointer"
                            title="View Student details"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={() => handleUpdatePlan(user.id, user.subscription_tier)}
                            disabled={updatingUserId === user.id}
                            className={`p-2 border rounded-xl transition cursor-pointer disabled:opacity-50 ${
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
                            className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-xl transition cursor-pointer"
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
            
            <div className="space-y-6">
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
    </div>
  )
}
