'use client'

import React from 'react'

export function HowItWorks() {
  return (
    <section id="how-it-works" className="space-y-12 py-20 md:py-28 scroll-mt-24">
      <div className="text-center space-y-3">
        <span className="text-xs font-mono uppercase text-primary font-bold tracking-wider">How it works</span>
        <h2 className="font-heading text-3xl font-extrabold text-text-1">A Blueprint Designed For Your Mind</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-surface border border-border rounded-[10px] space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center border border-primary/15 font-heading font-bold text-base">
              01
            </div>
            <h3 className="font-heading text-lg font-bold text-text-1">State Your Aspirations</h3>
            <p className="text-text-2 text-xs leading-relaxed">
              Enter any skill, domain, or subject you wish to master—from software engineering and marketing curves to culinary arts or language practice.
            </p>
          </div>
        </div>

        <div className="p-6 bg-surface border border-border rounded-[10px] space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-md bg-accent/10 text-accent flex items-center justify-center border border-accent/15 font-heading font-bold text-base">
              02
            </div>
            <h3 className="font-heading text-lg font-bold text-text-1">Dynamic Roadmap Partitioning</h3>
            <p className="text-text-2 text-xs leading-relaxed">
              Our compiler constructs a logical track of modules and milestones, creating lazy-generation lesson stubs ready for your studies.
            </p>
          </div>
        </div>

        <div className="p-6 bg-surface border border-border rounded-[10px] space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-md bg-success/10 text-success flex items-center justify-center border border-success/15 font-heading font-bold text-base">
              03
            </div>
            <h3 className="font-heading text-lg font-bold text-text-1">Adaptive Depth Loading</h3>
            <p className="text-text-2 text-xs leading-relaxed">
              Open any lesson stub. Toggle explanation layers from simplified analogies to heap memory compiler logic instantly.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
