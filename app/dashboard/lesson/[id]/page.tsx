'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import LessonSkeleton from '@/components/lesson/LessonSkeleton'
import LessonContent from '@/components/lesson/LessonContent'
import { SparkDrawer } from '@/components/lesson/SparkDrawer'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle2, Lock, Sparkles, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { GeneratedLesson } from '@/types/ai'
import { LessonCompleteModal } from '@/components/mascot/LessonCompleteModal'
import { ReadingProgressBar } from '@/components/lesson/ReadingProgressBar'
import MascotOverlay from '@/components/mascot/MascotOverlay'
import LessonGeneratingOverlay from '@/components/lesson/LessonGeneratingOverlay'
import { useToast } from '@/components/ui/toast'
import { SoundEffects } from '@/lib/sound'

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
  const searchParams = useSearchParams()
  const isReentry = searchParams.get('reentry') === 'true'
  const lessonId = params.id as string
  const supabase = createClient()
  const { toast } = useToast()

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
  const [heartsCount, setHeartsCount] = useState<number>(3)
  const [hasRefilledThisSession, setHasRefilledThisSession] = useState(false)
  
  const [depthLevel, setDepthLevel] = useState<number>(2)
  const [isChangingDepth, setIsChangingDepth] = useState(false)
  const [userId, setUserId] = useState('')
  const [subject, setSubject] = useState('')
  const [isPro, setIsPro] = useState(true)
  const [isLockedLesson, setIsLockedLesson] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [isCached, setIsCached] = useState(false)

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

  // Focus-mode lesson UX state
  const [hasReachedBottom, setHasReachedBottom] = useState(false)
  const [isSparkOpen, setIsSparkOpen] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)

  const handleProgressChange = useCallback((pct: number) => {
    if (pct >= 98) setHasReachedBottom(true)
  }, [])

  useEffect(() => {
    const handleHeartsChanged = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail && detail.hearts !== undefined) {
        setHeartsCount(detail.hearts)
      }
    }
    window.addEventListener('cognara_hearts_changed', handleHeartsChanged)
    return () => window.removeEventListener('cognara_hearts_changed', handleHeartsChanged)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOffline(!window.navigator.onLine)
      const handleOnline = () => setIsOffline(false)
      const handleOffline = () => setIsOffline(true)
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  // Save the lesson ID in sessionStorage to return to it when going back to the tree view
  useEffect(() => {
    if (typeof window !== 'undefined' && lessonId) {
      sessionStorage.setItem('lastViewedLessonId', lessonId)
    }
  }, [lessonId])

  useEffect(() => {
    async function loadLesson() {
      // ── Step 0: Check offline status first ──────────────────────────────────
      if (typeof window !== 'undefined' && !window.navigator.onLine) {
        setIsOffline(true)
        try {
          const stored = localStorage.getItem('cognara_downloaded_lessons')
          const downloads = stored ? JSON.parse(stored) : {}
          if (downloads[lessonId]) {
            const entry = downloads[lessonId]
            setIsCached(true)
            setLessonTitle(entry.title)
            setSubject(entry.subject || 'Development')
            setDepthLevel(entry.depthLevel || 2)
            setIsPro(true)
            
            const dbContent = entry.lesson
            if (dbContent && typeof dbContent === 'object') {
              setContent(dbContent)
              setContentMap({ [entry.depthLevel || 2]: dbContent })
            }
            return
          }
        } catch (err) {
          console.error('Failed to parse offline downloads:', err)
        }
        setIsCached(false)
        return
      }

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
        lessonsRes,
        phasesRes,
        progressRes,
        profileRes,
        roadmapRes,
      ] = await Promise.all([
        lesson.phase_id
          ? supabase.from('roadmap_phases').select('title, phase_number').eq('id', lesson.phase_id).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        supabase.from('streaks').select('current_streak').eq('user_id', user.id).maybeSingle(),
        lesson.roadmap_id
          ? supabase.from('lessons').select('id, phase_id, order_index').eq('roadmap_id', lesson.roadmap_id)
          : Promise.resolve({ data: null, error: null }),
        lesson.roadmap_id
          ? supabase.from('roadmap_phases').select('id, phase_number').eq('roadmap_id', lesson.roadmap_id)
          : Promise.resolve({ data: null, error: null }),
        supabase.from('lesson_progress').select('status').eq('user_id', user.id).eq('lesson_id', lessonId).maybeSingle(),
        supabase.from('profiles').select('name, learning_depth, subscription_tier, subscription_status, subscription_end_date, hearts').eq('id', user.id).maybeSingle(),
        lesson.roadmap_id
          ? supabase.from('roadmaps').select('goal_id').eq('id', lesson.roadmap_id).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ])

      if (lesson.phase_id) setPhaseId(lesson.phase_id)
      if ((phaseRes.data as any)?.title) setPhaseTitle((phaseRes.data as any).title)
      setStreakDays((streakRes.data as any)?.current_streak || 0)

      // Calculate nextLessonId using JS-based sorting matching the roadmap progression
      let resolvedNextLessonId: string | null = null
      if (lessonsRes.data && phasesRes.data) {
        const lessonsList = lessonsRes.data
        const phasesList = phasesRes.data

        const lessonsByPhase: Record<string, any[]> = {}
        lessonsList.forEach((l: any) => {
          if (!lessonsByPhase[l.phase_id]) {
            lessonsByPhase[l.phase_id] = []
          }
          lessonsByPhase[l.phase_id].push(l)
        })

        const sortedPhases = [...phasesList].sort((a: any, b: any) => a.phase_number - b.phase_number)

        const orderedLessons: any[] = []
        sortedPhases.forEach((phase: any) => {
          const phaseLessons = lessonsByPhase[phase.id] || []
          phaseLessons.sort((a: any, b: any) => a.order_index - b.order_index)
          orderedLessons.push(...phaseLessons)
        })

        const currIdx = orderedLessons.findIndex((l: any) => l.id === lessonId)
        if (currIdx !== -1 && currIdx < orderedLessons.length - 1) {
          resolvedNextLessonId = orderedLessons[currIdx + 1].id
        }
      }
      setNextLessonId(resolvedNextLessonId)
      if ((progressRes.data as any)?.status) setStatus((progressRes.data as any).status)

      // Calculate isPro status
      const prof = profileRes.data as any
      if (prof) {
        setHeartsCount(prof.hearts ?? 3)
        if (prof.name) setUserName(prof.name)
      }
      const tier = prof?.subscription_tier || 'free'
      const statusVal = prof?.subscription_status || 'inactive'
      const endDate = prof?.subscription_end_date || null
      
      const isProTier = tier === 'pro_monthly' || tier === 'pro_yearly'
      const isStatusActive = statusVal === 'active' || statusVal === 'trialing' || statusVal === 'trailing'
      const isExpired = endDate ? new Date(endDate) < new Date() : false
      const activeAndNotExpired = isProTier && isStatusActive && !isExpired
      
      const isAdmin = user.id === process.env.NEXT_PUBLIC_ADMIN_USER_ID || user.id === '4c1fbae5-c423-42e7-8394-1112fe00d42e'
      const hasProAccess = activeAndNotExpired || isAdmin
      
      setIsPro(hasProAccess)

      // If !isPro and phase is > 1, lock the lesson!
      const phaseNum = (phaseRes.data as any)?.phase_number || 1
      setPhaseNumber(phaseNum)
      if (!hasProAccess && phaseNum > 1) {
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
  }, [content, nextLessonId, lessonId])

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

        // Award +100 XP
        try {
          const { data: xpData, error: xpError } = await supabase.rpc('add_xp', {
            user_id: user.id,
            amount: 100
          })
          if (!xpError && xpData) {
            window.dispatchEvent(new CustomEvent('cognara_xp_gained', {
              detail: {
                xpGained: 100,
                newXp: xpData.xp,
                newLevel: xpData.level,
                leveledUp: xpData.leveled_up
              }
            }))
            toast('Brain Powered! +100 XP Earned 🧠')
          }
        } catch (xpErr) {
          console.error('Error awarding XP on lesson complete:', xpErr)
        }
        
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

  const handleRefillHeartReview = async () => {
    setIsCompleting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: newHearts, error } = await supabase.rpc('refill_heart', { user_id: user.id })

      if (!error) {
        setHasRefilledThisSession(true)
        const updatedHearts = typeof newHearts === 'number' ? newHearts : (heartsCount + 1)
        setHeartsCount(updatedHearts)
        
        SoundEffects.play('success')

        // Dispatch hearts changed event
        window.dispatchEvent(new CustomEvent('cognara_hearts_changed', {
          detail: { hearts: updatedHearts }
        }))
        toast('Heart Refilled! ❤️ +1 Cognitive Energy')
      } else {
        console.error('Error refilling heart:', error)
        toast('Failed to refill heart.', 'error')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsCompleting(false)
    }
  }

  const handleTakeQuiz = async () => {
    // Mark as complete if not already done
    if (status !== 'completed') {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('lesson_progress').upsert({
            user_id: user.id,
            lesson_id: lessonId,
            status: 'completed',
            completed_at: new Date().toISOString(),
          }, { onConflict: 'user_id,lesson_id' })
          setStatus('completed')
          // Award XP silently
          try {
            const { data: xpData } = await supabase.rpc('add_xp', { user_id: user.id, amount: 100 })
            if (xpData) {
              window.dispatchEvent(new CustomEvent('cognara_xp_gained', {
                detail: { xpGained: 100, newXp: xpData.xp, newLevel: xpData.level, leveledUp: xpData.leveled_up }
              }))
            }
          } catch { /* XP error non-critical */ }
        }
      } catch { /* completion error non-critical — proceed to quiz */ }
    }
    router.push(`/dashboard/quiz/${lessonId}`)
  }

  if (isOffline && !isCached) {
    return (
      <div className="py-20 px-4 max-w-lg mx-auto text-center space-y-6 animate-page-enter">
        <div className="inline-flex p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500">
          <HelpCircle className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-bold text-text-1">Lesson Offline 🌐</h1>
          <p className="text-text-2 text-sm leading-relaxed">
            This lesson is not available offline. Download it first to read without internet.
          </p>
        </div>
        <div className="pt-4 border-t border-border flex flex-col gap-3">
          <Link href="/dashboard/downloads">
            <Button className="w-full bg-primary hover:bg-primary/95 text-white font-bold h-11 rounded-xl shadow-[0_0_12px_rgba(91,142,255,0.2)]">
              Go to Downloads Shelf
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
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-surface-alt/40 border border-border/80 hover:bg-surface-alt/75 text-xs font-semibold text-text-2 hover:text-text-1 rounded-full transition-all duration-200 mb-6 shadow-sm group hover:scale-[1.02]"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
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

  // Serialise lesson content as plain text for Spark context
  const sparkLessonContext = content
    ? content.sections
        .map(s => [s.heading, s.body || s.callout_body || s.code_snippet || ''].filter(Boolean).join('\n'))
        .join('\n\n')
    : ''

  const displayEstimatedMinutes = isReentry
    ? Math.max(2, Math.round((content.estimated_minutes || 5) * 0.4))
    : (content.estimated_minutes || 5)

  return (
    <>
      <ReadingProgressBar
        estimatedMinutes={displayEstimatedMinutes}
        onProgressChange={handleProgressChange}
      />

      {/* Full-screen focus container */}
      <div className="min-h-screen bg-[#0A0C14] pb-40">

        {/* Minimal lesson header */}
        <div className="sticky top-0 z-30 bg-[#0A0C14]/95 backdrop-blur-md border-b border-[#1E2540]/60">
          <div className="max-w-[720px] mx-auto px-4 h-14 flex items-center justify-between">
            {/* Back arrow */}
            <Link
              href="/dashboard/path"
              className="inline-flex items-center gap-1.5 text-[#8B95B3] hover:text-[#F0F4FF] transition-colors text-xs font-semibold group"
            >
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">My Path</span>
            </Link>

            {/* Phase · Module breadcrumb */}
            <div className="flex flex-col items-center">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#4A5272] font-bold">
                Phase {phaseNumber}{phaseTitle ? ` · ${phaseTitle}` : ''}
              </p>
              <p className="text-[11px] font-semibold text-[#8B95B3] truncate max-w-[160px] sm:max-w-[280px] mt-0.5">
                {lessonTitle}
              </p>
            </div>

            {/* Reading time */}
            <div className="text-[10px] text-[#4A5272] font-medium">
              {displayEstimatedMinutes} min read
            </div>
          </div>
        </div>

        {/* Lesson content */}
        <div className="max-w-[720px] mx-auto px-4 pt-8">
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
            isReentry={isReentry}
          />

          {/* End-of-lesson block — only shown after scrolling to bottom */}
          <div
            className="mt-12 border-t border-[#1E2540] pt-8 space-y-6"
            style={{
              opacity: hasReachedBottom ? 1 : 0,
              transform: hasReachedBottom ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
              pointerEvents: hasReachedBottom ? 'auto' : 'none',
            }}
          >
            {/* Completion message */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#34D399]/10 border border-[#34D399]/25 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-4 w-4 text-[#34D399]" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-[#F0F4FF]">You have reached the end of this lesson</p>
                <p className="text-[11px] text-[#8B95B3] mt-0.5">Great work — here is what you just learned:</p>
              </div>
            </div>

            {/* Key takeaways */}
            {content.key_takeaways && content.key_takeaways.length > 0 && (
              <ul className="space-y-2 pl-2">
                {content.key_takeaways.slice(0, 3).map((takeaway, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-[13px] text-[#C8D0E8] leading-relaxed">
                    <div className="w-5 h-5 rounded-full bg-[#5B8EFF]/15 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-[#5B8EFF]">{idx + 1}</span>
                    </div>
                    {takeaway}
                  </li>
                ))}
              </ul>
            )}

            {/* Primary CTA — Take the Quiz */}
            <Button
              onClick={handleTakeQuiz}
              disabled={isOffline}
              className="w-full h-13 bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] hover:from-[#4A7AEE] hover:to-[#9067FA] text-white font-bold rounded-xl shadow-[0_0_24px_rgba(91,142,255,0.3)] transition-all duration-200 flex items-center justify-center gap-2 text-[15px] disabled:opacity-50"
            >
              <span>Take the Quiz →</span>
            </Button>

            {/* Secondary — Ask Spark */}
            <button
              type="button"
              onClick={() => setIsSparkOpen(true)}
              className="w-full text-[12px] text-[#8B95B3] hover:text-[#A78BFA] transition-colors font-medium flex items-center justify-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Ask Spark before I continue
            </button>
          </div>
        </div>
      </div>

      {/* Spark FAB — fixed bottom-right */}
      {!isSparkOpen && (
        <button
          type="button"
          onClick={() => setIsSparkOpen(true)}
          className="fixed bottom-6 right-5 z-30 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-[#5B8EFF] to-[#A78BFA] rounded-full shadow-[0_0_20px_rgba(91,142,255,0.4)] text-white text-[12px] font-bold hover:shadow-[0_0_28px_rgba(91,142,255,0.6)] hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Ask Spark</span>
        </button>
      )}

      {/* Spark Chat Drawer */}
      <SparkDrawer
        isOpen={isSparkOpen}
        onClose={() => setIsSparkOpen(false)}
        lessonId={lessonId}
        lessonTitle={lessonTitle}
        lessonContent={sparkLessonContext}
        userName={userName}
        subject={subject}
      />

      {/* Lesson complete modal (unchanged) */}
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
              onCtaClick={isPhaseBadge ? () => {
                window.open(`/api/certificate/generate?phaseId=${phaseId}`, '_blank')
              } : undefined}
              showTestimonial={isPhaseBadge}
              learningGoal={subject || 'My Learning Goal'}
              onDismiss={() => {
                if (!isPhaseBadge) {
                  // If not a phase badge, the cta download generates on dismiss
                  // wait, isPhaseBadge is false, so no certificate generate needed
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
    </>
  )
}
