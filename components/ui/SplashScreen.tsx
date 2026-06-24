'use client'

import React, { useEffect, useState } from 'react'
import { Logo } from './Logo'

export function SplashScreen() {
  const [mounted, setMounted] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const [isFadingOut, setIsFadingOut] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Check if the splash screen has already played in this browser session
    const hasBooted = sessionStorage.getItem('cognara-booted')
    if (hasBooted === 'true') {
      return
    }

    // If not booted, show splash screen
    setShouldRender(true)

    // Trigger fade-out animation after 1.8 seconds (duration of logo pop + text fade-in)
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true)
    }, 1800)

    // Completely unmount the splash screen and save state after fade-out transition completes (500ms)
    const removeTimer = setTimeout(() => {
      setShouldRender(false)
      sessionStorage.setItem('cognara-booted', 'true')
    }, 2300)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [])

  if (!mounted || !shouldRender) {
    return null
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0A0C14] select-none ${
        isFadingOut ? 'animate-splash-overlay-out' : ''
      }`}
    >
      <div className="flex flex-col items-center justify-center space-y-6">
        {/* Animated Mascot Logo */}
        <div 
          className="animate-splash-logo relative"
          style={{ 
            opacity: 0, 
            transform: 'scale(0.3) rotate(-8deg)', 
            filter: 'blur(8px)' 
          }}
        >
          <Logo className="w-24 h-24 sm:w-28 sm:h-28" />
          {/* Subtle glowing halo behind logo */}
          <div className="absolute inset-0 -z-10 rounded-full bg-primary/10 blur-xl animate-pulse-subtle scale-110" />
        </div>

        {/* Text Area */}
        <div className="flex flex-col items-center space-y-2 text-center">
          {/* Title */}
          <h1
            className="animate-splash-text text-3xl sm:text-4xl font-extrabold tracking-widest text-[#F0F4FF]"
            style={{
              fontFamily: 'var(--font-heading)',
              textShadow: '0 0 20px rgba(91,142,255,0.15)',
              opacity: 0,
              transform: 'translateY(12px)',
              filter: 'blur(2px)'
            }}
          >
            COGNARA
          </h1>

          {/* Subtitle */}
          <p
            className="animate-splash-text text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-[#8B95B3]"
            style={{
              animationDelay: '0.8s',
              fontFamily: 'var(--font-sans)',
              opacity: 0,
              transform: 'translateY(12px)',
              filter: 'blur(2px)'
            }}
          >
            Cognitive Adaptive System
          </p>
        </div>
      </div>
    </div>
  )
}
