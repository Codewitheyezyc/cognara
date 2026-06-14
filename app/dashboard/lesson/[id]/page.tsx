'use client'

import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import LessonSkeleton from '@/components/lesson/LessonSkeleton'
import LessonContent from '@/components/lesson/LessonContent'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { GeneratedLesson } from '@/types/ai'
import { LessonCompleteModal } from '@/components/mascot/LessonCompleteModal'
import { ReadingProgressBar } from '@/components/lesson/ReadingProgressBar'
import MascotOverlay from '@/components/mascot/MascotOverlay'

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
  const [isCompleting, setIsCompleting] = useState(false)
  const [status, setStatus] = useState<'not_started' | 'in_progress' | 'completed'>('not_started')
  
  const [depthLevel, setDepthLevel] = useState<number>(2)
  const [isChangingDepth, setIsChangingDepth] = useState(false)
  const [userId, setUserId] = useState('')
  const [subject, setSubject] = useState('')
  const [isPro, setIsPro] = useState(true)

  // Celebration Mascot Modal States
  const [showCelebration, setShowCelebration] = useState(false)
  const [streakDays, setStreakDays] = useState(0)
  const [nextLessonId, setNextLessonId] = useState<string | null>(null)

  // Badge celebration states
  const [newBadges, setNewBadges] = useState<any[]>([])
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0)

  useEffect(() => {
    async function loadLesson() {
      // 1. Fetch user session
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)

      // 2. Fetch lesson record
      const { data: lesson, error } = await supabase
        .from('lessons')
        .select('title, content, roadmap_id, order_index')
        .eq('id', lessonId)
        .maybeSingle()

      if (error || !lesson) {
        router.push('/dashboard/path')
        return
      }

      setLessonTitle(lesson.title)

      // Fetch user's current streak
      const { data: streakRow } = await supabase
        .from('streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .maybeSingle()
      setStreakDays(streakRow?.current_streak || 0)

      // Fetch next lesson ID in the roadmap
      if (lesson.roadmap_id) {
        const { data: nextLesson } = await supabase
          .from('lessons')
          .select('id')
          .eq('roadmap_id', lesson.roadmap_id)
          .gt('order_index', lesson.order_index)
          .order('order_index', { ascending: true })
          .limit(1)
          .maybeSingle()
        if (nextLesson) {
          setNextLessonId(nextLesson.id)
        }
      }

      // 3. Fetch current progress
      const { data: progress } = await supabase
        .from('lesson_progress')
        .select('status')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle()

      if (progress?.status) {
        setStatus(progress.status as any)
      }

      // 4. Fetch depth level
      const { data: profile } = await supabase
        .from('profiles')
        .select('learning_depth')
        .eq('id', user.id)
        .maybeSingle()

      setIsPro(true)

      let activeGoalDepth = null
      if (lesson.roadmap_id) {
        const { data: roadmap } = await supabase
          .from('roadmaps')
          .select('goal_id')
          .eq('id', lesson.roadmap_id)
          .maybeSingle()

        if (roadmap?.goal_id) {
          const { data: goal } = await supabase
            .from('learning_goals')
            .select('depth_level, subject')
            .eq('id', roadmap.goal_id)
            .maybeSingle()
          if (goal?.depth_level) {
            activeGoalDepth = goal.depth_level
          }
          if (goal?.subject) {
            setSubject(goal.subject)
          }
        }
      }
      const initialDepth = activeGoalDepth ?? profile?.learning_depth ?? 2
      setDepthLevel(initialDepth)

      // 5. Handle rendering / lazy generation
      const dbContent = lesson.content as any
      let initialMap: Record<number, GeneratedLesson> = {}
      let activeContent: GeneratedLesson | null = null

      if (dbContent && typeof dbContent === 'object') {
        if ('sections' in dbContent) {
          // Old single-depth schema migration fallback
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
        setIsGenerating(true)
        try {
          const res = await fetch('/api/ai/generate-lesson', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lessonId }),
          })
          const result = await res.json()
          if (res.ok && result.content) {
            setContent(result.content)
            setContentMap(prev => ({ ...prev, [initialDepth]: result.content }))
            setStatus('in_progress')
          }
        } catch (err) {
          console.error('Error generating lesson content:', err)
        } finally {
          setIsGenerating(false)
        }
      }
    }

    loadLesson()
  }, [lessonId, supabase, router])

  // Background prefetching for next lesson
  useEffect(() => {
    if (!content || !nextLessonId) return

    // Wait 3 seconds after lesson loads to avoid competing for network
    const prefetchTimer = setTimeout(async () => {
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
    }, 3000)

    return () => clearTimeout(prefetchTimer)
  }, [content, nextLessonId])

  const handleDepthChange = async (newDepth: number) => {
    setIsChangingDepth(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Update profiles learning_depth
      await supabase
        .from('profiles')
        .update({ learning_depth: newDepth })
        .eq('id', user.id)

      // 2. Fetch roadmap & goal to update goal depth_level
      const { data: lesson } = await supabase
        .from('lessons')
        .select('roadmap_id')
        .eq('id', lessonId)
        .maybeSingle()

      if (lesson?.roadmap_id) {
        const { data: roadmap } = await supabase
          .from('roadmaps')
          .select('goal_id')
          .eq('id', lesson.roadmap_id)
          .maybeSingle()

        if (roadmap?.goal_id) {
          await supabase
            .from('learning_goals')
            .update({ depth_level: newDepth })
            .eq('id', roadmap.goal_id)
        }
      }

      // 3. Update local state
      setDepthLevel(newDepth)

      // If already cached locally, load immediately and return
      if (contentMap[newDepth]) {
        setContent(contentMap[newDepth])
        setIsChangingDepth(false)
        return
      }

      // Otherwise clear local content to trigger skeleton/loading and fetch
      setContent(null)

      // 4. Trigger generation
      const res = await fetch('/api/ai/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId }),
      })
      const result = await res.json()
      if (res.ok && result.content) {
        setContent(result.content)
        setContentMap(prev => ({ ...prev, [newDepth]: result.content }))
        setStatus('in_progress')
      }
    } catch (err) {
      console.error('Error changing depth level:', err)
    } finally {
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

  if (isGenerating || isChangingDepth || !content) {
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
        <LessonSkeleton />
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
        <MascotOverlay
          emotion="celebrate"
          messages={[
            `New badge earned! ${newBadges[currentBadgeIndex].badge_emoji}`,
            `${newBadges[currentBadgeIndex].badge_label}`,
            BADGE_DESCRIPTIONS[newBadges[currentBadgeIndex].badge_key] || ''
          ]}
          ctaLabel="Keep going!"
          onDismiss={() => {
            if (currentBadgeIndex + 1 < newBadges.length) {
              setCurrentBadgeIndex(currentBadgeIndex + 1)
            } else {
              setNewBadges([])
              window.dispatchEvent(new Event('badge-earned'))
              router.refresh()
            }
          }}
        />
      )}
      </div>
    </>
  )
}
