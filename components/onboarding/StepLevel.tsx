'use client'

import { Button } from '@/components/ui/button'

interface StepLevelProps {
  level: string
  onChange: (val: string) => void
  onNext: () => void
  onBack: () => void
}

const levels = [
  {
    value: 'beginner',
    title: 'Beginner',
    description: 'I am starting from scratch. Teach me the foundational concepts and terminology.',
  },
  {
    value: 'intermediate',
    title: 'Some knowledge',
    description: 'I understand the basics. Skip the entry-level theory and focus on practical applications.',
  },
  {
    value: 'advanced',
    title: 'Advanced',
    description: 'I have solid experience. Dive straight into advanced architectures and edge cases.',
  },
]

export default function StepLevel({ level, onChange, onNext, onBack }: StepLevelProps) {
  const handleNext = () => {
    if (!level) return
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <span className="text-xs font-mono uppercase tracking-wider text-accent">Step 3 of 4</span>
        <h2 className="font-heading text-3xl font-bold text-text-1">What is your current level?</h2>
        <p className="text-sm text-text-2">We will calibrate the depth and vocabulary of your lessons.</p>
      </div>

      <div className="space-y-3">
        {levels.map((item) => {
          const isSelected = level === item.value
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange(item.value)}
              className={`w-full text-left p-4 rounded-md border bg-surface-alt hover:bg-border transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'border-primary ring-1 ring-primary/45 bg-surface'
                  : 'border-border'
              }`}
            >
              <div className="flex flex-col">
                <span className={`font-semibold text-base ${isSelected ? 'text-primary' : 'text-text-1'}`}>
                  {item.title}
                </span>
                <span className="text-xs text-text-2 mt-1 leading-relaxed">
                  {item.description}
                </span>
              </div>
            </button>
          )
        })}
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
          disabled={!level}
          onClick={handleNext}
          className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white font-medium shadow-[0_0_16px_rgba(91,142,255,0.2)] disabled:opacity-50 rounded-sm"
        >
          Next Step
        </Button>
      </div>
    </div>
  )
}
