'use client'

import React from 'react'
import { Check, X } from 'lucide-react'

export function ComparisonSection() {
  const otherTools = [
    'They answer your question right now',
    'They forget who you are when you close the tab',
    'They leave you to figure out what to learn next',
    'They do not show how far you have come',
    'No one checks on you when you stop',
    'Good for quick answers, but not for finishing a big goal'
  ]

  const cognaraTools = [
    'We build your entire learning path',
    'We remember exactly where you left off',
    'You get a step-by-step path from start to finish',
    'We track your lessons, quizzes, and points',
    'Spark checks in to help you stay on track',
    'We are built to help you reach your goal'
  ]

  return (
    <section className="py-16 md:py-24 max-w-5xl mx-auto px-4 border-t border-border/40 scroll-mt-24">
      {/* Headline */}
      <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-text-1 tracking-tight text-center">
        Why Cognara is different
      </h2>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 items-stretch">
        {/* Left Column - Other Tools */}
        <div className="bg-surface-alt/20 border border-border/60 rounded-2xl p-6 md:p-8 space-y-6 flex flex-col justify-between opacity-80">
          <div className="space-y-4">
            <h3 className="font-heading text-lg font-bold text-text-2">
              Other tools
            </h3>
            <ul className="space-y-4">
              {otherTools.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-text-3 font-semibold">
                  <X className="h-4 w-4 text-text-3/60 shrink-0 mt-0.5" strokeWidth={3} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column - Cognara */}
        <div className="bg-surface border-2 border-primary rounded-2xl p-6 md:p-8 space-y-6 flex flex-col justify-between shadow-[0_0_24px_rgba(91,142,255,0.08)] relative overflow-hidden">
          {/* Ambient background glow inside card */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 pointer-events-none" />
          
          <div className="relative space-y-4 z-10">
            <h3 className="font-heading text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Cognara
            </h3>
            <ul className="space-y-4">
              {cognaraTools.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-text-1 font-bold">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" strokeWidth={3} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Closing Line */}
      <p className="text-base sm:text-lg font-extrabold text-text-1 mt-12 text-center tracking-tight">
        Other tools give you answers. We show you the way.
      </p>
    </section>
  )
}
