'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { 
  Send, 
  Users, 
  FileText, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  X,
  Mail
} from 'lucide-react'

export default function AdminBroadcastPage() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [audience, setAudience] = useState<'all' | 'free' | 'pro'>('all')
  const [isSending, setIsSending] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [recipientCount, setRecipientCount] = useState(0)
  
  // Preview State
  const [showPreview, setShowPreview] = useState(false)

  // Toast notifications
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const supabase = createClient()

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type })
    setTimeout(() => setToastMsg(null), 3000)
  }

  useEffect(() => {
    loadRecipientCount()
  }, [audience])

  async function loadRecipientCount() {
    try {
      let query = supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })

      if (audience === 'free') {
        query = query.not('subscription_status', 'in', '("active","pro")')
      } else if (audience === 'pro') {
        query = query.in('subscription_status', ['active', 'pro'])
      }

      const { count, error } = await query
      if (error) throw error
      setRecipientCount(count || 0)
    } catch (err) {
      console.error('Failed to load recipient count:', err)
    }
  }

  async function handleSendBroadcast() {
    if (!subject.trim() || !message.trim()) {
      showToast('Subject and Message are required', 'error')
      return
    }

    const confirmed = window.confirm(
      `Send this email to ${recipientCount} users? This cannot be undone.`
    )
    if (!confirmed) return

    setIsSending(true)
    setProgress(0)
    setResult(null)

    try {
      // 1. Fetch recipients
      let query = supabase
        .from('profiles')
        .select('id, email, name')

      if (audience === 'free') {
        query = query.not('subscription_status', 'in', '("active","pro")')
      } else if (audience === 'pro') {
        query = query.in('subscription_status', ['active', 'pro'])
      }

      const { data: recipients, error: fetchErr } = await query
      if (fetchErr) throw fetchErr

      if (!recipients || recipients.length === 0) {
        setResult({ 
          success: false, 
          message: 'No recipients found' 
        })
        setIsSending(false)
        return
      }

      let sent = 0
      let failed = 0

      // 2. Loop through recipients
      for (const recipient of recipients) {
        try {
          const firstName = recipient.name?.split(' ')[0] || 'there'
          const personalisedMessage = message
            .replace(/\[First Name\]/g, firstName)
            .replace(/\[first name\]/g, firstName)

          const htmlBody = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333333; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px; background: #ffffff;">
              <div style="margin-bottom: 24px; border-bottom: 2px solid #eaeaea; padding-bottom: 12px;">
                <h2 style="color: #3D6AFF; margin: 0; font-family: sans-serif; font-weight: 800;">Cognara</h2>
              </div>
              ${personalisedMessage.replace(/\n/g, '<br/>')}
              <div style="margin-top: 36px; border-top: 1px solid #eaeaea; padding-top: 16px; font-size: 11px; color: #888888;">
                You are receiving this because you are a registered user of Cognara.
              </div>
            </div>
          `

          const res = await fetch('/api/admin/broadcast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'send',
              to: recipient.email,
              subject: subject,
              html: htmlBody
            })
          })

          if (res.ok) {
            sent++
          } else {
            failed++
          }
        } catch (err) {
          console.error(`Failed to send to ${recipient.email}:`, err)
          failed++
        }

        setProgress(sent + failed)

        // Respect Resend rate limits
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // 3. Log broadcast to audit log
      const logRes = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log',
          subject,
          audience,
          total_recipients: recipients.length,
          sent,
          failed
        })
      })

      if (logRes.ok) {
        setResult({
          success: true,
          message: `Sent to ${sent} users. ${failed > 0 ? `${failed} failed.` : 'All delivered successfully.'}`
        })
      } else {
        setResult({
          success: true,
          message: `Broadcast sent, but failed to write audit log entry.`
        })
      }
    } catch (err: any) {
      console.error(err)
      setResult({
        success: false,
        message: `Error: ${err.message || 'Unknown error'}`
      })
    } finally {
      setIsSending(false)
    }
  }

  // Get preview content
  const previewHtml = message
    ? message
        .replace(/\[First Name\]/g, 'Learner')
        .replace(/\[first name\]/g, 'Learner')
        .split('\n')
        .map((paragraph, index) => (
          <p key={index} className="mb-3 text-text-2 text-sm leading-relaxed font-medium">
            {paragraph}
          </p>
        ))
    : <p className="text-text-3 italic text-sm">Write a message to preview...</p>

  return (
    <div className="space-y-8 text-left animate-page-enter relative max-w-3xl mx-auto">
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
      <div>
        <h1 className="text-3xl font-black font-heading tracking-tight text-text-1 flex items-center gap-3">
          📢 Broadcast Email
        </h1>
        <p className="text-xs sm:text-sm text-text-3 font-semibold uppercase tracking-wider mt-1">
          Send personalized bulk newsletters and feature updates to your user segments
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* Settings panel */}
        <div className="bg-surface border border-border/40 rounded-3xl p-6 shadow-sm space-y-6">
          
          {/* Audience selection */}
          <div className="space-y-3">
            <label className="text-xs font-extrabold text-text-2 uppercase tracking-widest block">
              Who should receive this?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { value: 'all', label: 'All users' },
                { value: 'free', label: 'Free users only' },
                { value: 'pro', label: 'Pro users only' },
              ].map(option => (
                <label
                  key={option.value}
                  className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition select-none ${
                    audience === option.value
                      ? 'bg-primary/5 border-primary text-text-1'
                      : 'bg-surface-alt/45 border-border hover:border-border-hover text-text-2'
                  }`}
                >
                  <input
                    type="radio"
                    name="audience"
                    value={option.value}
                    checked={audience === option.value}
                    onChange={(e) => setAudience(e.target.value as any)}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm font-bold">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-text-3 text-[11px] font-bold uppercase tracking-wider">
              Target Audience Size: <span className="text-primary font-extrabold">{recipientCount} users</span>
            </p>
          </div>

          {/* Subject input */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-text-2 uppercase tracking-widest block">
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What are you learning today?"
              className="w-full bg-surface-alt border border-border rounded-2xl px-4 py-3.5 text-text-1 text-sm focus:border-primary outline-none font-medium"
            />
          </div>

          {/* Message input */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-text-2 uppercase tracking-widest block">
              Message Body
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={12}
              placeholder="Write your email content here. Use [First Name] to insert the user's name."
              className="w-full bg-surface-alt border border-border rounded-2xl px-4 py-3.5 text-text-1 text-sm focus:border-primary outline-none resize-none font-medium"
            />
            <p className="text-text-3 text-[10px] font-bold uppercase tracking-wider mt-1">
              Tip: Use <code className="text-primary font-mono select-all font-black">[First Name]</code> anywhere to personalize the greeting
            </p>
          </div>

          {/* Progress bar */}
          {isSending && (
            <div className="bg-surface-alt/60 border border-border rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                <span className="text-text-2 animate-pulse">Sending Broadcast...</span>
                <span className="text-text-1">{progress} / {recipientCount}</span>
              </div>
              <div className="w-full bg-border/50 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${recipientCount > 0 ? (progress / recipientCount) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Result message */}
          {result && (
            <div className={`rounded-2xl p-4 border text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
              result.success
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              {result.success ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
              <span>{result.message}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowPreview(true)}
              className="h-12 px-6 border border-border text-text-2 hover:text-text-1 rounded-2xl font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-2 bg-surface-alt/45"
            >
              <Eye size={14} />
              <span>Preview</span>
            </button>
            <button
              onClick={handleSendBroadcast}
              disabled={!subject.trim() || !message.trim() || isSending || recipientCount === 0}
              className="flex-1 h-12 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-sm"
            >
              {isSending ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Sending ({progress}/{recipientCount})</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Send to {recipientCount} users</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

      {/* Preview Modal */}
      {showPreview && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="bg-surface border border-border/40 rounded-3xl shadow-2xl p-6 mx-4 w-full max-w-2xl max-h-[85vh] overflow-y-auto text-left flex flex-col">
              
              {/* Header */}
              <div className="flex items-center justify-between mb-5 border-b border-border/40 pb-3">
                <div>
                  <h3 className="text-text-1 font-bold text-lg">
                    Email Preview
                  </h3>
                  <p className="text-text-3 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                    Visual layout sent to community members
                  </p>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-text-3 hover:text-text-1 transition p-2 cursor-pointer text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Email Client Wrapper */}
              <div className="flex-1 bg-surface-alt/30 border border-border rounded-2xl p-5 space-y-4">
                <div className="space-y-1.5 border-b border-border pb-3 text-xs text-text-3 font-semibold">
                  <p><span className="text-text-2 font-bold">From:</span> Isaac from Cognara &lt;hello@cognaralearn.com&gt;</p>
                  <p><span className="text-text-2 font-bold">Reply-To:</span> hello@cognaralearn.com</p>
                  <p><span className="text-text-2 font-bold">Subject:</span> {subject || <span className="italic text-text-3">(No subject)</span>}</p>
                </div>
                
                <div className="bg-surface border border-border/40 rounded-xl p-6 min-h-60 text-left">
                  <div style={{ fontFamily: 'sans-serif' }}>
                    <div style={{ marginBottom: '24px', borderBottom: '2px solid #eaeaea', paddingBottom: '12px' }}>
                      <h2 style={{ color: '#3D6AFF', margin: 0, fontFamily: 'sans-serif', fontWeight: 800 }}>Cognara</h2>
                    </div>
                    {previewHtml}
                    <div style={{ marginTop: '36px', borderTop: '1px solid #eaeaea', paddingTop: '16px', fontSize: '11px', color: '#888888' }}>
                      You are receiving this because you are a registered user of Cognara.
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowPreview(false)}
                className="mt-5 w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-2xl text-xs uppercase tracking-wider transition cursor-pointer min-h-[44px]"
              >
                Close Preview
              </button>

            </div>
          </div>
        </Portal>
      )}

    </div>
  )
}

function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  return mounted ? createPortal(children, document.body) : null
}
