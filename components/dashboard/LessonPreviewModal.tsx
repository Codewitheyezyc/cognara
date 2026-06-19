'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import { X, Lock, Sparkles, Check, Zap, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'

interface LessonPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  lessonTitle?: string
  lessonDescription?: string
  phaseNumber?: number
}

export function LessonPreviewModal({
  isOpen,
  onClose,
  lessonTitle,
  lessonDescription,
  phaseNumber
}: LessonPreviewModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [mounted, setMounted] = React.useState(false)
  const [loadingPlan, setLoadingPlan] = React.useState<'monthly' | 'annual' | null>(null)

  React.useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!isOpen || !mounted) return null

  const handleUpgrade = async (plan: 'monthly' | 'annual') => {
    try {
      setLoadingPlan(plan)
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          plan,
          cancelUrl: typeof window !== 'undefined' ? window.location.href : undefined
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.authorization_url) {
        throw new Error(data.error || 'Failed to initialize payment')
      }

      // Redirect to Paystack checkout page
      window.location.href = data.authorization_url
    } catch (err: any) {
      console.error('Checkout error:', err)
      toast(err.message || 'Unable to start checkout. Please try again.', 'error')
      setLoadingPlan(null)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn">
      {/* Modal Container */}
      <div 
        className="relative bg-surface border border-border rounded-2xl max-w-lg w-full overflow-hidden shadow-[0_0_50px_rgba(91,142,255,0.15)] flex flex-col animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Border glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-accent-warm" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-surface-alt/50 border border-border text-text-3 hover:text-text-1 hover:bg-surface-alt transition-all duration-150 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Content */}
        <div className="p-6 md:p-8 space-y-6">
          
          {/* Header block with Lock Icon */}
          <div className="flex items-center space-x-3 text-primary">
            <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-xl">
              <Lock className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-accent">Pro Member Feature</span>
              <h3 className="font-heading text-xl font-bold text-text-1">Unlock Learning Content</h3>
            </div>
          </div>

          {/* Lesson Metadata Display */}
          {lessonTitle && (
            <div className="bg-surface-alt/40 border border-border/60 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded font-bold">
                  {phaseNumber ? `Phase ${phaseNumber}` : 'Locked Lesson'}
                </span>
                <span className="text-[10px] text-text-3 font-medium">Locked</span>
              </div>
              <h4 className="font-heading text-base font-bold text-text-1">{lessonTitle}</h4>
              {lessonDescription && (
                <p className="text-xs text-text-2 leading-relaxed">{lessonDescription}</p>
              )}
            </div>
          )}

          {/* Value Propositions */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-text-3 font-semibold block">Included in Pro Plan:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-text-2">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-success flex-shrink-0" />
                <span>Unlock all lessons &amp; certificates</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-success flex-shrink-0" />
                <span>All 5 depth levels (Expert)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-success flex-shrink-0" />
                <span>Unlimited Confused explanations</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-success flex-shrink-0" />
                <span>Monaco &amp; StackBlitz workspaces</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-success flex-shrink-0" />
                <span>Progress &amp; analytics graphs</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-success flex-shrink-0" />
                <span>In-app lesson downloads</span>
              </div>
            </div>
          </div>

          <div className="border-t border-border/60 pt-6" />

          {/* Pricing Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Monthly Card */}
            <div className="border border-border/85 rounded-xl p-4 flex flex-col justify-between bg-surface-alt/20 hover:bg-surface-alt/40 transition duration-150">
              <div>
                <span className="text-[9px] uppercase font-mono tracking-wider text-text-3 font-bold block mb-1">Monthly Plan</span>
                <p className="text-lg font-bold text-text-1 font-mono">₦4,500<span className="text-xs text-text-3 font-normal font-sans">/mo</span></p>
                <p className="text-[10px] text-text-3 mt-1">Billed monthly, cancel anytime.</p>
              </div>
              <button
                onClick={() => handleUpgrade('monthly')}
                disabled={loadingPlan !== null}
                className="mt-3.5 w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-bold py-2 rounded-lg text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingPlan === 'monthly' ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Zap className="h-3 w-3 fill-current animate-pulse" />
                )}
                <span>{loadingPlan === 'monthly' ? 'Redirecting...' : 'Choose Monthly'}</span>
              </button>
            </div>

            {/* Annual Card */}
            <div className="border border-primary/35 rounded-xl p-4 flex flex-col justify-between bg-primary/5 hover:bg-primary/10 transition duration-150 relative overflow-hidden">
              {/* Save Badge */}
              <div className="absolute top-0 right-0 bg-accent text-white font-bold text-[8px] px-2 py-0.5 rounded-bl uppercase font-mono">
                Save 16%
              </div>
              <div>
                <span className="text-[9px] uppercase font-mono tracking-wider text-accent font-bold block mb-1">Annual Plan</span>
                <p className="text-lg font-bold text-text-1 font-mono">₦45,000<span className="text-xs text-text-3 font-normal font-sans">/yr</span></p>
                <p className="text-[10px] text-text-3 mt-1">Billed annually, best value.</p>
              </div>
              <button
                onClick={() => handleUpgrade('annual')}
                disabled={loadingPlan !== null}
                className="mt-3.5 w-full bg-primary hover:bg-primary/95 text-white font-bold py-2 rounded-lg text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer shadow-[0_0_10px_rgba(91,142,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingPlan === 'annual' ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Zap className="h-3 w-3 fill-current" />
                )}
                <span>{loadingPlan === 'annual' ? 'Redirecting...' : 'Choose Annual'}</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  )
}
