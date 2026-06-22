'use client'

import React from 'react'
import { Check } from 'lucide-react'

export function RichLayouts() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-20 md:py-28">
      <div className="space-y-6">
        <span className="text-xs font-mono uppercase text-primary font-bold tracking-wider">Rich Layout Engine</span>
        <h3 className="font-heading text-3xl font-extrabold text-text-1 leading-tight">
          Lessons Must Not Be Walls of Text.
        </h3>
        <p className="text-text-2 text-xs sm:text-sm leading-relaxed">
          Every concept requires the correct pedagogical representation. Cognara's layout engine dynamically injects custom structural blocks to ensure concepts click immediately:
        </p>

        <ul className="space-y-3">
          {[
            { title: "Monaco Code Practice Playgrounds", desc: "Live code editor with syntax highlighting for hands-on technical lessons (HTML/CSS/JS)." },
            { title: "AI Soft-Skills Writing Workspaces", desc: "Advanced text area with instant, context-aware AI feedback for paragraph assignments." },
            { title: "Actionable Task Checklists", desc: "Visual, step-by-step guides for practical offline training exercises." },
            { title: "Interactive Spark Mascot Greetings", desc: "A CSS/SVG animated AI companion that celebrates your study wins and habit streaks." },
            { title: "Progressive Subscription Paywalls", desc: "Freemium plan layout options and structured limits tailored for active goals." },
            { title: "Colored Context Callouts", desc: "Important, Warning, Tip, and Pro Tip callouts highlighting critical concepts." }
          ].map((item, idx) => (
            <li key={idx} className="flex items-start text-xs text-text-2">
              <Check className="h-4 w-4 text-success mr-2.5 flex-shrink-0 mt-0.5" strokeWidth={3} />
              <div>
                <span className="font-bold text-text-1">{item.title}</span> — {item.desc}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Graphical representation grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-surface border border-border rounded-[10px] space-y-2 shadow-sm">
          <span className="text-[8px] font-mono text-accent">TIP CALLOUT</span>
          <div className="text-xs font-bold text-text-1">💡 Focus on Payback Periods</div>
          <p className="text-[10px] text-text-2 leading-relaxed">When analyzing CAC, prioritize payback periods. A low CAC is risky if payback takes over 12 months.</p>
        </div>

        <div className="p-4 bg-surface border border-border rounded-[10px] space-y-3 shadow-sm">
          <span className="text-[8px] font-mono text-accent">DIAGRAM BLOCK</span>
          <pre className="text-[9px] font-mono text-text-2 leading-tight">
            {`[Target Audience]
   └── conversion 
         └── [Acquired User]`}</pre>
        </div>

        <div className="p-4 bg-surface border border-border rounded-[10px] space-y-2 shadow-sm col-span-2">
          <span className="text-[8px] font-mono text-accent">COMPARISON TABLE</span>
          <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
            <div className="p-2 bg-error/5 border border-error/15 text-error rounded-sm">❌ High CAC (Sales heavy)</div>
            <div className="p-2 bg-success/5 border border-success/15 text-success rounded-sm">✅ Low CAC (Word of Mouth)</div>
          </div>
        </div>
      </div>
    </section>
  )
}
