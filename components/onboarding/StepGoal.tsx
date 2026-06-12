'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface StepGoalProps {
  goalText: string
  subject: string
  onGoalChange: (val: string) => void
  onSubjectChange: (val: string) => void
  onNext: () => void
  onBack: () => void
}

const suggestions = [
  { label: 'React Frontend Development', subject: 'React Frontend' },
  { label: 'Business Strategy & Marketing', subject: 'Business Strategy' },
  { label: 'Creative Writing & Storytelling', subject: 'Creative Writing' },
  { label: 'Public Speaking & Presentation', subject: 'Public Speaking' },
  { label: 'UI/UX Product Design', subject: 'UI/UX Design' },
]

export default function StepGoal({
  goalText,
  subject,
  onGoalChange,
  onSubjectChange,
  onNext,
  onBack,
}: StepGoalProps) {
  const [error, setError] = useState(false)

  const handleNext = () => {
    if (!goalText.trim() || !subject.trim()) {
      setError(true)
      return
    }
    setError(false)
    onNext()
  }

  const handleSuggestionClick = (label: string, subj: string) => {
    onGoalChange(label)
    onSubjectChange(subj)
    setError(false)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <span className="text-xs font-mono uppercase tracking-wider text-accent">Step 2 of 4</span>
        <h2 className="font-heading text-3xl font-bold text-text-1">What do you want to master?</h2>
        <p className="text-sm text-text-2">Be specific! For example, &quot;I want to become a frontend engineer.&quot;</p>
      </div>

      <div className="space-y-4">
        {/* Goal Text Input */}
        <div className="space-y-1">
          <Label htmlFor="goal" className="text-xs font-medium text-text-2 uppercase tracking-wider">
            Your Learning Goal
          </Label>
          <textarea
            id="goal"
            value={goalText}
            placeholder="e.g. I want to build web apps with React and Next.js"
            onChange={(e) => {
              onGoalChange(e.target.value)
              if (error) setError(false)
            }}
            className="w-full min-h-[90px] p-3 border border-border bg-surface-alt text-sm text-text-1 placeholder-text-3 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm resize-none outline-none"
            autoFocus
          />
        </div>

        {/* Subject/Category Input */}
        <div className="space-y-1">
          <Label htmlFor="subject" className="text-xs font-medium text-text-2 uppercase tracking-wider">
            Primary Subject
          </Label>
          <Input
            id="subject"
            type="text"
            value={subject}
            placeholder="e.g. Frontend Development"
            onChange={(e) => {
              onSubjectChange(e.target.value)
              if (error) setError(false)
            }}
            className="h-10 border-border bg-surface-alt text-text-1 placeholder-text-3 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm"
          />
        </div>

        {error && (
          <p className="text-xs text-error">Please fill in both your learning goal and subject.</p>
        )}

        {/* Suggestions chips */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-text-2 uppercase tracking-wider">Popular Suggestions:</span>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleSuggestionClick(item.label, item.subject)}
                className="px-3 py-1.5 text-xs bg-surface-alt hover:bg-border border border-border hover:border-text-2 text-text-2 hover:text-text-1 rounded-full transition-all duration-150 cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex space-x-3 mt-6">
        <Button
          type="button"
          onClick={onBack}
          className="flex-1 h-11 bg-transparent hover:bg-surface-alt text-text-1 border border-border rounded-sm transition duration-150"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white font-medium shadow-[0_0_16px_rgba(91,142,255,0.2)] rounded-sm"
        >
          Next Step
        </Button>
      </div>
    </div>
  )
}
