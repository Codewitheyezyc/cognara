'use client'
import { useState } from 'react'
import { Lock, ChevronDown, ChevronUp, CheckCircle2, PlayCircle, Circle } from 'lucide-react'
import { LessonPreviewModal } from '@/components/subscription/LessonPreviewModal'

interface Lesson {
  id: string
  title: string
  description: string
  order_index: number
  isAccessible: boolean
  status: 'not_started' | 'in_progress' | 'completed'
}

interface RoadmapPhaseCardProps {
  phaseNumber: number
  title: string
  description: string
  lessons: Lesson[]
  isFullyLocked: boolean
  isPro: boolean
}

export function RoadmapPhaseCard({
  phaseNumber,
  title,
  description,
  lessons,
  isFullyLocked,
  isPro
}: RoadmapPhaseCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [selectedLockedLesson, setSelectedLockedLesson] = useState<Lesson | null>(null)

  const completedCount = lessons.filter(l => l.status === 'completed').length
  const accessibleCount = lessons.filter(l => l.isAccessible).length

  const handleLessonClick = (lesson: Lesson) => {
    if (!lesson.isAccessible) {
      setSelectedLockedLesson(lesson)
      return
    }
    // Navigate to lesson
    window.location.href = `/dashboard/lesson/${lesson.id}`
  }

  return (
    <>
      <div style={{
        border: `1px solid ${isFullyLocked ? 'var(--color-border)' : 'var(--color-border)'}`,
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '12px',
        opacity: isFullyLocked ? 0.85 : 1
      }}>
        {/* Phase header — always clickable */}
        <div
          onClick={() => setExpanded(!expanded)}
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
              background: isFullyLocked
                ? 'var(--color-surface-alt)'
                : 'var(--color-primary-glow)',
              border: `2px solid ${isFullyLocked ? 'var(--color-border)' : 'var(--color-primary)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '14px',
              color: isFullyLocked ? 'var(--color-text-3)' : 'var(--color-primary)',
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
                {isFullyLocked && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(167,139,250,0.1)',
                    color: 'var(--color-accent)',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '999px'
                  }}>
                    <Lock size={10} />
                    Pro
                  </span>
                )}
              </div>
              <span style={{ color: 'var(--color-text-3)', fontSize: '12px' }}>
                {isFullyLocked
                  ? `${lessons.length} lessons — click to preview`
                  : `${completedCount} of ${accessibleCount} lessons completed`
                }
              </span>
            </div>
          </div>

          <div style={{ color: 'var(--color-text-3)' }}>
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>

        {/* Lesson list — shown when expanded */}
        {expanded && (
          <div style={{
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-surface-alt)'
          }}>
            {lessons.map((lesson, index) => (
              <div
                key={lesson.id}
                onClick={() => handleLessonClick(lesson)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 20px',
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
                      <Lock size={16} style={{ color: 'var(--color-text-3)' }} />
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
                      color: lesson.isAccessible
                        ? 'var(--color-text-1)'
                        : 'var(--color-text-3)',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '2px'
                    }}>
                      {lesson.title}
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
                      background: 'rgba(167,139,250,0.1)',
                      color: 'var(--color-accent)',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 10px',
                      borderRadius: '999px'
                    }}>
                      Pro
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

            {/* Upgrade CTA at bottom of locked phase */}
            {isFullyLocked && (
              <div style={{
                padding: '16px 20px',
                background: 'linear-gradient(135deg, rgba(91,142,255,0.06), rgba(167,139,250,0.04))',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{
                    color: 'var(--color-text-1)',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '2px'
                  }}>
                    Unlock this phase and everything else
                  </div>
                  <div style={{
                    color: 'var(--color-text-3)',
                    fontSize: '12px'
                  }}>
                    From $9/month — cancel anytime
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    window.location.href = '/upgrade'
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
                    whiteSpace: 'nowrap'
                  }}
                >
                  Upgrade to Pro
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lesson preview modal */}
      {selectedLockedLesson && (
        <LessonPreviewModal
          lesson={selectedLockedLesson}
          onClose={() => setSelectedLockedLesson(null)}
        />
      )}
    </>
  )
}
