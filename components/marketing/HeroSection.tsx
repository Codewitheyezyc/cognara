'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-20 md:py-28">
      <div className="lg:col-span-7 space-y-6 text-left">
        <span className="inline-flex items-center px-3 py-1 border border-accent/20 bg-accent/5 text-accent text-xs font-mono font-bold uppercase tracking-widest rounded-full">
          Your mind. Your path. Your era.
        </span>
        <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold text-text-1 tracking-tight leading-[1.05]">
          Master Anything. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Calibrated to You.</span>
        </h1>
        <p className="text-text-2 text-sm sm:text-base leading-relaxed max-w-xl">
          Cognara is an AI Learning Operating System. We dynamically compile your learning goals into logical roadmaps, rendering rich lesson layouts and adaptive quiz challenges engineered around your personal schedule and explanation depth.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto h-12 px-8 inline-flex items-center justify-center rounded-lg font-bold text-sm bg-primary hover:bg-primary-hover text-white shadow-[0_0_20px_rgba(91,142,255,0.3)] transition-all duration-150 hover:-translate-y-0.5"
          >
            <span>Start Learning For Free</span>
            <ArrowRight className="ml-2 h-4 w-4" strokeWidth={2.5} />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto h-12 px-8 inline-flex items-center justify-center rounded-lg font-bold text-sm border border-border bg-surface hover:bg-surface-alt text-text-1 transition-all duration-150"
          >
            Sign In to Dashboard
          </Link>
        </div>
      </div>

      {/* Hero Visual Card (Visual Showcase Mockup) */}
      <div className="lg:col-span-5 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-[12px] blur-xl pointer-events-none" />
        <div className="relative bg-surface border border-border rounded-[12px] p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-error" />
              <span className="w-3 h-3 rounded-full bg-accent-warm" />
              <span className="w-3 h-3 rounded-full bg-success" />
            </div>
            <span className="text-[9px] font-mono text-text-3">ROADMAP CONFIGURATION</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-2">Target Goal</span>
              <span className="text-xs text-text-1 font-semibold">Business Finance & Strategy</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-2">Study Schedule</span>
              <span className="text-xs text-text-1 font-semibold">30 minutes / day</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-2">Subject Area</span>
              <span className="text-xs text-text-1 font-semibold">Corporate Economics</span>
            </div>
          </div>
          <div className="p-3 bg-surface-alt border border-border/60 rounded-[8px] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-accent font-bold">COMPILING CURRICULUM</span>
              <span className="text-[10px] font-mono text-text-3">100%</span>
            </div>
            <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-full rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
