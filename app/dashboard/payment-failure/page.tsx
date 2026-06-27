'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { XCircle, RefreshCw, ArrowLeft, ShieldAlert, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PaymentFailurePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') || 'monthly'
  
  const [loading, setLoading] = useState(false)

  const handleRetry = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: plan === 'pro_annual' || plan === 'annual' ? 'annual' : 'monthly' }),
      })

      const data = await res.json()
      if (data.authorization_url) {
        window.location.href = data.authorization_url
      } else {
        alert(data.error || 'Failed to initialize payment')
      }
    } catch (err) {
      console.error(err)
      alert('Unable to restart checkout. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg text-text-1 flex items-center justify-center p-4 sm:p-6 md:p-12 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-error/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full bg-surface border border-border/80 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl flex flex-col items-center text-center space-y-7 relative overflow-hidden animate-page-enter">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-error" />
        
        {/* Error Graphic */}
        <div className="relative mt-2">
          <div className="absolute inset-0 bg-error/15 rounded-full blur-xl animate-pulse" />
          <div className="relative w-20 h-20 flex items-center justify-center bg-error/5 border border-error/25 rounded-2xl text-error">
            <XCircle className="h-10 w-10 animate-bounce-subtle" />
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase bg-error/10 border border-error/20 text-error px-3 py-1 rounded-full font-bold inline-flex items-center gap-1">
            <ShieldAlert className="h-3.5 w-3.5" />
            Transaction Failed
          </span>
          <h1 className="font-heading text-2xl font-black text-text-1 tracking-tight">
            Payment Not Completed
          </h1>
          <p className="text-text-2 text-xs sm:text-sm leading-relaxed max-w-xs mx-auto">
            Your transaction was declined, cancelled, or timed out. Don't worry, your account was not charged.
          </p>
        </div>

        {/* Retry Box card */}
        <div className="w-full p-4 bg-surface-alt/40 border border-border/80 rounded-2xl text-left space-y-2">
          <span className="text-[9px] font-mono uppercase text-text-3 font-bold block">
            What you can do:
          </span>
          <ul className="text-[11px] text-text-2 space-y-1.5 list-disc pl-4 leading-relaxed">
            <li>Verify your payment details and card authorization.</li>
            <li>Ensure you have sufficient funds in your bank account.</li>
            <li>Try another method like bank transfer or USSD on checkout.</li>
          </ul>
        </div>

        {/* Actions CTA buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={handleRetry}
            disabled={loading}
            className="w-full h-12 bg-primary hover:bg-primary/95 text-white font-extrabold rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 text-xs hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            {loading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Redirecting to Checkout...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Try Payment Again</span>
              </>
            )}
          </button>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full h-10 bg-transparent hover:bg-surface-alt/60 border border-border text-text-2 hover:text-text-1 font-semibold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  )
}
