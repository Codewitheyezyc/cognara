'use client'
import { useState, useEffect } from 'react'

interface ReadingProgressBarProps {
  estimatedMinutes: number
  onProgressChange?: (progress: number) => void
}

export function ReadingProgressBar({ estimatedMinutes, onProgressChange }: ReadingProgressBarProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      const clamped = Math.min(100, Math.round(scrollPercent))
      setProgress(clamped)
      onProgressChange?.(clamped)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [onProgressChange])

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
      background: 'rgba(30,37,64,0.8)'
    }}>
      {/* Progress fill — indigo/violet gradient */}
      <div style={{
        height: '100%',
        width: `${progress}%`,
        background: isComplete
          ? 'linear-gradient(90deg, #34D399, #10B981)'
          : 'linear-gradient(90deg, #5B8EFF, #A78BFA)',
        transition: 'width 0.1s ease',
        borderRadius: '0 2px 2px 0'
      }} />

      {/* Time remaining label */}
      <div style={{
        position: 'fixed',
        bottom: '76px',
        left: '16px',
        fontSize: '11px',
        color: isComplete ? '#34D399' : 'var(--color-text-3)',
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
