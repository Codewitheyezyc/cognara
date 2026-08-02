'use client'

import { ProgressUpdate } from '@/lib/progress'
import { ArrowRight, Trophy, Target, Sparkles } from 'lucide-react'

interface LessonCompleteScreenProps {
  progressUpdate: ProgressUpdate
  onContinue: () => void
}

export function LessonCompleteScreen({
  progressUpdate,
  onContinue,
}: LessonCompleteScreenProps) {
  const encouragement =
    progressUpdate.phasePercent >= 75
      ? "You're almost done with this phase 🔥"
      : progressUpdate.phasePercent >= 50
      ? "You're over halfway there. Keep going."
      : progressUpdate.completedInPhase === 1
      ? "That's your first lesson done. Every expert started exactly here."
      : "Solid progress. One step closer."

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="w-full max-w-lg mx-auto bg-surface border border-border/80 rounded-2xl p-8 sm:p-10 shadow-2xl text-center space-y-6">
        
        {/* Top Celebration Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-1 shadow-sm">
          <span className="text-3xl">🎉</span>
        </div>

        {/* Heading */}
        <div className="space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-text-1 tracking-tight font-heading">
            Lesson complete!
          </h2>
          <p className="text-text-2 text-sm font-medium">
            Great work. Here&apos;s where you stand.
          </p>
        </div>

        {/* Special first-lesson encouragement */}
        {progressUpdate.completedInPhase === 1 && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-left flex items-start gap-3">
            <div className="p-1.5 bg-primary/15 text-primary rounded-lg shrink-0 mt-0.5">
              <Target className="h-4 w-4" />
            </div>
            <p className="text-text-1 text-xs sm:text-sm leading-relaxed font-medium">
              🎯 You just took your first real step. Most people never even start — you already have momentum.
            </p>
          </div>
        )}

        {/* Phase Progress Card */}
        <div className="bg-surface-alt/60 border border-border/80 rounded-xl p-6 text-left space-y-3.5">
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-1 font-bold truncate max-w-[240px]">
              {progressUpdate.phaseName}
            </span>
            <span className="text-primary font-mono font-extrabold">
              {progressUpdate.phasePercent}%
            </span>
          </div>

          {/* Progress Bar Container */}
          <div className="w-full bg-surface-alt border border-border/50 rounded-full h-3 overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-primary to-accent h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
              style={{ width: `${Math.max(4, progressUpdate.phasePercent)}%` }}
            />
          </div>

          <p className="text-xs text-text-3 font-medium flex items-center justify-between pt-0.5">
            <span>
              {progressUpdate.completedInPhase} of {progressUpdate.totalInPhase} lessons done
            </span>
            {progressUpdate.lessonsRemaining > 0 && (
              <span className="text-text-2 font-semibold">
                {progressUpdate.lessonsRemaining} lesson{progressUpdate.lessonsRemaining === 1 ? '' : 's'} to go
              </span>
            )}
          </p>
        </div>

        {/* Encouraging message */}
        <div className="py-1">
          <p className="text-text-1 text-sm font-semibold flex items-center justify-center gap-1.5">
            <Sparkles className="h-4 w-4 text-accent-warm inline" />
            <span>{encouragement}</span>
          </p>
        </div>

        {/* Primary CTA */}
        <button
          onClick={onContinue}
          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] hover:from-[#4A7AEE] hover:to-[#9067FA] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all duration-200 active:scale-[0.99] cursor-pointer text-sm"
        >
          <span>Continue to next lesson</span>
          <ArrowRight className="h-4 w-4" />
        </button>

      </div>
    </div>
  )
}
