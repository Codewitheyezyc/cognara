'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, X, Sparkles, Loader2 } from 'lucide-react'

export function PricingSection() {
  const router = useRouter()
  const supabase = createClient()
  
  const [user, setUser] = useState<any>(null)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then((res: any) => {
      setUser(res.data?.user || null)
    })
  }, [supabase])

  const freeFeatures = [
    { label: '1 learning goal at a time', included: true },
    { label: 'Start at the beginner level', included: true },
    { label: 'Lessons, quizzes, and tracking', included: true },
    { label: 'Phase 1 completion certificate', included: true },
    { label: 'Phase 2 & beyond certificates', included: false },
    { label: 'Goal completion certificates', included: false },
    { label: 'Fast support from Spark (your AI helper)', included: false },
    { label: 'Learn as many things as you want', included: false },
    { label: 'Learn as deep as you want to go', included: false },
    { label: 'Learn without an internet connection', included: false }
  ]

  const proFeatures = [
    'Everything in the Free plan',
    'Learn as many things as you want',
    'Learn as deep as you want to go',
    'Phase 2 & beyond certificates',
    'Goal completion certificates',
    'Learn without an internet connection',
    'Fast support from Spark (your AI helper)',
    'Practical projects and homework',
    'Fast path mode',
    'Weekly challenges'
  ]

  const handleSelectPlan = async (plan: 'free' | 'monthly' | 'annual') => {
    if (plan === 'free') {
      sessionStorage.removeItem('pending_plan')
      if (user) {
        router.push('/dashboard')
      } else {
        router.push('/signup')
      }
      return
    }

    // Save pending plan to session storage for post-signup/redirects
    sessionStorage.setItem('pending_plan', plan === 'annual' ? 'pro_annual' : 'pro_monthly')

    if (!user) {
      // Redirect new user to signup (Scenario 1)
      router.push('/signup')
      return
    }

    // User is logged in: skip signup and go straight to Paystack (Scenario 3 & 4)
    setLoadingPlan(plan)
    try {
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })

      const data = await res.json()
      if (data.authorization_url) {
        window.location.href = data.authorization_url
      } else {
        alert(data.error || 'Failed to initialize payment')
      }
    } catch (err) {
      console.error(err)
      alert('Payment setup error. Please try again.')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <section id="pricing" className="py-16 md:py-24 max-w-6xl mx-auto px-4 border-t border-border/40 scroll-mt-24">
      {/* Headline & Subheadline */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-text-1 tracking-tight">
          Start learning for free. Pay only when you are ready.
        </h2>
        <p className="text-text-2 text-xs sm:text-sm font-semibold">
          No card needed to try it.
        </p>
      </div>

      {/* Three Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 items-stretch max-w-5xl mx-auto">
        
        {/* CARD 1 — FREE */}
        <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 flex flex-col justify-between space-y-6 shadow-sm hover:border-primary/10 transition-all duration-200">
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-mono font-bold text-text-3 uppercase tracking-wider">Plan</span>
              <h3 className="font-heading text-lg font-bold text-text-1 mt-0.5">Free</h3>
            </div>
            
            <div className="flex items-baseline">
              <span className="font-heading text-3xl font-black text-text-1">₦0</span>
              <span className="text-text-2 text-xs font-semibold ml-1.5">forever</span>
            </div>
            
            <div className="w-full h-px bg-border/60" />
            
            <ul className="space-y-3 text-left">
              {freeFeatures.map((f, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs font-semibold">
                  {f.included ? (
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" strokeWidth={3} />
                  ) : (
                    <X className="h-4 w-4 text-text-3 shrink-0 mt-0.5" strokeWidth={3} />
                  )}
                  <span className={f.included ? 'text-text-2' : 'text-text-3 line-through'}>
                    {f.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full pt-4">
            <button 
              onClick={() => handleSelectPlan('free')}
              className="w-full h-11 border border-border bg-surface-alt hover:bg-surface text-text-1 font-bold rounded-xl text-xs transition duration-150 cursor-pointer"
            >
              Try it free →
            </button>
          </div>
        </div>

        {/* CARD 2 — PRO MONTHLY */}
        <div className="bg-surface border-2 border-primary rounded-2xl p-6 md:p-8 flex flex-col justify-between space-y-6 shadow-[0_0_24px_rgba(91,142,255,0.12)] relative overflow-hidden transition-all duration-200 transform md:-translate-y-2 md:scale-[1.02]">
          {/* Most Popular Badge */}
          <div className="absolute top-0 right-0 bg-primary text-white font-mono font-extrabold text-[8px] px-3.5 py-1 rounded-bl-xl uppercase tracking-wider shadow-sm flex items-center gap-1 z-10">
            <Sparkles className="h-2.5 w-2.5 fill-current" />
            <span>Most Popular</span>
          </div>

          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-wider">Plan</span>
              <h3 className="font-heading text-lg font-bold text-text-1 mt-0.5">Pro</h3>
            </div>
            
            <div className="flex items-baseline">
              <span className="font-heading text-3xl font-black text-text-1">₦4,500</span>
              <span className="text-text-2 text-xs font-semibold ml-1.5">/ month</span>
            </div>
            
            <div className="w-full h-px bg-border/60" />
            
            <ul className="space-y-3 text-left">
              {proFeatures.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs font-bold text-text-1">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" strokeWidth={3} />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full pt-4">
            <button 
              onClick={() => handleSelectPlan('monthly')}
              disabled={loadingPlan !== null}
              className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/95 hover:to-accent text-white font-extrabold rounded-xl text-xs shadow-[0_0_16px_rgba(91,142,255,0.3)] transition duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              {loadingPlan === 'monthly' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Initializing...</span>
                </>
              ) : (
                <span>Get Pro →</span>
              )}
            </button>
          </div>
        </div>

        {/* CARD 3 — PRO ANNUAL */}
        <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 flex flex-col justify-between space-y-6 shadow-sm hover:border-primary/10 transition-all duration-200">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-text-3 uppercase tracking-wider">Plan</span>
                <h3 className="font-heading text-lg font-bold text-text-1 mt-0.5">Pro Annual</h3>
              </div>
              <span className="text-[9px] bg-amber-500/10 text-amber-500 font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/25 uppercase tracking-wider animate-pulse-subtle">
                Save 16%
              </span>
            </div>
            
            <div className="flex items-baseline">
              <span className="font-heading text-3xl font-black text-text-1">₦45,000</span>
              <span className="text-text-2 text-xs font-semibold ml-1.5">/ year</span>
            </div>
            
            <div className="w-full h-px bg-border/60" />
            
            <ul className="space-y-3 text-left">
              {proFeatures.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs font-bold text-text-2">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" strokeWidth={3} />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full pt-4">
            <button 
              onClick={() => handleSelectPlan('annual')}
              disabled={loadingPlan !== null}
              className="w-full h-11 border border-border bg-surface-alt hover:bg-surface text-text-1 font-bold rounded-xl text-xs transition duration-150 cursor-pointer flex items-center justify-center gap-2"
            >
              {loadingPlan === 'annual' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Initializing...</span>
                </>
              ) : (
                <span>Get Pro Annual →</span>
              )}
            </button>
          </div>
        </div>

      </div>
    </section>
  )
}
