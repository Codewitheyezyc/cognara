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
 
const autocompleteSubjects = [
  'React Frontend Development',
  'Next.js Web Development',
  'Python Programming',
  'UI/UX Product Design',
  'WAEC Mathematics',
  'JAMB English Language',
  'Chemistry for Beginners',
  'Public Speaking & Presentation',
  'Creative Writing & Storytelling',
  'Baking & Pastry Arts',
  'Fashion Design & Tailoring',
  'Personal Finance & Budgeting',
  'Time Management & Productivity',
  'Digital Marketing & SEO',
  'Data Science & Analytics',
  'Spanish Language Basics',
  'Beginning Acoustic Guitar',
  'Photography & Composition'
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
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0)

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

  const handleSubjectChange = (val: string) => {
    onSubjectChange(val)
    if (error) setError(false)
    if (val.trim()) {
      const filtered = autocompleteSubjects.filter(item =>
        item.toLowerCase().includes(val.toLowerCase())
      )
      setFilteredSuggestions(filtered)
      setShowSuggestions(true)
      setActiveSuggestionIndex(0)
    } else {
      setFilteredSuggestions(autocompleteSubjects)
      setShowSuggestions(true)
      setActiveSuggestionIndex(0)
    }
  }

  const handleSubjectFocus = () => {
    const val = subject
    if (val.trim()) {
      const filtered = autocompleteSubjects.filter(item =>
        item.toLowerCase().includes(val.toLowerCase())
      )
      setFilteredSuggestions(filtered)
    } else {
      setFilteredSuggestions(autocompleteSubjects)
    }
    setShowSuggestions(true)
    setActiveSuggestionIndex(0)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveSuggestionIndex((prev) => 
        prev < filteredSuggestions.length - 1 ? prev + 1 : 0
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveSuggestionIndex((prev) => 
        prev > 0 ? prev - 1 : filteredSuggestions.length - 1
      )
    } else if (e.key === 'Enter') {
      e.preventDefault()
      onSubjectChange(filteredSuggestions[activeSuggestionIndex])
      setShowSuggestions(false)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
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

        {/* Subject/Category Input with Autocomplete */}
        <div className="space-y-1 relative">
          <Label htmlFor="subject" className="text-xs font-medium text-text-2 uppercase tracking-wider">
            Primary Subject
          </Label>
          <Input
            id="subject"
            type="text"
            value={subject}
            placeholder="e.g. Frontend Development"
            onChange={(e) => handleSubjectChange(e.target.value)}
            onFocus={handleSubjectFocus}
            onBlur={() => {
              // Delay slightly so that mouseDown click registers before menu unmounts
              setTimeout(() => setShowSuggestions(false), 200)
            }}
            onKeyDown={handleKeyDown}
            className="h-10 border-border bg-surface-alt text-text-1 placeholder-text-3 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm"
            disabled={isValidating}
            autoComplete="off"
          />

          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-surface border border-border rounded-sm shadow-xl max-h-56 overflow-y-auto z-50 animate-fadeIn">
              {filteredSuggestions.map((suggestion, index) => (
                <div
                  key={suggestion}
                  onMouseDown={(e) => {
                    e.preventDefault() // Prevents input blur from firing before selection click
                    onSubjectChange(suggestion)
                    setShowSuggestions(false)
                    setError(false)
                  }}
                  className={`px-4 py-2 text-sm cursor-pointer transition-colors duration-150 ${
                    index === activeSuggestionIndex
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-text-1 hover:bg-surface-alt'
                  }`}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
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
