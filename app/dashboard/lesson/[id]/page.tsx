'use client'

import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import LessonSkeleton from '@/components/lesson/LessonSkeleton'
import LessonContent from '@/components/lesson/LessonContent'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle2, ChevronRight, HelpCircle, Lock } from 'lucide-react'
import Link from 'next/link'
import { GeneratedLesson } from '@/types/ai'
import { LessonCompleteModal } from '@/components/mascot/LessonCompleteModal'
import { ReadingProgressBar } from '@/components/lesson/ReadingProgressBar'
import MascotOverlay from '@/components/mascot/MascotOverlay'
import LessonGeneratingOverlay from '@/components/lesson/LessonGeneratingOverlay'

const BADGE_DESCRIPTIONS: Record<string, string> = {
  phase_1: 'Completed Phase 1',
  phase_2: 'Completed Phase 2',
  phase_3: 'Completed Phase 3',
  phase_4: 'Completed Phase 4',
  phase_5: 'Completed full roadmap',
  streak_7: '7 day streak',
  streak_30: '30 day streak',
  perfect_quiz: '100% on a quiz',
  speed_learner: '3 lessons in one day'
}

export default function LessonPage() {
  const params = useParams()
  const router = useRouter()
  const lessonId = params.id as string
  const supabase = createClient()

  const [lessonTitle, setLessonTitle] = useState('')
  const [content, setContent] = useState<GeneratedLesson | null>(null)
  const [contentMap, setContentMap] = useState<Record<number, GeneratedLesson>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  // True only while the Claude API call is in-flight (shows animated overlay on top of skeleton)
  const [isAIGenerating, setIsAIGenerating] = useState(false)
  // True when the generation API call fails — shows a retry screen
  const [generationError, setGenerationError] = useState(false)
  const [generationErrorMsg, setGenerationErrorMsg] = useState('')
  const [isCompleting, setIsCompleting] = useState(false)
  const [status, setStatus] = useState<'not_started' | 'in_progress' | 'completed'>('not_started')
  
  const [depthLevel, setDepthLevel] = useState<number>(2)
  const [isChangingDepth, setIsChangingDepth] = useState(false)
  const [userId, setUserId] = useState('')
  const [subject, setSubject] = useState('')
  const [isPro, setIsPro] = useState(true)
  const [isLockedLesson, setIsLockedLesson] = useState(false)

  // Celebration Mascot Modal States
  const [showCelebration, setShowCelebration] = useState(false)
  const [streakDays, setStreakDays] = useState(0)
  const [nextLessonId, setNextLessonId] = useState<string | null>(null)

  // Badge celebration states
  const [newBadges, setNewBadges] = useState<any[]>([])
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0)
  const [phaseId, setPhaseId] = useState('')
  const [phaseTitle, setPhaseTitle] = useState('')
  const [phaseNumber, setPhaseNumber] = useState<number>(1)

  useEffect(() => {
    async function loadLesson() {
      // ── Step 1: authenticate ──────────────────────────────────────────────
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      // ── Step 2: fetch lesson (needed for all downstream queries) ──────────
      const { data: lesson, error } = await supabase
        .from('lessons')
        .select('title, content, roadmap_id, order_index, phase_id')
        .eq('id', lessonId)
        .maybeSingle()
      if (error || !lesson) { router.push('/dashboard/path'); return }
      setLessonTitle(lesson.title)

      // ── Step 3: fire all independent queries in parallel ──────────────────
      const [
        phaseRes,
        streakRes,
        nextLessonRes,
        progressRes,
        profileRes,
        roadmapRes,
      ] = await Promise.all([
        lesson.phase_id
          ? supabase.from('roadmap_phases').select('title, phase_number').eq('id', lesson.phase_id).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        supabase.from('streaks').select('current_streak').eq('user_id', user.id).maybeSingle(),
        lesson.roadmap_id
          ? supabase.from('lessons').select('id')
              .eq('roadmap_id', lesson.roadmap_id)
              .gt('order_index', lesson.order_index)
              .order('order_index', { ascending: true })
              .limit(1)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        supabase.from('lesson_progress').select('status').eq('user_id', user.id).eq('lesson_id', lessonId).maybeSingle(),
        supabase.from('profiles').select('learning_depth, subscription_tier, subscription_status, subscription_end_date').eq('id', user.id).maybeSingle(),
        lesson.roadmap_id
          ? supabase.from('roadmaps').select('goal_id').eq('id', lesson.roadmap_id).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ])

      if (lesson.phase_id) setPhaseId(lesson.phase_id)
      if ((phaseRes.data as any)?.title) setPhaseTitle((phaseRes.data as any).title)
      setStreakDays((streakRes.data as any)?.current_streak || 0)
      if ((nextLessonRes.data as any)?.id) setNextLessonId((nextLessonRes.data as any).id)
      if ((progressRes.data as any)?.status) setStatus((progressRes.data as any).status)

      // Calculate isPro status
      const prof = profileRes.data as any
      const tier = prof?.subscription_tier || 'free'
      const statusVal = prof?.subscription_status || 'inactive'
      const endDate = prof?.subscription_end_date || null
      
      const isProTier = tier === 'pro_monthly' || tier === 'pro_yearly'
      const isStatusActive = statusVal === 'active' || statusVal === 'trialing' || statusVal === 'trailing'
      const isExpired = endDate ? new Date(endDate) < new Date() : false
      const activeAndNotExpired = isProTier && isStatusActive && !isExpired
      
      setIsPro(activeAndNotExpired)

      // If !isPro and phase is > 1, lock the lesson!
      const phaseNum = (phaseRes.data as any)?.phase_number || 1
      setPhaseNumber(phaseNum)
      if (!activeAndNotExpired && phaseNum > 1) {
        setIsLockedLesson(true)
        setIsGenerating(false)
        setIsAIGenerating(false)
        return
      }

      // ── Step 4: fetch goal (depends on roadmap.goal_id from step 3) ───────
      let activeGoalDepth = null
      const goalId = (roadmapRes.data as any)?.goal_id
      if (goalId) {
        const { data: goal } = await supabase
          .from('learning_goals')
          .select('depth_level, subject')
          .eq('id', goalId)
          .maybeSingle()
        if (goal?.depth_level) activeGoalDepth = goal.depth_level
        if (goal?.subject) setSubject(goal.subject)
      }

      const initialDepth = activeGoalDepth ?? (profileRes.data as any)?.learning_depth ?? 2
      setDepthLevel(initialDepth)

      // ── Step 5: resolve content or trigger AI generation ──────────────────
      const dbContent = lesson.content as any
      let initialMap: Record<number, GeneratedLesson> = {}
      let activeContent: GeneratedLesson | null = null

      if (dbContent && typeof dbContent === 'object') {
        if ('sections' in dbContent) {
          initialMap = { [initialDepth]: dbContent as GeneratedLesson }
          activeContent = dbContent as GeneratedLesson
        } else {
          initialMap = dbContent as Record<number, GeneratedLesson>
          activeContent = dbContent[initialDepth] || null
        }
      }

      setContentMap(initialMap)

      if (activeContent) {
        setContent(activeContent)
      } else {
        // No cached content — call Claude
        setGenerationError(false)
        setIsGenerating(true)
        setIsAIGenerating(true)
        try {
          const res = await fetch('/api/ai/generate-lesson', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lessonId }),
          })
          // res.json() can throw if Vercel returns an HTML timeout page
          let result: any = {}
          try { result = await res.json() } catch { /* non-JSON body (504 etc.) */ }

          if (res.ok && result.content) {
            setContent(result.content)
            setContentMap(prev => ({ ...prev, [initialDepth]: result.content }))
            setStatus('in_progress')
          } else {
            // API returned error (500 / 504 timeout / model error)
            setGenerationErrorMsg(result.error || "Spark is having trouble compiling this lesson. Let's try reloading the page!");
            setGenerationError(true);
          }
        } catch (err) {
          console.error('Error generating lesson content:', err)
          setGenerationErrorMsg('We had trouble connecting to the study server. Please check your internet connection or try again.');
          setGenerationError(true);
        } finally {
          setIsGenerating(false)
          setIsAIGenerating(false)
        }
      }
    }

    loadLesson()
  }, [lessonId, supabase, router])

  // Background prefetching for next lesson and current quiz
  useEffect(() => {
    if (!content) return

    // Wait 3 seconds after lesson loads to avoid competing for network
    const prefetchTimer = setTimeout(async () => {
      // 1. Prefetch current lesson's quiz
      try {
        console.log(`[Prefetch] Proactively pre-generating quiz for current lesson: ${lessonId}`);
        await fetch('/api/ai/generate-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId }),
        })
      } catch (err) {
        console.warn('[Prefetch] Quiz prefetch failed:', err)
      }

      // 2. Prefetch next lesson
      if (nextLessonId) {
        try {
          console.log(`[Prefetch] Proactively pre-generating next lesson: ${nextLessonId}`);
          await fetch('/api/ai/generate-lesson', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lessonId: nextLessonId }),
          })
        } catch (err) {
          console.warn('[Prefetch] Next lesson prefetch failed:', err)
        }
      }
    }, 3000)

    return () => clearTimeout(prefetchTimer)
  }, [content, nextLessonId])

  const handleDepthChange = async (newDepth: number) => {
    setIsChangingDepth(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch lesson to get roadmap_id, then goal_id — these are sequential (dependency chain)
      const { data: lesson } = await supabase
        .from('lessons')
        .select('roadmap_id')
        .eq('id', lessonId)
        .maybeSingle()

      const roadmapId = lesson?.roadmap_id
      const goalId = roadmapId
        ? (await supabase.from('roadmaps').select('goal_id').eq('id', roadmapId).maybeSingle()).data?.goal_id
        : null

      // Fire profile + goal DB writes in parallel
      await Promise.all([
        supabase.from('profiles').update({ learning_depth: newDepth }).eq('id', user.id),
        goalId
          ? supabase.from('learning_goals').update({ depth_level: newDepth }).eq('id', goalId)
          : Promise.resolve(),
      ])

      setDepthLevel(newDepth)

      // Serve from local cache instantly if available
      if (contentMap[newDepth]) {
        setContent(contentMap[newDepth])
        setIsChangingDepth(false)
        return
      }

      // No cache — clear content (shows skeleton) then call Claude
      setContent(null)
      setGenerationError(false)
      setIsAIGenerating(true)

      let result: any = {}
      try {
        const res = await fetch('/api/ai/generate-lesson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId }),
        })
        try { result = await res.json() } catch { /* non-JSON body */ }
        if (res.ok && result.content) {
          setContent(result.content)
          setContentMap(prev => ({ ...prev, [newDepth]: result.content }))
          setStatus('in_progress')
        } else {
          setGenerationErrorMsg(result.error || "Spark is having trouble adapting this lesson. Let's try reloading the page!");
          setGenerationError(true);
        }
      } catch (err) {
        console.error('Error changing depth level:', err)
        setGenerationErrorMsg('We had trouble connecting to the study server. Please check your internet connection or try again.');
        setGenerationError(true);
      } finally {
        setIsChangingDepth(false);
        setIsAIGenerating(false);
      }
    } catch (err) {
      console.error('handleDepthChange outer error:', err)
      setIsChangingDepth(false)
    }
  }

  const handleMarkComplete = async () => {
    setIsCompleting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Upsert progress to completed
      const { error } = await supabase
        .from('lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          status: 'completed',
          completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,lesson_id' })

      if (!error) {
        setStatus('completed')
        setShowCelebration(true)
        
        // Trigger badge check on lesson completion
        try {
          const badgeRes = await fetch('/api/badges/check-and-award', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lessonId })
          })
          if (badgeRes.ok) {
            const badgeData = await badgeRes.json()
            if (badgeData.newBadges && badgeData.newBadges.length > 0) {
              setNewBadges(badgeData.newBadges)
              setCurrentBadgeIndex(0)
            }
          }
        } catch (badgeErr) {
          console.error('Error checking badges on lesson complete:', badgeErr)
        }
      } else {
        console.error('Error updating progress:', error)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsCompleting(false)
    }
  }

  const handleTakeQuiz = () => {
    router.push(`/dashboard/quiz/${lessonId}`)
  }

  if (isLockedLesson) {
    return (
      <div className="py-20 px-4 max-w-lg mx-auto text-center space-y-6 animate-page-enter">
        <div className="inline-flex p-4 bg-primary/10 border border-primary/20 rounded-2xl text-primary">
          <Lock className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-bold text-text-1">Lesson Locked 🔒</h1>
          <p className="text-text-2 text-sm leading-relaxed">
            &quot;{lessonTitle}&quot; is part of a Phase that is locked under your current plan. Upgrade to Pro to unlock this lesson and the rest of the roadmap.
          </p>
        </div>
        <div className="pt-4 border-t border-border flex flex-col gap-3">
          <Link href="/dashboard/settings">
            <Button className="w-full bg-primary hover:bg-primary/95 text-white font-bold h-11 rounded-xl shadow-[0_0_12px_rgba(91,142,255,0.2)]">
              Upgrade to Pro
            </Button>
          </Link>
          <Link href="/dashboard/path">
            <Button variant="ghost" className="w-full text-text-2 text-xs font-semibold">
              Back to Roadmap Path
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (isGenerating || isChangingDepth || !content) {
    // Show a friendly error screen with retry when generation fails
    if (generationError) {
      return (
        <div className="py-6">
          <div className="max-w-[720px] mx-auto">
            <Link
              href="/dashboard/path"
              className="inline-flex items-center space-x-2 text-xs text-text-2 hover:text-text-1 mb-8 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Path</span>
            </Link>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
                padding: '48px 32px',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                background: 'var(--color-surface)',
                textAlign: 'center',
                marginTop: '32px',
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'rgba(255,100,80,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                }}
              >
                ⚡
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-1)', margin: 0 }}>
                  Cognara is taking longer than usual
                </p>
                <p style={{ fontSize: '13px', color: 'var(--color-text-2)', margin: 0, maxWidth: '360px', lineHeight: '1.6' }}>
                  The lesson couldn&apos;t load right now. This sometimes happens when Cognara is busy crafting your lesson. Give it a moment and try again.
                </p>
                {generationErrorMsg && (
                  <p style={{
                    fontSize: '11px',
                    color: 'var(--color-text-2)',
                    margin: '8px 0 0',
                    maxWidth: '420px',
                    lineHeight: '1.5',
                    padding: '8px 12px',
                    background: 'rgba(255,100,80,0.07)',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    wordBreak: 'break-word',
                  }}>
                    {generationErrorMsg}
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  setGenerationError(false)
                  setIsGenerating(false)
                  setIsAIGenerating(false)
                  // Re-trigger the lesson load by resetting content
                  setContent(null)
                  // Force re-run loadLesson
                  const supabaseClient = createClient()
                  async function retry() {
                    const { data: { user } } = await supabaseClient.auth.getUser()
                    if (!user) return
                    setIsGenerating(true)
                    setIsAIGenerating(true)
                    try {
                      const res = await fetch('/api/ai/generate-lesson', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ lessonId }),
                      })
                      let result: any = {}
                      try { result = await res.json() } catch { /* non-JSON */ }
                      if (res.ok && result.content) {
                        setContent(result.content)
                        setStatus('in_progress')
                      } else {
                        setGenerationErrorMsg(result.error || 'Unknown error.')
                        setGenerationError(true)
                      }
                    } catch {
                      setGenerationError(true)
                    } finally {
                      setIsGenerating(false)
                      setIsAIGenerating(false)
                    }
                  }
                  retry()
                }}
                style={{
                  padding: '10px 28px',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="py-6 space-y-4">
        <div className="max-w-[720px] mx-auto">
          <Link
            href="/dashboard/path"
            className="inline-flex items-center space-x-2 text-xs text-text-2 hover:text-text-1 mb-6 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Path</span>
          </Link>
        </div>
        {/* Relative wrapper so the overlay can position itself over the skeleton */}
        <div className="relative">
          <LessonSkeleton />
          {isAIGenerating && <LessonGeneratingOverlay />}
        </div>
      </div>
    )
  }

  const isCompleted = status === 'completed'

  return (
    <>
      <ReadingProgressBar estimatedMinutes={content.estimated_minutes || 5} />
      <div className="py-4 space-y-6">
      {/* Back button container */}
      <div className="max-w-[720px] mx-auto mb-2">
        <Link
          href="/dashboard/path"
          className="inline-flex items-center space-x-2 text-xs text-text-2 hover:text-text-1 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Path</span>
        </Link>
      </div>

      {/* Main Lesson Content */}
      <LessonContent 
        lesson={content} 
        depthLevel={depthLevel}
        isChangingDepth={isChangingDepth}
        onDepthChange={handleDepthChange}
        lessonTitle={lessonTitle}
        subject={subject}
        lessonId={lessonId}
        userId={userId}
        isPro={isPro}
        phaseNumber={phaseNumber}
      />

      {/* Bottom controls panel */}
      <div className="max-w-[720px] mx-auto pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-12">
        <div className="flex items-center space-x-2">
          {isCompleted ? (
            <div className="flex items-center space-x-1.5 text-xs text-success bg-success/10 border border-success/15 px-3 py-1.5 rounded-full font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              <span>You have completed this lesson!</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 text-xs text-text-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span>Currently in progress</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {/* Mark Complete button */}
          {!isCompleted ? (
            <Button
              onClick={handleMarkComplete}
              disabled={isCompleting}
              className="h-10 px-5 bg-transparent border border-border hover:bg-surface-alt text-text-1 rounded-sm text-xs font-semibold"
            >
              {isCompleting ? 'Saving...' : 'Mark as Complete'}
            </Button>
          ) : (
            <Button
              disabled
              className="h-10 px-5 bg-success/10 border border-success/20 text-success rounded-sm text-xs font-semibold opacity-75"
            >
              Completed
            </Button>
          )}

          {/* Take Quiz button */}
          <Button
            onClick={handleTakeQuiz}
            className="h-10 px-5 bg-primary hover:bg-primary/90 text-white rounded-sm text-xs font-semibold shadow-[0_0_12px_rgba(91,142,255,0.2)]"
          >
            <span>Take Quiz</span>
            <HelpCircle className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </div>

      {showCelebration && (
        <LessonCompleteModal
          lessonTitle={lessonTitle}
          xpEarned={15}
          streakDays={streakDays}
          onQuiz={handleTakeQuiz}
          onNext={() => {
            if (nextLessonId) {
              router.push(`/dashboard/lesson/${nextLessonId}`)
              setShowCelebration(false)
            } else {
              router.push('/dashboard/path')
            }
          }}
          onDismiss={() => {
            setShowCelebration(false)
            router.refresh()
          }}
        />
      )}

      {newBadges.length > 0 && currentBadgeIndex < newBadges.length && (
        (() => {
          const badge = newBadges[currentBadgeIndex]
          const isPhaseBadge = badge.badge_key.startsWith('phase')
          
          return (
            <MascotOverlay
              emotion="celebrate"
              messages={
                isPhaseBadge
                  ? [
                      `Phase complete! 🏆`,
                      `You finished every lesson in ${phaseTitle || badge.badge_label}`,
                      `Your certificate is ready to download.`
                    ]
                  : [
                      `New badge earned! ${badge.badge_emoji}`,
                      `${badge.badge_label}`,
                      BADGE_DESCRIPTIONS[badge.badge_key] || ''
                    ]
              }
              ctaLabel={isPhaseBadge ? "Download Certificate" : "Keep going!"}
              onDismiss={() => {
                if (isPhaseBadge) {
                  window.open(`/api/certificate/generate?phaseId=${phaseId}`, '_blank')
                }
                
                if (currentBadgeIndex + 1 < newBadges.length) {
                  setCurrentBadgeIndex(currentBadgeIndex + 1)
                } else {
                  setNewBadges([])
                  window.dispatchEvent(new Event('badge-earned'))
                  router.refresh()
                }
              }}
            />
          )
        })()
      )}
      </div>
    </>
  )
}
