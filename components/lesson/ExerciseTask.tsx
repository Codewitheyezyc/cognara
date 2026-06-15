'use client'
import { useState } from 'react'
import { CheckSquare, Square } from 'lucide-react'

interface ExerciseTaskProps {
  instructions: string
  steps: string[]
}

export function ExerciseTask({ instructions, steps }: ExerciseTaskProps) {
  const [checked, setChecked] = useState<boolean[]>(new Array(steps.length).fill(false))

  const toggle = (index: number) => {
    const updated = [...checked]
    updated[index] = !updated[index]
    setChecked(updated)
  }

  const completedCount = checked.filter(Boolean).length
  const allDone = completedCount === steps.length

  return (
    <div style={{
      border: '1px solid var(--color-border)',
      borderRadius: '12px',
      overflow: 'hidden',
      marginBlock: '24px'
    }}>
      <div style={{
        padding: '14px 48px 14px 20px',
        background: 'var(--color-surface-alt)',
        borderBottom: '1px solid var(--color-border)'
      }}>
        <div style={{
          fontSize: '11px',
          color: 'var(--color-accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontFamily: 'JetBrains Mono, monospace',
          marginBottom: '6px'
        }}>
          Practical Exercise
        </div>
        <p style={{ color: 'var(--color-text-1)', fontSize: '14px', margin: 0 }}>
          {instructions}
        </p>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {steps.map((step, i) => (
          <div
            key={i}
            onClick={() => toggle(i)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px 0',
              borderBottom: i < steps.length - 1 ? '1px solid var(--color-border)' : 'none',
              cursor: 'pointer'
            }}
          >
            <div style={{ color: checked[i] ? 'var(--color-success)' : 'var(--color-text-3)', flexShrink: 0, marginTop: '1px' }}>
              {checked[i] ? <CheckSquare size={18} /> : <Square size={18} />}
            </div>
            <span style={{
              color: checked[i] ? 'var(--color-text-3)' : 'var(--color-text-1)',
              fontSize: '14px',
              lineHeight: '1.6',
              textDecoration: checked[i] ? 'line-through' : 'none'
            }}>
              {step}
            </span>
          </div>
        ))}
      </div>

      <div style={{
        padding: '12px 20px',
        background: allDone ? 'rgba(52,211,153,0.08)' : 'var(--color-surface-alt)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{
          color: allDone ? 'var(--color-success)' : 'var(--color-text-2)',
          fontSize: '13px',
          fontWeight: 500
        }}>
          {allDone ? '🎉 Exercise complete!' : `${completedCount} of ${steps.length} steps completed`}
        </span>
        <div style={{
          height: '6px',
          width: '120px',
          background: 'var(--color-border)',
          borderRadius: '999px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${(completedCount / steps.length) * 100}%`,
            background: 'var(--color-success)',
            borderRadius: '999px',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
    </div>
  )
}
