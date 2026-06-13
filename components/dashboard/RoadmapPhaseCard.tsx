'use client'
import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle2, PlayCircle, Circle } from 'lucide-react'

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
}

export function RoadmapPhaseCard({
  phaseNumber,
  title,
  description,
  lessons
}: RoadmapPhaseCardProps) {
  const [expanded, setExpanded] = useState(false)

  const completedCount = lessons.filter(l => l.status === 'completed').length

  const handleLessonClick = (lesson: Lesson) => {
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

        <div style={{ color: 'var(--color-text-3)' }}>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
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
  )
}
