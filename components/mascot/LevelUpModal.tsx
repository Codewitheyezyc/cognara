'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Spark } from './Spark'
import { ArrowRight, Trophy, X } from 'lucide-react'

interface LevelUpModalProps {
  oldLevel: number
  newLevel: number
  rankName: string
  onDismiss: () => void
}

export function LevelUpModal({ oldLevel, newLevel, rankName, onDismiss }: LevelUpModalProps) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [confetti, setConfetti] = useState<Array<{x: number, y: number, color: string, delay: number}>>([])

  useEffect(() => {
    setMounted(true)
    setTimeout(() => setVisible(true), 100)

    // Generate celebrating level-up confetti particles
    const pieces = Array.from({ length: 30 }, (_, i) => ({
      x: Math.random() * 100,
      y: -10,
      color: ['#5B8EFF', '#A78BFA', '#34D399', '#F59E0B', '#F87171'][i % 5],
      delay: Math.random() * 1.2
    }))
    setConfetti(pieces)
  }, [])

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(onDismiss, 300)
  }

  if (!mounted) return null

  return createPortal(
    <>
      {/* Backdrop overlay (dismissible on click) */}
      <div 
        onClick={handleDismiss}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 6, 10, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
          cursor: 'pointer'
        }} 
      />

      {/* Confetti particles */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 10000, pointerEvents: 'none', overflow: 'hidden' }}>
        {confetti.map((piece, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            width: '8px',
            height: '8px',
            borderRadius: '2px',
            background: piece.color,
            animation: `levelUpConfettiFall 2.5s ease-in ${piece.delay}s forwards`
          }} />
        ))}
      </div>

      {/* Modal centered on the screen */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: visible
          ? 'translate(-50%, -50%) scale(1)'
          : 'translate(-50%, -50%) scale(0.85)',
        opacity: visible ? 1 : 0,
        width: '95%',
        maxWidth: '420px',
        background: 'var(--color-surface)',
        borderRadius: '24px',
        padding: '40px 32px',
        zIndex: 10001,
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        textAlign: 'center',
        border: '1.5px solid var(--color-accent)',
        boxShadow: '0 0 40px rgba(167, 139, 250, 0.15), inset 0 0 20px rgba(255,255,255,0.02)'
      }}>
        {/* Glow effect */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(167,139,250,0.08) 0%, transparent 70%)',
          borderRadius: '24px',
          pointerEvents: 'none'
        }} />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-3)',
            cursor: 'pointer',
            padding: '4px',
            zIndex: 10002,
            transition: 'color 0.15s ease'
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-1)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-3)' }}
        >
          <X size={20} />
        </button>

        {/* Level Up Badge Header */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(167,139,250,0.12)',
          color: 'var(--color-accent)',
          border: '1px solid rgba(167,139,250,0.25)',
          padding: '6px 18px',
          borderRadius: '999px',
          fontSize: '11px',
          fontWeight: 700,
          fontFamily: 'var(--font-mono), monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom: '24px'
        }}>
          <Trophy size={13} className="text-accent animate-pulse" />
          Level Up!
        </div>

        {/* Mascot Spark Celebrating */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          <Spark emotion="celebrate" size={110} />
        </div>

        {/* Achievement Rank Title */}
        <h2 style={{
          color: 'var(--color-text-1)',
          fontSize: '24px',
          fontWeight: 800,
          fontFamily: 'Sora, sans-serif',
          margin: '0 0 10px',
          letterSpacing: '-0.02em'
        }}>
          Rank Reached: {rankName}
        </h2>
        
        {/* Paragraph describing Level Up (No Markdown Asterisks!) */}
        <p style={{
          color: 'var(--color-text-2)',
          fontSize: '13.5px',
          lineHeight: '1.6',
          margin: '0 auto 12px',
          maxWidth: '320px'
        }}>
          You've advanced from{' '}
          <span style={{ color: 'var(--color-primary)', fontWeight: 800 }}>Level {oldLevel}</span>
          {' '}to{' '}
          <span style={{ color: 'var(--color-accent)', fontWeight: 800 }}>Level {newLevel}</span>
          ! Your cognitive capabilities are growing.
        </p>

        {/* Level Transition Graphic Bubble */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          margin: '18px 0 28px'
        }}>
          <div style={{
            background: 'var(--color-surface-alt)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '10px 20px',
            fontSize: '18px',
            fontWeight: 800,
            color: 'var(--color-text-3)',
            fontFamily: 'Sora, sans-serif'
          }}>
            Lvl {oldLevel}
          </div>
          <div style={{ fontSize: '20px', color: 'var(--color-accent)' }}>
            ➔
          </div>
          <div style={{
            background: 'rgba(167,139,250,0.08)',
            border: '2px solid var(--color-accent)',
            borderRadius: '12px',
            padding: '10px 20px',
            fontSize: '20px',
            fontWeight: 800,
            color: 'var(--color-accent)',
            fontFamily: 'Sora, sans-serif',
            boxShadow: '0 0 15px rgba(167, 139, 250, 0.15)'
          }}>
            Lvl {newLevel}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleDismiss}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'var(--color-accent)',
            color: '#0A0C14',
            border: 'none',
            borderRadius: '12px',
            padding: '14px 32px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(167, 139, 250, 0.25)',
            transition: 'all 0.2s ease',
            fontFamily: 'Sora, sans-serif',
            width: '100%'
          }}
        >
          <span>Continue Journey</span>
          <ArrowRight size={16} />
        </button>
      </div>

      <style>{`
        @keyframes levelUpConfettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </>,
    document.body
  )
}
