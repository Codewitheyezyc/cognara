'use client'
import { useState, useEffect } from 'react'
import { Spark } from './Spark'
import { Check } from 'lucide-react'

interface MascotOverlayProps {
  emotion?: 'idle' | 'happy' | 'celebrate' | 'thinking' | 'wave'
  messages: string[]
  ctaLabel?: string
  onDismiss: () => void
}

export function MascotOverlay({
  emotion = 'celebrate',
  messages,
  ctaLabel = 'Keep going!',
  onDismiss
}: MascotOverlayProps) {
  const [visible, setVisible] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [confetti, setConfetti] = useState<Array<{x: number, y: number, color: string, delay: number}>>([])

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
    setTimeout(() => setShowContent(true), 400)

    // Generate celebration particles if emotion is celebrate
    if (emotion === 'celebrate') {
      const pieces = Array.from({ length: 24 }, (_, i) => ({
        x: Math.random() * 100,
        y: -10,
        color: ['#5B8EFF', '#A78BFA', '#34D399', '#F59E0B', '#F87171'][i % 5],
        delay: Math.random() * 0.8
      }))
      setConfetti(pieces)
    }
  }, [emotion])

  return (
    <>
      {/* Background Backdrop Blur */}
      <div 
        onClick={onDismiss}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(6px)',
          zIndex: 999,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }} 
      />

      {/* Confetti Orbit */}
      {emotion === 'celebrate' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, pointerEvents: 'none', overflow: 'hidden' }}>
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
      )}

      {/* Modal Dialog */}
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
        maxWidth: '380px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '20px',
        padding: '32px 24px',
        zIndex: 1001,
        textAlign: 'center',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3), 0 10px 10px -5px rgba(0,0,0,0.04)'
      }}>
        {/* Spark character */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <Spark emotion={emotion} size={90} />
        </div>

        {showContent && (
          <div style={{ animation: 'fadeInUp 0.4s ease' }} className="space-y-4">
            {/* Header Badge */}
            <div style={{
              display: 'inline-block',
              background: 'rgba(91,142,255,0.1)',
              color: 'var(--color-primary)',
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 14px',
              borderRadius: '999px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '4px'
            }}>
              Spark Celebrates! ✨
            </div>

            {/* Messages */}
            <div className="space-y-1">
              {messages.map((msg, i) => {
                if (i === 0) {
                  return (
                    <h2 key={i} className="font-heading text-lg font-bold text-text-1 leading-snug">
                      {msg}
                    </h2>
                  )
                }
                return (
                  <p key={i} className={`${i === 1 ? 'text-primary font-semibold text-sm' : 'text-text-2 text-xs'}`}>
                    {msg}
                  </p>
                )
              })}
            </div>

            {/* CTA Button */}
            <button
              onClick={onDismiss}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                background: 'var(--color-primary)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '16px',
                boxShadow: '0 4px 6px -1px rgba(91, 142, 255, 0.2)'
              }}
            >
              <Check size={14} />
              {ctaLabel}
            </button>
          </div>
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
export default MascotOverlay
