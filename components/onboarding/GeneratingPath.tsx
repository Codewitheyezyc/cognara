'use client'

import { useState, useEffect } from 'react'
import { Zap } from 'lucide-react'

const statusMessages = [
  'Analyzing learning goals...',
  'Parsing primary subject topics...',
  'Structuring progressive curriculum phases...',
  'Generating modular lesson timelines...',
  'Calibrating vocabulary for experience level...',
  'Preparing quiz questions and insights engine...',
  'Assembling your personalized Learning OS...',
]

export default function GeneratingPath() {
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % statusMessages.length)
    }, 1500)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-8 animate-page-enter">
      {/* Animated Glowing Zap Emblem */}
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 animate-pulse" />
        <div className="relative flex items-center justify-center w-20 h-20 rounded-full border border-primary/30 bg-surface-alt text-primary shadow-[0_0_32px_rgba(91,142,255,0.15)]">
          <Zap className="h-10 w-10 animate-bounce" strokeWidth={1.5} />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-heading text-2xl font-bold text-text-1">Building Your Learning Path</h2>
        <div className="h-6 overflow-hidden">
          <p className="text-sm font-mono text-accent uppercase tracking-wider transition-all duration-300">
            {statusMessages[msgIndex]}
          </p>
        </div>
        <p className="text-xs text-text-3 max-w-[280px] mx-auto">
          Please wait while Cognara customizes every milestone for your mind.
        </p>
      </div>

      {/* Pulsing loading bar */}
      <div className="w-full max-w-[240px] h-1.5 bg-border rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary to-accent w-1/2 rounded-full animate-[shimmer_1.5s_infinite_linear]" style={{ backgroundSize: '200% 100%' }} />
      </div>
    </div>
  )
}
