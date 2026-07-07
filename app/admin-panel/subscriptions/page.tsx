'use client'

import React, { useEffect, useState } from 'react'
import { 
  CreditCard, 
  Sparkles, 
  ArrowUpRight, 
  TrendingUp, 
  BadgeCent, 
  CheckCircle,
  RefreshCw,
  Award
} from 'lucide-react'

interface SubscriptionItem {
  id: string
  user_email: string
  user_name: string
  plan: string
  status: string
  amount: string
  payment_method: string
  started_at: string
}

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([])
  const [metrics, setMetrics] = useState({
    mrr: 0,
    activeCount: 0,
    conversionRate: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubs = async () => {
      try {
        const res = await fetch('/api/admin/subscriptions')
        if (res.ok) {
          const data = await res.json()
          setSubscriptions(data.subscriptions || [])
          if (data.metrics) {
            setMetrics(data.metrics)
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchSubs()
  }, [])

  return (
    <div className="space-y-8 text-left animate-page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-heading tracking-tight text-text-1">
            Subscription Manager
          </h1>
          <p className="text-xs sm:text-sm text-text-3 font-semibold uppercase tracking-wider mt-1">
            Track user payments, plans, and conversions through Paystack
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface border border-border/40 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-text-2 uppercase tracking-wider">MRR (Naira)</span>
            <div className="p-2 bg-surface-alt rounded-xl border border-border/40 text-primary">
              <BadgeCent size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-text-1 font-heading">₦{metrics.mrr.toLocaleString()}</p>
          <p className="text-[10px] text-text-3 font-semibold uppercase tracking-wider mt-1">Calculated monthly recurring revenue</p>
        </div>

        <div className="bg-surface border border-border/40 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-text-2 uppercase tracking-wider">Conversion rate</span>
            <div className="p-2 bg-surface-alt rounded-xl border border-border/40 text-amber-500">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-text-1 font-heading">{metrics.conversionRate}%</p>
          <p className="text-[10px] text-text-3 font-semibold uppercase tracking-wider mt-1">From free tier to pro subscriptions</p>
        </div>

        <div className="bg-surface border border-border/40 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-text-2 uppercase tracking-wider">Active Pro accounts</span>
            <div className="p-2 bg-surface-alt rounded-xl border border-border/40 text-indigo-400">
              <Sparkles size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-text-1 font-heading">{metrics.activeCount}</p>
          <p className="text-[10px] text-text-3 font-semibold uppercase tracking-wider mt-1">Total active subscribers</p>
        </div>
      </div>

      {/* Subscription List */}
      <div className="bg-surface border border-border/40 rounded-3xl p-6">
        <h3 className="text-sm font-bold text-text-1 uppercase tracking-wider mb-6 flex items-center gap-2">
          <CreditCard size={16} className="text-primary" />
          <span>Recent Subscriber Transactions</span>
        </h3>

        <div className="overflow-x-auto -mx-4 md:mx-0">
          <div className="min-w-[600px] px-4 md:px-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-surface/50 text-[10px] font-bold text-text-3 uppercase tracking-wider">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Billing Plan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Payment Node</th>
                  <th className="px-6 py-4">Billing Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 w-28 bg-surface-alt rounded" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-20 bg-surface-alt rounded" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-12 bg-surface-alt rounded" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-12 bg-surface-alt rounded" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-16 bg-surface-alt rounded" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-16 bg-surface-alt rounded" /></td>
                    </tr>
                  ))
                ) : (
                  subscriptions.map(sub => (
                    <tr key={sub.id} className="hover:bg-surface-alt/10 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-text-1">{sub.user_name}</p>
                        <p className="text-[10px] text-text-3 font-semibold">{sub.user_email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-surface-alt border border-border rounded-lg font-bold text-[9px] text-text-2 uppercase tracking-wider">
                          {sub.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[9px] uppercase tracking-wider border ${
                          sub.status === 'active' 
                            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
                            : 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                        }`}>
                          <span>{sub.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-text-1">{sub.amount}</td>
                      <td className="px-6 py-4 text-text-3 font-semibold uppercase tracking-wider text-[10px]">{sub.payment_method}</td>
                      <td className="px-6 py-4 text-text-3 font-semibold uppercase tracking-wider text-[10px]">{sub.started_at}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
