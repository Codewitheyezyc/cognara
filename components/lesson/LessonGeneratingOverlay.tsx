'use client'

import { useEffect, useState } from 'react'

const STAGES = [
  { label: 'Loading your learning path…', duration: 1800 },
  { label: 'Analysing the topic for you…', duration: 3000 },
  { label: 'Cognara is crafting your lesson…', duration: 14000 },
  { label: 'Almost ready, hang tight…', duration: Infinity },
]

export default function LessonGeneratingOverlay() {
  const [stageIndex, setStageIndex] = useState(0)

  useEffect(() => {
    let cancelled = false
    let idx = 0

    const advance = () => {
      if (cancelled || idx >= STAGES.length - 1) return
      idx++
      setStageIndex(idx)
      if (STAGES[idx].duration !== Infinity) {
        setTimeout(advance, STAGES[idx].duration)
      }
    }

    const first = STAGES[0]
    if (first.duration !== Infinity) {
      const t = setTimeout(advance, first.duration)
      return () => { cancelled = true; clearTimeout(t) }
    }
  }, [])

  return (
    /* Centred overlay — sits on top of the skeleton, doesn't block the Back link */
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '120px',
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          background: 'var(--color-surface)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--color-border)',
          borderRadius: '18px',
          padding: '28px 36px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          pointerEvents: 'auto',
        }}
      >
        {/* Pulsing rings */}
        <div style={{ position: 'relative', width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '2px solid rgba(91,142,255,0.25)',
              animation: 'ping 1.6s cubic-bezier(0,0,0.2,1) infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: '6px',
              borderRadius: '50%',
              border: '2px solid rgba(91,142,255,0.4)',
            }}
          />
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'rgba(91,142,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: 'var(--color-primary)',
                animation: 'pulse 1.2s cubic-bezier(0.4,0,0.6,1) infinite',
              }}
            />
          </div>
        </div>

        {/* Labels */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <p
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono), monospace',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-primary)',
            }}
          >
            Cognara
          </p>
          <p
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--color-text-1)',
              transition: 'opacity 0.4s',
            }}
          >
            {STAGES[stageIndex].label}
          </p>
        </div>

        {/* Bouncing dots */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--color-primary)',
                opacity: 0.7,
                animation: 'bounce 1.1s infinite',
                animationDelay: `${i * 0.18}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
