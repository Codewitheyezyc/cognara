'use client'
import React, { useState } from 'react'
import { CheckCircle2, SkipForward, Wrench, Clock, Zap, ChevronRight } from 'lucide-react'
import { Spark } from '@/components/mascot/Spark'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'

// Import dynamically to prevent SSR issues
const ExerciseCode = dynamic(
  () => import('@/components/lesson/ExerciseCode').then(mod => ({ default: mod.ExerciseCode })),
  { ssr: false }
)

const ExerciseProject = dynamic(
  () => import('@/components/lesson/ExerciseProject').then(mod => ({ default: mod.ExerciseProject })),
  { ssr: false }
)

export interface PracticalExerciseData {
  title: string
  instruction: string
  tool_required: string
  estimated_time: string
  example_output: string
  tips: [string, string]
  domain_type: string
  starter_code?: string
  expected_output?: string
  language?: string
  complexity?: string
}

interface PracticalExerciseScreenProps {
  practical: PracticalExerciseData
  userId: string
  lessonCacheId?: string | null
  goalId?: string | null
  topicName: string
  domain: string
  onComplete: () => void
  onSkip: () => void
  isPro?: boolean
}

const CXP_REWARD = 50

export function PracticalExerciseScreen({
  practical,
  userId,
  lessonCacheId,
  goalId,
  topicName,
  domain,
  onComplete,
  onSkip,
  isPro = false,
}: PracticalExerciseScreenProps) {
  const supabase = createClient()
  const [isSaving, setIsSaving] = useState(false)
  const [isSkipping, setIsSkipping] = useState(false)
  const [showCxpAnim, setShowCxpAnim] = useState(false)

  const handleComplete = async () => {
    if (isSaving) return
    setIsSaving(true)
    try {
      // 1. Mark as completed in DB
      await supabase.from('cognara_practical_completions').insert({
        user_id: userId,
        lesson_cache_id: lessonCacheId || null,
        goal_id: goalId || null,
        topic_name: topicName,
        domain: domain,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })

      // 2. Award 50 CXP via RPC
      await supabase.rpc('award_user_cxp', {
        user_id_input: userId,
        amount_input: CXP_REWARD,
        source_input: 'practical_completion',
        description_input: `Completed practical: ${topicName}`,
      })

      // 3. Check milestones (fire-and-forget — non-blocking)
      fetch('/api/practical/check-milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      }).catch(() => {/* non-critical */})

      // 4. Show CXP animation then advance
      setShowCxpAnim(true)
      setTimeout(() => {
        setShowCxpAnim(false)
        onComplete()
      }, 1800)
    } catch (err) {
      console.error('[PracticalExercise] Failed to save completion:', err)
      onComplete() // Don't block user on error
    }
  }

  const handleSkip = async () => {
    if (isSkipping) return
    setIsSkipping(true)
    try {
      await supabase.from('cognara_practical_completions').insert({
        user_id: userId,
        lesson_cache_id: lessonCacheId || null,
        goal_id: goalId || null,
        topic_name: topicName,
        domain: domain,
        status: 'skipped',
        created_at: new Date().toISOString(),
      })
    } catch (err) {
      console.error('[PracticalExercise] Failed to save skip:', err)
    } finally {
      onSkip()
    }
  }

  return (
    <div className="min-h-screen bg-bg text-text-1 flex flex-col items-center justify-center p-5 max-w-lg mx-auto animate-page-enter">
      <style>{`
        @keyframes cxpPop {
          0% { opacity: 0; transform: translateY(20px) scale(0.8); }
          20% { opacity: 1; transform: translateY(0) scale(1.15); }
          40% { transform: scale(1.0); }
          100% { opacity: 0; transform: translateY(-80px) scale(0.9); }
        }
        .animate-cxpPop { animation: cxpPop 1.8s cubic-bezier(0.25, 1, 0.50, 1) forwards; }
      `}</style>

      {/* CXP Float Animation */}
      {showCxpAnim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="animate-cxpPop flex flex-col items-center">
            <span className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA]">
              +{CXP_REWARD} CXP
            </span>
            <span className="text-[11px] font-bold text-[#A78BFA] mt-1.5 tracking-widest uppercase">
              Practice completed!
            </span>
          </div>
        </div>
      )}

      {/* Header badge */}
      <div className="w-full mb-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
            <Wrench className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
            Practical Exercise
          </span>
        </div>

        <h2 className="font-heading text-2xl font-extrabold text-text-1 leading-tight">
          Now apply what you learned
        </h2>
        <p className="text-[13px] text-text-2 mt-1 leading-relaxed">
          The quiz tested what you remembered. This tests what you can actually do.
        </p>
      </div>

      {/* Spark hint */}
      <div className="w-full flex gap-3 bg-surface-alt/50 border border-border rounded-2xl p-3.5 mb-4">
        <Spark emotion="happy" size={28} />
        <p className="text-[12px] text-text-2 leading-relaxed italic">
          &quot;You don&apos;t need to be perfect. The goal is to apply — not to ace it.&quot;
        </p>
      </div>

      {/* Exercise Card */}
      <div className="w-full bg-surface border border-border rounded-2xl overflow-hidden mb-4">
        {/* Card header */}
        <div className="px-4 pt-4 pb-3 border-b border-border">
          <h3 className="text-[15px] font-bold text-text-1 leading-snug">{practical.title}</h3>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-text-2 bg-surface-alt border border-border rounded-full px-2.5 py-1">
              <Clock className="h-2.5 w-2.5" />
              {practical.estimated_time}
            </span>
            {practical.tool_required && practical.tool_required !== 'None' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/8 border border-primary/20 rounded-full px-2.5 py-1">
                <Wrench className="h-2.5 w-2.5" />
                {practical.tool_required}
              </span>
            )}
          </div>
        </div>

        {/* What to do */}
        <div className="px-4 py-3.5 border-b border-border/60">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-3 mb-2 font-bold">What to do:</p>
          <p className="text-[13px] text-text-1 leading-relaxed">{practical.instruction}</p>
        </div>

        {/* What a good result looks like */}
        <div className="px-4 py-3.5 border-b border-border/60 bg-emerald-500/5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 mb-2 font-bold">What a good result looks like:</p>
          <p className="text-[13px] text-text-2 leading-relaxed">{practical.example_output}</p>
        </div>

        {/* Tips */}
        <div className="px-4 py-3.5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-3 mb-2.5 font-bold">Tips:</p>
          <div className="space-y-2">
            {practical.tips.map((tip, i) => (
              <div key={i} className="flex gap-2 items-start">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <p className="text-[12px] text-text-2 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Coding environment for tech domain */}
      {getCodingEnvironment(practical) === 'monaco' && (
        <div className="mt-6 mb-4 w-full">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-foreground">
              Code Editor
            </span>
            <span className="text-xs text-muted-foreground">
              Write and run your code here
            </span>
          </div>

          <ExerciseCode
            language={
              practical.tool_required?.toLowerCase().includes('html') 
                ? 'html' 
                : practical.tool_required?.toLowerCase().includes('typescript')
                ? 'typescript'
                : 'javascript'
            }
            starterCode={practical.starter_code || getStarterCode(practical)}
            expectedOutput={practical.expected_output || ''}
            isLocked={!isPro}
            instructions={practical.instruction}
          />
        </div>
      )}

      {getCodingEnvironment(practical) === 'stackblitz' && (
        <div className="mt-6 mb-4 w-full">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-foreground">
              Project Workspace
            </span>
            <span className="text-xs text-muted-foreground">
              Build your full project here
            </span>
          </div>

          <ExerciseProject
            projectTitle={practical.title}
            description={practical.instruction}
            template={getProjectTemplate(practical)}
            starterFiles={getStarterFiles(practical)}
            steps={getChecklistSteps(practical)}
            isLocked={!isPro}
            lessonId={lessonCacheId || 'practical-lesson'}
            userId={userId}
          />
        </div>
      )}

      {/* No submission note */}
      <p className="text-[11px] text-text-3 text-center leading-relaxed mb-4 px-2">
        There is nothing to submit. This exercise is for your own practice.
        The goal is to apply what you learned — not to be perfect.
      </p>

      {/* CXP reward pill */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full mb-5">
        <Zap className="h-3 w-3 text-primary" />
        <span className="text-[11px] font-bold text-primary">
          Complete this exercise to earn +{CXP_REWARD} CXP
        </span>
      </div>

      {/* Action buttons */}
      <div className="w-full flex flex-col gap-3">
        <button
          onClick={handleComplete}
          disabled={isSaving || showCxpAnim}
          className="w-full h-13 bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] hover:from-[#4A7AEE] hover:to-[#9067FA] text-white font-bold rounded-xl shadow-[0_0_24px_rgba(91,142,255,0.25)] transition-all duration-200 flex items-center justify-center gap-2 text-[14px] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <span>Saving...</span>
          ) : (
            <>
              <CheckCircle2 className="h-4.5 w-4.5" />
              <span>I completed the exercise ✓</span>
            </>
          )}
        </button>

        <button
          onClick={handleSkip}
          disabled={isSkipping || isSaving}
          className="w-full h-11 bg-transparent hover:bg-surface-alt border border-border text-text-2 hover:text-text-1 font-semibold rounded-xl text-[13px] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <SkipForward className="h-3.5 w-3.5" />
          <span>Skip for now</span>
        </button>
      </div>
    </div>
  )
}

function getCodingEnvironment(practical: PracticalExerciseData) {
  // Only show coding environment for tech domain
  if (practical.domain_type !== 'technology') {
    return null
  }

  // StackBlitz for complex projects
  // Estimated time over 20 minutes = complex
  const timeValue = parseInt(practical.estimated_time || '0')

  if (
    timeValue >= 25 ||
    practical.complexity === 'complex' ||
    practical.tool_required?.toLowerCase().includes('project')
  ) {
    return 'stackblitz'
  }

  // Monaco for simpler coding tasks
  return 'monaco'
}

function getStarterCode(practical: PracticalExerciseData) {
  const tool = practical.tool_required?.toLowerCase()

  if (tool?.includes('html')) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Exercise</title>
  <style>
    /* Add your CSS here */
  </style>
</head>
<body>
  <!-- Add your HTML here -->
  
  <script>
    // Add your JavaScript here
  </script>
</body>
</html>`
  }

  if (tool?.includes('react')) {
    return `import React, { useState } from 'react';

export default function App() {
  return (
    <div>
      {/* Build your component here */}
      <h1>Hello Cognara</h1>
    </div>
  );
}`
  }

  // Default JavaScript starter
  return `// ${practical.title}
// ${practical.instruction}

// Write your solution here:

function solution() {
  // Your code here
}

solution();`
}

function getProjectTemplate(practical: PracticalExerciseData) {
  const tool = practical.tool_required?.toLowerCase()

  if (tool?.includes('react')) return 'react-ts'
  if (tool?.includes('next')) return 'nextjs'
  if (tool?.includes('node')) return 'node'
  if (tool?.includes('html')) return 'html'
  return 'javascript'
}

function getStarterFiles(practical: PracticalExerciseData) {
  return {
    'index.js': `// ${practical.title}\n// ${practical.instruction}\n\n// Your code here`,
    'README.md': `# ${practical.title}\n\n${practical.instruction}\n\n## Tips\n${practical.tips?.join('\n- ') || ''}`
  }
}

function getChecklistSteps(practical: PracticalExerciseData): string[] {
  return practical.tips || []
}
