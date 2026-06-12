'use client'

import React, { useEffect, useState } from 'react'
import { BrainCircuit, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { GeneratedInsight } from '@/types/ai'
import AIBadge from '../lesson/AIBadge'

export default function AICoachInsight() {
  const [insight, setInsight] = useState<GeneratedInsight | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchInsight() {
      try {
        setIsLoading(true)
        const res = await fetch('/api/ai/generate-insight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
        const data = await res.json()
        if (res.ok && data.insight) {
          setInsight(data.insight)
        }
      } catch (err) {
        console.error('Failed to load coach insight:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInsight()
  }, [])

  if (isLoading) {
    return (
      <div className="border-l-[3px] border-accent bg-accent/5 p-4 rounded-r-[10px] flex items-start space-x-4 animate-pulse">
        <div className="p-2 bg-accent/10 text-accent rounded-md">
          <BrainCircuit className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <div className="space-y-2 flex-1">
          <div className="h-3.5 bg-accent/20 rounded w-24" />
          <div className="h-3 bg-border rounded w-full" />
          <div className="h-3 bg-border rounded w-5/6" />
        </div>
      </div>
    )
  }

  if (!insight) return null

  return (
    <div className="border-l-[3px] border-accent bg-accent/5 p-5 rounded-r-[10px] flex items-start space-x-4 transition-all duration-300 shadow-sm relative group overflow-hidden">
      {/* Visual pulse glow in corner */}
      <div className="absolute right-0 top-0 w-24 h-24 rounded-full bg-accent/5 blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
      
      <div className="p-2 bg-accent/10 text-accent rounded-md flex-shrink-0">
        <BrainCircuit className="h-5 w-5" strokeWidth={1.5} />
      </div>

      <div className="space-y-2 flex-1 relative">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase text-accent font-bold tracking-wider">
            AI Coach Insight
          </span>
          <AIBadge />
        </div>

        <p className="text-xs text-text-1 leading-relaxed font-medium">
          {insight.insight}
        </p>

        {insight.recommendation && (
          <p className="text-[11px] text-text-2 italic">
            💡 <span className="font-semibold text-text-1">Recommendation:</span> {insight.recommendation}
          </p>
        )}

        {insight.recommended_lesson_title && (
          <div className="pt-2">
            <Link 
              href="/dashboard/path"
              className="inline-flex items-center space-x-1 text-xs text-primary hover:underline font-semibold"
            >
              <span>Review lesson: "{insight.recommended_lesson_title}"</span>
              <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
