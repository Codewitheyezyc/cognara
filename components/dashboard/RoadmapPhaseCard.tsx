'use client'
import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle2, PlayCircle, Circle, Award, Lock } from 'lucide-react'
import { LessonPreviewModal } from './LessonPreviewModal'

interface Lesson {
  id: string
  title: string
  description: string
  order_index: number
  isAccessible: boolean
  status: 'not_started' | 'in_progress' | 'completed'
}

interface RoadmapPhaseCardProps {
  phaseId: string
  phaseNumber: number
  title: string
  description: string
  lessons: Lesson[]
  initiallyExpanded?: boolean
  isPro?: boolean
  eligibility?: {
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
}

export function RoadmapPhaseCard({
  phaseId,
  phaseNumber,
  title,
  description,
  lessons = [],
  initiallyExpanded = false,
  isPro = false,
  eligibility
}: RoadmapPhaseCardProps) {
  const [expanded, setExpanded] = useState(initiallyExpanded)
  const [selectedLesson, setSelectedLesson] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const completedCount = lessons.filter(l => l.status === 'completed').length

  const handleLessonClick = (lesson: Lesson) => {
    if (!lesson.isAccessible) {
      setSelectedLesson({
        title: lesson.title,
        description: lesson.description
      })
      setIsModalOpen(true)
      return
    }
    window.location.href = `/dashboard/lesson/${lesson.id}`
  }

  return (
    <div style={{
      border: '1px solid var(--color-border)',
      borderRadius: '12px',
      overflow: 'hidden',
      marginBottom: '12px'
    }}>
      {/* Phase header */}
      <div
        onClick={() => {
          setExpanded(!expanded)
        }}
        style={{
          padding: '16px 20px',
          background: 'var(--color-surface)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Phase number circle */}
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--color-primary-glow)',
            border: '2px solid var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '14px',
            color: 'var(--color-primary)',
            flexShrink: 0
          }}>
            {phaseNumber}
          </div>

          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '2px'
            }}>
              <span style={{
                color: 'var(--color-text-1)',
                fontWeight: 600,
                fontSize: '15px'
              }}>
                {title}
              </span>
            </div>
            <span style={{ color: 'var(--color-text-3)', fontSize: '12px' }}>
              {lessons.length > 0
                ? `${completedCount} of ${lessons.length} lessons completed`
                : 'No lessons available for this phase.'
              }
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ color: 'var(--color-text-3)' }}>
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </div>

      {/* Expanded phase content (Lessons list) */}
      {expanded && (
        <div style={{
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-surface-alt)'
        }}>
          {/* Certificate button — shown at top of expanded section when eligible */}
          {lessons.length > 0 && eligibility?.eligible && (
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(`/api/certificate/generate?phaseId=${phaseId}`, '_blank')
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(52,211,153,0.1)',
                  color: 'var(--color-success)',
                  border: '1px solid rgba(52,211,153,0.4)',
                  borderRadius: '8px',
                  padding: '7px 16px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                <Award size={14} />
                🎓 Download Phase Certificate
              </button>
            </div>
          )}
          {lessons.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  onClick={() => handleLessonClick(lesson)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 20px',
                    borderBottom: index < lessons.length - 1
                      ? '1px solid var(--color-border)'
                      : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                    background: 'transparent'
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.background = 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Status icon */}
                    <div style={{ flexShrink: 0 }}>
                      {!lesson.isAccessible ? (
                        <Lock size={15} style={{ color: 'var(--color-primary)' }} />
                      ) : lesson.status === 'completed' ? (
                        <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />
                      ) : lesson.status === 'in_progress' ? (
                        <PlayCircle size={16} style={{ color: 'var(--color-primary)' }} />
                      ) : (
                        <Circle size={16} style={{ color: 'var(--color-text-3)' }} />
                      )}
                    </div>

                    <div>
                      <div style={{
                        color: 'var(--color-text-1)',
                        fontSize: '14px',
                        fontWeight: 500,
                        marginBottom: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        {lesson.title}
                        {!lesson.isAccessible && (
                          <span style={{
                            fontSize: '9px',
                            background: 'rgba(91,142,255,0.1)',
                            border: '1px solid rgba(91,142,255,0.2)',
                            color: 'var(--color-primary)',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase'
                          }}>
                            Pro
                          </span>
                        )}
                      </div>
                      {lesson.description && (
                        <div style={{
                          color: 'var(--color-text-3)',
                          fontSize: '12px'
                        }}>
                          {lesson.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side indicator */}
                  <div style={{ flexShrink: 0 }}>
                    {!lesson.isAccessible ? null : lesson.status === 'completed' ? (
                      <span style={{
                        color: 'var(--color-success)',
                        fontSize: '12px',
                        fontWeight: 500
                      }}>
                        Done
                      </span>
                    ) : (
                      <span style={{
                        color: 'var(--color-primary)',
                        fontSize: '12px',
                        fontWeight: 500
                      }}>
                        {lesson.status === 'in_progress' ? 'Continue →' : 'Start →'}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Upgrade Banner for Locked Phases */}
              {!isPro && phaseNumber > 1 && (
                <div 
                  className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5"
                  style={{
                    background: 'rgba(91,142,255,0.03)',
                    borderTop: '1px solid var(--color-border)'
                  }}
                >
                  <span style={{ color: 'var(--color-text-2)', fontSize: '13px' }}>
                    Unlock all {lessons.length} lessons in Phase {phaseNumber} · From ₦4,500/month
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedLesson({
                        title: `Phase ${phaseNumber}: ${title}`,
                        description: description || `Access all ${lessons.length} interactive lessons in this phase.`
                      })
                      setIsModalOpen(true)
                    }}
                    style={{
                      background: 'var(--color-primary)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 0 12px rgba(91,142,255,0.2)'
                    }}
                  >
                    Upgrade to Pro
                  </button>
                </div>
              )}
              {/* Phase Certificate Eligibility Card Block */}
              {lessons.length > 0 && (isPro || phaseNumber === 1) && (
                <div 
                  className="p-5 space-y-4"
                  style={{
                    background: 'rgba(91,142,255,0.02)',
                    borderTop: '1px solid var(--color-border)'
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-left">
                      <h4 className="text-sm font-bold text-text-1 flex items-center gap-1.5">
                        🎓 Phase {phaseNumber} Certificate
                      </h4>
                      <p className="text-text-3 text-[11px] mt-0.5">
                        {eligibility?.eligible 
                          ? 'Congratulations! You have completed all requirements for this phase certificate.'
                          : `${eligibility?.completedLessons || 0} of ${eligibility?.totalLessons || 0} lessons completed · ${eligibility?.passedQuizzes || 0} of ${eligibility?.totalQuizzes || 0} quizzes passed`
                        }
                        {eligibility?.averageScore !== undefined && eligibility.averageScore > 0 && (
                          <span> · Average Score: {eligibility.averageScore}% (60% required)</span>
                        )}
                      </p>
                    </div>

                    <div>
                      {eligibility?.eligible ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(`/api/certificate/generate?phaseId=${phaseId}`, '_blank')
                          }}
                          className="px-4 py-2 bg-success/10 border border-success/30 hover:bg-success/20 text-success text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-[0_0_12px_rgba(52,211,153,0.15)] w-full sm:w-auto justify-center"
                        >
                          🎓 Download Phase Certificate
                        </button>
                      ) : (
                        <button
                          disabled
                          className="px-4 py-2 bg-surface border border-border text-text-3 text-xs font-bold rounded-lg opacity-60 cursor-not-allowed flex items-center gap-1.5 w-full sm:w-auto justify-center"
                        >
                          🔒 Complete requirements to unlock
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Requirements Checklist */}
                  {eligibility && !eligibility.eligible && (
                    <div className="bg-surface border border-border/80 rounded-xl p-4 space-y-2.5 text-left">
                      <span className="text-[11px] font-semibold text-text-2 uppercase tracking-wider block">
                        To earn this certificate complete the following:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {eligibility.details.map((detail, dIdx) => (
                          <div key={dIdx} className="flex items-start gap-2 text-text-1">
                            <span>{detail.completed && detail.quizPassed ? '✅' : '❌'}</span>
                            <div className="flex-1 min-w-0">
                              <span className="font-semibold block truncate leading-tight">{detail.title}</span>
                              <span className="text-text-3 text-[10px]">
                                {detail.completed ? 'Completed' : 'Not completed'} • {detail.quizPassed ? `Quiz passed (${detail.score}%)` : detail.score !== null ? `Quiz failed (${detail.score}%)` : 'Quiz not passed yet'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {eligibility.averageScore < 60 && eligibility.averageScore > 0 && (
                        <div className="text-[10px] text-accent font-semibold pt-1 border-t border-border/40">
                          ⚠️ Note: Average score is currently {eligibility.averageScore}%. You need at least 60% average score to earn the certificate. Retake quizzes to raise your average.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '20px', color: 'var(--color-text-3)', textAlign: 'center', fontSize: '14px' }}>
              No lessons available for this phase.
            </div>
          )}
        </div>
      )}

      <LessonPreviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        lessonTitle={selectedLesson?.title}
        lessonDescription={selectedLesson?.description}
        phaseNumber={phaseNumber}
      />
    </div>
  )
}
