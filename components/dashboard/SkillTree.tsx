'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Play, Check, Award, HelpCircle, Layers, ArrowLeft } from 'lucide-react'
import { LessonPreviewModal } from './LessonPreviewModal'
import { useToast } from '@/components/ui/toast'

interface Lesson {
  id: string
  title: string
  description: string
  order_index: number
  isAccessible: boolean
  status: 'not_started' | 'in_progress' | 'completed'
}

interface PhaseEligibility {
  eligible: boolean
  completedLessons: number
  totalLessons: number
  passedQuizzes: number
  totalQuizzes: number
  averageScore: number
  missingItems: string[]
  details: Array<{
    title: string
    completed: boolean
    quizPassed: boolean
    score: number | null
  }>
}

interface Phase {
  id: string
  phase_number: number
  title: string
  description: string | null
}

interface SkillTreeProps {
  roadmap: {
    id: string
    title: string
    description: string | null
  }
  phases: Phase[]
  lessonsByPhase: Record<string, Lesson[]>
  isPro: boolean
  eligibilities: PhaseEligibility[]
  onToggleView: () => void
}

export function SkillTree({
  roadmap,
  phases,
  lessonsByPhase,
  isPro,
  eligibilities,
  onToggleView
}: SkillTreeProps) {
  const router = useRouter()
  const { toast } = useToast()

  // State for active popup/popover tooltip
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)
  
  // Paywall Modal State
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [paywallLesson, setPaywallLesson] = useState<{ title: string; description: string; phaseNumber: number } | null>(null)

  // SVG lines paths state
  const [paths, setPaths] = useState<Record<string, string>>({})
  
  // Refs to measure container sizes and positions
  const containerRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Floating Classic View button visibility state
  const [showFloatingBtn, setShowFloatingBtn] = useState(false)
  const hasScrolledRef = useRef(false)

  // Compute curved SVG path lines between nodes
  const computePaths = () => {
    const newPaths: Record<string, string> = {}
    
    phases.forEach((phase) => {
      const phaseId = phase.id
      const container = containerRefs.current[phaseId]
      if (!container) return

      // Find all lesson nodes and chest node in this phase container
      const nodes = Array.from(container.querySelectorAll('[data-node-id]')) as HTMLElement[]
      if (nodes.length < 2) return

      const points: Array<{ x: number; y: number }> = []

      nodes.forEach((node) => {
        const rect = node.getBoundingClientRect()
        const parentRect = container.getBoundingClientRect()
        
        // Find the absolute center coordinates relative to the relative parent phase container
        const x = rect.left - parentRect.left + rect.width / 2
        const y = rect.top - parentRect.top + rect.height / 2
        points.push({ x, y })
      })

      // Sort points by vertical Y coord to ensure line moves top to bottom
      points.sort((a, b) => a.y - b.y)

      let d = ''
      points.forEach((p, idx) => {
        if (idx === 0) {
          d = `M ${p.x} ${p.y}`
        } else {
          const prev = points[idx - 1]
          const midY = (prev.y + p.y) / 2
          // Cubic Bezier curve creates a gorgeous smooth snake path
          d += ` C ${prev.x} ${midY}, ${p.x} ${midY}, ${p.x} ${p.y}`
        }
      })

      newPaths[phaseId] = d
    })

    setPaths(newPaths)
  }

  // Effect to recalculate lines on load and resize
  useEffect(() => {
    // Run after a slight delay to ensure browser layout has settled
    const timer = setTimeout(() => {
      computePaths()
    }, 150)

    window.addEventListener('resize', computePaths)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', computePaths)
    }
  }, [phases, lessonsByPhase])

  // Scroll listener to toggle floating button visibility
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowFloatingBtn(true)
      } else {
        setShowFloatingBtn(false)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-scroll to current active or first incomplete lesson on mount
  useEffect(() => {
    if (hasScrolledRef.current) return
    if (phases.length === 0) return

    let targetLessonId: string | null = null

    // Check if we came from a specific lesson in this session
    if (typeof window !== 'undefined') {
      const savedId = sessionStorage.getItem('lastViewedLessonId')
      if (savedId) {
        targetLessonId = savedId
        sessionStorage.removeItem('lastViewedLessonId') // Consume it immediately
      }
    }

    if (!targetLessonId) {
      // 1. Look for the first lesson with status 'in_progress'
      for (const phase of phases) {
        const lessons = lessonsByPhase[phase.id] || []
        const active = lessons.find(l => l.status === 'in_progress')
        if (active) {
          targetLessonId = active.id
          break
        }
      }

      // 2. If no in_progress lesson, look for the first 'not_started' lesson
      if (!targetLessonId) {
        for (const phase of phases) {
          const lessons = lessonsByPhase[phase.id] || []
          const firstNotStarted = lessons.find(l => l.status === 'not_started')
          if (firstNotStarted) {
            targetLessonId = firstNotStarted.id
            break
          }
        }
      }

      // 3. If all lessons are completed, target the last lesson of the last phase
      if (!targetLessonId && phases.length > 0) {
        const lastPhase = phases[phases.length - 1]
        const lessons = lessonsByPhase[lastPhase.id] || []
        if (lessons.length > 0) {
          targetLessonId = lessons[lessons.length - 1].id
        }
      }
    }

    if (targetLessonId) {
      hasScrolledRef.current = true
      // Delay slightly to ensure layout and SVG elements are calculated and positioned
      const scrollTimer = setTimeout(() => {
        const element = document.querySelector(`[data-node-id="${targetLessonId}"]`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 500)
      return () => clearTimeout(scrollTimer)
    }
  }, [phases, lessonsByPhase])

  // Handle clicking outside popup tooltip to close it
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (activeNodeId) {
        const target = e.target as HTMLElement
        if (!target.closest('[data-popover-container]') && !target.closest('[data-node-id]')) {
          setActiveNodeId(null)
        }
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [activeNodeId])

  const handleNodeClick = (lesson: Lesson, phaseNumber: number) => {
    if (!lesson.isAccessible) {
      setPaywallLesson({
        title: lesson.title,
        description: lesson.description,
        phaseNumber
      })
      setPaywallOpen(true)
      setActiveNodeId(null)
      return
    }

    // Toggle popover tooltip
    if (activeNodeId === lesson.id) {
      setActiveNodeId(null)
    } else {
      setActiveNodeId(lesson.id)
    }
  }

  const handleChestClick = (phaseId: string) => {
    // Toggle chest popover tooltip
    const chestId = `chest-${phaseId}`
    if (activeNodeId === chestId) {
      setActiveNodeId(null)
    } else {
      setActiveNodeId(chestId)
    }
  }

  const startLesson = (lessonId: string) => {
    window.location.href = `/dashboard/lesson/${lessonId}`
  }

  return (
    <div className="space-y-10 max-w-2xl mx-auto pb-24 animate-page-enter">
      {/* Skill Tree Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/50 pb-6">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center space-x-2 text-primary">
            <Layers className="h-4.5 w-4.5" strokeWidth={1.5} />
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Active Cognitive Tree</span>
          </div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-text-1">{roadmap.title}</h1>
          <p className="text-text-2 text-xs md:text-sm max-w-xl">{roadmap.description}</p>
        </div>
        <button
          onClick={onToggleView}
          className="h-10 px-4 border border-border bg-surface hover:bg-surface-alt text-text-2 hover:text-text-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-center"
        >
          <ArrowLeft size={14} />
          <span>Classic List View</span>
        </button>
      </div>

      {/* Interactive Path Tree */}
      <div className="space-y-12 relative">
        {[...phases].reverse().map((phase, reversedIdx) => {
          const phaseIdx = phases.length - 1 - reversedIdx
          const phaseLessons = lessonsByPhase[phase.id] || []
          const eligibility = eligibilities[phaseIdx]
          
          // Calculate phase completion stats
          const completedCount = phaseLessons.filter(l => l.status === 'completed').length
          const totalCount = phaseLessons.length
          const phaseProgressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

          return (
            <div key={phase.id} className="space-y-6">
              {/* Phase Banner Header Card */}
              <div className="relative overflow-hidden border border-border bg-surface rounded-2xl p-5 md:p-6 shadow-md">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 to-accent/60" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono uppercase text-accent font-bold tracking-wider">
                      Phase {phase.phase_number}
                    </span>
                    <h3 className="font-heading text-lg font-bold text-text-1">{phase.title}</h3>
                    {phase.description && (
                      <p className="text-text-2 text-xs leading-relaxed max-w-lg">
                        {phase.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Phase Stats Indicator */}
                  <div className="flex flex-col items-start sm:items-end justify-center min-w-[120px]">
                    <span className="text-[10px] text-text-3 font-semibold mb-1 font-mono">
                      {completedCount}/{totalCount} Completed
                    </span>
                    <div className="w-28 h-2 bg-border rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                        style={{ width: `${phaseProgressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Staggered Node Path Tracks */}
              <div 
                id={`phase-container-${phase.id}`}
                ref={el => { containerRefs.current[phase.id] = el }}
                className="relative py-8 flex flex-col items-center gap-10 overflow-visible"
              >
                {/* SVG Connecting Path Overlay */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
                  {/* Gray background connector dashed line */}
                  <path 
                    d={paths[phase.id] || ''} 
                    fill="none" 
                    stroke="var(--color-border)" 
                    strokeWidth="6" 
                    strokeDasharray="12 10"
                    strokeLinecap="round"
                    className="opacity-45"
                  />
                  {/* Glowing active connector line */}
                  <path 
                    d={paths[phase.id] || ''} 
                    fill="none" 
                    stroke="rgba(9b,142,255,0.4)" 
                    strokeWidth="4" 
                    strokeLinecap="round"
                    className="opacity-75"
                  />
                </svg>

                {/* Certificate Milestone Gate (Treasure Chest Node) */}
                {phaseLessons.length > 0 && (
                  <div className="w-full flex justify-center relative z-10">
                    <button
                      data-node-id={`chest-${phase.id}`}
                      onClick={() => handleChestClick(phase.id)}
                      className={`
                        w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer
                        btn-3d shadow-md select-none border-b-[6px]
                        ${eligibility?.eligible 
                          ? 'bg-gradient-to-br from-amber-400 to-yellow-600 border-amber-800 text-white animate-float-subtle shadow-[0_4px_22px_rgba(245,158,11,0.35)] hover:scale-105 active:scale-95'
                          : 'bg-[#2c3344] border-[#1c212c] text-text-3 opacity-75'
                        }
                      `}
                    >
                      {eligibility?.eligible ? (
                        <span className="text-2xl animate-pulse">🏆</span>
                      ) : (
                        <Lock className="w-5.5 h-5.5 text-text-3" />
                      )}
                    </button>

                    {/* Chest Popover Tooltip */}
                    {activeNodeId === `chest-${phase.id}` && (
                      <div 
                        data-popover-container
                        className="absolute z-50 w-76 bg-[#171c2a] border border-border p-4.5 rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.5)] text-left bottom-[108%] left-1/2 -translate-x-1/2 select-none animate-slideDown flex flex-col gap-3"
                      >
                        {/* Triangle speech pointer */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[8px] border-transparent border-t-[#171c2a]" />
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[8px] border-transparent border-t-border -z-10 translate-y-[1px]" />
                        
                        {/* Tooltip Content */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono uppercase bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2 py-0.5 rounded font-bold">
                              Phase {phase.phase_number} Reward
                            </span>
                            <span className={`text-[9px] font-bold uppercase ${eligibility?.eligible ? 'text-amber-400' : 'text-text-3'}`}>
                              {eligibility?.eligible ? 'Ready to Claim' : 'Locked Milestone'}
                            </span>
                          </div>
                          <h4 className="font-heading text-sm font-bold text-text-1 flex items-center gap-1.5 mt-1">
                            🎓 Phase {phase.phase_number} Certificate
                          </h4>
                          <p className="text-text-3 text-[11px] leading-relaxed">
                            {eligibility?.eligible 
                              ? 'Congratulations! You completed all lessons and quizzes. Your certificate is unlocked.'
                              : 'Complete all lessons and pass all quizzes with at least a 60% average score to earn this certificate.'
                            }
                          </p>
                        </div>

                        {/* Checklist Details */}
                        {eligibility && !eligibility.eligible && (
                          <div className="bg-[#111520] border border-border/80 rounded-xl p-3 space-y-2 text-left text-[10px]">
                            <span className="font-bold text-text-2 uppercase tracking-wider block text-[9px]">
                              Requirements checklist:
                            </span>
                            <div className="space-y-1 text-text-1">
                              <div className="flex items-center justify-between">
                                <span>Lessons Completed:</span>
                                <span className="font-mono">{eligibility.completedLessons}/{eligibility.totalLessons}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Quizzes Passed:</span>
                                <span className="font-mono">{eligibility.passedQuizzes}/{eligibility.totalQuizzes}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Average Score:</span>
                                <span className="font-mono">{eligibility.averageScore}% / 60%</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="border-t border-border/40 pt-2.5 mt-0.5">
                          {eligibility?.eligible ? (
                            <button
                              onClick={() => {
                                window.open(`/api/certificate/generate?phaseId=${phase.id}`, '_blank')
                              }}
                              className="w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-[0_0_12px_rgba(245,158,11,0.25)] flex items-center justify-center gap-1.5"
                            >
                              Download Phase Certificate 🎓
                            </button>
                          ) : (
                            <button
                              disabled
                              className="w-full py-2 bg-[#2c3344] text-text-3 text-xs font-bold rounded-lg cursor-not-allowed flex items-center justify-center gap-1"
                            >
                              🔒 Milestone Locked
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Lesson nodes rendering */}
                {[...phaseLessons].reverse().map((lesson, index) => {
                  const status = lesson.status
                  const isAccessible = lesson.isAccessible

                  // Calculate staggering coordinate offset
                  // Alternating pattern: Center (0%) -> Left (-20%) -> Center (0%) -> Right (20%) -> Center (0%)
                  const offset = index % 4 === 1 ? -22 : index % 4 === 3 ? 22 : 0

                  return (
                    <div 
                      key={lesson.id} 
                      className="w-full flex justify-center relative z-10"
                    >
                      {/* Interactive circular 3D node button */}
                      <button
                        data-node-id={lesson.id}
                        onClick={() => handleNodeClick(lesson, phase.phase_number)}
                        style={{ left: `${offset}%`, position: 'relative' }}
                        className={`
                          w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer
                          btn-3d-node shadow-md select-none outline-none border-b-[6px]
                          ${status === 'completed'
                            ? 'bg-emerald-500 hover:bg-emerald-400 border-emerald-700 text-white btn-3d-node-completed shadow-[0_4px_16px_rgba(16,185,129,0.25)] hover:scale-105 active:scale-95'
                            : status === 'in_progress'
                              ? 'bg-primary hover:bg-primary/95 border-blue-700 text-white btn-3d-node-active animate-node-pulse shadow-[0_4px_18px_rgba(91,142,255,0.35)] hover:scale-105 active:scale-95'
                              : 'bg-[#2c3344] border-[#1c212c] text-text-3 btn-3d-node-locked opacity-75'
                          }
                        `}
                      >
                        {status === 'completed' ? (
                          <Check className="w-7 h-7 stroke-[3px]" />
                        ) : status === 'in_progress' ? (
                          <Play className="w-7 h-7 fill-current translate-x-[2px]" />
                        ) : (
                          <Lock className="w-5.5 h-5.5 text-text-3" />
                        )}
                      </button>

                      {/* Detail Popover Speech Bubble Tooltip */}
                      {activeNodeId === lesson.id && (
                        <div 
                          data-popover-container
                          style={{ left: `calc(50% + ${offset}%)`, transform: 'translateX(-50%)' }}
                          className="absolute z-50 w-72 bg-[#171c2a] border border-border p-4.5 rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.5)] text-left bottom-[108%] select-none animate-slideDown flex flex-col gap-3"
                        >
                          {/* Triangle speech pointer */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[8px] border-transparent border-t-[#171c2a]" />
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[8px] border-transparent border-t-border -z-10 translate-y-[1px]" />
                          
                          {/* Tooltip Content */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono uppercase bg-primary/15 border border-primary/20 text-primary px-2 py-0.5 rounded font-bold">
                                Lesson {lesson.order_index}
                              </span>
                              <span className={`text-[9px] font-bold uppercase ${status === 'completed' ? 'text-success' : 'text-primary'}`}>
                                {status === 'completed' ? 'Completed' : status === 'in_progress' ? 'Active' : 'Locked'}
                              </span>
                            </div>
                            <h4 className="font-heading text-sm font-bold text-text-1 leading-tight">{lesson.title}</h4>
                            {lesson.description && (
                              <p className="text-text-3 text-[11px] leading-relaxed line-clamp-2">{lesson.description}</p>
                            )}
                          </div>

                          <div className="flex items-center justify-between border-t border-border/40 pt-2.5 mt-0.5">
                            <span className="text-[10px] text-text-2 font-semibold font-mono flex items-center gap-1">
                              🧠 {status === 'completed' ? '+50 XP (Review)' : '+100 XP (Mastery)'}
                            </span>
                            <button
                              onClick={() => startLesson(lesson.id)}
                              className="px-3.5 py-1.5 bg-primary hover:bg-primary/95 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-colors shadow-[0_0_8px_rgba(91,142,255,0.2)]"
                            >
                              {status === 'completed' ? 'Review Concept' : status === 'in_progress' ? 'Continue Study' : 'Start Lesson'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Subscription Paywall Modal Overlay */}
      <LessonPreviewModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        lessonTitle={paywallLesson?.title}
        lessonDescription={paywallLesson?.description}
        phaseNumber={paywallLesson?.phaseNumber}
      />

      {/* Floating Classic View Switcher FAB */}
      {showFloatingBtn && (
        <button
          onClick={onToggleView}
          className="fixed bottom-20 right-6 md:bottom-8 md:right-8 z-40 h-11 px-4 bg-[#171c2a]/95 backdrop-blur-xs hover:bg-[#1f2638] border border-border border-b-[4px] border-b-[#0f131c] text-text-2 hover:text-text-1 rounded-full text-xs font-bold active:translate-y-[2px] active:border-b-[2px] transition-all shadow-lg flex items-center gap-1.5 cursor-pointer animate-fadeIn"
        >
          <ArrowLeft size={14} />
          <span>Classic List View</span>
        </button>
      )}
    </div>
  )
}
