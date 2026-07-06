'use client'

import React from 'react'

export function ProblemSection() {
  const cards = [
    {
      icon: '🌀',
      text: 'You start learning something new but stop after two weeks.'
    },
    {
      icon: '📑',
      text: 'You have too many open tabs and do not know where to start.'
    },
    {
      icon: '🤖',
      text: 'You asked AI to teach you, but it gave you too much info.'
    }
  ]

  return (
    <section className="py-16 md:py-24 text-center max-w-5xl mx-auto px-4 border-t border-border/40 mt-6">
      {/* Section Headline */}
      <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-text-1 tracking-tight">
        Sound familiar?
      </h2>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className="bg-surface border border-border rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-sm hover:border-primary/30 transition-all duration-200"
          >
            {/* Large Prominent Icon */}
            <span className="text-5xl md:text-6xl select-none">
              {card.icon}
            </span>
            {/* Relatable Text */}
            <p className="text-text-2 text-sm sm:text-base leading-relaxed font-semibold">
              {card.text}
            </p>
          </div>
        ))}
      </div>

      {/* Closing Line */}
      <p className="text-lg sm:text-xl font-extrabold text-text-1 mt-12 tracking-tight">
        Cognara is the system that fixes all three.
      </p>
    </section>
  )
}
