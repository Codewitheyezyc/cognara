'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface StepLearningStyleProps {
  onChange: (val: {
    prefers: string
    confusion_style: string
    pace: string
    motivation: string
    challenge: string
  }) => void
  onNext: () => void
  onBack: () => void
}

const questions = [
  {
    id: 'prefers',
    question: 'When you encounter a new concept, what helps most?',
    options: [
      { label: 'Read a clear explanation first', value: 'explanation_first' },
      { label: 'See a real example before anything else', value: 'examples_first' },
      { label: 'Try doing it myself immediately', value: 'doing_first' },
      { label: 'Have it compared to something I already know', value: 'analogy_first' }
    ]
  },
  {
    id: 'confusion_style',
    question: 'When you hit something confusing, you prefer to:',
    options: [
      { label: 'Re-read it slowly until it clicks', value: 're_read' },
      { label: 'Skip ahead and come back later', value: 'skip_ahead' },
      { label: 'Look for a different explanation', value: 'different_explanation' },
      { label: 'Take a break and return fresh', value: 'take_break' }
    ]
  },
  {
    id: 'pace',
    question: 'Your ideal lesson length is:',
    options: [
      { label: 'Short and focused — under 10 minutes', value: 'short' },
      { label: 'Medium — 10 to 20 minutes', value: 'medium' },
      { label: 'Detailed — take as long as needed', value: 'detailed' },
      { label: 'Flexible — depends on the topic', value: 'flexible' }
    ]
  },
  {
    id: 'motivation',
    question: 'What motivates you most to keep learning?',
    options: [
      { label: 'Seeing my progress and streak', value: 'streak' },
      { label: 'Getting good quiz scores', value: 'quiz_scores' },
      { label: 'Finishing phases and earning badges', value: 'badges' },
      { label: 'Feeling genuinely skilled at something', value: 'skill_gain' }
    ]
  },
  {
    id: 'challenge',
    question: 'Your biggest challenge with learning in the past has been:',
    options: [
      { label: 'Losing motivation after a few days', value: 'motivation' },
      { label: 'Not knowing where to start', value: 'starting' },
      { label: 'Getting bored with repetitive content', value: 'boredom' },
      { label: 'Not having time to study consistently', value: 'consistency' }
    ]
  }
]

export default function StepLearningStyle({ onChange, onNext, onBack }: StepLearningStyleProps) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selections, setSelections] = useState<string[]>([])

  const handleSelect = (val: string) => {
    const nextSelections = [...selections]
    nextSelections[currentIdx] = val
    setSelections(nextSelections)

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1)
    } else {
      // 5th question is selected, submit and move next
      onChange({
        prefers: nextSelections[0],
        confusion_style: nextSelections[1],
        pace: nextSelections[2],
        motivation: nextSelections[3],
        challenge: nextSelections[4]
      })
      onNext()
    }
  }

  const handleBack = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1)
    } else {
      onBack()
    }
  }

  const q = questions[currentIdx]
  const progressPercent = Math.round(((currentIdx + 1) / questions.length) * 100)

  return (
    <div className="space-y-6">
      {/* Header and Progress Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-accent">
            Question {currentIdx + 1} of 5
          </span>
          <span className="text-xs font-mono text-text-3">{progressPercent}%</span>
        </div>
        <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300 rounded-full" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <h2 className="font-heading text-2xl font-bold text-text-1">How do you learn best?</h2>
        <p className="text-xs text-text-2">
          Answer these quick questions so Cognara can personalise every lesson structure for you.
        </p>
      </div>

      {/* Current Question */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-text-1">{q.question}</h3>
        <div className="grid grid-cols-1 gap-2.5">
          {q.options.map((opt) => {
            const isSelected = selections[currentIdx] === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full text-left p-3.5 rounded-md border bg-surface-alt hover:bg-border transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'border-primary ring-1 ring-primary/45 bg-surface'
                    : 'border-border'
                }`}
              >
                <span className={`text-xs font-semibold ${isSelected ? 'text-primary' : 'text-text-1'}`}>
                  {opt.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex space-x-3 mt-6">
        <Button
          type="button"
          onClick={handleBack}
          className="flex-1 h-10 bg-transparent hover:bg-surface-alt text-text-1 border border-border rounded-sm transition duration-150"
        >
          Back
        </Button>
      </div>
    </div>
  )
}
