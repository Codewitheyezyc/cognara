'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Spark } from './Spark'

interface StreakMilestoneModalProps {
  streakDays: number
  onDismiss: () => void
}

export function StreakMilestoneModal({ streakDays, onDismiss }: StreakMilestoneModalProps) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  const getMessage = () => {
    if (streakDays >= 30) return "30 days straight. You are unstoppable."
    if (streakDays >= 14) return "Two weeks of pure consistency. This is how legends are built."
    if (streakDays >= 7) return "One full week! Most people quit by day 3. Not you."
    return "3 days in a row! You are building a real habit."
  }

  useEffect(() => {
    setMounted(true)
    setTimeout(() => setVisible(true), 100)
    const timeout = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }, 5000)
    return () => clearTimeout(timeout)
  }, [onDismiss])

  if (!mounted) return null

  return createPortal(
    <div style={{
      position: 'fixed',
      bottom: visible ? '24px' : '-200px',
      left: '50%',
      transform: 'translateX(-50%)',
      transition: 'bottom 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-accent-warm)',
      borderRadius: '16px',
      padding: '16px 20px',
      zIndex: 300,
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      maxWidth: '380px',
      width: '90%'
    }}>
      <Spark emotion="celebrate" size={48} />
      <div>
        <div style={{
          color: 'var(--color-accent-warm)',
          fontWeight: 700,
          fontSize: '15px',
          marginBottom: '3px'
        }}>
          🔥 {streakDays} Day Streak!
        </div>
        <div style={{ color: 'var(--color-text-2)', fontSize: '13px' }}>
          {getMessage()}
        </div>
      </div>
    </div>,
    document.body
  )
}
