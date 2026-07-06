'use client'

import React, { useState } from 'react'

const faqs = [
  {
    question: "What is Cognara?",
    answer: "Cognara is a learning app that builds a personal plan for anything you want to learn. You tell us your goal — like becoming a developer or learning marketing — and we create a step by step path just for you. Then we help you stay on track every day until you get there."
  },
  {
    question: "How is Cognara different from watching tutorials online?",
    answer: "Tutorials give you content but no direction. You have to figure out what to watch next and hope you are learning the right things. Cognara builds your full learning plan first, teaches you in the right order, tests what you understood, and checks in when you go quiet. It remembers where you stopped and picks up from there."
  },
  {
    question: "Do I need any experience to start?",
    answer: "Not at all. When you sign up you tell Cognara your level — complete beginner, some knowledge, or already know the basics. Every lesson is built to match exactly where you are. You will never feel lost or overwhelmed."
  },
  {
    question: "What can I learn on Cognara?",
    answer: "Almost anything. Social media marketing, web development, business strategy, data analysis, UI design, finance, languages, and much more. You type your goal and Cognara figures out the rest."
  },
  {
    question: "Is Cognara a mobile app?",
    answer: "Cognara works on any phone or computer through your browser. You can also install it on your phone like a regular app with no app store needed. On iPhone open the site in Safari and tap Add to Home Screen. On Android open in Chrome and tap the three dots then Add to Home Screen."
  },
  {
    question: "What is the free plan?",
    answer: "The free plan lets you start one learning goal, go through the first phase, take quizzes, and chat with Spark — our AI mentor — up to 5 times a day. It is completely free and you do not need a card to sign up."
  },
  {
    question: "What does Pro give me that free does not?",
    answer: "Pro removes all the limits. You can learn as many things as you want, go as deep as you want, get a certificate when you finish each phase, download lessons to read offline, and chat with Spark as much as you need. Pro is ₦4,500 per month or ₦45,000 per year."
  },
  {
    question: "What is Spark?",
    answer: "Spark is your AI mentor inside Cognara. If something in a lesson does not make sense just ask Spark and it will explain it a different way. Spark also checks in when you have not logged in for a while and helps you get back on track."
  },
  {
    question: "What happens to my progress if I stop for a while?",
    answer: "Nothing disappears. Your roadmap, lessons, quizzes, points, and certificates are always saved. You can come back after a week or a month and pick up exactly where you left off. Cognara will even send you a reminder to come back."
  },
  {
    question: "Can I cancel my Pro plan anytime?",
    answer: "Yes. You can cancel with one click from your profile page. No questions and no penalties. If you just need a break you can also pause your plan for a month instead of cancelling — no charge during the pause and your progress stays safe."
  },
  {
    question: "Will I get a certificate when I finish?",
    answer: "Yes. Pro users get a shareable certificate when they complete each learning phase and another one when they finish their full goal. You can download it and share it on LinkedIn to show what you have achieved."
  },
  {
    question: "Is Cognara only for people in Nigeria?",
    answer: "Cognara started in Nigeria but is open to anyone anywhere. Nigerian users pay in Naira via Paystack. International users can pay in USD. The learning content works for anyone regardless of where they are."
  },
  {
    question: "I have a question that is not here. How do I reach you?",
    answer: "Send us an email at hello@cognaralearn.com and we will get back to you. We are a small team and we actually read every message."
  }
]

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="max-w-3xl mx-auto px-4 py-20 scroll-mt-24">
      <div className="text-center mb-12">
        <h2 className="text-text-1 font-bold text-3xl mb-3">
          Questions people ask us
        </h2>
        <p className="text-text-2">
          Cannot find what you are looking for? Email us at hello@cognaralearn.com
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-card border border-border rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(
                openIndex === index ? null : index
              )}
              className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-surface-alt/10 transition"
            >
              <span className="text-text-1 font-medium">
                {faq.question}
              </span>
              <span className="text-text-3 text-xl flex-shrink-0 font-light select-none">
                {openIndex === index ? '−' : '+'}
              </span>
            </button>

            {openIndex === index && (
              <div className="px-6 pb-5 border-t border-border">
                <p className="text-text-2 leading-relaxed pt-4 font-semibold">
                  {faq.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
