'use client'

import { Button } from '@/components/ui/button'

interface StepDepthProps {
  depth: number
  onChange: (val: number) => void
  onNext: () => void
  onBack: () => void
}

const depthLevels = [
  {
    value: 0,
    title: "Like I'm 6",
    description: "For young children — very simple, fun, visual explanations, ages 6-9",
    preview: "Think of a variable like a small labeled box. If you put a toy inside and write 'my_toy' on it, you can find it easily later!",
  },
  {
    value: 1,
    title: "Like I'm 10",
    description: "Simple words, fun analogies, no jargon",
    preview: "A variable is like a labeled box where you store something — like writing your name on a lunchbox.",
  },
  {
    value: 2,
    title: "Beginner",
    description: "Plain English, no assumed knowledge, step-by-step explanations, everyday analogies",
    preview: "A variable is a named container that holds a value you can use later in your code.",
  },
  {
    value: 3,
    title: "Intermediate",
    description: "Proper terminology, assumes basic concepts are known, explains the 'why' behind things",
    preview: "Variables are named references to memory locations that store values, with scope and mutability determined by how they're declared.",
  },
  {
    value: 4,
    title: "Advanced",
    description: "Technical depth, edge cases, best practices, trade-offs, industry-standard patterns",
    preview: "Variables in JavaScript have function or block scope depending on declaration keyword, with hoisting behavior that differs between var, let, and const.",
  },
  {
    value: 5,
    title: "Expert",
    description: "Assumes strong foundational knowledge, covers nuance, performance, theory, and expert-level context",
    preview: "Variable declarations involve the creation phase of the execution context, where identifiers are registered in the scope chain with specific binding behaviors determined by their declaration type.",
  },
]

export default function StepDepth({ depth, onChange, onNext, onBack }: StepDepthProps) {
  const handleLevelClick = (value: number) => {
    onChange(value)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <span className="text-xs font-mono uppercase tracking-wider text-accent">Step 4 of 5</span>
        <h2 className="font-heading text-3xl font-bold text-text-1">How do you want lessons explained?</h2>
        <p className="text-sm text-text-2">Calibration of the depth and explanation style for all future topics.</p>
      </div>

      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
        {depthLevels.map((item) => {
          const isSelected = depth === item.value
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => handleLevelClick(item.value)}
              className={`w-full text-left p-4 rounded-md border transition-all duration-150 cursor-pointer bg-surface-alt hover:bg-border ${
                isSelected
                  ? 'border-primary ring-1 ring-primary/45 bg-surface'
                  : 'border-border'
              }`}
            >
              <div className="flex flex-col">
                <div className="flex justify-between items-baseline">
                  <span className={`font-semibold text-base ${isSelected ? 'text-primary' : 'text-text-1'}`}>
                    {item.title}
                  </span>
                  <span className="text-[10px] font-mono text-text-3 font-semibold uppercase">
                    Level {item.value}
                  </span>
                </div>
                <span className="text-xs text-text-2 mt-1 leading-relaxed">
                  {item.description}
                </span>
                
                {/* Preview text box */}
                <div className="mt-3 p-3 rounded-md bg-bg border border-border/40">
                  <span className="text-[9px] font-mono uppercase text-text-3 font-bold block mb-1">Preview</span>
                  <p className="text-xs text-text-2 italic leading-relaxed">
                    &ldquo;{item.preview}&rdquo;
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex space-x-3 mt-6">
        <Button
          type="button"
          onClick={onBack}
          variant="secondary"
          className="flex-1 h-11 transition duration-150"
        >
          Back
        </Button>
        <Button
          type="button"
          disabled={depth === undefined || depth === null}
          onClick={onNext}
          variant="default"
          className="flex-1 h-11 transition duration-150"
        >
          Next Step
        </Button>
      </div>
    </div>
  )
}
