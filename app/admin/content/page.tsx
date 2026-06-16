'use client'

import React, { useEffect, useState } from 'react'
import { 
  Sparkles, ShieldCheck, ShieldAlert, Trash2, 
  Eye, X, AlertTriangle, RefreshCw, CheckCircle
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
        setLessons(data.lessons)
        setFailedValidations(data.failedValidations)
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
    setTimeout(() => setToastMsg(null), 3500)
  }

  const handleBulkClear = async () => {
    if (!confirmAction) return
    setActionLoading(true)
    
    const endpoint = confirmAction === 'lessons' 
      ? '/api/admin/regenerate-all-lessons' 
      : '/api/admin/regenerate-all-quizzes'
      
    try {
      const res = await fetch(endpoint, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        showToast(data.message || 'Cache cleared successfully!')
        if (confirmAction === 'lessons') {
          setLessons([]) // Clear locally
        }
      } else {
        const err = await res.json()
        showToast(err.error || 'Failed to clear cache', 'error')
      }
    } catch (err) {
      showToast('Connection error, failed to execute action', 'error')
    } finally {
      setActionLoading(false)
      setConfirmAction(null)
    }
  }

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-xs font-semibold text-text-2">Loading content reports...</p>
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
          {toastMsg.type === 'success' ? <CheckCircle className="h-4.5 w-4.5 text-emerald-400" /> : <AlertTriangle className="h-4.5 w-4.5 text-rose-400" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-1">Content Quality Monitor</h1>
          <p className="text-xs text-text-2 mt-1">Audit AI-generated materials, inspect validation records, and clear caching parameters.</p>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="p-2 bg-surface hover:bg-surface-alt border border-border rounded-xl text-text-2 hover:text-text-1 transition disabled:opacity-50 cursor-pointer"
          title="Refresh logs"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* BULK ACTIONS PANEL */}
      <div className="bg-surface p-5 rounded-2xl border border-border space-y-3">
        <h3 className="text-xs font-bold text-text-1 uppercase tracking-wider select-none">Bulk Operations</h3>
        <p className="text-[11px] text-text-2 leading-relaxed">
          Force content regeneration across the entire platform. Clearing cache removes saved lesson texts or quizzes, forcing Claude to regenerate them from scratch when learners next open the topic.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <button
            onClick={() => setConfirmAction('lessons')}
            className="flex items-center gap-2 px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-xs font-bold text-rose-400 rounded-lg transition cursor-pointer"
          >
            <Trash2 className="h-4 w-4 text-rose-400" />
            <span>Clear All Lesson Cache</span>
          </button>

          <button
            onClick={() => setConfirmAction('quizzes')}
            className="flex items-center gap-2 px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-xs font-bold text-rose-400 rounded-lg transition cursor-pointer"
          >
            <Trash2 className="h-4 w-4 text-rose-400" />
            <span>Clear All Quiz Cache</span>
          </button>
        </div>
      </div>

      {/* RECENTLY GENERATED LESSONS */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border bg-surface-alt/45 select-none">
          <h3 className="text-xs font-bold text-text-1 uppercase tracking-wider">Recently Generated Lessons</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/80 text-[10px] uppercase font-bold tracking-wider text-text-2 bg-surface-alt/10 select-none">
                <th className="py-3 px-5">Lesson Title</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Triggered By</th>
                <th className="py-3 px-4">Generation Time</th>
                <th className="py-3 px-4">Validation</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {lessons.length > 0 ? (
                lessons.map((lesson) => (
                  <tr key={lesson.id} className="hover:bg-surface-alt/20 transition">
                    <td className="py-3.5 px-5 font-bold text-text-1">{lesson.title}</td>
                    <td className="py-3.5 px-4 text-text-2 font-medium">{lesson.subject}</td>
                    <td className="py-3.5 px-4 text-text-2">
                      <div className="flex flex-col">
                        <span className="font-semibold text-text-1">{lesson.user_name}</span>
                        <span className="text-[10px] text-text-3">{lesson.user_email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-text-2 font-medium">
                      {new Date(lesson.generated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{' '}
                      <span className="text-[10px] text-text-3">
                        {new Date(lesson.generated_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                        <ShieldCheck className="h-4 w-4 text-emerald-400" />
                        <span>Passed</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => setPreviewLesson(lesson)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-alt hover:bg-border border border-border text-[10px] font-bold text-text-2 hover:text-text-1 rounded-lg transition ml-auto cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Preview</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-text-3 font-semibold">No generated lessons found in cache</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAILED VALIDATIONS LOG */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border bg-surface-alt/45 select-none flex items-center justify-between">
          <h3 className="text-xs font-bold text-text-1 uppercase tracking-wider">Failed Validation Alerts</h3>
          <ShieldAlert className="h-4.5 w-4.5 text-orange-400" />
        </div>
        <div className="divide-y divide-border/60">
          {failedValidations.map((item, i) => (
            <div key={i} className="p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-surface-alt/10 transition">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-text-1">{item.title}</span>
                  <span className="px-1.5 py-0.5 rounded-sm bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[9px] font-mono font-bold">
                    {item.subject}
                  </span>
                </div>
                <p className="text-[10px] text-rose-400 font-semibold">{item.reason}</p>
              </div>
              
              <div className="flex sm:flex-col items-end justify-between gap-1 text-[10px] font-semibold">
                <span className="text-emerald-400 font-bold">{item.status}</span>
                <span className="text-text-3">
                  {new Date(item.date).toLocaleDateString()}{' '}
                  {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PREVIEW MODAL */}
      {previewLesson && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface border border-border rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-page-enter">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-surface-alt/30">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-text-1 truncate max-w-[500px]">{previewLesson.title}</h3>
                <p className="text-[10px] text-text-3">Subject: {previewLesson.subject} · Created for: {previewLesson.user_email}</p>
              </div>
              <button
                onClick={() => setPreviewLesson(null)}
                className="p-1.5 hover:bg-surface-alt rounded-lg text-text-3 hover:text-text-1 transition cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-text-1 leading-relaxed">
              {previewLesson.content && typeof previewLesson.content === 'object' ? (
                // If it's multi-depth caching content map, extract the first available lesson
                (() => {
                  const lessonObj = previewLesson.content.sections 
                    ? previewLesson.content 
                    : Object.values(previewLesson.content)[0] as any

                  if (!lessonObj || !lessonObj.sections) {
                    return <pre className="bg-surface-alt p-4 rounded-xl border border-border font-mono text-[10px] text-text-2 overflow-x-auto">{JSON.stringify(previewLesson.content, null, 2)}</pre>
                  }

                  return (
                    <div className="space-y-6">
                      {/* Estimated time */}
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 text-primary border border-primary/10 rounded-lg w-max font-bold">
                        <span>⏳ Estimated: {lessonObj.estimated_minutes} mins</span>
                      </div>

                      {/* Sections */}
                      {lessonObj.sections.map((sec: any, idx: number) => (
                        <div key={idx} className="space-y-2 border-l-2 border-border/80 pl-4">
                          <h4 className="font-bold text-text-1 text-[13px]">{sec.heading}</h4>
                          {sec.body && <p className="text-text-2">{sec.body}</p>}
                          {sec.code_snippet && (
                            <pre className="bg-surface-alt p-3 rounded-lg border border-border font-mono text-[10px] text-text-2 overflow-x-auto">
                              <code>{sec.code_snippet}</code>
                            </pre>
                          )}
                          {sec.callout_body && (
                            <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg text-text-2 italic">
                              {sec.callout_body}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Key Takeaways */}
                      {lessonObj.key_takeaways && (
                        <div className="bg-surface-alt p-4.5 rounded-xl border border-border space-y-2">
                          <h4 className="font-bold text-text-1 uppercase tracking-wider text-[10px]">Key Takeaways</h4>
                          <ul className="list-disc pl-4 space-y-1 text-text-2 font-medium">
                            {lessonObj.key_takeaways.map((t: string, tIdx: number) => (
                              <li key={tIdx}>{t}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )
                })()
              ) : (
                <div className="text-center py-6 text-text-3 font-semibold">No structured lesson content details available.</div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-surface-alt/25 flex justify-end">
              <button
                onClick={() => setPreviewLesson(null)}
                className="px-4 py-1.5 bg-surface-alt hover:bg-border border border-border text-xs font-bold text-text-2 hover:text-text-1 rounded-lg transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG FOR BULK ACTIONS */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl animate-page-enter">
            <div className="flex items-center space-x-3 text-rose-500">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-sm font-bold text-text-1">Confirm Cache Deletion</h3>
            </div>
            <p className="text-xs text-text-2 leading-relaxed">
              Are you sure you want to clear all {confirmAction} cache? This will delete all generated {confirmAction} content from the database. Next time users open their dashboard, content will regenerate dynamically.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setConfirmAction(null)}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-surface-alt hover:bg-border border border-border text-xs font-bold text-text-2 hover:text-text-1 rounded-lg transition disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkClear}
                disabled={actionLoading}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white rounded-lg transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {actionLoading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Clearing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clear Cache</span>
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
