'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Check, Sparkles } from 'lucide-react'

export function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')

  return (
    <section id="pricing" className="py-20 md:py-28 animate-page-enter scroll-mt-24">
      <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
        <span className="inline-flex items-center px-3 py-1 border border-accent/20 bg-accent/5 text-accent text-xs font-mono font-bold uppercase tracking-widest rounded-full">
          Flexible Plans
        </span>
        <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-text-1">
          Simple, Transparent Pricing
        </h2>
        <p className="text-text-2 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
          Start learning for free and upgrade to Pro whenever you need unlimited goals, academic-grade depth levels, and offline reading.
        </p>

        {/* Monthly / Annual Toggle */}
        <div className="flex items-center justify-center pt-4">
          <div className="bg-surface border border-border p-1 rounded-lg flex items-center gap-1">
            <button
              type="button"
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                billingPeriod === 'monthly'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-2 hover:text-text-1'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod('annual')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                billingPeriod === 'annual'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-2 hover:text-text-1'
              }`}
            >
              <span>Annual</span>
              <span className="text-[9px] bg-accent-warm text-black font-mono font-bold px-1 rounded-sm uppercase tracking-wide">Save 16%</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
        {/* Card 1: Free Tier */}
        <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 flex flex-col justify-between space-y-8 relative overflow-hidden transition-all hover:border-border-hover">
          <div className="space-y-6">
            <div>
              <h3 className="font-heading text-lg font-bold text-text-1">Free Tier</h3>
              <p className="text-text-2 text-xs mt-1">Perfect for trying out Cognara's personalized roadmaps.</p>
            </div>
            <div className="flex items-baseline">
              <span className="font-heading text-3xl font-extrabold text-text-1">₦0</span>
              <span className="text-text-2 text-xs ml-1.5 font-semibold">/ forever</span>
            </div>
            <div className="w-full h-px bg-border/60" />
            <ul className="space-y-3.5 text-xs text-text-2">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success shrink-0" strokeWidth={2.5} />
                <span>1 Active Learning Goal</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success shrink-0" strokeWidth={2.5} />
                <span>Beginner Depth Level Only (Level 2)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success shrink-0" strokeWidth={2.5} />
                <span>Standard AI Lesson Generation</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success shrink-0" strokeWidth={2.5} />
                <span>Interactive Practice Quizzes</span>
              </li>
            </ul>
          </div>
          <Link href="/signup" className="w-full">
            <button className="w-full py-3 border border-border hover:bg-surface-alt font-bold rounded-lg text-xs transition duration-150 cursor-pointer text-text-1">
              Get Started For Free
            </button>
          </Link>
        </div>

        {/* Card 2: Pro Tier */}
        <div className="bg-gradient-to-br from-surface via-surface to-primary/5 border-2 border-primary rounded-2xl p-6 md:p-8 flex flex-col justify-between space-y-8 relative overflow-hidden shadow-[0_0_24px_rgba(91,142,255,0.08)]">
          <div className="absolute top-0 right-0 h-4 bg-primary text-white font-mono font-bold text-[9px] px-3 flex items-center rounded-bl-lg uppercase tracking-wider">
            Most Popular
          </div>
          <div className="space-y-6">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-5 w-5 text-primary fill-current" />
              <h3 className="font-heading text-lg font-bold text-text-1">Pro Access</h3>
            </div>
            <p className="text-text-2 text-xs mt-1">Unlock the full power of adaptive, offline AI learning.</p>
            <div className="flex items-baseline">
              <span className="font-heading text-3xl font-extrabold text-text-1">
                {billingPeriod === 'monthly' ? '₦4,500' : '₦45,000'}
              </span>
              <span className="text-text-2 text-xs ml-1.5 font-semibold">
                {billingPeriod === 'monthly' ? '/ month' : '/ year'}
              </span>
            </div>
            <div className="w-full h-px bg-border/60" />
            <ul className="space-y-3.5 text-xs text-text-2">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" strokeWidth={2.5} />
                <span className="font-bold text-text-1">Everything in Free Tier</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" strokeWidth={2.5} />
                <span className="font-semibold text-text-1">Unlimited Active Learning Goals</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" strokeWidth={2.5} />
                <span>All 5 Cognitive Depths (from Lvl 1 to Expert)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" strokeWidth={2.5} />
                <span>AI Explanations ("Confused?" Study Helper)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" strokeWidth={2.5} />
                <span className="font-semibold text-text-1">Full PWA Offline Downloads Shelf</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" strokeWidth={2.5} />
                <span>Monaco Code Playground & AI Writing Workspaces</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" strokeWidth={2.5} />
                <span>Milestone Badge Certificates Download</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" strokeWidth={2.5} />
                <span>AI Coach Insights Trajectory & Study Vitals</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" strokeWidth={2.5} />
                <span>Streak Activity Calendar Heatmap</span>
              </li>
            </ul>
          </div>
          <Link href="/signup" className="w-full">
            <button className="w-full py-3 bg-primary hover:bg-primary/95 text-white font-bold rounded-lg text-xs transition duration-150 cursor-pointer shadow-[0_0_12px_rgba(91,142,255,0.25)] hover:scale-[1.02] active:scale-[0.98]">
              Start 7-Day Free Trial
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}
