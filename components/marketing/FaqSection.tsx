'use client'

import React, { useState } from 'react'
import { HelpCircle } from 'lucide-react'

const faqs = [
  {
    q: "Can I use Cognara to learn non-technical subjects?",
    a: "Yes! Cognara is designed to master any structured body of knowledge. Whether you are studying corporate finance, learning classical guitar, or practicing public speaking, our AI partitions the concepts, creates custom roadmaps, and adjusts explanations to your level."
  },
  {
    q: "How does Cognara know which depth level is right for me?",
    a: "During onboarding, you choose a preferred depth level. You can also change this at any time in your Settings or directly in the header of any active lesson. If a concept feels too complex or too basic, just toggle the depth to reload it immediately."
  },
  {
    q: "Does Cognara query the AI every time I load a page?",
    a: "No. Cognara uses a smart lazy-generation caching layer. The very first time you click a lesson on your roadmap, the AI compiles and structures it for your chosen depth. Once generated, it is cached in our secure database forever. This gives you instant loading times for future visits."
  },
  {
    q: "How are the daily streaks calculated?",
    a: "Your streak increases every calendar day you complete a quiz with a passing score of 60% or higher. Taking multiple quizzes on the same day maintains your streak but does not double-increment it, encouraging consistent, daily habits."
  }
]

export function FaqSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <section id="faq" className="space-y-12 py-20 md:py-28 scroll-mt-24">
      <div className="text-center space-y-3">
        <span className="text-xs font-mono uppercase text-primary font-bold tracking-wider">Got Questions?</span>
        <h2 className="font-heading text-3xl font-extrabold text-text-1">Frequently Asked Questions</h2>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openFaq === idx
          return (
            <div
              key={idx}
              className="bg-surface border border-border rounded-[10px] transition-all duration-200"
            >
              <button
                onClick={() => setOpenFaq(isOpen ? null : idx)}
                type="button"
                className="w-full text-left p-5 flex items-center justify-between font-heading font-bold text-sm text-text-1 hover:text-primary transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                <HelpCircle className={`h-4 w-4 text-text-3 transition-transform ${isOpen ? 'rotate-180 text-primary' : ''}`} />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs text-text-2 leading-relaxed border-t border-border/30">
                  {faq.a}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
