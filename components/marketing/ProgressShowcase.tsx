'use client'

import React from 'react'
import { Flame } from 'lucide-react'

export function ProgressShowcase() {
  return (
    <div className="py-20 md:py-28">
      <section className="bg-surface border border-border rounded-[12px] p-6 md:p-8 space-y-8 shadow-md">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

          {/* Visual Dashboard Card Mockup */}
          <div className="lg:col-span-6 space-y-4 order-last lg:order-first">
            <div className="p-5 bg-surface-alt border border-border/80 rounded-[8px] space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center space-x-2">
                  <Flame className="h-4 w-4 text-accent-warm fill-current" />
                  <span className="text-[10px] font-mono text-text-1 font-bold">12-DAY STUDY STREAK</span>
                </div>
                <span className="text-[9px] font-mono text-text-3">ANALYTICS ENGINE</span>
              </div>
              {/* Visual Heatmap Mock */}
              <div className="space-y-2">
                <div className="text-[8px] font-mono text-text-3 uppercase">Activity Calendar</div>
                <div className="flex gap-1">
                  {[1, 2, 0, 3, 1, 0, 2, 3, 3, 1, 2, 0, 1, 3, 2, 0, 1].map((val, i) => {
                    let color = 'bg-border/40'
                    if (val === 1) color = 'bg-primary/25'
                    if (val === 2) color = 'bg-primary/50'
                    if (val === 3) color = 'bg-primary'
                    return <div key={i} className={`w-3.5 h-3.5 rounded-sm ${color}`} />
                  })}
                </div>
              </div>
              {/* AI Coach card Mock */}
              <div className="border-l-[3px] border-accent bg-accent/5 p-3.5 rounded-r-[8px] space-y-1">
                <span className="text-[8px] font-mono text-accent font-bold uppercase tracking-wider">AI Coach Insight</span>
                <p className="text-[10px] text-text-1 leading-normal">
                  You're doing great! Your quiz accuracy trajectory is at 88%. You mastered Customer Acquisition Cost calculations today. Continue to LTV ratios tomorrow.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-mono uppercase text-primary font-bold tracking-wider">Analytics & Coach</span>
            <h3 className="font-heading text-3xl font-extrabold text-text-1 leading-tight">
              Streaks, Heatmaps, and Personalized Insights.
            </h3>
            <p className="text-text-2 text-xs sm:text-sm leading-relaxed">
              Stay motivated with interactive vitals metrics. Cognara logs your daily studies and quiz scores, generating a GitHub-style activity heatmap, score charts, and direct coach feedback to highlight strengths and recommend reviews.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
