'use client'

import React, { useState } from 'react'
import { Lock } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface ConfusedButtonProps {
  sectionHeading: string
  sectionBody: string
  subject: string
  depthLevel: number
  children: React.ReactNode
  isPro?: boolean
  onUpgradePrompt?: () => void
}

export function ConfusedButton({
  sectionHeading,
  sectionBody,
  subject,
  depthLevel,
  children,
  isPro = false,
  onUpgradePrompt,
}: ConfusedButtonProps) {
  const { toast } = useToast()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'resolved'>('idle')
  const [explanation, setExplanation] = useState('')

  // Rate Limiting States
  const [sectionClicks, setSectionClicks] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return Number(sessionStorage.getItem(`confused_clicks_${sectionHeading}`) || '0')
    }
    return 0
  })

  const [lessonClicks, setLessonClicks] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return Number(sessionStorage.getItem('confused_lesson_clicks') || '0')
    }
    return 0
  })

  const [dailyRemaining, setDailyRemaining] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cognara_confused_daily_remaining')
      const storedDate = localStorage.getItem('cognara_confused_daily_date')
      const today = new Date().toISOString().split('T')[0]
      if (storedDate === today && stored !== null) {
        return Number(stored)
      }
    }
    return null
  })

  const [cooldown, setCooldown] = useState<number>(0)

  React.useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => {
      setCooldown(prev => prev - 1)
    }, 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const handleConfusedClick = async () => {
    if (typeof window !== 'undefined' && !window.navigator.onLine) {
      toast("You are offline. Cognitive explanations require an active internet connection.", "error")
      return
    }

    if (!isPro) {
      onUpgradePrompt?.()
      return
    }

    if (cooldown > 0 || sectionClicks >= 3 || lessonClicks >= 10 || dailyRemaining === 0) return
    if (status === 'loading' || status === 'resolved' || status === 'success') return

    // Cooldown check for global click timing (prevents rapid clicking)
    const lastClickTimeStr = localStorage.getItem('cognara_confused_last_click')
    if (lastClickTimeStr) {
      const elapsed = Date.now() - Number(lastClickTimeStr)
      if (elapsed < 8000) {
        setCooldown(Math.ceil((8000 - elapsed) / 1000))
        return
      }
    }

    setStatus('loading')
    try {
      const res = await fetch('/api/ai/simplify-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionHeading, sectionBody, subject, depthLevel }),
      })

      if (res.status === 429) {
        setDailyRemaining(0)
        localStorage.setItem('cognara_confused_daily_remaining', '0')
        localStorage.setItem('cognara_confused_daily_date', new Date().toISOString().split('T')[0])
        throw new Error('Daily limit reached')
      }

      if (!res.ok) throw new Error('Failed to fetch simplified explanation')
      const data = await res.json()

      const newSecClicks = sectionClicks + 1
      setSectionClicks(newSecClicks)
      sessionStorage.setItem(`confused_clicks_${sectionHeading}`, String(newSecClicks))

      const newLesClicks = lessonClicks + 1
      setLessonClicks(newLesClicks)
      sessionStorage.setItem('confused_lesson_clicks', String(newLesClicks))

      if (data.remaining !== undefined) {
        setDailyRemaining(data.remaining)
        localStorage.setItem('cognara_confused_daily_remaining', String(data.remaining))
        localStorage.setItem('cognara_confused_daily_date', new Date().toISOString().split('T')[0])
      }

      // Record last click time for 8s cooldown
      localStorage.setItem('cognara_confused_last_click', String(Date.now()))
      setCooldown(8)

      setExplanation(data.explanation)
      setStatus('success')
    } catch (err) {
      console.error(err)
      setStatus('idle')
    }
  }

  const handleGotItClick = () => setStatus('resolved')

  return (
    <div className="space-y-3 w-full">
      {/* Header row: heading | [bookmark icon] */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 w-full">
        <h3 className="font-heading text-base sm:text-lg font-semibold text-text-1 min-w-0 flex-1">
          {sectionHeading}
        </h3>

        <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5 sm:self-start self-start sm:mt-0 mt-1 flex-wrap">
        </div>
      </div>

      {children}
    </div>
  )
}
