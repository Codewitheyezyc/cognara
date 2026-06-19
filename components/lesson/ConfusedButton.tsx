'use client'

import React, { useState } from 'react'
import { Lock } from 'lucide-react'

interface ConfusedButtonProps {
  sectionHeading: string
  sectionBody: string
  subject: string
  depthLevel: number
  children: React.ReactNode
  /** Optional element (e.g. BookmarkButton) rendered to the left of the Confused pill in the header row */
  bookmarkSlot?: React.ReactNode
  isPro?: boolean
  onUpgradePrompt?: () => void
}

export function ConfusedButton({
  sectionHeading,
  sectionBody,
  subject,
  depthLevel,
  children,
  bookmarkSlot,
  isPro = false,
  onUpgradePrompt,
}: ConfusedButtonProps) {
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
      {/* Header row: heading | [bookmark icon] [confused pill] */}
      <div className="flex items-start justify-between gap-2 w-full">
        <h3 className="font-heading text-lg font-semibold text-text-1 min-w-0 flex-1">
          {sectionHeading}
        </h3>

        <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
          {/* BookmarkButton injected from parent — rendered inline, no z-index clash */}
          {bookmarkSlot}

          {/* Remaining Count Badge */}
          {isPro && sectionClicks < 3 && lessonClicks < 10 && dailyRemaining !== 0 && (
            <span className="text-[10px] text-text-3 font-mono">
              {dailyRemaining !== null ? `${dailyRemaining} left today` : '15 left today'}
            </span>
          )}

          {/* Confused? pill */}
          {sectionClicks < 3 && (
            <button
              type="button"
              onClick={handleConfusedClick}
              disabled={isPro && (status === 'loading' || status === 'resolved' || cooldown > 0 || lessonClicks >= 10 || dailyRemaining === 0)}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all duration-200 cursor-pointer flex-shrink-0 flex items-center gap-1 ${
                !isPro
                  ? 'text-text-3 border-border hover:bg-surface-alt hover:text-text-2'
                  : status === 'idle' && cooldown === 0 && lessonClicks < 10 && dailyRemaining !== 0
                  ? 'text-text-3 border-border hover:bg-surface-alt hover:text-text-2'
                  : status === 'loading'
                  ? 'text-primary border-primary/30 bg-primary/10 animate-pulse-subtle'
                  : status === 'success'
                  ? 'text-primary border-primary/30 bg-primary/10'
                  : status === 'resolved'
                  ? 'text-success border-success/30 bg-success/10 font-semibold cursor-default'
                  : 'text-text-3 border-border opacity-50 cursor-not-allowed'
              }`}
              style={{
                borderColor: isPro && status === 'resolved' ? 'rgba(52,211,153,0.3)' : undefined,
                color: isPro && status === 'resolved' ? 'var(--color-success)' : undefined,
              }}
            >
              {!isPro && (
                <>
                  <Lock className="h-3 w-3" />
                  <span>Confused?</span>
                </>
              )}
              {isPro && cooldown > 0 && `Wait ${cooldown}s`}
              {isPro && cooldown === 0 && lessonClicks >= 10 && 'Session limit reached'}
              {isPro && cooldown === 0 && dailyRemaining === 0 && 'Limit reached'}
              {isPro && cooldown === 0 && lessonClicks < 10 && dailyRemaining !== 0 && (
                <>
                  {status === 'idle' && 'Confused? 💡'}
                  {status === 'loading' && 'Thinking...'}
                  {status === 'success' && 'Thinking...'}
                  {status === 'resolved' && '✓ Clearer now'}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {children}

      {/* Section-specific limit warning */}
      {sectionClicks >= 3 && (
        <div className="text-xs text-text-3 bg-surface-alt/40 border border-border p-3.5 rounded-lg leading-relaxed mt-2">
          ℹ️ You've seen 3 explanations for this section. Try re-reading it or move to the next part.
        </div>
      )}

      {/* Daily limit warning */}
      {isPro && dailyRemaining === 0 && (
        <div className="text-xs text-accent bg-accent/5 border border-accent/20 p-3.5 rounded-lg leading-relaxed mt-2">
          🔒 You've used your daily explanation limit. Come back tomorrow for more.
        </div>
      )}

      {status === 'success' && sectionClicks < 3 && (
        <div
          className="animate-slideDown space-y-3"
          style={{
            background: 'rgba(91,142,255,0.06)',
            border: '1px solid rgba(91,142,255,0.2)',
            borderLeft: '3px solid var(--color-primary)',
            borderRadius: '10px',
            padding: '16px 20px',
          }}
        >
          <div className="flex items-center space-x-2 text-primary">
            <span className="text-sm">💡</span>
            <span className="text-xs font-semibold uppercase tracking-wider">
              Let me explain this differently
            </span>
          </div>

          <p className="text-text-2 text-sm leading-relaxed whitespace-pre-line">
            {explanation}
          </p>

          <button
            type="button"
            onClick={handleGotItClick}
            className="text-xs font-bold text-primary border border-primary/20 bg-primary/10 hover:bg-primary/20 transition-colors duration-150 px-3 py-1.5 rounded-[6px] cursor-pointer"
          >
            Got it! ✓
          </button>
        </div>
      )}
    </div>
  )
}
