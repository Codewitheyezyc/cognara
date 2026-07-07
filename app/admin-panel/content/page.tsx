'use client'

import React, { useEffect, useState } from 'react'
import { 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert, 
  Trash2, 
  Eye, 
  X, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle,
  Database,
  ArrowRight,
  Loader2
} from 'lucide-react'

interface GeneratedLessonItem {
  id: string
  title: string
  generated_at: string
  subject: string
  user_name: string
  user_email: string
  content: any
}

interface FailedValidation {
  date: string
  subject: string
  title: string
  reason: string
  status: string
}

export default function AdminContentQuality() {
  const [lessons, setLessons] = useState<GeneratedLessonItem[]>([])
  const [failedValidations, setFailedValidations] = useState<FailedValidation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [previewLesson, setPreviewLesson] = useState<GeneratedLessonItem | null>(null)
  
  // Bulk action states
  const [confirmAction, setConfirmAction] = useState<'lessons' | 'quizzes' | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const loadData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    try {
      const res = await fetch('/api/admin/content')
      if (res.ok) {
        const data = await res.json()
        setLessons(data.lessons || [])
        setFailedValidations(data.failedValidations || [])
      }
    } catch (err) {
      console.error('Failed to load content quality stats', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type })
    setTimeout(() => setToastMsg(null), 3000)
  }

  const handleBulkRegenerate = async () => {
    if (!confirmAction) return
    setActionLoading(true)
    try {
      const endpoint = confirmAction === 'lessons' 
        ? '/api/admin/regenerate-all-lessons' 
        : '/api/admin/regenerate-all-quizzes'
        
      const res = await fetch(endpoint, { method: 'POST' })
      const data = await res.json()
      
      if (res.ok) {
        showToast(data.message || `Successfully queued bulk regeneration of ${confirmAction}`)
        setConfirmAction(null)
        loadData()
      } else {
        showToast(data.error || 'Operation failed', 'error')
      }
    } catch (err) {
      showToast('Connection error occurred', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-8 text-left animate-page-enter relative">
      {/* Toast Alert */}
      {toastMsg && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-2xl flex items-center gap-2 border animate-page-enter ${
          toastMsg.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
        }`}>
          <CheckCircle size={14} />
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-heading tracking-tight text-text-1">
            Lesson Cache & Quality
          </h1>
          <p className="text-xs sm:text-sm text-text-3 font-semibold uppercase tracking-wider mt-1">
            Manage generated lesson structures and review quality metrics
          </p>
        </div>
        <button
          onClick={() => loadData(true)}
          className="h-10 px-4 inline-flex items-center gap-2 rounded-xl bg-surface border border-border text-text-1 hover:bg-surface-alt font-bold text-xs uppercase tracking-wider transition cursor-pointer"
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#121620]/90 border border-border/80 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-text-2 uppercase tracking-wider">Cached Lessons</span>
            <div className="p-2 bg-surface rounded-xl border border-border text-primary">
              <Database size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-text-1 font-heading">{lessons.length}</p>
          <p className="text-[10px] text-text-3 font-semibold uppercase tracking-wider mt-1">Stored structures ready for review</p>
        </div>

        <div className="bg-[#121620]/90 border border-border/80 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-text-2 uppercase tracking-wider">Failed Validations</span>
            <div className="p-2 bg-surface rounded-xl border border-border text-rose-500">
              <ShieldAlert size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-rose-400 font-heading">{failedValidations.length}</p>
          <p className="text-[10px] text-text-3 font-semibold uppercase tracking-wider mt-1">Lessons flagged with formatting errors</p>
        </div>

        <div className="bg-[#121620]/90 border border-border/80 rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-text-2 uppercase tracking-wider">Maintenance Actions</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmAction('lessons')}
              className="flex-1 py-2 rounded-xl bg-surface border border-border text-text-2 hover:text-text-1 font-bold text-[9px] uppercase tracking-wider transition cursor-pointer"
            >
              Reset Lessons
            </button>
            <button
              onClick={() => setConfirmAction('quizzes')}
              className="flex-1 py-2 rounded-xl bg-surface border border-border text-text-2 hover:text-text-1 font-bold text-[9px] uppercase tracking-wider transition cursor-pointer"
            >
              Reset Quizzes
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Lessons List */}
        <div className="bg-[#121620]/90 border border-border/80 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-text-1 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <span>Successfully Cached Lessons</span>
          </h3>

          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-surface-alt rounded-2xl animate-pulse" />
              ))
            ) : lessons.length === 0 ? (
              <p className="text-xs text-text-3 font-semibold uppercase tracking-wider text-center py-12">No cached lessons found</p>
            ) : (
              lessons.map(lesson => (
                <div key={lesson.id} className="bg-surface/50 border border-border/80 hover:border-primary/20 p-4 rounded-2xl flex items-center justify-between transition duration-150">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-text-1 truncate">{lesson.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-text-3 font-semibold uppercase tracking-wider mt-1">
                      <span className="text-primary">{lesson.subject}</span>
                      <span>•</span>
                      <span>{lesson.user_name || 'Guest'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setPreviewLesson(lesson)}
                    className="p-2 bg-surface hover:bg-surface-alt border border-border text-text-2 hover:text-text-1 rounded-xl transition cursor-pointer shrink-0 ml-4"
                  >
                    <Eye size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Validation Failures */}
        <div className="bg-[#121620]/90 border border-border/80 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-text-1 uppercase tracking-wider mb-6 flex items-center gap-2">
            <ShieldAlert size={16} className="text-rose-500" />
            <span>Format Validation Errors</span>
          </h3>

          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-surface-alt rounded-2xl animate-pulse" />
              ))
            ) : failedValidations.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <ShieldCheck size={24} className="text-emerald-400 mx-auto" />
                <p className="text-xs text-text-3 font-semibold uppercase tracking-wider">All generated content passed checks</p>
              </div>
            ) : (
              failedValidations.map((fail, i) => (
                <div key={i} className="bg-rose-500/5 border border-rose-500/15 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-rose-400 font-bold text-xs">{fail.title}</span>
                    <span className="text-[9px] text-text-3 font-bold uppercase tracking-wider">{new Date(fail.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[10px] text-text-2 leading-relaxed">{fail.reason}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121620] border border-border max-w-sm w-full rounded-3xl p-6 shadow-2xl space-y-6 text-center animate-page-enter">
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto text-amber-500">
              <AlertTriangle size={32} />
            </div>
            <div className="space-y-2">
              <h4 className="text-text-1 font-bold text-lg">Clear and Regenerate Cache?</h4>
              <p className="text-text-2 text-xs leading-relaxed">
                This will delete all stored {confirmAction} from the database. When users request lessons/quizzes, they will be regenerated using the AI model again.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 h-10 bg-surface hover:bg-surface-alt border border-border text-text-1 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkRegenerate}
                disabled={actionLoading}
                className="flex-1 h-10 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? <Loader2 size={12} className="animate-spin" /> : 'Yes, Reset Cache'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Content Preview Drawer */}
      {previewLesson && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-end">
          <div className="bg-[#121620] border-l border-border h-full max-w-2xl w-full p-8 shadow-2xl relative flex flex-col justify-between animate-page-enter text-left">
            <button 
              onClick={() => setPreviewLesson(null)} 
              className="absolute top-6 right-6 p-2 bg-surface hover:bg-surface-alt border border-border text-text-3 hover:text-text-1 rounded-xl transition cursor-pointer"
            >
              <X size={15} />
            </button>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
              <div>
                <span className="text-[10px] text-primary font-bold uppercase tracking-wider bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                  {previewLesson.subject}
                </span>
                <h4 className="font-heading font-black text-2xl text-text-1 mt-4">{previewLesson.title}</h4>
                <p className="text-[10px] text-text-3 font-semibold uppercase tracking-wider mt-1.5">
                  Generated at {new Date(previewLesson.generated_at).toLocaleString()}
                </p>
              </div>

              <div className="border-t border-border/60 pt-6 space-y-4">
                <h5 className="text-xs font-bold text-text-2 uppercase tracking-wider">Lesson JSON structure</h5>
                <pre className="p-4 bg-[#0B0D13] border border-border rounded-2xl text-[10px] text-emerald-400 overflow-x-auto whitespace-pre-wrap font-mono max-h-[380px]">
                  {JSON.stringify(previewLesson.content, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
