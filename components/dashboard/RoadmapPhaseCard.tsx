'use client'
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, CheckCircle2, PlayCircle, Circle, Award } from 'lucide-react'

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
}

export function RoadmapPhaseCard({
  phaseId,
  phaseNumber,
  title,
  description,
  lessons,
  initiallyExpanded = false
}: RoadmapPhaseCardProps) {
  const [expanded, setExpanded] = useState(initiallyExpanded)
  const [lessonsList, setLessonsList] = useState<Lesson[]>(lessons)
  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState('')

  // Sync state with prop if prop changes
  useEffect(() => {
    setLessonsList(lessons)
  }, [lessons])

  // Automatically trigger lesson generation on expand if empty
  useEffect(() => {
    if (expanded && lessonsList.length === 0 && !loading) {
      let active = true
      const generateLessons = async () => {
        setLoading(true)
        setErrorText('')
        try {
          const res = await fetch('/api/ai/generate-lessons-for-phase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phaseId })
          })
          const data = await res.json()
          if (!res.ok || data.error) {
            throw new Error(data.error || 'Failed to generate lessons')
          }
          if (active) {
            const formatted = (data.lessons || []).map((lesson: any) => ({
              id: lesson.id,
              title: lesson.title,
              description: `Lesson ${lesson.order_index} • Ready to learn`,
              order_index: lesson.order_index,
              isAccessible: true,
              status: 'not_started' as const
            }))
            setLessonsList(formatted)
          }
        } catch (err: any) {
          console.error(err)
          if (active) {
            setErrorText(err.message || 'Failed to load lessons.')
          }
        } finally {
          if (active) {
            setLoading(false)
          }
        }
      }
      generateLessons()
      return () => {
        active = false
      }
    }
  }, [expanded, lessonsList.length, phaseId, loading])

  const completedCount = lessonsList.filter(l => l.status === 'completed').length

  const handleLessonClick = (lesson: Lesson) => {
    window.location.href = `/dashboard/lesson/${lesson.id}`
  }

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Trigger useEffect again by emptying error text and letting it fetch
    setErrorText('')
  }

  return (
    <div style={{
      border: '1px solid var(--color-border)',
      borderRadius: '12px',
      overflow: 'hidden',
      marginBottom: '12px'
    }}>
      {/* Pulse keyframe definitions for skeleton loading */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* Phase header */}
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
              {lessonsList.length > 0
                ? `${completedCount} of ${lessonsList.length} lessons completed`
                : 'Click to unlock & explore this phase'
              }
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {lessonsList.length > 0 && lessonsList.every(l => l.status === 'completed') && (
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

      {/* Expanded phase content (Lessons list or loading states) */}
      {expanded && (
        <div style={{
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-surface-alt)'
        }}>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Skeleton loading list */}
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderBottom: i < 4 ? '1px solid var(--color-border)' : 'none',
                  background: 'transparent'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '80%' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: 'var(--color-border)',
                      animation: 'pulse 1.5s infinite ease-in-out',
                      flexShrink: 0
                    }} />
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{
                        width: '40%',
                        height: '14px',
                        background: 'var(--color-border)',
                        borderRadius: '4px',
                        animation: 'pulse 1.5s infinite ease-in-out'
                      }} />
                      <div style={{
                        width: '85%',
                        height: '11px',
                        background: 'var(--color-border)',
                        borderRadius: '4px',
                        opacity: 0.6,
                        animation: 'pulse 1.5s infinite ease-in-out'
                      }} />
                    </div>
                  </div>
                  <div style={{
                    width: '32px',
                    height: '12px',
                    background: 'var(--color-border)',
                    borderRadius: '4px',
                    animation: 'pulse 1.5s infinite ease-in-out'
                  }} />
                </div>
              ))}
            </div>
          )}

          {errorText && (
            <div style={{
              padding: '24px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}>
              <span style={{ color: 'var(--color-error)', fontSize: '14px' }}>{errorText}</span>
              <button
                onClick={handleRetry}
                style={{
                  background: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Retry Loading
              </button>
            </div>
          )}

          {!loading && !errorText && lessonsList.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {lessonsList.map((lesson, index) => (
                <div
                  key={lesson.id}
                  onClick={() => handleLessonClick(lesson)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 20px',
                    borderBottom: index < lessonsList.length - 1
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
                      {lesson.status === 'completed' ? (
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
                    {lesson.status === 'completed' ? (
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
            </div>
          )}
        </div>
      )}
    </div>
  )
}
