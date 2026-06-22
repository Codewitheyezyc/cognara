'use client'

import React from 'react'

export function DashboardPreview() {
  return (
    <section className="space-y-6 animate-page-enter py-20 md:py-28">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-mono uppercase text-accent font-bold tracking-wider">Product Tour</span>
        <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-text-1">A Clean, Focused Learning OS</h2>
        <p className="text-text-2 text-xs sm:text-sm">
          Manage your milestones, track learning vitals, and receive custom coach insights inside a responsive dashboard.
        </p>
      </div>

      <div className="relative rounded-[16px] border border-border bg-surface p-2 shadow-2xl overflow-hidden group max-w-5xl mx-auto">
        {/* Ambient background glow */}
        <div className="absolute -inset-10 bg-gradient-to-r from-primary/10 to-accent/10 rounded-[24px] blur-3xl pointer-events-none opacity-50 group-hover:opacity-75 transition-opacity duration-500" />

        <div className="relative rounded-[12px] overflow-hidden border border-border/60">
          <img
            src="/images/dashboard-light.png"
            alt="Cognara Dashboard Light Mode"
            className="w-full h-auto block dark:hidden object-cover transition-all duration-700 ease-out group-hover:scale-[1.005]"
          />
          <img
            src="/images/dashboard-dark.png"
            alt="Cognara Dashboard Dark Mode"
            className="w-full h-auto hidden dark:block object-cover transition-all duration-700 ease-out group-hover:scale-[1.005]"
          />
        </div>
      </div>
    </section>
  )
}
