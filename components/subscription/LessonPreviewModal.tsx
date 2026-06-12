'use client'
import { X, Lock, Zap, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface Lesson {
  id: string
  title: string
  description: string
}

interface LessonPreviewModalProps {
  lesson: Lesson
  onClose: () => void
}

export function LessonPreviewModal({ lesson, onClose }: LessonPreviewModalProps) {
  const router = useRouter()

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 100
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '480px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        zIndex: 101,
        overflow: 'hidden'
      }}>
        {/* Modal header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(167,139,250,0.1)',
              color: 'var(--color-accent)',
              fontSize: '11px',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: '999px',
              marginBottom: '10px'
            }}>
              <Lock size={10} />
              Pro Lesson
            </div>
            <h3 style={{
              color: 'var(--color-text-1)',
              fontSize: '18px',
              fontWeight: 700,
              margin: 0,
              fontFamily: 'Sora, sans-serif'
            }}>
              {lesson.title}
            </h3>
            {lesson.description && (
              <p style={{
                color: 'var(--color-text-2)',
                fontSize: '14px',
                margin: '8px 0 0',
                lineHeight: '1.5'
              }}>
                {lesson.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-3)',
              cursor: 'pointer',
              padding: '4px',
              flexShrink: 0,
              marginLeft: '16px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* What is included */}
        <div style={{ padding: '20px 24px' }}>
          <div style={{
            fontSize: '12px',
            color: 'var(--color-text-3)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '12px'
          }}>
            This lesson includes
          </div>
          {[
            'Full AI-generated lesson content',
            'Real-world examples and analogies',
            'Code examples or practical diagrams',
            'Hands-on practice exercise',
            'Quiz to test your understanding',
            'AI feedback on your progress'
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '7px 0',
              borderBottom: i < 5 ? '1px solid var(--color-border)' : 'none'
            }}>
              <Check size={14} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
              <span style={{ color: 'var(--color-text-1)', fontSize: '13px' }}>
                {item}
              </span>
            </div>
          ))}
        </div>

        {/* Upgrade buttons */}
        <div style={{
          padding: '16px 24px 24px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px'
        }}>
          <button
            onClick={() => router.push('/upgrade?plan=monthly')}
            style={{
              padding: '12px',
              background: 'transparent',
              border: '2px solid var(--color-primary)',
              borderRadius: '10px',
              cursor: 'pointer',
              textAlign: 'center'
            }}
          >
            <div style={{
              color: 'var(--color-primary)',
              fontWeight: 700,
              fontSize: '18px',
              fontFamily: 'Sora, sans-serif'
            }}>
              $9
            </div>
            <div style={{ color: 'var(--color-text-2)', fontSize: '12px' }}>
              per month
            </div>
          </button>

          <button
            onClick={() => router.push('/upgrade?plan=yearly')}
            style={{
              padding: '12px',
              background: 'var(--color-primary)',
              border: '2px solid var(--color-primary)',
              borderRadius: '10px',
              cursor: 'pointer',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--color-accent-warm)',
              color: '#FFFFFF',
              fontSize: '9px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '999px',
              whiteSpace: 'nowrap'
            }}>
              BEST VALUE
            </div>
            <div style={{
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '18px',
              fontFamily: 'Sora, sans-serif'
            }}>
              $79
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
              per year
            </div>
          </button>
        </div>

        <div style={{
          textAlign: 'center',
          paddingBottom: '16px',
          color: 'var(--color-text-3)',
          fontSize: '11px'
        }}>
          Cancel anytime · Instant access · No hidden fees
        </div>
      </div>
    </>
  )
}
