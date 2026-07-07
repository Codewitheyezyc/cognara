'use client'

import React, { useEffect, useState } from 'react'
import { CloudinaryUpload } from '@/components/blog/CloudinaryUpload'
import { Loader2, User, Mail, Award, CheckCircle } from 'lucide-react'

interface AdminData {
  id: string
  email: string
  full_name: string
  role: string
  avatar_url: string | null
}

export default function AdminProfilePage() {
  const [adminData, setAdminData] = useState<AdminData | null>(null)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [fullName, setFullName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type })
    setTimeout(() => setToastMsg(null), 3000)
  }

  const loadAdminProfile = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/profile')
      if (res.ok) {
        const data = await res.json()
        if (data.admin) {
          setAdminData(data.admin)
          setAvatarUrl(data.admin.avatar_url || '')
          setFullName(data.admin.full_name || '')
        }
      } else {
        showToast('Failed to load profile details', 'error')
      }
    } catch (err) {
      console.error(err)
      showToast('Error fetching profile', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdminProfile()
  }, [])

  const handleSave = async () => {
    if (!fullName.trim()) {
      showToast('Full name is required', 'error')
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          avatarUrl
        })
      })

      if (res.ok) {
        showToast('Profile updated successfully')
        // Refresh local details
        if (adminData) {
          setAdminData({
            ...adminData,
            full_name: fullName,
            avatar_url: avatarUrl
          })
        }
      } else {
        const data = await res.json()
        showToast(data.error || 'Error saving profile', 'error')
      }
    } catch (error) {
      console.error(error)
      showToast('Error saving profile', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-xs text-text-3 font-semibold uppercase tracking-wider">Loading Profile details...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8 space-y-6 text-left animate-page-enter">
      {/* Toast Alert */}
      {toastMsg && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border transition-all duration-300 flex items-center gap-2 ${
          toastMsg.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          <CheckCircle size={14} />
          <span className="text-xs font-bold uppercase tracking-wider">{toastMsg.text}</span>
        </div>
      )}

      <div>
        <h1 className="text-foreground font-bold text-2xl mb-1">
          Admin Profile
        </h1>
        <p className="text-xs text-text-3 font-semibold uppercase tracking-wider">
          Manage your decoupled administrator information
        </p>
      </div>

      {/* Profile picture card */}
      <div className="bg-surface border border-border/40 rounded-3xl p-6 space-y-6">
        <h2 className="text-text-1 font-bold text-xs uppercase tracking-wider border-b border-border/40 pb-3">
          Profile Picture
        </h2>

        {/* Current avatar preview */}
        <div className="flex items-center gap-6">
          <img
            src={avatarUrl || '/default-avatar.png'}
            alt="Admin avatar"
            className="w-20 h-20 rounded-full object-cover border-2 border-border/60 bg-bg"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/default-avatar.png'
            }}
          />
          <div>
            <p className="text-text-1 font-semibold text-sm">
              {fullName || 'Administrator'}
            </p>
            <p className="text-text-3 text-[11px] font-bold uppercase tracking-wider mt-0.5">
              Role: {adminData?.role || 'Admin'}
            </p>
          </div>
        </div>

        {/* Upload new image via Cloudinary */}
        <div className="pt-2">
          <CloudinaryUpload
            value={avatarUrl}
            onChange={(url) => {
              setAvatarUrl(url)
              showToast('Image uploaded successfully!')
            }}
            label="Upload Profile Image"
          />
        </div>

        {avatarUrl && (
          <div className="mt-3 flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
            <span className="text-emerald-400 text-xs">✓ Image uploaded successfully</span>
          </div>
        )}
      </div>

      {/* Admin details card */}
      <div className="bg-surface border border-border/40 rounded-3xl p-6 space-y-4">
        <h2 className="text-text-1 font-bold text-xs uppercase tracking-wider border-b border-border/40 pb-3">
          Admin Details
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-2 uppercase tracking-wider block mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-3" size={16} />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full name"
                className="w-full bg-surface-alt border border-border/40 rounded-2xl pl-11 pr-4 py-3 text-text-1 text-sm focus:border-primary outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-2 uppercase tracking-wider block mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-3" size={16} />
              <input
                type="email"
                value={adminData?.email || ''}
                disabled
                className="w-full bg-surface-alt/40 border border-border/30 rounded-2xl pl-11 pr-4 py-3 text-text-3 text-sm cursor-not-allowed"
              />
            </div>
            <p className="text-[10px] text-text-3 font-semibold mt-1.5 uppercase tracking-wider">
              Email cannot be changed here
            </p>
          </div>
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-3.5 rounded-2xl text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
      >
        {isSaving ? (
          <>
            <Loader2 className="animate-spin" size={14} />
            <span>Saving Changes...</span>
          </>
        ) : (
          <span>Save Changes</span>
        )}
      </button>

    </div>
  )
}
