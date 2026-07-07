'use client'

import React, { useEffect, useState } from 'react'
import { 
  Star, 
  Check, 
  X, 
  MessageSquare, 
  AlertCircle,
  Loader2,
  RefreshCw,
  CheckCircle2
} from 'lucide-react'

interface Testimonial {
  id: string
  name: string
  role: string | null
  content: string
  rating: number
  is_approved: boolean
  created_at: string
}

export default function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const fetchTestimonials = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/testimonials')
      if (res.ok) {
        const data = await res.json()
        setTestimonials(data.testimonials || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTestimonials()
  }, [])

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type })
    setTimeout(() => setToastMsg(null), 3000)
  }

  const handleApprove = async (id: string, currentStatus: boolean) => {
    setLoadingId(id)
    try {
      const res = await fetch('/api/admin/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_approved: !currentStatus })
      })

      if (res.ok) {
        setTestimonials(prev => prev.map(t => t.id === id ? { ...t, is_approved: !currentStatus } : t))
        showToast(currentStatus ? 'Testimonial unapproved' : 'Testimonial approved successfully')
      } else {
        showToast('Action failed', 'error')
      }
    } catch (err) {
      showToast('Connection error occurred', 'error')
    } finally {
      setLoadingId(null)
    }
  }

  const pending = testimonials.filter(t => !t.is_approved)
  const approved = testimonials.filter(t => t.is_approved)

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
            Testimonials Approval
          </h1>
          <p className="text-xs sm:text-sm text-text-3 font-semibold uppercase tracking-wider mt-1">
            Moderate community feedback displayed on the landing page
          </p>
        </div>
        <button
          onClick={fetchTestimonials}
          className="h-10 px-4 inline-flex items-center gap-2 rounded-xl bg-surface border border-border text-text-1 hover:bg-surface-alt font-bold text-xs uppercase tracking-wider transition cursor-pointer"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Testimonials List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Pending Testimonials */}
        <div className="bg-[#121620]/90 border border-border/80 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-text-1 uppercase tracking-wider mb-6 flex items-center gap-2">
            <MessageSquare size={16} className="text-primary" />
            <span>Pending Review ({pending.length})</span>
          </h3>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {loading ? (
              <div className="h-24 bg-surface-alt rounded-2xl animate-pulse" />
            ) : pending.length === 0 ? (
              <p className="text-xs text-text-3 font-semibold uppercase tracking-wider text-center py-12">No pending reviews</p>
            ) : (
              pending.map(t => (
                <div key={t.id} className="bg-surface/50 border border-border p-5 rounded-2xl space-y-3 relative group">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-text-1 text-xs">{t.name}</p>
                      <p className="text-[10px] text-text-3 font-semibold mt-0.5">{t.role || 'Student'}</p>
                    </div>
                    <div className="flex gap-0.5 text-amber-400">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} size={11} fill="currentColor" stroke="none" />
                      ))}
                    </div>
                  </div>
                  <p className="text-text-2 text-xs leading-relaxed italic">"{t.content}"</p>
                  
                  <div className="flex justify-end pt-2 border-t border-border/40">
                    <button
                      onClick={() => handleApprove(t.id, t.is_approved)}
                      disabled={loadingId === t.id}
                      className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {loadingId === t.id ? <Loader2 size={10} className="animate-spin" /> : <Check size={11} />}
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Approved Testimonials */}
        <div className="bg-[#121620]/90 border border-border/80 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-text-1 uppercase tracking-wider mb-6 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>Approved Feed ({approved.length})</span>
          </h3>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {loading ? (
              <div className="h-24 bg-surface-alt rounded-2xl animate-pulse" />
            ) : approved.length === 0 ? (
              <p className="text-xs text-text-3 font-semibold uppercase tracking-wider text-center py-12">No approved testimonials</p>
            ) : (
              approved.map(t => (
                <div key={t.id} className="bg-surface/50 border border-border p-5 rounded-2xl space-y-3 relative group">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-text-1 text-xs">{t.name}</p>
                      <p className="text-[10px] text-text-3 font-semibold mt-0.5">{t.role || 'Student'}</p>
                    </div>
                    <div className="flex gap-0.5 text-amber-400">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} size={11} fill="currentColor" stroke="none" />
                      ))}
                    </div>
                  </div>
                  <p className="text-text-2 text-xs leading-relaxed italic">"{t.content}"</p>
                  
                  <div className="flex justify-end pt-2 border-t border-border/40">
                    <button
                      onClick={() => handleApprove(t.id, t.is_approved)}
                      disabled={loadingId === t.id}
                      className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {loadingId === t.id ? <Loader2 size={10} className="animate-spin" /> : <X size={11} />}
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
