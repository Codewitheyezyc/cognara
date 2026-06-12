'use client'

import { Button } from '@/components/ui/button'

interface StepTimeProps {
  dailyMinutes: number
  onChange: (val: number) => void
  onNext: () => void
  onBack: () => void
}

const times = [
  {
    value: 15,
    title: '15 Minutes / day',
    tag: 'Casual',
    description: 'Bite-sized learning fits into any busy schedule.',
  },
  {
    value: 30,
    title: '30 Minutes / day',
    tag: 'Balanced',
    description: 'The sweet spot for active recall and steady progress. (Recommended)',
  },
  {
    value: 60,
    title: '1 Hour / day',
    tag: 'Serious',
    description: 'Deep focus sessions to rapidly build technical skills.',
  },
  {
    value: 120,
    title: '2+ Hours / day',
    tag: 'Intense',
    description: 'Full-time immersion for immediate career transitions.',
  },
]

export default function StepTime({ dailyMinutes, onChange, onNext, onBack }: StepTimeProps) {
  const handleNext = () => {
    if (!dailyMinutes) return
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <span className="text-xs font-mono uppercase tracking-wider text-accent">Step 4 of 4</span>
        <h2 className="font-heading text-3xl font-bold text-text-1">Daily time commitment?</h2>
        <p className="text-sm text-text-2">We use this to estimate the duration of your phases and roadmaps.</p>
      </div>

      <div className="space-y-3">
        {times.map((item) => {
          const isSelected = dailyMinutes === item.value
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
                <div className="flex items-center justify-between">
                  <span className={`font-semibold text-base ${isSelected ? 'text-primary' : 'text-text-1'}`}>
                    {item.title}
                  </span>
                  <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-sm border ${
                    isSelected 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-border bg-surface-alt text-text-2'
                  }`}>
                    {item.tag}
                  </span>
                </div>
                <span className="text-xs text-text-2 mt-2 leading-relaxed">
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
          disabled={!dailyMinutes}
          onClick={handleNext}
          className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white font-medium shadow-[0_0_16px_rgba(91,142,255,0.2)] disabled:opacity-50 rounded-sm"
        >
          Generate My Path
        </Button>
      </div>
    </div>
  )
}
