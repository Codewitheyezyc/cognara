'use client'
import { useState, useEffect } from 'react'

interface ReadingProgressBarProps {
  estimatedMinutes: number
}

export function ReadingProgressBar({ estimatedMinutes }: ReadingProgressBarProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      setProgress(Math.min(100, Math.round(scrollPercent)))
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const minutesRemaining = Math.ceil(estimatedMinutes * (1 - progress / 100))
  const isComplete = progress >= 98

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      height: '3px',
      background: 'var(--color-border)'
    }}>
      {/* Progress fill */}
      <div style={{
        height: '100%',
        width: `${progress}%`,
        background: isComplete
          ? 'var(--color-success)'
          : 'var(--color-primary)',
        transition: 'width 0.1s ease',
        borderRadius: '0 2px 2px 0'
      }} />

      {/* Time remaining label — anchored bottom-left, above mobile nav, clear of top navbar */}
      <div style={{
        position: 'fixed',
        bottom: '76px',
        left: '16px',
        fontSize: '11px',
        color: isComplete ? 'var(--color-success)' : 'var(--color-text-3)',
        fontWeight: 500,
        background: 'var(--color-surface)',
        padding: '2px 10px',
        borderRadius: '999px',
        border: '1px solid var(--color-border)',
        zIndex: 999,
        pointerEvents: 'none',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
      }}>
        {isComplete ? '✓ Read' : `${minutesRemaining} min left`}
      </div>
    </div>
  )
}
