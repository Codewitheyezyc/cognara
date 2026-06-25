'use client'

import React, { useState, useEffect } from 'react'
import { Spark } from '@/components/mascot/Spark'
import { X, Sparkles } from 'lucide-react'

interface SparkDialogueProps {
  userName: string
  streak: number
  level: number
}

export default function SparkDialogue({ userName, streak, level }: SparkDialogueProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [message, setMessage] = useState('')
  const [emotion, setEmotion] = useState<'idle' | 'happy' | 'celebrate' | 'thinking' | 'wave'>('wave')

  useEffect(() => {
    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem('spark_dialogue_dismissed') === 'true'
    if (isDismissed) {
      setIsVisible(false)
      return
    }

    // Determine message and emotion dynamically
    const quotes = []
    
    if (streak === 0) {
      quotes.push({
        text: `Welcome to Cognara, ${userName}! Let's launch your study streak today. A single lesson is all it takes! 🚀`,
        emotion: 'wave' as const
      })
      quotes.push({
        text: `Synaptic growth starts with a single step. Complete a lesson to set your daily learning streak! 🧠`,
        emotion: 'idle' as const
      })
    } else if (streak <= 3) {
      quotes.push({
        text: `You're building momentum! Keep that ${streak}-day study streak hot today. 🔥`,
        emotion: 'happy' as const
      })
      quotes.push({
        text: `Consistency is building! Day ${streak} looks good on you. Let's lock in another lesson. ⚡`,
        emotion: 'wave' as const
      })
    } else {
      quotes.push({
        text: `Outstanding consistency! A ${streak}-day active learning streak is a serious achievement. Keep pushing! 🏆`,
        emotion: 'celebrate' as const
      })
      quotes.push({
        text: `Synapses firing, habits locking in! Study today to preserve your powerful ${streak}-day streak! 🧠`,
        emotion: 'happy' as const
      })
    }

    // Add general cognitive tips
    quotes.push({
      text: `Did you know? Completing a lesson grants you +100 XP. Perfect quiz scores award a +50 XP bonus! 🧠`,
      emotion: 'happy' as const
    })
    quotes.push({
      text: `Want a challenge? Switch to 'Expert' depth inside any lesson to customize your cognitive loading! 📚`,
      emotion: 'thinking' as const
    })
    quotes.push({
      text: `Check out your Cognitive Quests widget on the dashboard. Claim completed goals for massive XP boosts! 🎯`,
      emotion: 'celebrate' as const
    })
    quotes.push({
      text: `Need to refresh? Swap between the winding Skill Tree and Classic list view under the 'My Path' tab! 🗺️`,
      emotion: 'idle' as const
    })
    quotes.push({
      text: `Active recall is the fastest path to mastery. Try retaking a quiz to test your long-term retention! 🔄`,
      emotion: 'thinking' as const
    })

    // Pick a random quote
    const selected = quotes[Math.floor(Math.random() * quotes.length)]
    setMessage(selected.text)
    setEmotion(selected.emotion)
  }, [userName, streak])

  const handleDismiss = () => {
    setIsVisible(false)
    sessionStorage.setItem('spark_dialogue_dismissed', 'true')
  }

  if (!isVisible) return null

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent p-5 shadow-lg flex items-center gap-5 transition-all duration-300 group">
      {/* Decorative top border glow */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/50 to-accent/50" />

      {/* Dismiss Button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-text-3 hover:text-text-1 transition-colors p-1 rounded-md hover:bg-surface-alt/50"
        title="Dismiss Spark"
      >
        <X size={14} />
      </button>

      {/* Spark Avatar */}
      <div className="shrink-0 flex items-center justify-center p-1 bg-surface-alt/60 rounded-xl border border-border/80 shadow-inner">
        <Spark emotion={emotion} size={64} />
      </div>

      {/* Dialog Bubble */}
      <div className="flex-1 space-y-2 relative min-w-0 pr-4">
        {/* Spark Label */}
        <div className="flex items-center gap-1.5 text-primary text-[10px] font-bold font-mono uppercase tracking-wider">
          <Sparkles size={11} className="animate-pulse" />
          <span>Coach Spark</span>
        </div>

        {/* Message */}
        <p className="text-text-1 text-xs md:text-sm font-medium leading-relaxed max-w-[550px]">
          {message}
        </p>
      </div>
    </div>
  )
}
