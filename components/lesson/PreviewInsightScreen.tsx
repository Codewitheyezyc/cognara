'use client'

import { Sparkles, ArrowRight } from 'lucide-react'

interface PreviewInsightScreenProps {
  insight: string
  topicName: string
  onContinue: () => void
}

export function PreviewInsightScreen({
  insight,
  topicName,
  onContinue,
}: PreviewInsightScreenProps) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="w-full max-w-lg mx-auto bg-surface border border-border/80 rounded-2xl p-8 sm:p-10 shadow-2xl text-center relative overflow-hidden space-y-6">
        {/* Subtle background gradient glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Icon & Eyebrow */}
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-1 shadow-sm">
            <Sparkles className="h-6 w-6 animate-pulse-subtle" />
          </div>
          <p className="text-xs font-mono font-bold tracking-widest text-primary uppercase">
            Before we begin
          </p>
        </div>

        {/* Insight Card Body */}
        <div className="bg-surface-alt/60 border border-border/60 rounded-xl p-6 relative">
          <p className="text-text-1 text-base sm:text-lg font-medium leading-relaxed">
            &ldquo;{insight}&rdquo;
          </p>
        </div>

        {/* Question */}
        <p className="text-text-2 text-sm font-medium">
          Ready to learn more about <span className="text-text-1 font-semibold">{topicName}</span>?
        </p>

        {/* CTA Button */}
        <button
          onClick={onContinue}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] hover:from-[#4A7AEE] hover:to-[#9067FA] text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all duration-200 active:scale-[0.99] cursor-pointer text-sm"
        >
          <span>Start the lesson</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
