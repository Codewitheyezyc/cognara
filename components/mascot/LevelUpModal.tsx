'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Spark } from './Spark'
import { ArrowRight, Trophy } from 'lucide-react'

interface LevelUpModalProps {
  oldLevel: number
  newLevel: number
  rankName: string
  onDismiss: () => void
}

export function LevelUpModal({ oldLevel, newLevel, rankName, onDismiss }: LevelUpModalProps) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTimeout(() => setVisible(true), 100)
  }, [])

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(onDismiss, 300)
  }

  if (!mounted) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 6, 10, 0.8)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease'
      }} />

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
        zIndex: 10000,
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        textAlign: 'center',
        border: '1px solid var(--color-accent)'
      }}>
        {/* Confetti decoration */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)',
          borderRadius: '24px',
          pointerEvents: 'none'
        }} />

        {/* Level Up Badge Header */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(167,139,250,0.1)',
          color: 'var(--color-accent)',
          border: '1px solid rgba(167,139,250,0.2)',
          padding: '6px 18px',
          borderRadius: '999px',
          fontSize: '11px',
          fontWeight: 700,
          fontFamily: 'var(--font-mono), monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '28px animate-bounce'
        }}>
          <Trophy size={12} />
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

        {/* Achievement Text */}
        <h2 style={{
          color: 'var(--color-text-1)',
          fontSize: '24px',
          fontWeight: 800,
          fontFamily: 'Sora, sans-serif',
          margin: '0 0 8px',
          letterSpacing: '-0.02em'
        }}>
          Rank Reached: {rankName}
        </h2>
        
        <p style={{
          color: 'var(--color-text-2)',
          fontSize: '14px',
          lineHeight: '1.6',
          margin: '0 auto 28px',
          maxWidth: '300px'
        }}>
          You've advanced from **Level {oldLevel}** to **Level {newLevel}**! Your cognitive capabilities are growing.
        </p>

        {/* Action Button */}
        <button
          onClick={handleDismiss}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--color-accent)',
            color: '#0A0C14',
            border: 'none',
            borderRadius: '12px',
            padding: '14px 32px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(167, 139, 250, 0.3)',
            transition: 'all 0.2s ease',
            fontFamily: 'Sora, sans-serif'
          }}
        >
          <span>Continue Journey</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </>,
    document.body
  )
}
