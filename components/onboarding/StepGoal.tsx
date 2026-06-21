'use client'
 
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Loader2, AlertCircle } from 'lucide-react'
 
interface StepGoalProps {
  goalText: string
  subject: string
  onGoalChange: (val: string) => void
  onSubjectChange: (val: string) => void
  onNext: () => void
  onBack: () => void
  safetyError?: string | null
  isValidating?: boolean
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
  safetyError = null,
  isValidating = false,
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
            disabled={isValidating}
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
            disabled={isValidating}
          />
        </div>
 
        {error && (
          <p className="text-xs text-error">Please fill in both your learning goal and subject.</p>
        )}
 
        {/* Safety Rejection UI Panel */}
        {safetyError && (
          <div className="bg-error/5 border border-error/20 border-l-[3px] border-l-error rounded-[10px] p-4 mt-3 animate-fadeIn flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-error font-semibold text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>This goal is not available on Cognara</span>
            </div>
            <div className="text-text-2 text-xs leading-relaxed">
              {safetyError}
            </div>
            <div className="border-t border-border/40 my-1" />
            <div className="text-text-3 text-[11px] leading-relaxed">
              Cognara is for learning skills, academic subjects, and professional development. Try goals like:
              <div className="mt-1.5 text-[10px] text-primary font-medium flex flex-wrap gap-1">
                <span>&quot;Learn Mathematics for WAEC&quot;</span> · 
                <span>&quot;Learn Web Development&quot;</span> · 
                <span>&quot;Improve my English&quot;</span> · 
                <span>&quot;Learn Digital Marketing&quot;</span>
              </div>
            </div>
          </div>
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
                disabled={isValidating}
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
          disabled={isValidating}
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white font-medium shadow-[0_0_16px_rgba(91,142,255,0.2)] rounded-sm flex items-center justify-center gap-1.5"
          disabled={isValidating}
        >
          {isValidating && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
          <span>{isValidating ? 'Validating...' : 'Next Step'}</span>
        </Button>
      </div>
    </div>
  )
}
