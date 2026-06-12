'use client'
import { useState, useEffect } from 'react'
import { Spark } from './Spark'
import { ArrowRight, Star } from 'lucide-react'

interface LessonCompleteModalProps {
  lessonTitle: string
  xpEarned: number
  streakDays: number
  onQuiz: () => void
  onNext: () => void
  onDismiss: () => void
}

export function LessonCompleteModal({
  lessonTitle,
  xpEarned,
  streakDays,
  onQuiz,
  onNext,
  onDismiss
}: LessonCompleteModalProps) {
  const [visible, setVisible] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [confetti, setConfetti] = useState<Array<{x: number, y: number, color: string, delay: number}>>([])

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
    setTimeout(() => setShowContent(true), 600)

    // Generate confetti particles
    const pieces = Array.from({ length: 20 }, (_, i) => ({
      x: Math.random() * 100,
      y: -10,
      color: ['#5B8EFF', '#A78BFA', '#34D399', '#F59E0B', '#F87171'][i % 5],
      delay: Math.random() * 0.8
    }))
    setConfetti(pieces)
  }, [])

  return (
    <>
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
        zIndex: 200,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease'
      }} />

      {/* Confetti */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 201, pointerEvents: 'none', overflow: 'hidden' }}>
        {confetti.map((piece, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            width: '8px',
            height: '8px',
            borderRadius: '2px',
            background: piece.color,
            animation: `confettiFall 2s ease-in ${piece.delay}s forwards`
          }} />
        ))}
      </div>

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: visible
          ? 'translate(-50%, -50%) scale(1)'
          : 'translate(-50%, -50%) scale(0.8)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        width: '90%',
        maxWidth: '400px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '20px',
        padding: '32px 28px',
        zIndex: 202,
        textAlign: 'center'
      }}>
        {/* Spark celebrating */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <Spark emotion="celebrate" size={90} />
        </div>

        {showContent && (
          <>
            {/* Lesson complete heading */}
            <div style={{
              display: 'inline-block',
              background: 'rgba(52,211,153,0.1)',
              color: 'var(--color-success)',
              fontSize: '12px',
              fontWeight: 700,
              padding: '4px 14px',
              borderRadius: '999px',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              animation: 'fadeInUp 0.4s ease'
            }}>
              Lesson Complete 🎉
            </div>

            <h2 style={{
              color: 'var(--color-text-1)',
              fontSize: '18px',
              fontWeight: 700,
              fontFamily: 'Sora, sans-serif',
              margin: '0 0 6px',
              animation: 'fadeInUp 0.4s ease 0.1s both'
            }}>
              {lessonTitle}
            </h2>

            <p style={{
              color: 'var(--color-text-2)',
              fontSize: '14px',
              margin: '0 0 24px',
              animation: 'fadeInUp 0.4s ease 0.2s both'
            }}>
              Great work! Keep that momentum going.
            </p>

            {/* Stats row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              marginBottom: '24px',
              animation: 'fadeInUp 0.4s ease 0.3s both'
            }}>
              <div style={{
                background: 'var(--color-surface-alt)',
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                padding: '14px'
              }}>
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'Sora, sans-serif' }}>
                  +{xpEarned}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-3)', marginTop: '2px' }}>
                  XP earned
                </div>
              </div>
              <div style={{
                background: 'var(--color-surface-alt)',
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                padding: '14px'
              }}>
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-accent-warm)', fontFamily: 'Sora, sans-serif' }}>
                  🔥 {streakDays}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-3)', marginTop: '2px' }}>
                  day streak
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              animation: 'fadeInUp 0.4s ease 0.4s both'
            }}>
              <button
                onClick={onQuiz}
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
                <Star size={15} />
                Take the Quiz
              </button>
              <button
                onClick={onNext}
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
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Next Lesson
                <ArrowRight size={15} />
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
