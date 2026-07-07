'use client'

import React, { useEffect, useState } from 'react'
import { 
  Shield, 
  UserPlus, 
  ListFilter, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ClipboardList,
  RefreshCw
} from 'lucide-react'

interface AuditLog {
  id: string
  action: string
  target_type: string | null
  target_id: string | null
  details: any
  created_at: string
  admin: {
    full_name: string
    email: string
  } | null
}

export default function AdminSettings() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)

  // Provision admin states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('admin')
  const [isProvisioning, setIsProvisioning] = useState(false)
  
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const fetchLogs = async () => {
    setLoadingLogs(true)
    try {
      const res = await fetch('/api/admin/audit-logs')
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingLogs(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProvisioning(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const res = await fetch('/api/admin/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, role })
      })

      const data = await res.json()

      if (res.ok) {
        setSuccessMsg(`Admin user ${fullName} successfully registered.`)
        setEmail('')
        setPassword('')
        setFullName('')
        setRole('admin')
        fetchLogs() // Refresh audit log list
      } else {
        setErrorMsg(data.error || 'Failed to create admin.')
      }
    } catch (err) {
      setErrorMsg('Connection error occurred.')
    } finally {
      setIsProvisioning(false)
    }
  }

  return (
    <div className="space-y-8 text-left animate-page-enter">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black font-heading tracking-tight text-text-1">
          Admin Settings & Audit
        </h1>
        <p className="text-xs sm:text-sm text-text-3 font-semibold uppercase tracking-wider mt-1">
          Provision credentials and review administrative operations logs
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Provision Admin User */}
        <div className="bg-[#121620]/90 border border-border/80 rounded-3xl p-6 h-fit">
          <h3 className="text-sm font-bold text-text-1 uppercase tracking-wider mb-6 flex items-center gap-2">
            <UserPlus size={16} className="text-primary" />
            <span>Provision Admin Account</span>
          </h3>

          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/25 p-4 rounded-xl text-xs font-bold text-emerald-400 mb-4 flex items-center gap-1.5">
              <CheckCircle2 size={13} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/25 p-4 rounded-xl text-xs font-bold text-rose-400 mb-4 flex items-center gap-1.5">
              <AlertCircle size={13} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-3 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#0B0D13]/60 border border-border/80 rounded-xl px-4 py-2.5 text-xs text-text-1 focus:outline-none focus:border-primary/50"
                placeholder="e.g. Isaac Peter"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-3 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0B0D13]/60 border border-border/80 rounded-xl px-4 py-2.5 text-xs text-text-1 focus:outline-none focus:border-primary/50"
                placeholder="e.g. name@cognaralearn.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-3 uppercase tracking-wider">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0B0D13]/60 border border-border/80 rounded-xl px-4 py-2.5 text-xs text-text-1 focus:outline-none focus:border-primary/50"
                placeholder="••••••••••••"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-3 uppercase tracking-wider">Access Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-[#0B0D13]/60 border border-border/80 rounded-xl px-3 py-2.5 text-xs text-text-1 focus:outline-none focus:border-primary/50 cursor-pointer"
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
                <option value="moderator">Moderator</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isProvisioning || !email || !password || !fullName}
              className="w-full h-10 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-[0_0_15px_rgba(91,142,255,0.15)] transition text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 mt-2"
            >
              {isProvisioning ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Register Admin</span>
              )}
            </button>
          </form>

          <p className="text-[9px] text-text-3 font-semibold text-center leading-relaxed mt-5 uppercase tracking-wider">
            ⚠️ Only Super Admins can provision new credentials.
          </p>
        </div>

        {/* Right: Audit Logs List */}
        <div className="lg:col-span-2 bg-[#121620]/90 border border-border/80 rounded-3xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-text-1 uppercase tracking-wider flex items-center gap-2">
              <ClipboardList size={16} className="text-primary" />
              <span>Audit Logging Operations</span>
            </h3>
            <button
              onClick={fetchLogs}
              className="p-2 bg-surface hover:bg-surface-alt border border-border text-text-3 hover:text-text-1 rounded-xl transition cursor-pointer"
            >
              <RefreshCw size={12} className={loadingLogs ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[420px] space-y-3.5 pr-2">
            {loadingLogs ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4 items-center animate-pulse">
                  <div className="h-2 w-16 bg-surface-alt rounded" />
                  <div className="h-3 w-2/3 bg-surface-alt rounded" />
                </div>
              ))
            ) : logs.length === 0 ? (
              <p className="text-xs text-text-3 font-semibold uppercase tracking-wider text-center py-12">
                No logging records available
              </p>
            ) : (
              logs.map(log => (
                <div key={log.id} className="flex items-start gap-4 text-xs pb-3 border-b border-border/40 last:border-b-0 last:pb-0">
                  <span className="text-[9px] text-text-3 font-bold uppercase tracking-wider mt-0.5 shrink-0">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="flex-1">
                    <p className="text-text-1 font-semibold leading-relaxed">
                      <span className="font-bold text-primary">{log.admin?.full_name || 'Admin'}</span>
                      {' '}{log.action.replace('_', ' ')}
                      {log.target_type && (
                        <>
                          {' '}on <span className="font-bold text-[#A78BFA]">{log.target_type}</span>
                        </>
                      )}
                    </p>
                    {log.details && (
                      <span className="text-[10px] text-text-3 font-medium mt-0.5 block truncate">
                        {JSON.stringify(log.details)}
                      </span>
                    )}
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
