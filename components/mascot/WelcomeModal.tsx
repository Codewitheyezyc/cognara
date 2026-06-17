'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Spark } from './Spark'
import { ArrowRight } from 'lucide-react'

interface WelcomeModalProps {
  userName: string
  onDismiss: () => void
}

export function WelcomeModal({ userName, onDismiss }: WelcomeModalProps) {
  const [mounted, setMounted] = useState(false)
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
    setMounted(true)
    // Slide in from bottom
    setTimeout(() => setVisible(true), 100)
  }, [])

  useEffect(() => {
    if (textStep === 0) setSparkEmotion('wave')
    else if (textStep === 1) setSparkEmotion('idle')
    else if (textStep === 2) setSparkEmotion('wave')
    else if (textStep === 3) setSparkEmotion('happy')
  }, [textStep])

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
        background: 'rgba(0,0,0,0.6)',
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
        width: '95%',
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
          <h2 
            key={textStep}
            style={{
              color: 'var(--color-text-1)',
              fontSize: '20px',
              fontWeight: 700,
              fontFamily: 'Sora, sans-serif',
              margin: 0,
              animation: 'fadeInUp 0.4s ease'
            }}
          >
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
            <div 
              key={i} 
              onClick={() => setTextStep(i)}
              style={{
                width: i === textStep ? '20px' : '6px',
                height: '6px',
                borderRadius: '999px',
                background: i === textStep ? 'var(--color-primary)' : 'var(--color-border)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }} 
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={textStep === messages.length - 1 ? handleDismiss : () => setTextStep(prev => prev + 1)}
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
            transition: 'all 0.2s ease'
          }}
        >
          {textStep === messages.length - 1 ? (
            <>
              Let's start learning
              <ArrowRight size={16} />
            </>
          ) : (
            'Next'
          )}
        </button>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>,
    document.body
  )
}
