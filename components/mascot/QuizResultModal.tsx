'use client'
import { useState, useEffect } from 'react'
import { Spark } from './Spark'
import { ArrowRight, RotateCcw } from 'lucide-react'

interface QuizResultModalProps {
  score: number
  passed: boolean
  lessonTitle: string
  onContinue: () => void
  onRetry: () => void
}

export function QuizResultModal({
  score,
  passed,
  lessonTitle,
  onContinue,
  onRetry
}: QuizResultModalProps) {
  const [visible, setVisible] = useState(false)
  const [displayScore, setDisplayScore] = useState(0)

  // Get message based on score
  const getMessage = () => {
    if (score === 100) return "Perfect score! You absolutely nailed it! 🏆"
    if (score >= 80) return "Excellent work! You really understood this lesson."
    if (score >= 60) return "Good job! You passed. Review any mistakes and keep going."
    return "Not quite yet. Review the lesson and try again — you've got this."
  }

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)

    // Animate score counting up
    let current = 0
    const increment = score / 40
    const timer = setInterval(() => {
      current += increment
      if (current >= score) {
        setDisplayScore(score)
        clearInterval(timer)
      } else {
        setDisplayScore(Math.floor(current))
      }
    }, 30)

    return () => clearInterval(timer)
  }, [score])

  const scoreColor = score >= 80
    ? 'var(--color-success)'
    : score >= 60
    ? 'var(--color-accent-warm)'
    : 'var(--color-error)'

  const emotion = score >= 80 ? 'celebrate' : score >= 60 ? 'happy' : 'thinking'

  return (
    <>
      {/* Backdrop */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
        zIndex: 200,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease'
      }} />

      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: visible
          ? 'translate(-50%, -50%) scale(1)'
          : 'translate(-50%, -50%) scale(0.85)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        width: '95%',
        maxWidth: '380px',
        background: 'var(--color-surface)',
        border: `1px solid ${scoreColor}40`,
        borderRadius: '20px',
        padding: '32px 28px',
        zIndex: 201,
        textAlign: 'center'
      }}>
        {/* Spark */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <Spark emotion={emotion} size={80} />
        </div>

        {/* Animated score */}
        <div style={{
          fontSize: '56px',
          fontWeight: 800,
          color: scoreColor,
          fontFamily: 'Sora, sans-serif',
          lineHeight: 1,
          marginBottom: '8px'
        }}>
          {displayScore}
          <span style={{ fontSize: '24px', color: 'var(--color-text-3)' }}>%</span>
        </div>

        {/* Pass/fail badge */}
        <div style={{
          display: 'inline-block',
          background: passed ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
          color: passed ? 'var(--color-success)' : 'var(--color-error)',
          fontSize: '12px',
          fontWeight: 700,
          padding: '4px 14px',
          borderRadius: '999px',
          marginBottom: '16px',
          textTransform: 'uppercase',
          letterSpacing: '0.08em'
        }}>
          {passed ? '✓ Passed' : '✗ Not passed'}
        </div>

        <p style={{
          color: 'var(--color-text-2)',
          fontSize: '14px',
          margin: '0 0 28px',
          lineHeight: '1.6'
        }}>
          {getMessage()}
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={onContinue}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'var(--color-primary)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '13px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {passed ? 'Continue' : 'Back to Lesson'}
            <ArrowRight size={15} />
          </button>
          {score < 100 && (
            <button
              onClick={onRetry}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'transparent',
                color: 'var(--color-text-1)',
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                padding: '13px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={14} />
              Try Quiz Again
            </button>
          )}
        </div>
      </div>
    </>
  )
}
