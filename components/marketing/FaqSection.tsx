'use client'

import React, { useState } from 'react'
import { HelpCircle } from 'lucide-react'

const faqs = [
  {
    q: "Can I use Cognara to learn non-technical subjects?",
    a: "Yes! You can use Cognara to learn anything you want. Whether you are studying finance, learning guitar, or practicing public speaking, we build a simple path for you and teach you at your own pace."
  },
  {
    q: "How does Cognara know which depth level is right for me?",
    a: "When you sign up, you pick how deep you want to go. You can change this at any time. If a lesson feels too hard or too easy, you can click a button to change it instantly."
  },
  {
    q: "Does Cognara query the server every time I load a page?",
    a: "No. We save your lessons the first time you load them. This means the next time you open a lesson, it loads instantly without making you wait."
  },
  {
    q: "How are the daily streaks calculated?",
    a: "Your streak grows every day you pass a quiz with a score of 60% or more. Taking more quizzes on the same day keeps your streak going but does not add extra days. We want to help you build a daily learning habit."
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
