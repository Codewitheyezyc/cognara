'use client'
import { useEffect, useState } from 'react'

type SparkEmotion = 'idle' | 'happy' | 'celebrate' | 'thinking' | 'wave'

interface SparkProps {
  emotion?: SparkEmotion
  size?: number
}

export function Spark({ emotion = 'idle', size = 80 }: SparkProps) {
  const [animated, setAnimated] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setAnimated(true)
  }, [emotion])

  if (!mounted) {
    return (
      <div style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }} />
    )
  }

  const center = size / 2
  const coreSize = size * 0.28
  const particleSize = size * 0.08
  const orbitRadius = size * 0.38

  const particles = [0, 60, 120, 180, 240, 300].map((angle, i) => {
    const rad = (angle * Math.PI) / 180
    return {
      x: center + orbitRadius * Math.cos(rad),
      y: center + orbitRadius * Math.sin(rad),
      delay: i * 0.1
    }
  })

  return (
    <div style={{
      width: size,
      height: size,
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <style>{`
        @keyframes sparkFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-${size * 0.1}px); }
        }
        @keyframes sparkBounce {
          0% { transform: translateY(0) scale(1); }
          30% { transform: translateY(-${size * 0.3}px) scale(1.1); }
          60% { transform: translateY(-${size * 0.1}px) scale(0.95); }
          80% { transform: translateY(-${size * 0.15}px) scale(1.05); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes sparkSpin {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.2); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes sparkWave {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-15deg); }
          40% { transform: rotate(15deg); }
          60% { transform: rotate(-10deg); }
          80% { transform: rotate(10deg); }
        }
        @keyframes sparkPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes particleOrbit {
          from { transform: rotate(0deg) translateX(${orbitRadius}px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(${orbitRadius}px) rotate(-360deg); }
        }
        @keyframes particleBurst {
          0% { opacity: 1; transform: scale(1) translate(0, 0); }
          100% { opacity: 0; transform: scale(0.5) translate(
            ${(Math.random() - 0.5) * size * 1.5}px,
            ${(Math.random() - 0.5) * size * 1.5}px
          ); }
        }
        @keyframes glowPulse {
          0%, 100% { filter: drop-shadow(0 0 ${size * 0.08}px rgba(91,142,255,0.6)); }
          50% { filter: drop-shadow(0 0 ${size * 0.2}px rgba(91,142,255,0.9)); }
        }

        .spark-idle { animation: sparkFloat 3s ease-in-out infinite, glowPulse 2s ease-in-out infinite; }
        .spark-happy { animation: sparkBounce 0.8s ease-out forwards, glowPulse 0.5s ease-in-out infinite; }
        .spark-celebrate { animation: sparkSpin 0.8s ease-in-out forwards, glowPulse 0.3s ease-in-out infinite; }
        .spark-wave { animation: sparkWave 1s ease-in-out forwards; }
        .spark-thinking { animation: sparkFloat 1.5s ease-in-out infinite; }

        .particle-orbit { animation: particleOrbit 4s linear infinite; }
        .particle-slow { animation: particleOrbit 6s linear infinite; }
      `}</style>

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={`spark-${emotion}`}
        style={{ overflow: 'visible' }}
      >
        {/* Outer glow ring */}
        <circle
          cx={center}
          cy={center}
          r={coreSize * 1.6}
          fill="rgba(91,142,255,0.08)"
          style={{ animation: 'sparkPulse 2s ease-in-out infinite' }}
        />

        {/* Orbiting particles */}
        {particles.map((p, i) => (
          <g key={i} style={{
            transformOrigin: `${center}px ${center}px`,
            animation: `particleOrbit ${3 + i * 0.3}s linear infinite`,
            animationDelay: `${p.delay}s`
          }}>
            <circle
              cx={p.x}
              cy={center}
              r={particleSize * (i % 2 === 0 ? 1 : 0.7)}
              fill={i % 3 === 0 ? '#A78BFA' : '#5B8EFF'}
              opacity={0.7 + (i * 0.05)}
            />
          </g>
        ))}

        {/* Core diamond shape */}
        <polygon
          points={`
            ${center},${center - coreSize}
            ${center + coreSize * 0.7},${center}
            ${center},${center + coreSize}
            ${center - coreSize * 0.7},${center}
          `}
          fill="url(#sparkGradient)"
          style={{ filter: `drop-shadow(0 0 ${size * 0.12}px rgba(91,142,255,0.8))` }}
        />

        {/* Eyes */}
        <circle cx={center - coreSize * 0.22} cy={center - coreSize * 0.1} r={coreSize * 0.12} fill="white" opacity={0.9} />
        <circle cx={center + coreSize * 0.22} cy={center - coreSize * 0.1} r={coreSize * 0.12} fill="white" opacity={0.9} />

        {/* Eye pupils */}
        <circle cx={center - coreSize * 0.2} cy={center - coreSize * 0.08} r={coreSize * 0.06} fill="#1a1a2e" />
        <circle cx={center + coreSize * 0.24} cy={center - coreSize * 0.08} r={coreSize * 0.06} fill="#1a1a2e" />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="sparkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7BA7FF" />
            <stop offset="50%" stopColor="#5B8EFF" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}
