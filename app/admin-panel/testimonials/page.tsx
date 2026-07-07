'use client'

import React, { useEffect, useState } from 'react'
import { 
  Star, 
  Check, 
  EyeOff, 
  Eye, 
  Trash2, 
  RefreshCw, 
  Settings, 
  PlusCircle, 
  AlertTriangle 
} from 'lucide-react'

interface Testimonial {
  id: string
  user_id: string | null
  first_name: string
  last_initial: string
  learning_goal: string
  testimonial_text: string
  star_rating: number
  is_approved: boolean
  is_visible: boolean
  created_at: string
  approved_at: string | null
  removed_at: string | null
}

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [maxVisible, setMaxVisible] = useState(6)
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'hidden' | 'all'>('pending')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  
  // Toast notifications
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type })
    setTimeout(() => setToastMsg(null), 3000)
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      // 1. Fetch testimonials
      const res = await fetch('/api/admin/testimonials')
      if (res.ok) {
        const data = await res.json()
        setTestimonials(data.testimonials || [])
        if (data.maxVisible) {
          setMaxVisible(Number(data.maxVisible))
        }
      }
    } catch (err) {
      console.error(err)
      showToast('Failed to load testimonials', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAction = async (id: string, action: 'approve' | 'hide' | 'show' | 'delete') => {
    if (action === 'delete') {
      const confirmed = window.confirm('Delete this testimonial permanently? This cannot be undone.')
      if (!confirmed) return
    }

    setActionLoadingId(id)
    try {
      const res = await fetch('/api/admin/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })

      if (res.ok) {
        showToast(`Successfully processed testimonial action: ${action}`)
        // Update local state
        if (action === 'delete') {
          setTestimonials(prev => prev.filter(t => t.id !== id))
        } else {
          setTestimonials(prev => prev.map(t => {
            if (t.id === id) {
              if (action === 'approve') {
                return { ...t, is_approved: true, is_visible: true, approved_at: new Date().toISOString() }
              }
              if (action === 'hide') {
                return { ...t, is_visible: false, removed_at: new Date().toISOString() }
              }
              if (action === 'show') {
                return { ...t, is_visible: true }
              }
            }
            return t
          }))
        }
      } else {
        const errData = await res.json()
        showToast(errData.error || 'Failed to update testimonial', 'error')
      }
    } catch (err) {
      console.error(err)
      showToast('Failed to update testimonial', 'error')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleUpdateMaxVisible = async (count: number) => {
    try {
      const res = await fetch('/api/admin/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_max_visible', value: count }),
      })

      if (res.ok) {
        setMaxVisible(count)
        showToast(`Max homepage testimonials updated to ${count}`)
      } else {
        const errData = await res.json()
        showToast(errData.error || 'Failed to update homepage settings', 'error')
      }
    } catch (err) {
      console.error(err)
      showToast('Failed to update homepage settings', 'error')
    }
  }

  // Filter lists
  const pending = testimonials.filter(t => !t.is_approved)
  const approved = testimonials.filter(t => t.is_approved && t.is_visible)
  const hidden = testimonials.filter(t => t.is_approved && !t.is_visible)
  const visibleCount = approved.length

  const filteredTestimonials = 
    activeTab === 'pending' ? pending :
    activeTab === 'approved' ? approved :
    activeTab === 'hidden' ? hidden : testimonials

  return (
    <div className="space-y-8 text-left animate-page-enter relative">
      {/* Toast Alert */}
      {toastMsg && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl border text-xs font-bold uppercase tracking-wider animate-bounce ${
          toastMsg.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {toastMsg.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-heading tracking-tight text-text-1">
            Testimonials Control
          </h1>
          <p className="text-xs sm:text-sm text-text-3 font-semibold uppercase tracking-wider mt-1">
            Approve social proofs, manage visibility settings, and customize the homepage display limits
          </p>
        </div>
        
        <div>
          <button
            onClick={fetchData}
            className="h-10 px-4 inline-flex items-center gap-2 rounded-xl bg-surface border border-border text-text-1 hover:bg-surface-alt font-bold text-xs uppercase tracking-wider transition cursor-pointer"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Homepage display control settings */}
      <div className="bg-surface border border-border/40 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-text-1 font-heading font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
          <Settings size={15} className="text-primary" /> Homepage display settings
        </h3>
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
          <p className="text-text-2">
            Maximum visible testimonials on homepage:
          </p>
          <select
            value={maxVisible}
            onChange={(e) => handleUpdateMaxVisible(Number(e.target.value))}
            className="bg-surface-alt border border-border rounded-xl px-4 py-2 text-text-1 text-xs font-bold focus:border-primary outline-none cursor-pointer h-10"
          >
            {[3, 4, 6, 8, 10].map(n => (
              <option key={n} value={n}>{n} slots</option>
            ))}
          </select>
          <p className="text-text-3 uppercase tracking-wider">
            Currently showing: <span className="text-emerald-400 font-bold">{visibleCount}</span> approved & visible
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/60 pb-px">
        {[
          { id: 'pending', label: 'Pending Review', count: pending.length },
          { id: 'approved', label: 'Approved & Visible', count: approved.length },
          { id: 'hidden', label: 'Hidden', count: hidden.length },
          { id: 'all', label: 'All Submissions', count: testimonials.length },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-text-3 hover:text-text-1'
            }`}
          >
            <span>{t.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
              activeTab === t.id ? 'bg-primary/10 text-primary' : 'bg-surface border border-border text-text-2'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Testimonials List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <RefreshCw size={24} className="animate-spin text-primary" />
            <p className="text-xs font-bold text-text-3 uppercase tracking-wider">Syncing testimonial records...</p>
          </div>
        ) : filteredTestimonials.length === 0 ? (
          <div className="text-center py-12 bg-surface/50 border border-dashed border-border/60 rounded-3xl space-y-2">
            <span className="text-3xl">⭐️</span>
            <p className="text-xs font-bold text-text-3 uppercase tracking-wider">No testimonials found in this category</p>
          </div>
        ) : (
          filteredTestimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-surface border border-border/40 rounded-3xl p-6 shadow-sm space-y-4 text-left"
            >
              {/* Row Header */}
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-text-1 font-bold text-sm">
                      {testimonial.first_name} {testimonial.last_initial}.
                    </p>
                    <div className="flex gap-0.5 text-amber-400 select-none">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          size={12} 
                          className={i < testimonial.star_rating ? 'fill-current' : 'text-text-3'} 
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-text-3 font-semibold uppercase tracking-wider">
                    Goal: <span className="text-text-2 font-bold">{testimonial.learning_goal || 'Not specified'}</span> · Submitted: {new Date(testimonial.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Status badge */}
                <span className={`text-[9px] px-2 py-1 rounded-full font-mono font-bold uppercase tracking-wider shrink-0 border ${
                  testimonial.is_approved && testimonial.is_visible
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : testimonial.is_approved && !testimonial.is_visible
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    : 'bg-surface-alt border-border text-text-3'
                }`}>
                  {testimonial.is_approved && testimonial.is_visible && 'Live on homepage'}
                  {testimonial.is_approved && !testimonial.is_visible && 'Approved but hidden'}
                  {!testimonial.is_approved && 'Pending review'}
                </span>
              </div>

              {/* Text */}
              <div className="bg-surface-alt/55 border border-border/40 rounded-2xl p-4">
                <p className="text-text-2 text-xs sm:text-sm font-medium leading-relaxed italic">
                  &ldquo;{testimonial.testimonial_text}&rdquo;
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap items-center">
                {/* Approve */}
                {!testimonial.is_approved && (
                  <button
                    onClick={() => handleAction(testimonial.id, 'approve')}
                    disabled={actionLoadingId !== null}
                    className="min-h-[44px] px-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-bold text-xs uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
                  >
                    <Check size={12} />
                    <span>Approve and show</span>
                  </button>
                )}

                {/* Hide */}
                {testimonial.is_approved && testimonial.is_visible && (
                  <button
                    onClick={() => handleAction(testimonial.id, 'hide')}
                    disabled={actionLoadingId !== null}
                    className="min-h-[44px] px-4 inline-flex items-center gap-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 font-bold text-xs uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
                  >
                    <EyeOff size={12} />
                    <span>Hide from homepage</span>
                  </button>
                )}

                {/* Show */}
                {testimonial.is_approved && !testimonial.is_visible && (
                  <button
                    onClick={() => handleAction(testimonial.id, 'show')}
                    disabled={actionLoadingId !== null}
                    className="min-h-[44px] px-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 font-bold text-xs uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
                  >
                    <Eye size={12} />
                    <span>Show on homepage</span>
                  </button>
                )}

                {/* Delete */}
                <button
                  onClick={() => handleAction(testimonial.id, 'delete')}
                  disabled={actionLoadingId !== null}
                  className="min-h-[44px] h-11 w-11 inline-flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-xl transition cursor-pointer disabled:opacity-50 ml-auto"
                  title="Delete permanently"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
