'use client'

import { useState, useEffect } from 'react'
import { Zap, Lightbulb } from 'lucide-react'

const statusMessages = [
  'Analyzing learning goals...',
  'Parsing primary subject topics...',
  'Structuring progressive curriculum phases...',
  'Generating modular lesson timelines...',
  'Calibrating vocabulary for experience level...',
  'Preparing quiz questions and insights engine...',
  'Assembling your personalized Learning OS...',
]

const learningTips = [
  "Active recall (testing yourself) is 150% more effective for memory than re-reading.",
  "Studying in short 25-minute blocks (the Pomodoro technique) keeps focus at its peak.",
  "Explaining a concept to someone else in simple terms is the fastest way to master it.",
  "Your brain consolidates learning during sleep. A good night's rest is part of studying!",
  "Spacing out your study sessions over several days leads to double the retention rate.",
  "Making mistakes during practice strengthens the neural pathways that build true expertise.",
  "Combining visuals with text (dual coding) helps you process and store information faster."
]

export default function GeneratingPath() {
  const [msgIndex, setMsgIndex] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  // Rotate status messages
  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % statusMessages.length)
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  // Rotate learning tips
  useEffect(() => {
    // Select a random initial tip
    setTipIndex(Math.floor(Math.random() * learningTips.length))

    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % learningTips.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [])

  // Tick up progress bar slowly to 90%
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90
        const increment = Math.floor(Math.random() * 4) + 2 // 2% to 5%
        return Math.min(prev + increment, 90)
      })
    }, 800)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] text-center space-y-8 animate-page-enter max-w-[420px] mx-auto p-4">
      {/* Animated Glowing Zap Emblem */}
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 animate-pulse" />
        <div className="relative flex items-center justify-center w-20 h-20 rounded-full border border-primary/30 bg-surface-alt text-primary shadow-[0_0_32px_rgba(91,142,255,0.15)] animate-learning-pulse">
          <Zap className="h-10 w-10 animate-bounce" strokeWidth={1.5} />
        </div>
      </div>

      <div className="space-y-3 w-full">
        <h2 className="font-heading text-2xl font-bold text-text-1">Building Your Learning Path</h2>
        <div className="h-6 overflow-hidden">
          <p className="text-sm font-mono text-accent uppercase tracking-wider transition-all duration-300">
            {statusMessages[msgIndex]}
          </p>
        </div>
        <p className="text-xs text-text-3 max-w-[300px] mx-auto">
          Please wait while Cognara customizes every milestone for your mind.
        </p>
      </div>

      {/* Progress bar container */}
      <div className="w-full space-y-2">
        <div className="flex justify-between text-[10px] text-text-3 font-mono">
          <span>CURATING SCHEMAS</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-2 bg-border rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>

      {/* Glassmorphic Trivia / Tips Card */}
      <div className="w-full p-4 rounded-xl border border-border/60 bg-surface-alt/50 backdrop-blur-sm shadow-sm flex items-start space-x-3 text-left transition-all duration-500">
        <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0 mt-0.5">
          <Lightbulb className="h-4 w-4" strokeWidth={2} />
        </div>
        <div className="space-y-1">
          <h4 className="text-[10px] font-bold text-text-2 font-mono uppercase tracking-wider">Learning Tip</h4>
          <p className="text-xs text-text-2 leading-relaxed transition-opacity duration-300">
            {learningTips[tipIndex]}
          </p>
        </div>
      </div>
    </div>
  )
}
