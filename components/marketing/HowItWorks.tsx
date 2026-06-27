'use client'

import React from 'react'
import Link from 'next/link'
import { Target, Map, Bot, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function HowItWorks() {
  const steps = [
    {
      icon: <Target className="h-6 w-6 text-primary" />,
      title: 'Tell Cognara your goal',
      description: 'Anything from becoming a developer to mastering business strategy to passing your professional exams.'
    },
    {
      icon: <Map className="h-6 w-6 text-accent" />,
      title: 'Get your personalised roadmap',
      description: 'Cognara builds a structured path from where you are today to where you want to be — in under 60 seconds.'
    },
    {
      icon: <Bot className="h-6 w-6 text-primary" />,
      title: 'Learn with an AI mentor that remembers you',
      description: 'Daily lessons at your exact level. Quizzes that test real understanding. Spark adapts when you struggle and celebrates when you succeed.'
    }
  ]

  return (
    <section id="how-it-works" className="py-16 md:py-24 text-center max-w-5xl mx-auto px-4 border-t border-border/40 scroll-mt-24">
      {/* Headline */}
      <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-text-1 tracking-tight">
        Three steps to your goal
      </h2>

      {/* Steps Flow Container */}
      <div className="flex flex-col md:flex-row items-stretch justify-between gap-6 mt-12 relative">
        {steps.map((step, idx) => (
          <React.Fragment key={idx}>
            {/* Step Card */}
            <div className="flex-1 bg-surface border border-border rounded-2xl p-6 md:p-8 flex flex-col items-center text-center space-y-4 shadow-sm hover:border-primary/30 transition-all duration-200">
              {/* Icon Container */}
              <div className="w-12 h-12 rounded-xl bg-surface-alt border border-border flex items-center justify-center shadow-sm">
                {step.icon}
              </div>
              
              {/* Title & Description */}
              <div className="space-y-2">
                <h3 className="font-heading text-base sm:text-lg font-bold text-text-1">
                  {step.title}
                </h3>
                <p className="text-text-2 text-xs sm:text-sm leading-relaxed font-semibold">
                  {step.description}
                </p>
              </div>
            </div>

            {/* Connecting Arrow on Desktop (except last item) */}
            {idx < steps.length - 1 && (
              <div className="hidden md:flex items-center justify-center text-text-3 shrink-0 self-center">
                <ArrowRight className="h-5 w-5 animate-pulse-subtle" strokeWidth={2.5} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* CTA Button */}
      <div className="mt-12">
        <Link href="/signup">
          <Button
            className="h-12 px-8 bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white font-extrabold rounded-xl shadow-[0_0_20px_rgba(91,142,255,0.25)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 text-sm cursor-pointer"
          >
            See it work — Start free
          </Button>
        </Link>
      </div>
    </section>
  )
}
