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
}

export function RoadmapPhaseCard({
  phaseId,
  phaseNumber,
  title,
  description,
  lessons = [],
  initiallyExpanded = false,
  isPro = false
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
          {lessons.length > 0 && lessons.every(l => l.status === 'completed') && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                window.open(`/api/certificate/generate?phaseId=${phaseId}`, '_blank')
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(52,211,153,0.1)',
                color: 'var(--color-success)',
                border: '1px solid var(--color-success)',
                borderRadius: '8px',
                padding: '7px 14px',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              <Award size={14} />
              Download Certificate
            </button>
          )}
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
                    {!lesson.isAccessible ? (
                      <span style={{
                        color: 'var(--color-text-3)',
                        fontSize: '12px',
                        fontWeight: 500
                      }}>
                        Pro 🔒
                      </span>
                    ) : lesson.status === 'completed' ? (
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
                    Unlock all {lessons.length} lessons in Phase {phaseNumber} · From ₦5,000/month
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
