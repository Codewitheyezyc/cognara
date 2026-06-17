'use client'
import { useState } from 'react'
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
  hasMore?: boolean
}

export function RoadmapPhaseCard({
  phaseId,
  phaseNumber,
  title,
  description,
  lessons,
  hasMore = true
}: RoadmapPhaseCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [completeState, setCompleteState] = useState(!hasMore)
  const [errorText, setErrorText] = useState('')

  const completedCount = lessons.filter(l => l.status === 'completed').length

  const handleLessonClick = (lesson: Lesson) => {
    window.location.href = `/dashboard/lesson/${lesson.id}`
  }

  const handleGenerateMore = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setLoadingMore(true)
    setErrorText('')
    try {
      const res = await fetch('/api/ai/generate-more-lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phaseId })
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate lessons')
      }
      if (data.complete) {
        setCompleteState(true)
      } else {
        window.location.reload()
      }
    } catch (err: any) {
      console.error(err)
      setErrorText(err.message || 'An error occurred. Please try again.')
    } finally {
      setLoadingMore(false)
    }
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
              {completedCount} of {lessons.length} lessons completed
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

      {/* Lesson list */}
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
                borderBottom: '1px solid var(--color-border)',
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

          {/* Generate More Lessons button */}
          {!completeState && (
            <div style={{
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--color-surface)'
            }}>
              {errorText && (
                <span style={{ color: 'var(--color-error)', fontSize: '13px', textAlign: 'center', marginBottom: '4px' }}>
                  {errorText}
                </span>
              )}
              <button
                onClick={handleGenerateMore}
                disabled={loadingMore}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: loadingMore ? 'not-allowed' : 'pointer',
                  opacity: loadingMore ? 0.7 : 1,
                  transition: 'background 0.2s ease, transform 0.1s ease',
                  boxShadow: '0 2px 4px rgba(91, 142, 255, 0.2)'
                }}
                onMouseEnter={e => {
                  if (!loadingMore) (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-primary-hover)'
                }}
                onMouseLeave={e => {
                  if (!loadingMore) (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-primary)'
                }}
              >
                {loadingMore ? (
                  <>
                    <svg
                      style={{
                        animation: 'spin 1s linear infinite',
                        width: '16px',
                        height: '16px',
                        marginRight: '6px'
                      }}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Lessons...
                  </>
                ) : (
                  '+ Generate More Lessons'
                )}
              </button>
            </div>
          )}

          {completeState && (
            <div style={{
              padding: '14px 20px',
              textAlign: 'center',
              color: 'var(--color-success)',
              fontSize: '13px',
              fontWeight: 500,
              background: 'var(--color-surface)',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              <span>✨ End of lessons for this phase. Ready to move to the next phase!</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
