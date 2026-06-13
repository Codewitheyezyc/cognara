'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { GeneratedLesson } from '@/types/ai'
import { BookOpen, ArrowRight, ChevronDown } from 'lucide-react'
import AIBadge from './AIBadge'
import { CodeBlock } from './CodeBlock'
import { Callout } from './Callout'
import { LessonTable } from './LessonTable'
import { ExerciseCode } from './ExerciseCode'
import { ExerciseWriting } from './ExerciseWriting'
import { ExerciseTask } from './ExerciseTask'
import { ExerciseProject } from './ExerciseProject'

interface LessonContentProps {
  lesson: GeneratedLesson
  depthLevel: number
  isChangingDepth: boolean
  onDepthChange: (newDepth: number) => Promise<void>
  lessonTitle: string
  subject: string
  lessonId: string
  userId: string
  isPro: boolean
}

const depthLevels = [
  { value: 1, title: "Like I'm 10" },
  { value: 2, title: "Beginner" },
  { value: 3, title: "Intermediate" },
  { value: 4, title: "Advanced" },
  { value: 5, title: "Expert" },
]

const depthLabels = ["", "Like I'm 10", "Beginner", "Intermediate", "Advanced", "Expert"]

export default function LessonContent({ 
  lesson, 
  depthLevel, 
  isChangingDepth, 
  onDepthChange,
  lessonTitle,
  subject,
  lessonId,
  userId,
  isPro
}: LessonContentProps) {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)
  const router = useRouter()

  return (
    <div className="max-w-[720px] mx-auto space-y-8 pb-12 animate-page-enter">
      {/* Lesson Heading Block */}
      <div className="space-y-3 pb-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-accent">
            <BookOpen className="h-4 w-4" strokeWidth={1.5} />
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">AI Generated Lesson</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <AIBadge />
            <span className="inline-flex items-center px-2 py-0.5 border border-primary/20 bg-primary/10 text-primary text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm">
              {depthLabels[depthLevel] || 'Beginner'}
            </span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={isChangingDepth}
                className="text-[10px] text-primary hover:underline font-bold uppercase tracking-wide focus:outline-none flex items-center space-x-0.5 cursor-pointer disabled:opacity-50"
              >
                <span>Change depth</span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {isDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-44 rounded-md shadow-lg bg-surface border border-border z-50 py-1 animate-page-enter">
                    {depthLevels.map((lvl) => {
                      return (
                        <button
                          key={lvl.value}
                          type="button"
                          disabled={depthLevel === lvl.value}
                          onClick={() => {
                            onDepthChange(lvl.value)
                            setIsDropdownOpen(false)
                          }}
                          className={`w-full text-left px-4 py-2 text-xs hover:bg-surface-alt cursor-pointer transition-colors duration-100 flex items-center justify-between ${
                            depthLevel === lvl.value ? 'text-primary font-semibold' : 'text-text-2'
                          }`}
                        >
                          <span>{lvl.title}</span>
                          <span className="text-[9px] font-mono text-text-3">Lvl {lvl.value}</span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-1 tracking-tight">
          {lesson.title}
        </h1>
        <p className="text-xs font-mono text-text-2">
          Estimated reading time: <span className="text-primary font-bold">{lesson.estimated_minutes} minutes</span>
        </p>
      </div>

      {/* Structured Sections Loop */}
      <div className="space-y-8">
        {(lesson.sections || []).map((section, idx) => {
          switch (section.type) {
            case 'explanation':
            case 'analogy':
            case 'use_case':
            case 'summary':
              return (
                <div key={idx} className="space-y-2">
                  <h3 className="font-heading text-lg font-semibold text-text-1">
                    {section.heading}
                  </h3>
                  <p className="text-text-2 text-sm leading-relaxed whitespace-pre-line">
                    {section.body}
                  </p>
                </div>
              )

            case 'exercise_code':
              return (
                <div key={idx} style={{ marginBottom: '28px' }}>
                  <ExerciseCode
                    language={section.exercise_language || 'javascript'}
                    starterCode={section.exercise_starter_code || '// Write your code here\n'}
                    instructions={section.exercise_instructions || section.heading}
                    expectedOutput={section.exercise_expected_output}
                  />
                </div>
              )

            case 'exercise_writing':
              return (
                <div key={idx} style={{ marginBottom: '28px' }}>
                  <ExerciseWriting
                    instructions={section.exercise_instructions || section.heading}
                    criteria={section.exercise_criteria || []}
                    lessonTitle={lessonTitle}
                    subject={subject}
                  />
                </div>
              )

            case 'exercise_task':
              return (
                <div key={idx} style={{ marginBottom: '28px' }}>
                  <ExerciseTask
                    instructions={section.exercise_instructions || section.heading}
                    steps={section.exercise_steps || []}
                  />
                </div>
              )

            case 'exercise_project':
              return (
                <div key={idx} style={{ marginBottom: '28px' }}>
                  <ExerciseProject
                    projectTitle={section.exercise_project_title || 'Project Exercise'}
                    description={section.exercise_project_description || ''}
                    template={section.exercise_project_template || 'vanilla'}
                    starterFiles={section.exercise_project_files || {
                      'index.js': '// Start coding here\n'
                    }}
                    steps={section.exercise_project_steps || []}
                    lessonId={lessonId}
                    userId={userId}
                  />
                </div>
              )

            case 'code':
              return (
                <div key={idx} className="space-y-2">
                  <h3 className="font-heading text-lg font-semibold text-text-1">
                    {section.heading}
                  </h3>
                  <CodeBlock
                    code={section.code_snippet!}
                    language={section.code_language!}
                    caption={section.code_caption}
                  />
                </div>
              )

            case 'code_comparison':
              return (
                <div key={idx} className="space-y-2">
                  <h3 className="font-heading text-lg font-semibold text-text-1">
                    {section.heading}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                    <div>
                      <div className="text-error font-semibold mb-2 text-xs uppercase tracking-wider flex items-center gap-1">
                        {section.comparison_label_left || '❌ Before'}
                      </div>
                      <CodeBlock code={section.code_left!} language={section.code_language || 'js'} />
                    </div>
                    <div>
                      <div className="text-success font-semibold mb-2 text-xs uppercase tracking-wider flex items-center gap-1">
                        {section.comparison_label_right || '✅ After'}
                      </div>
                      <CodeBlock code={section.code_right!} language={section.code_language || 'js'} />
                    </div>
                  </div>
                  {section.comparison_caption && (
                    <p className="text-text-2 text-xs italic mt-1">
                      {section.comparison_caption}
                    </p>
                  )}
                </div>
              )

            case 'diagram':
              return (
                <div key={idx} className="space-y-2">
                  <h3 className="font-heading text-lg font-semibold text-text-1">
                    {section.heading}
                  </h3>
                  <pre style={{
                    background: 'var(--color-surface-alt)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '10px',
                    padding: '24px',
                    fontFamily: 'var(--font-mono), JetBrains Mono, monospace',
                    fontSize: '13px',
                    color: 'var(--color-text-1)',
                    overflowX: 'auto',
                    lineHeight: '1.8'
                  }}>
                    {section.diagram_content}
                  </pre>
                </div>
              )

            case 'table':
              return (
                <LessonTable
                  key={idx}
                  heading={section.heading}
                  headers={section.table_headers!}
                  rows={section.table_rows!}
                />
              )

            case 'callout':
              return (
                <Callout
                  key={idx}
                  type={section.callout_type!}
                  body={section.callout_body!}
                />
              )

            case 'resource':
              return (
                <div key={idx} className="p-4 rounded-[8px] bg-surface border border-border flex items-center gap-3 my-4">
                  <span className="text-xl">📖</span>
                  <div>
                    <a
                      href={section.resource_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary font-semibold text-sm hover:underline"
                    >
                      {section.resource_title}
                    </a>
                    {section.resource_description && (
                      <p className="text-text-2 text-xs mt-1">
                        {section.resource_description}
                      </p>
                    )}
                  </div>
                </div>
              )

            default:
              return null
          }
        })}
      </div>

      {/* Key Takeaways Section */}
      <div className="pt-6 border-t border-border space-y-3">
        <h3 className="font-heading text-lg font-bold text-text-1">Key Takeaways</h3>
        <ul className="space-y-2">
          {(lesson.key_takeaways || []).map((takeaway, idx) => (
            <li key={idx} className="flex items-start text-xs text-text-2 leading-relaxed">
              <span className="text-primary mr-2 select-none">•</span>
              <span>{takeaway}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Next Lesson Preview Banner */}
      {lesson.next_lesson_preview && (
        <div className="p-4 rounded-[10px] bg-surface-alt border border-border flex items-center justify-between space-x-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-text-3 font-semibold">Upcoming Next</span>
            <p className="text-xs text-text-2">{lesson.next_lesson_preview}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-text-3 flex-shrink-0" strokeWidth={2} />
        </div>
      )}
    </div>
  )
}
