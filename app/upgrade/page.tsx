'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Check, 
  X, 
  Zap, 
  Sparkles, 
  ShieldCheck, 
  HelpCircle, 
  ArrowLeft, 
  Lock, 
  Flame,
  Award,
  Crown,
  Laptop
} from 'lucide-react'

// Feature checklist items
const FEATURES = [
  { name: 'Active Learning Goals', free: '1 Goal at a time', pro: 'Unlimited Goals' },
  { name: 'Roadmap Generation', free: 'Standard (Phase 1 unlocked)', pro: 'All Phases Unlocked' },
  { name: 'Interactive Quizzes', free: 'Basic Quizzes only', pro: 'All Quiz Types + AI Writing Feedback' },
  { name: 'Practice Environments', free: 'None', pro: 'Full (Monaco Code + StackBlitz + AI Workspace)' },
  { name: 'Progress Analytics', free: 'No Page Access', pro: 'Full Dashboard & Insights' },
  { name: 'AI Coach Insights', free: 'None', pro: 'Dynamic Coach Cards' },
  { name: 'Depth Levels', free: 'Beginner Only', pro: 'All 5 Depth Levels (1 to 5)' },
  { name: 'Generation Priority', free: 'Standard', pro: 'Priority Generation Queue' },
]

const FAQS = [
  {
    q: 'Can I cancel my subscription anytime?',
    a: 'Absolutely. You can cancel your subscription at any time from your billing settings. Your access will remain active until the end of your billing cycle.'
  },
  {
    q: 'What happens to my progress if I downgrade?',
    a: 'Your progress history is always saved. If you downgrade, you will simply return to the Free plan limits (e.g. only Phase 1 & 2 first 2 lessons unlocked, and 1 active goal).'
  },
  {
    q: 'How does the billing simulator work in local dev?',
    a: 'For local development, you can use the Developer Sandbox section below to instantly simulate a successful checkout or cancel your subscription without entering credit card details.'
  },
  {
    q: 'Is there a money-back guarantee?',
    a: 'Yes, we offer a 14-day refund window if you are not fully satisfied with your Pro learning roadmap.'
  }
]

function UpgradePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // User States
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [tier, setTier] = useState<string>('free')
  const [status, setStatus] = useState<string>('inactive')
  const [loading, setLoading] = useState(true)
  const [redirectingPlan, setRedirectingPlan] = useState<string | null>(null)
  const [showComingSoon, setShowComingSoon] = useState(false)

  // Dev Simulation state
  const [simulating, setSimulating] = useState(false)

  // Selected billing interval ('monthly' or 'yearly')
  const initialPlan = searchParams.get('plan') === 'yearly' ? 'yearly' : 'monthly'
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>(initialPlan)

  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        setEmail(user.email || '')
        setUserId(user.id)

        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_tier, subscription_status')
          .eq('id', user.id)
          .maybeSingle()

        if (profile) {
          setTier(profile.subscription_tier || 'free')
          setStatus(profile.subscription_status || 'inactive')
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [supabase, router])

  const handleCheckout = async (interval: 'monthly' | 'yearly') => {
    // Payment gateway integration deferred for now. Show Coming Soon modal instead.
    setShowComingSoon(true)
  }

  // Developer simulation function
  const simulateUpgrade = async (newTier: 'pro_monthly' | 'pro_yearly' | 'free') => {
    setSimulating(true)
    try {
      const isProTier = newTier !== 'free'
      const statusValue = isProTier ? 'active' : 'inactive'
      
      const { error } = await supabase
        .from('profiles')
        .update({
          plan: isProTier ? 'pro' : 'free',
          subscription_tier: newTier,
          subscription_status: statusValue,
          subscription_start_date: isProTier ? new Date().toISOString() : null,
          subscription_end_date: isProTier ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null,
          lemonsqueezy_customer_id: isProTier ? 'sim_cust_12345' : null,
          lemonsqueezy_subscription_id: isProTier ? 'sim_sub_12345' : null
        })
        .eq('id', userId)

      if (error) throw error

      setTier(newTier)
      setStatus(statusValue)
      
      alert(`Developer Simulation: Profile tier successfully updated to ${newTier}!`)
      router.refresh()
    } catch (err: any) {
      console.error(err)
      alert(`Failed to simulate: ${err.message}`)
    } finally {
      setSimulating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--color-primary)]"></div>
          <p className="text-[var(--color-text-2)] text-sm font-mono">Loading pricing options...</p>
        </div>
      </div>
    )
  }

  const isUserPro = (tier === 'pro_monthly' || tier === 'pro_yearly') && status === 'active'

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Navigation Header */}
      <div className="max-w-6xl mx-auto flex items-center justify-between mb-12">
        <button 
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-sm text-[var(--color-text-3)] hover:text-[var(--color-text-1)] transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <div className="flex items-center gap-2">
          {isUserPro ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-[var(--color-primary)] border border-primary/20">
              <Crown size={12} />
              Pro Member ({tier === 'pro_yearly' ? 'Yearly' : 'Monthly'})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-border/40 text-[var(--color-text-3)] border border-border">
              Free Plan Active
            </span>
          )}
        </div>
      </div>

      {/* Main Pitch */}
      <div className="max-w-4xl mx-auto text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-accent-warm/15 text-[var(--color-accent-warm)] border border-accent-warm/20 mb-4 uppercase tracking-wider">
          <Sparkles size={12} className="animate-pulse" />
          Accelerate your skills
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-[var(--color-text-1)] tracking-tight">
          Unlock Unlimited Learning with Cognara Pro
        </h1>
        <p className="mt-4 text-lg text-[var(--color-text-2)] max-w-2xl mx-auto">
          Get access to personalized dynamic roadmaps, live practice environments, multi-goal learning paths, and instant AI coach analytics feedback.
        </p>

        {/* Plan Switcher */}
        <div className="mt-8 inline-flex items-center p-0.5 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)]">
          <button
            onClick={() => setBillingInterval('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              billingInterval === 'monthly'
                ? 'bg-[var(--color-surface)] text-[var(--color-text-1)] shadow-sm'
                : 'text-[var(--color-text-3)] hover:text-[var(--color-text-1)]'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('yearly')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
              billingInterval === 'yearly'
                ? 'bg-[var(--color-surface)] text-[var(--color-text-1)] shadow-sm'
                : 'text-[var(--color-text-3)] hover:text-[var(--color-text-1)]'
            }`}
          >
            Yearly
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-accent-warm)] text-white uppercase tracking-wide">
              Save 27%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {/* FREE PLAN */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 flex flex-col justify-between relative opacity-80">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-[var(--color-text-1)]">Free Tier</h3>
                <p className="text-xs text-[var(--color-text-3)] mt-1">Get started and sample the journey</p>
              </div>
              <span className="text-sm font-bold text-[var(--color-text-2)] px-2.5 py-1 rounded bg-[var(--color-surface-alt)] border border-[var(--color-border)]">
                Active
              </span>
            </div>
            
            <div className="flex items-baseline mb-6">
              <span className="text-4xl font-extrabold text-[var(--color-text-1)] font-mono">$0</span>
              <span className="text-sm text-[var(--color-text-3)] ml-2">forever</span>
            </div>

            <hr className="border-[var(--color-border)] mb-6" />

            <ul className="space-y-4">
              <li className="flex items-start gap-2.5 text-sm text-[var(--color-text-2)]">
                <Check size={16} className="text-[var(--color-success)] mt-0.5 flex-shrink-0" />
                <span>1 Active Learning Goal</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-[var(--color-text-2)]">
                <Check size={16} className="text-[var(--color-success)] mt-0.5 flex-shrink-0" />
                <span>Phase 1 fully unlocked (Lessons + Quizzes)</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-[var(--color-text-2)]">
                <Check size={16} className="text-[var(--color-success)] mt-0.5 flex-shrink-0" />
                <span>First 2 lessons of Phase 2 unlocked</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-[var(--color-text-3)] line-through">
                <X size={16} className="text-[var(--color-text-3)] mt-0.5 flex-shrink-0" />
                <span>Interactive Practice Sandbox (Monaco Code / Tasks)</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-[var(--color-text-3)] line-through">
                <X size={16} className="text-[var(--color-text-3)] mt-0.5 flex-shrink-0" />
                <span>Custom AI Writing Workspace with Feedback</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-[var(--color-text-3)] line-through">
                <X size={16} className="text-[var(--color-text-3)] mt-0.5 flex-shrink-0" />
                <span>Progress Analytics and Coach Insights</span>
              </li>
            </ul>
          </div>

          <div className="mt-8">
            <button
              disabled
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold border border-[var(--color-border)] text-[var(--color-text-3)] bg-[var(--color-surface-alt)] cursor-not-allowed text-center"
            >
              Current Plan
            </button>
          </div>
        </div>

        {/* PRO PLAN */}
        <div className="bg-[var(--color-surface)] border-2 border-[var(--color-primary)] rounded-2xl p-8 flex flex-col justify-between relative shadow-xl">
          {billingInterval === 'yearly' && (
            <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-[var(--color-accent-warm)] text-white text-[10px] font-bold tracking-wider px-3 py-1 rounded-full uppercase">
              Best Value
            </div>
          )}

          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-[var(--color-text-1)] flex items-center gap-1.5">
                  Cognara Pro
                  <Zap size={16} className="text-[var(--color-primary)] fill-current" />
                </h3>
                <p className="text-xs text-[var(--color-text-3)] mt-1">Unlimited learning without restrictions</p>
              </div>
              <span className="text-xs font-bold bg-primary/10 text-[var(--color-primary)] px-2.5 py-1 rounded border border-primary/20">
                Recommended
              </span>
            </div>

            <div className="flex items-baseline mb-6">
              <span className="text-5xl font-extrabold text-[var(--color-text-1)] font-mono">
                {billingInterval === 'yearly' ? '$79' : '$9'}
              </span>
              <span className="text-sm text-[var(--color-text-3)] ml-2">
                {billingInterval === 'yearly' ? '/ year' : '/ month'}
              </span>
            </div>

            <hr className="border-[var(--color-border)] mb-6" />

            <ul className="space-y-4">
              <li className="flex items-start gap-2.5 text-sm text-[var(--color-text-2)]">
                <Check size={16} className="text-[var(--color-success)] mt-0.5 flex-shrink-0" />
                <span><strong>Unlimited</strong> Active Goals & Roadmaps</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-[var(--color-text-2)]">
                <Check size={16} className="text-[var(--color-success)] mt-0.5 flex-shrink-0" />
                <span>All Phases & Lessons Unlocked Instantly</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-[var(--color-text-2)]">
                <Check size={16} className="text-[var(--color-success)] mt-0.5 flex-shrink-0" />
                <span>Full Interactive Practice Environment (Monaco Editor)</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-[var(--color-text-2)]">
                <Check size={16} className="text-[var(--color-success)] mt-0.5 flex-shrink-0" />
                <span>AI Writing Workspace with detailed paragraph feedback</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-[var(--color-text-2)]">
                <Check size={16} className="text-[var(--color-success)] mt-0.5 flex-shrink-0" />
                <span>Deep Progress Analytics + dynamic Coach Insights</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-[var(--color-text-2)]">
                <Check size={16} className="text-[var(--color-success)] mt-0.5 flex-shrink-0" />
                <span>Unlock all 5 learning depth levels</span>
              </li>
            </ul>
          </div>

          <div className="mt-8">
            {isUserPro ? (
              <button
                disabled
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold border border-[var(--color-primary)] text-[var(--color-primary)] bg-primary/10 cursor-default text-center"
              >
                Pro Plan Active
              </button>
            ) : (
              <button
                onClick={() => handleCheckout(billingInterval)}
                disabled={redirectingPlan !== null}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/95 shadow-md flex items-center justify-center gap-2 transition-all"
              >
                {redirectingPlan === billingInterval ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Redirecting to Lemonsqueezy...
                  </>
                ) : (
                  <>
                    Upgrade to Pro
                    <Sparkles size={14} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="max-w-4xl mx-auto mb-20 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-[var(--color-border)]">
          <h3 className="text-lg font-bold text-[var(--color-text-1)]">Compare Features</h3>
          <p className="text-xs text-[var(--color-text-3)] mt-0.5">See exactly what you get at each tier level</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-surface-alt)] border-b border-[var(--color-border)]">
                <th className="py-3 px-6 text-xs font-semibold text-[var(--color-text-3)] uppercase tracking-wider">Feature</th>
                <th className="py-3 px-6 text-xs font-semibold text-[var(--color-text-3)] uppercase tracking-wider">Free</th>
                <th className="py-3 px-6 text-xs font-semibold text-[var(--color-text-3)] uppercase tracking-wider">Pro Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] text-sm">
              {FEATURES.map((item, idx) => (
                <tr key={idx} className="hover:bg-[var(--color-surface-alt)]/40 transition-colors">
                  <td className="py-4 px-6 font-medium text-[var(--color-text-1)]">{item.name}</td>
                  <td className="py-4 px-6 text-[var(--color-text-2)]">{item.free}</td>
                  <td className="py-4 px-6 text-[var(--color-primary)] font-semibold">{item.pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto mb-20">
        <div className="text-center mb-10">
          <h3 className="font-heading text-2xl font-bold text-[var(--color-text-1)]">Frequently Asked Questions</h3>
          <p className="text-xs text-[var(--color-text-2)] mt-1">Got questions? We have answers</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FAQS.map((faq, idx) => (
            <div key={idx} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 shadow-sm">
              <h4 className="font-semibold text-sm text-[var(--color-text-1)] mb-2 flex items-center gap-1.5">
                <HelpCircle size={15} className="text-[var(--color-primary)]" />
                {faq.q}
              </h4>
              <p className="text-xs text-[var(--color-text-2)] leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Developer Sandbox Section */}
      <div className="max-w-4xl mx-auto p-6 bg-yellow-500/10 border-2 border-yellow-500/25 rounded-2xl">
        <h4 className="text-sm font-bold text-yellow-500 flex items-center gap-1.5 mb-2">
          <ShieldCheck size={16} />
          Developer Sandbox Control Panel
        </h4>
        <p className="text-xs text-[var(--color-text-2)] mb-4">
          Use these triggers to instantly mock database states. Excellent for manual testing without configuring real payment gateways.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => simulateUpgrade('pro_monthly')}
            disabled={simulating}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            Simulate Pro Monthly Upgrade
          </button>
          <button
            onClick={() => simulateUpgrade('pro_yearly')}
            disabled={simulating}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            Simulate Pro Yearly Upgrade
          </button>
          <button
            onClick={() => simulateUpgrade('free')}
            disabled={simulating}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            Reset Subscription (Revert to Free)
          </button>
        </div>
      </div>

      {showComingSoon && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '90%',
            maxWidth: '420px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '28px 24px',
            textAlign: 'center',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(91,142,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--color-primary)'
            }}>
              <Zap size={24} className="fill-current" />
            </div>
            <h3 style={{
              color: 'var(--color-text-1)',
              fontSize: '18px',
              fontWeight: 700,
              marginBottom: '8px',
              fontFamily: 'Sora, sans-serif'
            }}>
              Payment Coming Soon
            </h3>
            <p style={{
              color: 'var(--color-text-2)',
              fontSize: '14px',
              lineHeight: '1.6',
              margin: '0 0 20px'
            }}>
              Payment coming soon. We are setting up secure payment processing. Check back shortly.
            </p>
            <button
              onClick={() => setShowComingSoon(false)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--color-primary)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'Sora, sans-serif'
              }}
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function UpgradePage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--color-primary)]"></div>
          <p className="text-[var(--color-text-2)] text-sm font-mono animate-pulse">Loading checkout...</p>
        </div>
      </div>
    }>
      <UpgradePageContent />
    </React.Suspense>
  )
}
