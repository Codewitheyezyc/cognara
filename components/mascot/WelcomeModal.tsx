'use client'
import { useState, useEffect } from 'react'
import { Spark } from './Spark'
import { ArrowRight } from 'lucide-react'

interface WelcomeModalProps {
  userName: string
  onDismiss: () => void
}

export function WelcomeModal({ userName, onDismiss }: WelcomeModalProps) {
  const [visible, setVisible] = useState(false)
  const [textStep, setTextStep] = useState(0)
  const [sparkEmotion, setSparkEmotion] = useState<'wave' | 'happy' | 'idle'>('wave')

  const messages = [
    `Hi ${userName}! I'm Spark ✨`,
    `Welcome to Cognara — your personal learning OS.`,
    `I'll be here every step of your journey.`,
    `Let's build something great together.`
  ]

  useEffect(() => {
    // Slide in from bottom
    setTimeout(() => setVisible(true), 100)

    // Cycle through messages
    const interval = setInterval(() => {
      setTextStep(prev => {
        if (prev < messages.length - 1) return prev + 1
        clearInterval(interval)
        setSparkEmotion('happy')
        return prev
      })
    }, 1800)

    return () => clearInterval(interval)
  }, [])

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(onDismiss, 300)
  }

  return (
    <>
      {/* Backdrop */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(6px)',
        zIndex: 200,
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
        width: '90%',
        maxWidth: '440px',
        background: 'var(--color-surface)',
        borderRadius: '24px',
        padding: '40px 32px 48px',
        zIndex: 201,
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        textAlign: 'center',
        border: '1px solid var(--color-border)'
      }}>
        {/* Spark mascot */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          <Spark emotion={sparkEmotion} size={100} />
        </div>

        {/* Animated text */}
        <div style={{
          minHeight: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <h2 style={{
            color: 'var(--color-text-1)',
            fontSize: '20px',
            fontWeight: 700,
            fontFamily: 'Sora, sans-serif',
            margin: 0,
            animation: 'fadeInUp 0.4s ease',
            key: textStep
          } as any}>
            {messages[textStep]}
          </h2>
        </div>

        {/* Message dots */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '6px',
          margin: '20px 0 28px'
        }}>
          {messages.map((_, i) => (
            <div key={i} style={{
              width: i === textStep ? '20px' : '6px',
              height: '6px',
              borderRadius: '999px',
              background: i === textStep ? 'var(--color-primary)' : 'var(--color-border)',
              transition: 'all 0.3s ease'
            }} />
          ))}
        </div>

        {/* CTA Button */}
        {textStep === messages.length - 1 && (
          <button
            onClick={handleDismiss}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--color-primary)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '14px 28px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              animation: 'fadeInUp 0.4s ease'
            }}
          >
            Let's start learning
            <ArrowRight size={16} />
          </button>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
