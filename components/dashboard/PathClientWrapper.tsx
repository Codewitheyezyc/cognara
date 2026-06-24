'use client'

import React, { useState, useEffect } from 'react'
import { Map as MapIcon, Layers } from 'lucide-react'
import { RoadmapPhaseCard } from './RoadmapPhaseCard'
import { SkillTree } from './SkillTree'

interface MappedLesson {
  id: string
  title: string
  description: string
  order_index: number
  isAccessible: boolean
  status: 'not_started' | 'in_progress' | 'completed'
}

interface MappedPhase {
  id: string
  phase_number: number
  title: string
  description: string | null
  lessons: MappedLesson[]
  eligibility: any
}

interface PathClientWrapperProps {
  roadmap: {
    id: string
    title: string
    description: string | null
  }
  phases: MappedPhase[]
  isPro: boolean
}

export function PathClientWrapper({
  roadmap,
  phases,
  isPro
}: PathClientWrapperProps) {
  // Local storage toggle preference ('tree' for skill tree, 'list' for phase cards)
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree')
  const [mounted, setMounted] = useState(false)

  // Load view mode from localStorage on client-side mount
  useEffect(() => {
    setMounted(true)
    const savedMode = localStorage.getItem('cognara_path_view_mode')
    if (savedMode === 'tree' || savedMode === 'list') {
      setViewMode(savedMode)
    }
  }, [])

  const handleToggleView = () => {
    const nextMode = viewMode === 'tree' ? 'list' : 'tree'
    setViewMode(nextMode)
    localStorage.setItem('cognara_path_view_mode', nextMode)
  }

  // Prevent hydration flicker by rendering a skeleton or tree until mounted
  if (!mounted) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-pulse py-12">
        <div className="h-6 w-48 bg-surface-alt rounded" />
        <div className="h-10 w-full bg-surface-alt rounded" />
        <div className="h-4 w-3/4 bg-surface-alt rounded" />
        <div className="h-40 w-full bg-surface-alt rounded-2xl" />
      </div>
    )
  }

  // Format lessonsByPhase lookup map for SkillTree component
  const lessonsByPhaseMap: Record<string, MappedLesson[]> = {}
  const rawPhasesList: any[] = []
  const rawEligibilitiesList: any[] = []

  phases.forEach((p) => {
    lessonsByPhaseMap[p.id] = p.lessons
    rawPhasesList.push({
      id: p.id,
      phase_number: p.phase_number,
      title: p.title,
      description: p.description
    })
    rawEligibilitiesList.push(p.eligibility)
  })

  // Render Skill Tree view
  if (viewMode === 'tree') {
    return (
      <SkillTree
        roadmap={roadmap}
        phases={rawPhasesList}
        lessonsByPhase={lessonsByPhaseMap}
        isPro={isPro}
        eligibilities={rawEligibilitiesList}
        onToggleView={handleToggleView}
      />
    )
  }

  // Render Classic List view
  // Calculate active phase index (first phase that is not fully completed)
  let activePhaseIndex = 0
  for (let i = 0; i < phases.length; i++) {
    const pCompleted = phases[i].lessons.length > 0 && phases[i].lessons.every(l => l.status === 'completed')
    if (!pCompleted) {
      activePhaseIndex = i
      break
    }
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-12 animate-page-enter">
      {/* Roadmap Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/50 pb-6">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center space-x-2 text-primary">
            <MapIcon className="h-4.5 w-4.5" strokeWidth={1.5} />
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Your Learning Path</span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-text-1">{roadmap.title}</h1>
          <p className="text-text-2 text-sm leading-relaxed max-w-xl">{roadmap.description}</p>
        </div>
        <button
          onClick={handleToggleView}
          className="h-10 px-4 border border-border bg-surface hover:bg-surface-alt text-text-2 hover:text-text-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-center"
        >
          <Layers size={14} />
          <span>Interactive Tree View</span>
        </button>
      </div>

      {/* Visual Timeline Path */}
      <div className="relative border-l border-border pl-6 ml-4 space-y-12">
        {phases.map((phase, index) => {
          const initiallyExpanded = index === activePhaseIndex

          return (
            <div key={phase.id} className="relative">
              {/* Timeline dot identifier */}
              <div className="absolute -left-[31px] top-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-surface border border-primary shadow-[0_0_8px_rgba(91,142,255,0.4)]">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              </div>

              <RoadmapPhaseCard
                phaseId={phase.id}
                phaseNumber={phase.phase_number}
                title={phase.title}
                description={phase.description || ''}
                lessons={phase.lessons}
                initiallyExpanded={initiallyExpanded}
                isPro={isPro}
                eligibility={phase.eligibility}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
