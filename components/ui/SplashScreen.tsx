'use client'

import React, { useEffect, useState } from 'react'
import { Logo } from './Logo'

interface SplashScreenProps {
  duration?: number
}

export function SplashScreen({ duration }: SplashScreenProps) {
  const [mounted, setMounted] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    setMounted(true)

    // Check if the splash screen has already played in this browser session
    const hasBooted = sessionStorage.getItem('cognara-booted')
    if (hasBooted === 'true') {
      return
    }

    setShouldRender(true)

    // Automatically detect PWA standalone mode at runtime
    const isPWA = typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches
    const actualDuration = duration ?? (isPWA ? 3000 : 1500)

    // Scale factor: if duration is 1500ms, scale all transitions by 0.5
    const scale = actualDuration / 3000

    // Phase 1: Background visible, nothing else (0 to 300ms scaled)
    const t1 = setTimeout(() => setPhase(1), 300 * scale)

    // Phase 2: Logo appears (300ms to 1000ms scaled)
    const t2 = setTimeout(() => setPhase(2), 800 * scale)

    // Phase 3: Text appears (1000ms to 2000ms scaled)
    const t3 = setTimeout(() => setPhase(3), 1500 * scale)

    // Phase 4: Fade out starts (2500ms scaled)
    const t4 = setTimeout(() => {
      setPhase(4)
      // Fade out animation takes 500ms scaled
      setTimeout(() => {
        setShouldRender(false)
        sessionStorage.setItem('cognara-booted', 'true')
      }, 500 * scale)
    }, 2500 * scale)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [duration])

  if (!mounted || !shouldRender) {
    return null
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0F1629] select-none transition-opacity duration-500 ${
        phase === 4 ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center justify-center space-y-6">
        {/* Animated Logo (Small Cognara Logo) */}
        <div
          className={`transition-all duration-700 ${
            phase >= 1
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-75'
          } relative`}
        >
          <Logo className="w-16 h-16 sm:w-20 sm:h-20" />
          {/* Subtle glowing halo behind logo */}
          <div className="absolute inset-0 -z-10 rounded-full bg-primary/10 blur-xl animate-pulse-subtle scale-110" />
        </div>

        {/* Text Area */}
        <div className="flex flex-col items-center space-y-2 text-center">
          {/* Title */}
          <h1
            className={`transition-all duration-700 ${
              phase >= 2
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-2'
            } text-2xl sm:text-3xl font-extrabold tracking-widest text-[#F0F4FF]`}
            style={{
              fontFamily: 'var(--font-heading)',
              textShadow: '0 0 20px rgba(91,142,255,0.15)'
            }}
          >
            COGNARA
          </h1>

          {/* Subtitle / Tagline */}
          <p
            className={`transition-all duration-700 delay-200 ${
              phase >= 3
                ? 'opacity-100'
                : 'opacity-0'
            } text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-indigo-400`}
            style={{
              fontFamily: 'var(--font-sans)'
            }}
          >
            Your goal. Your roadmap. Your AI mentor.
          </p>
        </div>
      </div>
    </div>
  )
}
