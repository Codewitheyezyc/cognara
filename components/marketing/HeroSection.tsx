'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Spark } from '@/components/mascot/Spark'
import { CheckCircle2, Lock } from 'lucide-react'

export function HeroSection() {
  const supabase = createClient()
  const router = useRouter()
  const [userCount, setUserCount] = useState<number | null>(null)

  const handleGetStartedClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      router.push('/dashboard')
    } else {
      router.push('/signup')
    }
  }
  
  // Animation states
  const [activeStep, setActiveStep] = useState(0)
  const [typedGoal, setTypedGoal] = useState('')
  const targetGoal = 'Become a Social Media Strategist'

  useEffect(() => {
    async function fetchUserCount() {
      try {
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
        if (!error && count !== null) {
          setUserCount(count)
        }
      } catch (err) {
        console.error('Error fetching user count:', err)
      }
    }
    fetchUserCount()
  }, [supabase])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3)
    }, 4500) // 4.5 seconds per step
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (activeStep === 0) {
      let currentText = ''
      let charIndex = 0
      setTypedGoal('')
      const typeInterval = setInterval(() => {
        if (charIndex < targetGoal.length) {
          currentText += targetGoal.charAt(charIndex)
          setTypedGoal(currentText)
          charIndex++
        } else {
          clearInterval(typeInterval)
        }
      }, 70) // type a character every 70ms
      return () => clearInterval(typeInterval)
    }
  }, [activeStep])

  const learnersCount = userCount !== null ? userCount : 41

  return (
    <section className="flex flex-col items-center justify-center py-16 md:py-24 text-center max-w-4xl mx-auto">
      {/* 1. Badge / Top line */}
      <div className="inline-flex items-center px-3.5 py-1 border border-primary/20 bg-primary/5 text-primary text-xs font-mono font-bold uppercase tracking-wider rounded-full mb-6">
        Built with AI to help you grow
      </div>

      {/* 2. Headline */}
      <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold text-text-1 tracking-tight leading-[1.1] max-w-3xl mx-auto">
        Tell us your goal. <br className="hidden sm:inline" />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">We build your path.</span>
      </h1>

      {/* 3. Subheadline */}
      <p className="text-text-2 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto mt-6">
        Choose anything you want to learn. We build a simple daily plan that matches your level and helps you stay on track every day.
      </p>

      {/* 4. CTA and Social Proof */}
      <div className="flex flex-col items-center justify-center gap-3.5 mt-8 w-full max-w-md mx-auto px-4 z-10">
        <button
          onClick={handleGetStartedClick}
          className="w-full h-13 px-8 inline-flex items-center justify-center rounded-xl font-extrabold text-base bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white shadow-[0_0_24px_rgba(91,142,255,0.3)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          Build My Free Learning Plan →
        </button>
        <span className="text-[11px] text-text-3 font-bold uppercase tracking-wider">
          Join {learnersCount} learners already on their path
        </span>
      </div>

      {/* 5. Hero Visual (Clean Animated Mockup) */}
      <div className="w-full max-w-2xl mx-auto mt-14 relative px-4 w-full">
        {/* Ambient background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl blur-3xl pointer-events-none z-0" />
        
        {/* Mockup Frame */}
        <div className="relative z-10 bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden min-h-[460px] sm:min-h-[400px] flex flex-col transition-all duration-300">
          {/* Browser header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg/55 select-none">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <div className="text-[9px] sm:text-[10px] font-mono text-text-3 font-bold tracking-wider sm:tracking-widest uppercase">
              {activeStep === 0 && 'STEP 1: CHOOSE YOUR GOAL'}
              {activeStep === 1 && 'STEP 2: GET YOUR PATH'}
              {activeStep === 2 && 'STEP 3: START LEARNING'}
            </div>
            <div className="w-10" /> {/* spacer to balance controls */}
          </div>

          {/* Mockup Content Area */}
          <div className="flex-1 p-4 sm:p-6 flex flex-col justify-center relative bg-surface-alt/10">
            
            {/* STEP 1: Text Input with Typing Animation */}
            <div 
              className={`w-full max-w-md mx-auto space-y-4 sm:space-y-6 transition-all duration-500 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-4 sm:px-6 ${
                activeStep === 0 ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
              }`}
            >
              <div className="text-center space-y-1.5">
                <h4 className="text-sm sm:text-base font-extrabold text-text-1">What do you want to learn?</h4>
                <p className="text-[11px] sm:text-xs text-text-2">Tell us your goal. We will build your personal path.</p>
              </div>
              <div className="space-y-3">
                <div className="relative h-11 sm:h-13 w-full bg-surface border border-border rounded-xl px-4 flex items-center shadow-inner text-left">
                  <span className="text-text-1 text-xs sm:text-sm font-semibold">
                    {typedGoal}
                  </span>
                  <span className="w-[2px] h-4 sm:h-5 bg-primary ml-1 animate-pulse" />
                </div>
                <button
                  type="button"
                  className="w-full h-10 sm:h-12 bg-primary text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-default select-none shadow-sm opacity-90"
                >
                  Build My Path →
                </button>
              </div>
            </div>

            {/* STEP 2: Roadmap Appears with Phases */}
            <div 
              className={`w-full max-w-md mx-auto space-y-3 sm:space-y-4 transition-all duration-500 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-4 sm:px-6 ${
                activeStep === 1 ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
              }`}
            >
              <div className="text-left space-y-0.5">
                <h4 className="text-xs sm:text-sm font-extrabold text-text-1">Your Path: Social Media Strategist</h4>
                <p className="text-[9px] sm:text-[10px] text-text-3 font-mono">Estimated completion: 6 weeks at 30m/day</p>
              </div>
              
              <div className="space-y-2 sm:space-y-3">
                {/* Phase 1 (Active) */}
                <div className="p-2.5 sm:p-3.5 bg-surface border border-border rounded-xl space-y-2 sm:space-y-2.5 shadow-sm text-left">
                  <div className="flex items-center justify-between border-b border-border/40 pb-1 sm:pb-1.5">
                    <span className="text-xs font-bold text-text-1">Phase 1: Foundations of Content</span>
                    <span className="text-[8px] sm:text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>
                  </div>
                  <div className="space-y-1 sm:space-y-1.5 pl-0.5">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-text-2">
                      <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400 shrink-0" />
                      <span>Audience Personas & Channels</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-text-2">
                      <div className="h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full border-2 border-border flex items-center justify-center shrink-0" />
                      <span>Copywriting & Storytelling</span>
                    </div>
                  </div>
                </div>

                {/* Phase 2 (Locked) */}
                <div className="p-2.5 sm:p-3.5 bg-surface/40 border border-border/40 rounded-xl flex items-center justify-between opacity-60 text-left">
                  <span className="text-xs font-bold text-text-3">Phase 2: Growth & Advertising</span>
                  <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-text-3" />
                </div>

                {/* Phase 3 (Locked) */}
                <div className="p-2.5 sm:p-3.5 bg-surface/40 border border-border/40 rounded-xl flex items-center justify-between opacity-60 text-left">
                  <span className="text-xs font-bold text-text-3">Phase 3: Brand Mastery & Analytics</span>
                  <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-text-3" />
                </div>
              </div>
            </div>

            {/* STEP 3: First Lesson Opens */}
            <div 
              className={`w-full max-w-lg mx-auto space-y-3 sm:space-y-4 transition-all duration-500 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-4 sm:px-6 ${
                activeStep === 2 ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
              }`}
            >
              {/* Lesson Header */}
              <div className="flex items-center justify-between border-b border-border/60 pb-1.5 sm:pb-2">
                <div className="text-left">
                  <span className="text-[8px] sm:text-[9px] font-mono text-text-3 uppercase tracking-wider block">Phase 1 · Module 1.1</span>
                  <h4 className="text-xs sm:text-sm font-extrabold text-text-1">Audience Personas & Channels</h4>
                </div>
                <span className="text-[9px] sm:text-[10px] font-semibold text-text-3">5 min read</span>
              </div>

              {/* Lesson Content Area */}
              <div className="space-y-2 sm:space-y-3 text-left">
                {/* Scroll progress bar */}
                <div className="w-full bg-border h-1 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-primary to-accent h-full w-[60%] rounded-full" />
                </div>
                
                <div className="space-y-1 sm:space-y-2">
                  <p className="text-[11px] sm:text-xs text-text-2 leading-relaxed font-medium">
                    To design high-converting content, you must first define your target audience personas. Who are they? What are their pain points? Which channels do they spend their time on?
                  </p>
                  <p className="text-[11px] sm:text-xs text-text-2 leading-relaxed font-medium hidden sm:block">
                    Start by selecting a primary social channel (e.g., LinkedIn for B2B professionals, Instagram or TikTok for consumers).
                  </p>
                </div>

                {/* Spark Mascot Bubble */}
                <div className="flex items-start gap-2 sm:gap-2.5 bg-primary/5 border border-primary/20 rounded-xl p-2.5 sm:p-3 mt-2 sm:mt-4">
                  <div className="shrink-0 p-1 bg-surface border border-border rounded-lg shadow-sm">
                    <Spark emotion="wave" size={20} />
                  </div>
                  <div className="space-y-0.5 text-left">
                    <span className="text-[8px] sm:text-[9px] font-mono font-bold text-primary uppercase tracking-wider block">Spark (AI Mentor)</span>
                    <p className="text-[10px] sm:text-[11px] text-text-2 leading-relaxed font-semibold">
                      &ldquo;Choose one channel first. Master it before expanding. Focus beats volume!&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
