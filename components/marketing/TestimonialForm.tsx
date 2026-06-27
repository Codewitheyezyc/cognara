'use client'

import React, { useState } from 'react'
import { Star } from 'lucide-react'

interface TestimonialFormProps {
  moment: 'phase_complete' | 'goal_complete'
  learningGoal: string
  onComplete: () => void
  onDismiss: () => void
}

export function TestimonialForm({ moment, learningGoal, onComplete, onDismiss }: TestimonialFormProps) {
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [text, setText] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastInitial, setLastInitial] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !firstName.trim() || !lastInitial.trim()) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/testimonials/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_initial: lastInitial,
          learning_goal: learningGoal || 'My Learning Goal',
          testimonial_text: text,
          star_rating: rating
        })
      })

      if (res.ok) {
        setSubmitted(true)
        setTimeout(() => {
          onComplete()
        }, 2200)
      }
    } catch (err) {
      console.error('Error submitting testimonial', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="p-6 bg-surface border border-border rounded-2xl text-center space-y-3 mt-4 animate-page-enter">
        <div className="text-2xl select-none">🎉</div>
        <h4 className="text-xs font-bold text-text-1">Thank you for sharing!</h4>
        <p className="text-text-2 text-xs">Your words will help inspire future learners.</p>
      </div>
    )
  }

  const promptText = moment === 'phase_complete'
    ? 'Would you share what this phase meant to you? Your words could inspire someone who is exactly where you were on Day 1.'
    : 'You did it. Would you tell your story?'

  const placeholderLabel = moment === 'phase_complete'
    ? 'What did you achieve in this phase?'
    : 'What did Cognara help you achieve?'

  const submitText = moment === 'phase_complete'
    ? 'Share my experience'
    : 'Share my story'

  const dismissText = moment === 'phase_complete'
    ? 'Maybe later'
    : 'Skip for now'

  return (
    <form onSubmit={handleSubmit} className="p-5 bg-surface border border-border rounded-2xl space-y-4 text-left mt-4 animate-page-enter max-w-sm w-full mx-auto shadow-lg z-[1002]">
      <div className="space-y-1">
        <h4 className="text-xs font-bold text-text-1 uppercase tracking-wide text-primary">Inspirational Impact</h4>
        <p className="text-text-2 text-xs leading-relaxed font-semibold">{promptText}</p>
      </div>

      {/* Star Rating Selector */}
      <div className="flex items-center gap-1.5 py-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="focus:outline-none transition-transform active:scale-95 cursor-pointer"
          >
            <Star
              className={`h-5 w-5 transition ${
                (hoverRating || rating) >= star
                  ? 'text-amber-500 fill-amber-500'
                  : 'text-text-3'
              }`}
            />
          </button>
        ))}
      </div>

      {/* Name Input */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-text-3 uppercase tracking-wider">First Name</label>
          <input
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="e.g. Sarah"
            className="w-full h-10 px-3 bg-surface-alt border border-border rounded-lg text-xs text-text-1 focus:border-primary focus:outline-none font-semibold"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-text-3 uppercase tracking-wider">Last Initial</label>
          <input
            type="text"
            required
            maxLength={1}
            value={lastInitial}
            onChange={(e) => setLastInitial(e.target.value)}
            placeholder="e.g. O"
            className="w-full h-10 px-3 bg-surface-alt border border-border rounded-lg text-xs text-text-1 focus:border-primary focus:outline-none font-semibold"
          />
        </div>
      </div>

      {/* Testimonial Text Area */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-text-3 uppercase tracking-wider">{placeholderLabel}</label>
        <textarea
          required
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your experience here..."
          className="w-full p-3 bg-surface-alt border border-border rounded-lg text-xs text-text-1 focus:border-primary focus:outline-none resize-none leading-relaxed font-semibold"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onDismiss}
          disabled={isSubmitting}
          className="text-xs text-text-3 hover:text-text-2 font-bold px-1 py-2 cursor-pointer disabled:opacity-50"
        >
          {dismissText}
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !text.trim() || !firstName.trim() || !lastInitial.trim()}
          className="h-10 px-5 bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? 'Sharing...' : submitText}
        </button>
      </div>
    </form>
  )
}
