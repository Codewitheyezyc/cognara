'use client'

import React, { useEffect, useState } from 'react'
import { 
  Cpu, Server, Key, Landmark, Activity, 
  CheckCircle2, XCircle, RefreshCw, AlertCircle
} from 'lucide-react'

interface SystemData {
  db: {
    status: string
    latency: string
  }
  envCheck: {
    ANTHROPIC_API_KEY: boolean
    SUPABASE_URL: boolean
    SUPABASE_ANON_KEY: boolean
    RESEND_API_KEY: boolean
    ADMIN_USER_ID: boolean
    NEXT_PUBLIC_ADMIN_USER_ID: boolean
  }
  usage: {
    today: {
      calls: number
      tokens: number
      costUsd: number
      costNaira: number
    }
    monthly: {
      calls: number
      tokens: number
      costUsd: number
      costNaira: number
    }
    lastUsed: string | null
  }
}

export default function AdminSystemStatus() {
  const [data, setData] = useState<SystemData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    try {
      const res = await fetch('/api/admin/system')
      if (res.ok) {
        const resData = await res.json()
        setData(resData)
      }
    } catch (err) {
      console.error('Failed to load system status details', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const formatLastActive = (dateStr: string | null) => {
    if (!dateStr) return 'Never'
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins} mins ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} hours ago`
    const days = Math.floor(hours / 24)
    return `${days} days ago`
  }

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-xs font-semibold text-text-2">Pinging system status...</p>
        </div>
      </div>
    )
  }

  const isAnthropicOnline = data?.envCheck.ANTHROPIC_API_KEY ? 'Online' : 'Offline'
  const isResendOnline = data?.envCheck.RESEND_API_KEY ? 'Online' : 'Offline'

  return (
    <div className="space-y-6">
      {/* Header and Ping button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-1">System Health & Costs</h1>
          <p className="text-xs text-text-2 mt-1">Audit active service states, configuration variables, and API transaction fees.</p>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 bg-surface hover:bg-surface-alt text-xs font-bold text-text-2 hover:text-text-1 border border-border rounded-lg transition disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Testing pings...' : 'Run Health Check'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SERVICE STATUS BOX */}
        <div className="bg-surface rounded-2xl border border-border p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-text-1 uppercase tracking-wider border-b border-border pb-3">
            <Server className="h-4.5 w-4.5 text-primary" />
            <span>Service Connection Status</span>
          </div>

          <div className="space-y-4 text-xs font-semibold">
            {/* Supabase */}
            <div className="flex items-center justify-between p-3.5 bg-surface-alt rounded-xl border border-border">
              <div className="space-y-0.5">
                <p className="text-text-1">Supabase Database</p>
                <p className="text-[10px] text-text-3">Response latency: {data?.db.latency}</p>
              </div>
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                data?.db.status === 'Online' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${data?.db.status === 'Online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                <span>{data?.db.status}</span>
              </span>
            </div>

            {/* Anthropic */}
            <div className="flex items-center justify-between p-3.5 bg-surface-alt rounded-xl border border-border">
              <div className="space-y-0.5">
                <p className="text-text-1">Anthropic Claude API</p>
                <p className="text-[10px] text-text-3">Last transaction: {formatLastActive(data?.usage.lastUsed || null)}</p>
              </div>
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                isAnthropicOnline === 'Online' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isAnthropicOnline === 'Online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                <span>{isAnthropicOnline}</span>
              </span>
            </div>

            {/* Resend */}
            <div className="flex items-center justify-between p-3.5 bg-surface-alt rounded-xl border border-border">
              <div className="space-y-0.5">
                <p className="text-text-1">Resend Email Service</p>
                <p className="text-[10px] text-text-3">Transactional mailing</p>
              </div>
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                isResendOnline === 'Online' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isResendOnline === 'Online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                <span>{isResendOnline}</span>
              </span>
            </div>
          </div>
        </div>

        {/* ENVIRONMENT CHECKLIST */}
        <div className="bg-surface rounded-2xl border border-border p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-text-1 uppercase tracking-wider border-b border-border pb-3">
            <Key className="h-4.5 w-4.5 text-primary" />
            <span>Environment Checklist</span>
          </div>

          <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
            {data && Object.keys(data.envCheck).map((key) => {
              const set = data.envCheck[key as keyof typeof data.envCheck]
              return (
                <div key={key} className="flex items-center justify-between text-xs font-semibold">
                  <span className="font-mono text-text-2">{key}</span>
                  {set ? (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                      <span>Set ✓</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] text-rose-400 font-bold">
                      <XCircle className="h-4.5 w-4.5 text-rose-400 shrink-0" />
                      <span>Missing ✗</span>
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* CLAUDE COST TRACKER */}
      <div className="bg-surface rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-text-1 uppercase tracking-wider border-b border-border pb-3 select-none">
          <Landmark className="h-4.5 w-4.5 text-primary" />
          <span>Claude AI Token Cost Tracker</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Today */}
          <div className="bg-surface-alt p-5 rounded-2xl border border-border flex flex-col justify-between h-36">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="font-bold text-text-2 uppercase tracking-wide">Usage Today (Last 24 Hours)</span>
              <span className="px-2 py-0.5 rounded-sm bg-primary/15 text-primary border border-primary/20 text-[9px] font-mono font-bold">
                {data?.usage.today.calls} API calls
              </span>
            </div>
            <div className="pt-2 space-y-1">
              <p className="text-2xl font-black text-text-1 font-heading">
                ₦{data?.usage.today.costNaira.toLocaleString()}
              </p>
              <p className="text-[10px] text-text-3 font-semibold">
                Est: ~${data?.usage.today.costUsd.toFixed(2)} USD ({data?.usage.today.tokens.toLocaleString()} tokens used)
              </p>
            </div>
          </div>

          {/* Monthly */}
          <div className="bg-surface-alt p-5 rounded-2xl border border-border flex flex-col justify-between h-36">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="font-bold text-text-2 uppercase tracking-wide">Usage Monthly So Far</span>
              <span className="px-2 py-0.5 rounded-sm bg-primary/15 text-primary border border-primary/20 text-[9px] font-mono font-bold">
                {data?.usage.monthly.calls} API calls
              </span>
            </div>
            <div className="pt-2 space-y-1">
              <p className="text-2xl font-black text-text-1 font-heading">
                ₦{data?.usage.monthly.costNaira.toLocaleString()}
              </p>
              <p className="text-[10px] text-text-3 font-semibold">
                Est: ~${data?.usage.monthly.costUsd.toFixed(2)} USD ({data?.usage.monthly.tokens.toLocaleString()} tokens used)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
