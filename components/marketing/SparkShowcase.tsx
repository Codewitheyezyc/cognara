'use client'

import React, { useState } from 'react'
import { Spark } from '@/components/mascot/Spark'

export function SparkShowcase() {
  const [sparkEmotion, setSparkEmotion] = useState<'wave' | 'happy' | 'celebrate' | 'thinking' | 'idle'>('wave')

  return (
    <div className="py-20 md:py-28">
      <section className="bg-surface border border-border rounded-[12px] p-6 md:p-8 space-y-8 shadow-md relative overflow-hidden">
        <div className="absolute left-0 top-0 w-36 h-36 rounded-full bg-accent/5 blur-2xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

          {/* Spark mascot column */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-surface-alt border border-border/60 rounded-[8px] min-h-[300px] relative">
            <div className="mb-6 flex justify-center items-center w-full">
              <Spark emotion={sparkEmotion} size={120} />
            </div>

            <div className="w-full space-y-3">
              <span className="text-[10px] font-mono text-text-3 uppercase tracking-wider block text-center">Tap to Change Spark's Emotion</span>
              <div className="flex flex-wrap gap-2 justify-center">
                {(['wave', 'happy', 'celebrate', 'thinking', 'idle'] as const).map((emotion) => (
                  <button
                    key={emotion}
                    onClick={() => setSparkEmotion(emotion)}
                    type="button"
                    className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold capitalize transition-all cursor-pointer border ${sparkEmotion === emotion
                      ? 'border-primary bg-primary/10 text-primary shadow-[0_0_12px_rgba(91,142,255,0.15)]'
                      : 'border-border bg-surface text-text-2 hover:text-text-1'
                      }`}
                  >
                    {emotion}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content Column */}
          <div className="lg:col-span-7 space-y-6">
            <span className="text-xs font-mono uppercase text-accent font-bold tracking-wider">Meet the Mascot</span>
            <h3 className="font-heading text-3xl font-extrabold text-text-1 leading-tight">
              Spark: Your Responsive, CSS-Animated Study Companion
            </h3>
            <p className="text-text-2 text-xs sm:text-sm leading-relaxed">
              Learning is a journey, and we believe it deserves an emotional, engaging companion. Spark is constructed entirely from CSS and SVG layers (no static images) ensuring crisp, responsive presentation on any size screen:
            </p>

            <ul className="space-y-3">
              {[
                { title: "Friendly Welcome Greetings", desc: "Spark greets you inside the dashboard and helps you initialize your onboarding goals." },
                { title: "Confetti Completing Celebrations", desc: "When you mark a lesson as complete, Spark celebrates with confetti and tracks your streak." },
                { title: "Adaptive Quiz Dial Score Response", desc: "Cheering you for scoring high, thinking alongside you, or encouraging a retry." },
                { title: "Toast Milestone Slide-ins", desc: "Celebrating 3, 7, 14, and 30 day habit milestones to help maintain your momentum." }
              ].map((item, idx) => (
                <li key={idx} className="flex items-start text-xs text-text-2">
                  <span className="h-2 w-2 rounded-full bg-accent mr-3 mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-text-1">{item.title}</span> — {item.desc}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
