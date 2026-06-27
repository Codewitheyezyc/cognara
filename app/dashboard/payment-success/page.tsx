'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Trophy, CheckCircle2, ChevronRight, BarChart3, Rocket, Compass, Zap } from 'lucide-react'
import { Spark } from '@/components/mascot/Spark'
import { SoundEffects } from '@/lib/sound'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const plan = searchParams.get('plan') || 'monthly'

  useEffect(() => {
    // Play celebratory sound on mount
    SoundEffects.play('achievement')

    // Clean up session storage pending plan
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('pending_plan')
    }

    async function verifyAndLoad() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle()
          setProfile(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    verifyAndLoad()
  }, [supabase])

  const handleContinue = () => {
    // Force route refresh and go to dashboard (will redirect to onboarding if needed)
    router.push('/dashboard')
    router.refresh()
  }

  const features = [
    { icon: Compass, title: 'Adaptive Learning Path', desc: 'Custom AI roadmaps designed around your unique background and timeline.' },
    { icon: BarChart3, title: 'Advanced Analytics Dashboard', desc: 'Track your quiz scores, strengths, weaknesses, and activity heatmap.' },
    { icon: Zap, title: 'Speedrun Mode & Advanced Quests', desc: 'Fast-paced diagnostic trivia challenges and high-value weekly achievements.' },
    { icon: Rocket, title: 'Unlimited Study & Projects', desc: 'Infinite hearts, in-depth coding sandboxes, and full certificate generation.' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-text-3 font-mono">Unlocking Pro access...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg text-text-1 flex items-center justify-center p-4 sm:p-6 md:p-12 relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-xl w-full bg-surface border border-border/80 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl flex flex-col items-center text-center space-y-8 relative overflow-hidden animate-page-enter">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-accent to-amber-500" />
        
        {/* Celebrating Mascot */}
        <div className="relative mt-2">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-28 h-28 flex items-center justify-center bg-primary/5 border border-primary/20 rounded-full shadow-[0_0_32px_rgba(91,142,255,0.15)] animate-float-subtle">
            <Spark emotion="happy" size={80} />
          </div>
          <span className="absolute -bottom-1 -right-1 text-3xl animate-bounce">🎉</span>
        </div>

        {/* Header Message */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase bg-primary/15 border border-primary/25 text-primary px-3 py-1 rounded-full font-bold inline-flex items-center gap-1">
            <Trophy className="h-3 w-3 text-primary animate-pulse" />
            Upgrade Successful
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-black text-text-1 tracking-tight">
            Welcome to Cognara Pro!
          </h1>
          <p className="text-text-2 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
            Thank you for subscribing to Cognara Pro {plan === 'annual' ? 'Annual' : 'Monthly'}. Your billing is fully active, and your account is upgraded.
          </p>
        </div>

        {/* Locked features now unlocked list */}
        <div className="w-full text-left space-y-4 pt-2">
          <span className="text-[10px] font-bold text-text-3 uppercase tracking-wider block font-mono">
            Your Pro Benefits:
          </span>
          <div className="grid grid-cols-1 gap-3">
            {features.map((feat, idx) => {
              const Icon = feat.icon
              return (
                <div key={idx} className="flex gap-3.5 p-3.5 bg-surface-alt/40 border border-border/60 rounded-2xl transition duration-150 hover:bg-surface-alt/80">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-text-1 flex items-center gap-1.5">
                      {feat.title}
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    </h4>
                    <p className="text-[11px] text-text-2 leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Primary CTA */}
        <button
          onClick={handleContinue}
          className="w-full h-13 bg-gradient-to-r from-primary to-accent hover:from-primary/95 hover:to-accent/95 text-white font-extrabold rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-2 text-sm hover:scale-[1.01] active:scale-[0.99] transition-all duration-150"
        >
          <span>Begin Your Path</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
