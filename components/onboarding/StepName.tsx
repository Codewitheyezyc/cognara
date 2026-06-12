'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface StepNameProps {
  name: string
  onChange: (val: string) => void
  onNext: () => void
}

export default function StepName({ name, onChange, onNext }: StepNameProps) {
  const [error, setError] = useState(false)

  const handleNext = () => {
    if (!name.trim()) {
      setError(true)
      return
    }
    setError(false)
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <span className="text-xs font-mono uppercase tracking-wider text-accent">Step 1 of 4</span>
        <h2 className="font-heading text-3xl font-bold text-text-1">First, what should we call you?</h2>
        <p className="text-sm text-text-2">We will personalize your lessons and daily coaching insights.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name" className="sr-only">Your Name</Label>
        <Input
          id="name"
          type="text"
          value={name}
          placeholder="Enter your name"
          onChange={(e) => {
            onChange(e.target.value)
            if (error) setError(false)
          }}
          className="h-12 border-border bg-surface-alt text-lg text-text-1 placeholder-text-3 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleNext()
          }}
          autoFocus
        />
        {error && <p className="text-xs text-error">Please tell us your name to continue.</p>}
      </div>

      <Button
        onClick={handleNext}
        className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium shadow-[0_0_16px_rgba(91,142,255,0.2)] rounded-sm"
      >
        Next Step
      </Button>
    </div>
  )
}
