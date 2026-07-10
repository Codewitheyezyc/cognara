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
  Mail,
  Search
} from 'lucide-react'

interface UserProfile {
  id: string
  name: string | null
  email: string
  subscription_status: string | null
}

export default function AdminBroadcastPage() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [audience, setAudience] = useState<'all' | 'free' | 'pro' | 'individual'>('all')
  
  // All users fetched from DB
  const [allUsers, setAllUsers] = useState<UserProfile[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)

  // Selected individual user for "individual" audience
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  // Sending progress states
  const [isSending, setIsSending] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  
  // Preview State
  const [showPreview, setShowPreview] = useState(false)
  const [previewUserId, setPreviewUserId] = useState<string>('')

  // Toast notifications
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const supabase = createClient()

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type })
    setTimeout(() => setToastMsg(null), 3000)
  }

  // Load all users on mount
  useEffect(() => {
    async function loadUsers() {
      try {
        setLoadingUsers(true)
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, email, subscription_status')
          .order('name', { ascending: true })

        if (error) throw error
        setAllUsers(data || [])
      } catch (err) {
        console.error('Failed to load profiles:', err)
        showToast('Failed to load user records', 'error')
      } finally {
        setLoadingUsers(false)
      }
    }
    loadUsers()
  }, [])

  // Derive target recipients list based on audience selector
  const getTargetRecipients = (): UserProfile[] => {
    if (audience === 'all') {
      return allUsers
    }
    if (audience === 'free') {
      return allUsers.filter(u => u.subscription_status !== 'active' && u.subscription_status !== 'pro')
    }
    if (audience === 'pro') {
      return allUsers.filter(u => u.subscription_status === 'active' || u.subscription_status === 'pro')
    }
    if (audience === 'individual') {
      return selectedUser ? [selectedUser] : []
    }
    return []
  }

  const recipients = getTargetRecipients()
  const recipientCount = recipients.length

  // Initialize/Update previewUserId when recipients change
  useEffect(() => {
    if (recipients.length > 0) {
      // Keep existing preview selection if it is still in the active list
      const isStillAvailable = recipients.some(r => r.id === previewUserId)
      if (!isStillAvailable) {
        setPreviewUserId(recipients[0].id)
      }
    } else {
      setPreviewUserId('')
    }
  }, [recipients, previewUserId])

  async function handleSendBroadcast() {
    if (!subject.trim() || !message.trim()) {
      showToast('Subject and Message are required', 'error')
      return
    }

    if (audience === 'individual' && !selectedUser) {
      showToast('Please select a recipient first', 'error')
      return
    }

    const confirmed = window.confirm(
      `Send this email to ${recipientCount} user(s)? This cannot be undone.`
    )
    if (!confirmed) return

    setIsSending(true)
    setProgress(0)
    setResult(null)

    try {
      let sent = 0
      let failed = 0

      // Loop through recipients
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

      // Log broadcast in admin audit log
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
          message: `Sent to ${sent} user(s). ${failed > 0 ? `${failed} failed.` : 'All delivered successfully.'}`
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

  // Filter users by search term
  const searchedUsers = searchQuery.trim()
    ? allUsers.filter(u => 
        (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
         u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : allUsers.slice(0, 8)

  // Resolve dynamic preview body text
  const currentPreviewUser = allUsers.find(u => u.id === previewUserId) || recipients[0] || null
  const previewName = currentPreviewUser?.name?.split(' ')[0] || 'Learner'

  const previewHtml = message
    ? message
        .replace(/\[First Name\]/g, previewName)
        .replace(/\[first name\]/g, previewName)
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
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {[
                { value: 'all', label: 'All users' },
                { value: 'free', label: 'Free users' },
                { value: 'pro', label: 'Pro users' },
                { value: 'individual', label: 'Individual...' },
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
                    onChange={(e) => {
                      setAudience(e.target.value as any)
                      if (e.target.value !== 'individual') {
                        setSelectedUser(null)
                      }
                    }}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm font-bold whitespace-nowrap">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>

            {/* Individual user selection dropdown */}
            {audience === 'individual' && (
              <div className="relative mt-3 p-4 bg-surface-alt/40 border border-border/80 rounded-2xl space-y-3">
                <label className="text-[11px] font-bold text-text-2 uppercase tracking-wider block">
                  Select Target User:
                </label>
                <div className="flex gap-2 relative">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-4 top-3.5 text-text-3" />
                    <input
                      type="text"
                      placeholder="Search users by name or email..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setShowDropdown(true)
                      }}
                      onFocus={() => setShowDropdown(true)}
                      className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 text-text-1 text-xs focus:border-primary outline-none"
                    />
                  </div>
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('')
                        setShowDropdown(false)
                      }}
                      className="px-3 border border-border hover:bg-surface text-text-2 rounded-xl text-xs transition cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Dropdown list */}
                {showDropdown && (
                  <div className="absolute left-4 right-4 z-40 bg-surface border border-border rounded-xl shadow-xl mt-1 max-h-56 overflow-y-auto">
                    {searchedUsers.length === 0 ? (
                      <p className="text-xs text-text-3 p-3 italic">No matching users found</p>
                    ) : (
                      searchedUsers.map(user => (
                        <button
                          key={user.id}
                          onClick={() => {
                            setSelectedUser(user)
                            setSearchQuery('')
                            setShowDropdown(false)
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-surface-alt transition text-xs text-text-2 hover:text-text-1 flex justify-between border-b border-border/20 last:border-b-0 cursor-pointer"
                        >
                          <span className="font-bold">{user.name || 'Anonymous'}</span>
                          <span className="text-text-3">{user.email}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {/* Selected User Display Banner */}
                {selectedUser && (
                  <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-text-1">{selectedUser.name || 'Anonymous'}</p>
                      <p className="text-text-3 mt-0.5">{selectedUser.email}</p>
                    </div>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="text-text-3 hover:text-rose-400 font-bold p-1 cursor-pointer"
                      title="Deselect user"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )}

            <p className="text-text-3 text-[11px] font-bold uppercase tracking-wider mt-2">
              Target Audience Size: <span className="text-primary font-extrabold">{recipientCount} user(s)</span>
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
              onClick={() => {
                if (recipientCount === 0) {
                  showToast('No recipients available for preview', 'error')
                  return
                }
                setShowPreview(true)
              }}
              disabled={recipientCount === 0}
              className="h-12 px-6 border border-border text-text-2 hover:text-text-1 rounded-2xl font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-2 bg-surface-alt/45 disabled:opacity-50"
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
                  <span>Send to {recipientCount} user(s)</span>
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

              {/* Dynamic Recipient Selector */}
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between border-b border-border/40 pb-3 mb-3">
                <label className="text-xs font-bold text-text-3 uppercase tracking-wider">
                  Preview personalization for:
                </label>
                <select
                  value={previewUserId}
                  onChange={(e) => setPreviewUserId(e.target.value)}
                  className="bg-surface-alt border border-border rounded-xl px-3 py-1.5 text-text-1 text-xs font-bold focus:border-primary outline-none max-w-xs cursor-pointer"
                >
                  {recipients.slice(0, 50).map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name || 'Anonymous'} ({r.email})
                    </option>
                  ))}
                  {recipients.length > 50 && (
                    <option disabled>... and {recipients.length - 50} more</option>
                  )}
                </select>
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
