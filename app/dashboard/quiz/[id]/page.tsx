'use client'

import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import html2canvas from 'html2canvas'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle2, XCircle, Flame, Heart, Sparkles, Check, X, Bell } from 'lucide-react'
import Link from 'next/link'
import { QuizQuestion } from '@/types/ai'
import AIBadge from '@/components/lesson/AIBadge'
import { Spark } from '@/components/mascot/Spark'
import { SoundEffects } from '@/lib/sound'
import { useToast } from '@/components/ui/toast'
import { TestimonialForm } from '@/components/marketing/TestimonialForm'
import { PhaseCelebration } from '@/components/celebration/PhaseCelebration'
import { CertificateTemplate } from '@/components/celebration/CertificateTemplate'
import { CertificateShareScreen } from '@/components/celebration/CertificateShareScreen'
import { GoalCelebration } from '@/components/celebration/GoalCelebration'
import { PracticalExerciseScreen, type PracticalExerciseData } from '@/components/lesson/PracticalExerciseScreen'
import { AwardModal } from '@/components/celebration/AwardModal'

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr
}

function prepareQuizQuestions(questions: QuizQuestion[]): QuizQuestion[] {
  const shuffledQuestions = shuffleArray(questions)
  return shuffledQuestions.map(q => {
    if (q.type === 'multiple_choice' && q.options) {
      return {
        ...q,
        options: shuffleArray(q.options)
      }
    }
    return q
  })
}

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const lessonId = params.id as string
  const supabase = createClient()
  const { toast } = useToast()

  // States
  const [lessonTitle, setLessonTitle] = useState('')
  const [quizId, setQuizId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [isAnswerChecked, setIsAnswerChecked] = useState(false)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  
  // Hearts state
  const [hearts, setHearts] = useState(3)
  const [isHeartAnimating, setIsHeartAnimating] = useState(false)

  // Scoring / Submission
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [quizResult, setQuizResult] = useState<{
    score: number
    passed: boolean
    correctCount: number
    totalCount: number
    streak: { current: number; longest: number }
    roadmapCompleted?: boolean
    roadmapId?: string | null
    isRetake?: boolean
    cxpAwarded?: number
    xp?: { xpGained: number; newXp: number; newLevel: number; leveledUp: boolean } | null
  } | null>(null)

  // Onboarding screens progression
  const [isEndSession, setIsEndSession] = useState(false)
  const [reminderSet, setReminderSet] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [selectedTime, setSelectedTime] = useState('08:00')
  const [showXpAnim, setShowXpAnim] = useState(false)

  // Quiz testimonial popups
  const [showQuizTestimonialPrompt, setShowQuizTestimonialPrompt] = useState(false)
  const [showQuizTestimonialForm, setShowQuizTestimonialForm] = useState(false)

  // Sibling next lesson context
  const [nextLessonId, setNextLessonId] = useState<string | null>(null)
  const [nextLessonTitle, setNextLessonTitle] = useState<string | null>(null)
  const [nextLessonTime, setNextLessonTime] = useState<number>(5)

  // Loading / Error
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  // Profile context
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isRefillingHearts, setIsRefillingHearts] = useState(false)

  // Phase completion states
  const [activeLesson, setActiveLesson] = useState<any>(null)
  const [showPhaseCompleteScreen, setShowPhaseCompleteScreen] = useState(false)
  const [phaseCompleteData, setPhaseCompleteData] = useState<any>(null)

  const [hasWelcomeBonus, setHasWelcomeBonus] = useState(false)

  // Streak milestone celebration states
  const [showStreakMilestoneModal, setShowStreakMilestoneModal] = useState(false)
  const [milestoneStreakDays, setMilestoneStreakDays] = useState<number | null>(null)
  const [milestoneBadgeUrl, setMilestoneBadgeUrl] = useState<string | null>(null)
  const [isGeneratingBadge, setIsGeneratingBadge] = useState(false)
  const [showWelcomeBonusAnim, setShowWelcomeBonusAnim] = useState(false)

  // Real-time pending award states
  const [currentPendingAward, setCurrentPendingAward] = useState<any | null>(null)
  const [isGeneratingProgressCard, setIsGeneratingProgressCard] = useState(false)
  const [milestoneProgressPercent, setMilestoneProgressPercent] = useState<number | null>(null)
  const [bulkGoalName, setBulkGoalName] = useState('')
  const [bulkUserName, setBulkUserName] = useState('')


  // Certificate Generation States
  const [isGeneratingCert, setIsGeneratingCert] = useState(false)
  const [showFriendlyError, setShowFriendlyError] = useState(false)
  const [currentGeneratedId, setCurrentGeneratedId] = useState<string | null>(null)
  const [shareScreenData, setShareScreenData] = useState<any | null>(null)
  const [showGoalCompleteScreen, setShowGoalCompleteScreen] = useState(false)
  const [goalCompleteData, setGoalCompleteData] = useState<any | null>(null)

  // Practical Exercise States
  const [practicalExercise, setPracticalExercise] = useState<PracticalExerciseData | null>(null)
  const [showPracticalScreen, setShowPracticalScreen] = useState(false)
  const [lessonGoalId, setLessonGoalId] = useState<string | null>(null)
  const [lessonDomain, setLessonDomain] = useState<string>('General')

  // Timer
  const [timeSpentSecs, setTimeSpentSecs] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Save the lesson ID in sessionStorage to return to it when going back to the tree view
  useEffect(() => {
    if (typeof window !== 'undefined' && lessonId) {
      sessionStorage.setItem('lastViewedLessonId', lessonId)
    }
  }, [lessonId])

  // Fetch quiz details on mount
  useEffect(() => {
    async function loadQuiz() {
      try {
        setIsLoading(true)
        setErrorMsg('')

        // 1. Authenticate user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        setUserId(user.id)

        // Fetch profile with main_goal and name
        const { data: profRow } = await supabase
          .from('profiles')
          .select('name, subscription_tier, hearts, main_goal, xp')
          .eq('id', user.id)
          .maybeSingle()
          
        setProfile(profRow)
        if (profRow) {
          setHearts(profRow.hearts ?? 3)
        }

        // Check if user is eligible for referral welcome bonus animation
        try {
          const { data: welcomeEvent } = await supabase
            .from('cognara_cxp_events')
            .select('id')
            .eq('user_id', user.id)
            .eq('source', 'referral_welcome_bonus')
            .maybeSingle()

          if (welcomeEvent && !sessionStorage.getItem('referral_welcome_bonus_shown')) {
            setHasWelcomeBonus(true)
          }
        } catch (eventErr) {
          console.error('Failed to query welcome bonus event status:', eventErr)
        }


        // Read practical exercise from sessionStorage (set by lesson page after generate-lesson call)
        // This is reliable because the quiz always follows a lesson in the same browser session
        try {
          if (typeof window !== 'undefined') {
            const storedPractical = sessionStorage.getItem(`practical_${lessonId}`)
            if (storedPractical) {
              setPracticalExercise(JSON.parse(storedPractical) as PracticalExerciseData)
              console.log('[QuizPage] Loaded practical exercise from sessionStorage')
            } else {
              // Fallback: call the lesson API — it returns practicalExercise from shared cache
              // This handles the case where the quiz page was opened in a new tab or session expired
              try {
                const practicalRes = await fetch('/api/practical/for-lesson', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ lessonId }),
                })
                if (practicalRes.ok) {
                  const practicalData = await practicalRes.json()
                  if (practicalData.practicalExercise) {
                    setPracticalExercise(practicalData.practicalExercise as PracticalExerciseData)
                    console.log('[QuizPage] Loaded practical exercise from API fallback')
                  }
                }
              } catch (apiErr) {
                console.log('[QuizPage] Practical API fallback skipped (non-critical):', apiErr)
              }
            }
          }
        } catch (practicalErr) {
          console.error('[QuizPage] Failed to load practical exercise (non-critical):', practicalErr)
        }

        if (profRow && profRow.subscription_tier === 'free' && (profRow.hearts ?? 3) <= 0) {
          setErrorMsg('OUT_OF_HEARTS')
          setIsLoading(false)
          return
        }

        // 2. Fetch active lesson details
        const { data: lesson, error: lessonErr } = await supabase
          .from('lessons')
          .select('title, phase_id, roadmap_id')
          .eq('id', lessonId)
          .maybeSingle()
 
        if (lessonErr || !lesson) {
          router.push('/dashboard/path')
          return
        }
        setLessonTitle(lesson.title)
        setActiveLesson(lesson)

        // Resolve dynamic domain from roadmap/goal
        if (lesson.roadmap_id) {
          supabase
            .from('roadmaps')
            .select('goal_id')
            .eq('id', lesson.roadmap_id)
            .maybeSingle()
            .then(async (resObj: any) => {
              const rm = resObj.data
              if (rm?.goal_id) {
                const { data: gl } = await supabase
                  .from('learning_goals')
                  .select('subject')
                  .eq('id', rm.goal_id)
                  .maybeSingle()
                if (gl?.subject) {
                  const { getDomainFromSubject } = await import('@/lib/ai/lessonCache')
                  setLessonDomain(getDomainFromSubject(gl.subject))
                }
              }
            })
            .catch(() => {})
        }

        // Resolve next lesson sibling details
        if (lesson.roadmap_id) {
          const [lessonsRes, phasesRes] = await Promise.all([
            supabase.from('lessons').select('id, phase_id, order_index').eq('roadmap_id', lesson.roadmap_id),
            supabase.from('roadmap_phases').select('id, phase_number').eq('roadmap_id', lesson.roadmap_id)
          ])

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
              const nextL = orderedLessons[currIdx + 1]
              setNextLessonId(nextL.id)
              
              // Fetch next lesson's title and content details
              const { data: nextLessonDetails } = await supabase
                .from('lessons')
                .select('title, content')
                .eq('id', nextL.id)
                .maybeSingle()

              if (nextLessonDetails) {
                setNextLessonTitle(nextLessonDetails.title)
                const contentMap = nextLessonDetails.content as any
                const nextLessonContent = (contentMap && typeof contentMap === 'object')
                  ? (contentMap[2] || Object.values(contentMap)[0])
                  : contentMap
                const estMin = (nextLessonContent as any)?.estimated_minutes || 5
                setNextLessonTime(estMin)
              }
            }
          }
        }

        // 3. Load or generate quiz
        const res = await fetch('/api/ai/generate-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId }),
        })

        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data.questions) {
          setErrorMsg(data.error || "Spark is having trouble building this assessment. Let's try reloading the page!");
          setIsLoading(false);
          return;
        }

        setQuizId(data.quizId)
        setQuestions(prepareQuizQuestions(data.questions || []))
        setIsLoading(false)

        // Start timer
        setTimeSpentSecs(0)
        timerRef.current = setInterval(() => {
          setTimeSpentSecs((prev) => prev + 1)
        }, 1000)
      } catch (err: any) {
        console.error(err)
        setErrorMsg('We had trouble connecting to the study server. Please check your internet connection or try again.')
        setIsLoading(false)
      }
    }

    loadQuiz()

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [lessonId, supabase, router])

  // Handle checking active question's answer
  const handleCheckAnswer = () => {
    if (!selectedAnswer.trim() || !userId) return

    const currentQuestion = questions[currentIdx]
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: selectedAnswer,
    }))
    setIsAnswerChecked(true)

    const isCorrect = selectedAnswer.trim().toLowerCase() === currentQuestion.correct_answer.trim().toLowerCase()
    SoundEffects.play(isCorrect ? 'success' : 'failure')

    // Decrement heart if incorrect and user is free
    if (!isCorrect && profile?.subscription_tier === 'free') {
      setIsHeartAnimating(true)
      setTimeout(() => setIsHeartAnimating(false), 800)
      
      const newHeartsVal = Math.max(0, hearts - 1)
      setHearts(newHeartsVal)

      supabase.rpc('decrement_heart', { user_id: userId })
        .then(({ data, error }: any) => {
          if (!error && data && data.length > 0) {
            const dbHearts = data[0].new_hearts
            const isGameOver = data[0].is_game_over
            
            // Sync local hearts to DB status to remain aligned
            setHearts(dbHearts)
            setProfile((prev: any) => prev ? { ...prev, hearts: dbHearts } : null)
            
            window.dispatchEvent(new CustomEvent('cognara_hearts_changed', {
              detail: { hearts: dbHearts }
            }))
            
            if (isGameOver) {
              setTimeout(() => {
                setErrorMsg('OUT_OF_HEARTS')
              }, 1200)
            }
          }
        })
    }
  }

  const checkStreakMilestones = async (currentStreak: number) => {
    const milestones = [7, 30, 100]
    if (!milestones.includes(currentStreak)) return

    try {
      // Check if badge already generated for this milestone
      const { data: existing } = await supabase
        .from('cognara_streak_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('streak_days', currentStreak)
        .maybeSingle()

      if (existing) return

      // Set milestone states to trigger the hidden template rendering
      setMilestoneStreakDays(currentStreak)
      setIsGeneratingBadge(true)

      // We need to wait for the DOM to update so the hidden template is rendered before html2canvas captures it
      setTimeout(async () => {
        try {
          await generateStreakBadge(currentStreak)
        } catch (genErr) {
          console.error('[Streak Badge] Generation failed:', genErr)
          setIsGeneratingBadge(false)
        }
      }, 800)
    } catch (err) {
      console.error('[Streak Badge] Error checking milestones:', err)
    }
  }

  const generateStreakBadge = async (streakDays: number) => {
    const element = document.getElementById(`streak-badge-${streakDays}`)
    if (!element) {
      throw new Error(`Element #streak-badge-${streakDays} not found in DOM`)
    }

    const canvas = await html2canvas(element, {
      scale: 1,
      useCORS: true,
      backgroundColor: '#0F1629'
    })

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/png', 1.0)
    })

    if (!blob) {
      throw new Error('Canvas conversion to Blob failed')
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'cognara'
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'cognara_badges'

    const formData = new FormData()
    formData.append('file', blob)
    formData.append('upload_preset', uploadPreset)
    formData.append('folder', 'cognara/streak-badges')

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData }
    )

    if (!cloudinaryResponse.ok) {
      const errData = await cloudinaryResponse.json()
      throw new Error(errData?.error?.message || 'Cloudinary upload failed')
    }

    const cloudinaryData = await cloudinaryResponse.json()
    const badgeUrl = cloudinaryData.secure_url

    // Save to Supabase
    const { error: dbErr } = await supabase
      .from('cognara_streak_badges')
      .insert({
        user_id: userId,
        streak_days: streakDays,
        badge_url_png: badgeUrl,
        created_at: new Date().toISOString()
      })

    if (dbErr) {
      console.error('[Streak Badge] Failed to save to database:', dbErr)
    }

    // Enqueue pending award
    const { data: pendingAward } = await supabase
      .from('cognara_pending_awards')
      .insert({
        user_id: userId,
        award_type: 'streak_badge',
        award_data: {
          badge_url: badgeUrl,
          streak_days: streakDays,
          user_name: profile?.name || 'Learner'
        },
        is_shown: false,
        created_at: new Date().toISOString()
      })
      .select('*')
      .maybeSingle()

    setIsGeneratingBadge(false)
    setMilestoneStreakDays(null)

    if (pendingAward) {
      setCurrentPendingAward(pendingAward)
    }
  }

  const checkProgressMilestones = async () => {
    try {
      if (!userId) return

      // 1. Get active goal
      const { data: activeGoal } = await supabase
        .from('learning_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle()

      if (!activeGoal) return

      // 2. Get active roadmap
      const { data: activeRoadmap } = await supabase
        .from('roadmaps')
        .select('id, title')
        .eq('goal_id', activeGoal.id)
        .maybeSingle()

      if (!activeRoadmap) return

      // 3. Get total lessons in roadmap
      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('id')
        .eq('roadmap_id', activeRoadmap.id)

      if (!lessonsData || lessonsData.length === 0) return

      const totalLessons = lessonsData.length
      const lessonIds = lessonsData.map((l: any) => l.id)

      // 4. Get completed lessons count
      const { count: completedCount } = await supabase
        .from('lesson_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed')
        .in('lesson_id', lessonIds)

      const completed = completedCount || 0
      const progressPercent = Math.round((completed / totalLessons) * 100)

      const milestones = [25, 50, 75]
      let targetMilestone: number | null = null
      for (const m of milestones) {
        if (progressPercent >= m) {
          const { data: existing } = await supabase
            .from('cognara_progress_cards')
            .select('id')
            .eq('user_id', userId)
            .eq('milestone_percent', m)
            .maybeSingle()

          if (!existing) {
            targetMilestone = m
            break
          }
        }
      }

      if (!targetMilestone) return

      setIsGeneratingProgressCard(true)
      setMilestoneProgressPercent(targetMilestone)
      setBulkGoalName(activeGoal.goal_text || activeGoal.subject || 'My Learning Goal')
      setBulkUserName(profile?.name || 'Learner')

      setTimeout(async () => {
        try {
          await generateProgressCard(targetMilestone!, activeGoal)
        } catch (err) {
          console.error('Failed to generate progress card:', err)
          setIsGeneratingProgressCard(false)
        }
      }, 800)
    } catch (err) {
      console.error('Error checking progress milestones:', err)
    }
  }

  const generateProgressCard = async (percent: number, activeGoal: any) => {
    const element = document.getElementById(`progress-card-${percent}`)
    if (!element) {
      throw new Error(`Element #progress-card-${percent} not found in DOM`)
    }

    const canvas = await html2canvas(element, {
      scale: 1,
      useCORS: true,
      backgroundColor: '#0F1629'
    })

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/png', 1.0)
    })

    if (!blob) {
      throw new Error('Canvas conversion to Blob failed')
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'cognara'
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'cognara_badges'

    const formData = new FormData()
    formData.append('file', blob)
    formData.append('upload_preset', uploadPreset)
    formData.append('folder', 'cognara/progress-cards')

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData }
    )

    if (!cloudinaryResponse.ok) {
      const errData = await cloudinaryResponse.json()
      throw new Error(errData?.error?.message || 'Cloudinary upload failed')
    }

    const cloudinaryData = await cloudinaryResponse.json()
    const cardUrl = cloudinaryData.secure_url

    // Save to Supabase
    await supabase
      .from('cognara_progress_cards')
      .insert({
        user_id: userId,
        milestone_percent: percent,
        card_url_png: cardUrl,
        created_at: new Date().toISOString()
      })

    // Enqueue pending award
    const { data: pendingAward } = await supabase
      .from('cognara_pending_awards')
      .insert({
        user_id: userId,
        award_type: 'progress_card',
        award_data: {
          card_url: cardUrl,
          milestone_percent: percent,
          goal_name: activeGoal.goal_text || activeGoal.subject || 'My Learning Goal',
          user_name: profile?.name || 'Learner'
        },
        is_shown: false,
        created_at: new Date().toISOString()
      })
      .select('*')
      .maybeSingle()

    setIsGeneratingProgressCard(false)
    setMilestoneProgressPercent(null)
    setBulkGoalName('')
    setBulkUserName('')

    if (pendingAward) {
      setCurrentPendingAward(pendingAward)
    }
  }

  // Handle proceeding to next question or final results submission
  const handleNextQuestion = async () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1)
      setSelectedAnswer('')
      setIsAnswerChecked(false)
    } else {
      // Final submission
      if (timerRef.current) clearInterval(timerRef.current)
      setIsSubmitting(true)
      try {
        const res = await fetch('/api/quiz/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quizId,
            answers: userAnswers,
            timeSpentSecs,
          }),
        })

        const result = await res.json()
        if (!res.ok) {
          throw new Error(result.error || 'Failed to submit quiz results')
        }

        setQuizResult(result)
        
        let isPhaseComplete = false
        if (result.passed) {
          isPhaseComplete = await checkPhaseCompletion(result)
        }
        
        // 5/5 perfect score: 50% probability to show testimonial prompt (only if phase did not complete)
        if (result.correctCount === 5 && Math.random() < 0.5 && !isPhaseComplete) {
          setShowQuizTestimonialPrompt(true)
        }
        
        // Trigger float-up XP animation — FIRST ATTEMPT ONLY (retakes earn 0 CXP)
        if (!result.isRetake && result.cxpAwarded && result.cxpAwarded > 0) {
          setShowXpAnim(true)
          setTimeout(() => setShowXpAnim(false), 2400)
        }

        // Trigger welcome bonus animation if eligible
        if (hasWelcomeBonus) {
          setTimeout(() => {
            setShowWelcomeBonusAnim(true)
            setTimeout(() => {
              setShowWelcomeBonusAnim(false)
              setHasWelcomeBonus(false)
              sessionStorage.setItem('referral_welcome_bonus_shown', 'true')
            }, 2400)
          }, 1200)
        }


        // Play sound on completion
        SoundEffects.play(result.passed ? 'achievement' : 'success')

        // Dispatch XP gained event
        if (result.xp) {
          window.dispatchEvent(new CustomEvent('cognara_xp_gained', {
            detail: {
              xpGained: result.xp.xpGained,
              newXp: result.xp.newXp,
              newLevel: result.xp.newLevel,
              leveledUp: result.xp.leveledUp
            }
          }))
        }

        // Trigger badge check on quiz submission
        try {
          await fetch('/api/badges/check-and-award', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quizScore: result.score,
              lessonId,
              currentStreak: result.streak?.current
            })
          })
        } catch (badgeErr) {
          console.error('Error checking badges on quiz submit:', badgeErr)
        }

        // Check and trigger streak milestone badges
        const finalStreak = result.currentStreak || result.streak?.current || 0
        if (finalStreak > 0) {
          await checkStreakMilestones(finalStreak)
        }
        await checkProgressMilestones()
      } catch (err: any) {
        console.error(err)
        setErrorMsg(err.message || 'Failed to save quiz score.')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  // Reset quiz state to retry
  const handleRetryQuiz = () => {
    setQuestions(prevQuestions => prepareQuizQuestions(prevQuestions))
    setCurrentIdx(0)
    setSelectedAnswer('')
    setIsAnswerChecked(false)
    setUserAnswers({})
    setQuizResult(null)
    setErrorMsg('')
    setTimeSpentSecs(0)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeSpentSecs((prev) => prev + 1)
    }, 1000)
  }

  const handleCxpRefillHearts = async () => {
    if (isRefillingHearts || !userId || !profile) return
    if ((profile.xp || 0) < 150) {
      toast('Not enough CXP to refill hearts.', 'error')
      return
    }
    setIsRefillingHearts(true)
    try {
      const { data: success, error } = await supabase.rpc('spend_user_cxp', {
        user_id_input: userId,
        amount_input: 150,
        source_input: 'heart_refill',
        description_input: 'Refilled hearts to 3'
      })

      if (error || !success) {
        throw error || new Error('Spend failed')
      }

      setHearts(3)
      setProfile((prev: any) => prev ? { ...prev, hearts: 3, xp: Math.max(0, (prev.xp || 0) - 150) } : null)

      SoundEffects.play('success')

      window.dispatchEvent(new CustomEvent('cognara_hearts_changed', {
        detail: { hearts: 3 }
      }))

      toast('Hearts refilled! ❤️ 3/3 Cognitive Energy')
      setErrorMsg('')
      handleRetryQuiz()
    } catch (err) {
      console.error('Failed to refill hearts:', err)
      toast('Failed to refill hearts with CXP.', 'error')
    } finally {
      setIsRefillingHearts(false)
    }
  }

  // Save certificate as unclaimed in Supabase
  const saveUnclaimedCertificate = async () => {
    if (!userId || !phaseCompleteData) return

    try {
      // Check if certificate already exists to avoid duplicate inserts
      const { data: existingCert } = await supabase
        .from('cognara_certificates')
        .select('id')
        .eq('user_id', userId)
        .eq('phase_number', phaseCompleteData.phaseNumber)
        .eq('goal_name', phaseCompleteData.goalName)
        .maybeSingle()

      if (existingCert) {
        console.log('Certificate already exists in database.')
        return
      }

      const certCode = `COG-PH${phaseCompleteData.phaseNumber}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

      const { error } = await supabase
        .from('cognara_certificates')
        .insert({
          certificate_id: certCode,
          user_id: userId,
          goal_name: phaseCompleteData.goalName,
          phase_name: phaseCompleteData.phaseName,
          phase_number: phaseCompleteData.phaseNumber,
          topics_covered: phaseCompleteData.topics || [],
          is_goal_completion: false,
          claimed: false
        })

      if (error) throw error
      console.log('Unclaimed certificate saved successfully:', certCode)
    } catch (err) {
      console.error('Error saving unclaimed certificate:', err)
    }
  }

  // Generate unique certificate ID checking for database collisions
  const generateUniqueCertificateId = async (): Promise<string> => {
    let attempts = 0
    while (attempts < 5) {
      const prefix = 'CGN'
      const timestamp = Date.now().toString(36).toUpperCase()
      const random = Math.random().toString(36).substring(2, 6).toUpperCase()
      const certId = `${prefix}-${timestamp}-${random}`

      const { data } = await supabase
        .from('cognara_certificates')
        .select('id')
        .eq('certificate_id', certId)
        .maybeSingle()

      if (!data) {
        return certId
      }
      attempts++
    }
    return `CGN-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  }

  // Generate PNG/PDF and upload to Supabase Storage
  const generateCertificate = async (): Promise<any> => {
    if (!userId || !phaseCompleteData) throw new Error('Missing user or phase details')

    // Generate unique ID
    const certId = await generateUniqueCertificateId()
    setCurrentGeneratedId(certId)

    // Wait for rendering offscreen
    await new Promise(resolve => setTimeout(resolve, 250))

    const element = document.getElementById('certificate-template')
    if (!element) throw new Error('Certificate template element not found in DOM')

    // Load libraries dynamically to prevent SSR mismatches
    const html2canvas = (await import('html2canvas')).default
    const { jsPDF } = await import('jspdf')

    // Capture canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
    })

    // Convert to PNG blob
    const pngBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png')
    })
    if (!pngBlob) throw new Error('Failed to generate PNG blob')

    // Convert to PDF blob
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [1200, 850]
    })
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 1200, 850)
    const pdfBlob = pdf.output('blob')

    // Paths
    const pngPath = `certificates/${userId}/${certId}.png`
    const pdfPath = `certificates/${userId}/${certId}.pdf`

    // Upload to Supabase Storage
    const [pngUpload, pdfUpload] = await Promise.all([
      supabase.storage
        .from('cognara-certificates')
        .upload(pngPath, pngBlob, { contentType: 'image/png', upsert: true }),
      supabase.storage
        .from('cognara-certificates')
        .upload(pdfPath, pdfBlob, { contentType: 'application/pdf', upsert: true })
    ])

    if (pngUpload.error) throw pngUpload.error
    if (pdfUpload.error) throw pdfUpload.error

    // Public URLs
    const pngUrl = supabase.storage
      .from('cognara-certificates')
      .getPublicUrl(pngPath).data.publicUrl

    const pdfUrl = supabase.storage
      .from('cognara-certificates')
      .getPublicUrl(pdfPath).data.publicUrl

    // Check if certificate record already exists
    const { data: existingCert } = await supabase
      .from('cognara_certificates')
      .select('id')
      .eq('user_id', userId)
      .eq('phase_number', phaseCompleteData.phaseNumber)
      .eq('goal_name', phaseCompleteData.goalName)
      .maybeSingle()

    const certPayload = {
      certificate_id: certId,
      user_id: userId,
      goal_name: phaseCompleteData.goalName,
      phase_name: phaseCompleteData.phaseName,
      phase_number: phaseCompleteData.phaseNumber,
      topics_covered: phaseCompleteData.topics || [],
      issued_at: new Date().toISOString(),
      certificate_url_png: pngUrl,
      certificate_url_pdf: pdfUrl,
      is_goal_completion: false,
      claimed: true
    }

    let dbError
    if (existingCert) {
      const { error } = await supabase
        .from('cognara_certificates')
        .update(certPayload)
        .eq('id', existingCert.id)
      dbError = error
    } else {
      const { error } = await supabase
        .from('cognara_certificates')
        .insert(certPayload)
      dbError = error
    }

    if (dbError) throw dbError

    return {
      certificateId: certId,
      pngUrl,
      pdfUrl
    }
  }

  const generateCertificateInBackground = () => {
    generateCertificate()
      .then((res) => {
        console.log('Background certificate generation completed:', res)
      })
      .catch((err) => {
        console.error('Background certificate generation failed:', err)
      })
  }

  // Handle Certificate Claim (Primary Action)
  const handleClaimCertificate = async () => {
    setIsGeneratingCert(true)
    setShowFriendlyError(false)

    // 3 seconds timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), 3000)
    )

    try {
      const result = await Promise.race([
        generateCertificate(),
        timeoutPromise
      ])
      
      setIsGeneratingCert(false)
      toast('Certificate claimed successfully!')
      setShareScreenData({
        certificateId: (result as any).certificateId,
        pngUrl: (result as any).pngUrl,
        pdfUrl: (result as any).pdfUrl,
        goalName: phaseCompleteData.goalName,
        phaseName: phaseCompleteData.phaseName,
        phaseNumber: phaseCompleteData.phaseNumber,
        lessonsCount: phaseCompleteData.lessonsCount,
        quizzesCount: phaseCompleteData.quizzesCount,
        cxpEarned: phaseCompleteData.cxpEarned,
        nextPhaseNumber: phaseCompleteData.nextPhaseNumber,
      })
    } catch (err: any) {
      console.warn('Certificate generation hit error or timeout, running in background:', err)
      setIsGeneratingCert(false)
      setShowFriendlyError(true)
      generateCertificateInBackground()
    }
  }

  // Handle Continue without claiming (Secondary Action)
  const handleContinueWithoutClaiming = async () => {
    await saveUnclaimedCertificate()

    if (phaseCompleteData?.nextPhaseId) {
      try {
        const { data: nextLessons } = await supabase
          .from('lessons')
          .select('id')
          .eq('phase_id', phaseCompleteData.nextPhaseId)
          .order('order_index', { ascending: true })
          .limit(1)

        if (nextLessons && nextLessons.length > 0) {
          router.push(`/dashboard/lesson/${nextLessons[0].id}`)
          return
        }
      } catch (err) {
        console.error('Error finding next phase lesson:', err)
      }
    }
    router.push('/dashboard')
  }

  // Check if phase is completed after passing quiz
  const checkPhaseCompletion = async (result: any): Promise<boolean> => {
    if (!result.passed || !userId || !activeLesson) return false

    try {
      // 1. Fetch current phase details
      const { data: phaseRow } = await supabase
        .from('roadmap_phases')
        .select('*')
        .eq('id', activeLesson.phase_id)
        .maybeSingle()

      if (!phaseRow) return false

      // 2. Fetch all lessons in this phase
      const { data: phaseLessons } = await supabase
        .from('lessons')
        .select('id, title')
        .eq('phase_id', activeLesson.phase_id)

      const phaseLessonIds = phaseLessons?.map((l: any) => l.id) || []
      if (phaseLessonIds.length === 0) return false

      // 3. Fetch completed lessons from lesson_progress for this user
      const { data: completedProgress } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .in('lesson_id', phaseLessonIds)

      const completedIds = new Set(completedProgress?.map((p: any) => p.lesson_id) || [])
      completedIds.add(lessonId) // Ensure current lesson is marked completed

      if (completedIds.size === phaseLessonIds.length) {
        // Phase is complete! Let's load stats and next phase details
        const lessonsCount = phaseLessonIds.length

        // Fetch quizzes for this phase
        const { data: phaseQuizzes } = await supabase
          .from('quizzes')
          .select('id')
          .in('lesson_id', phaseLessonIds)

        const phaseQuizIds = phaseQuizzes?.map((q: any) => q.id) || []

        // Fetch quiz attempts (first attempts only — retakes don't award CXP)
        const { data: quizAttemptsList } = await supabase
          .from('quiz_attempts')
          .select('quiz_id, score, passed')
          .eq('user_id', userId)
          .eq('is_retake', false)
          .in('quiz_id', phaseQuizIds)

        const passedQuizAttempts = quizAttemptsList?.filter((a: any) => a.passed) || []
        const uniqueQuizzesPassed = new Set(passedQuizAttempts.map((a: any) => a.quiz_id)).size

        // Calculate CXP earned in this phase (100 per lesson + best quiz scores XP)
        const lessonsCxp = lessonsCount * 100
        const bestScores = new Map<string, number>()
        quizAttemptsList?.forEach((att: any) => {
          const currentBest = bestScores.get(att.quiz_id) || 0
          if (att.score > currentBest) {
            bestScores.set(att.quiz_id, att.score)
          }
        })
        
        let quizCxp = 0
        bestScores.forEach(score => {
          let xpAward = 10
          if (score === 100) xpAward = 100
          else if (score >= 80) xpAward = 80
          else if (score >= 60) xpAward = 60
          else if (score >= 40) xpAward = 40
          else if (score >= 20) xpAward = 20
          quizCxp += xpAward
        })

        const totalCxp = lessonsCxp + quizCxp

        // Fetch active goal name
        let goalName = profile?.main_goal || 'My Learning Goal'
        const { data: roadmapRow } = await supabase
          .from('roadmaps')
          .select('goal_id')
          .eq('id', phaseRow.roadmap_id)
          .maybeSingle()

        if (roadmapRow?.goal_id) {
          const { data: goalRow } = await supabase
            .from('learning_goals')
            .select('goal_text')
            .eq('id', roadmapRow.goal_id)
            .maybeSingle()
          if (goalRow) {
            goalName = goalRow.goal_text
          }
        }

        // Fetch next phase details
        const { data: nextPhaseRow } = await supabase
          .from('roadmap_phases')
          .select('*')
          .eq('roadmap_id', phaseRow.roadmap_id)
          .eq('phase_number', phaseRow.phase_number + 1)
          .maybeSingle()

        const topics = phaseLessons.map((l: any) => l.title)

        setPhaseCompleteData({
          phaseNumber: phaseRow.phase_number,
          phaseName: phaseRow.title,
          goalName,
          lessonsCount,
          quizzesCount: uniqueQuizzesPassed,
          cxpEarned: totalCxp,
          nextPhaseNumber: nextPhaseRow ? nextPhaseRow.phase_number : null,
          nextPhaseName: nextPhaseRow ? nextPhaseRow.title : null,
          nextPhaseDescription: nextPhaseRow ? (nextPhaseRow.description || 'Continue your learning journey with the next topics.') : null,
          phaseId: phaseRow.id,
          nextPhaseId: nextPhaseRow ? nextPhaseRow.id : null,
          roadmapId: phaseRow.roadmap_id,
          topics
        })
        // Check if this was the final phase of the roadmap
        const isFinalPhase = !nextPhaseRow
        if (isFinalPhase && roadmapRow?.goal_id) {
          const goalId = roadmapRow.goal_id
          
          // Check if already celebrated
          const { data: alreadyCelebrated } = await supabase
            .from('cognara_goal_celebrations')
            .select('id')
            .eq('user_id', userId)
            .eq('goal_id', goalId)
            .maybeSingle()

          if (!alreadyCelebrated) {
            // Trigger goal completion state updates
            // 1. Mark goal completed
            await supabase
              .from('learning_goals')
              .update({ 
                status: 'completed',
                completed_at: new Date().toISOString()
              })
              .eq('id', goalId)

            // 2. Award 500 CXP
            const GOAL_COMPLETION_BONUS = 500
            const currentXp = profile?.xp || 0
            await supabase
              .from('profiles')
              .update({ xp: currentXp + GOAL_COMPLETION_BONUS })
              .eq('id', userId)

            // 3. Unlock 'goal_getter' badge
            await supabase
              .from('user_badges')
              .insert({
                user_id: userId,
                badge_key: 'goal_getter',
                earned_at: new Date().toISOString()
              })

            // 4. Mark celebrated
            await supabase
              .from('cognara_goal_celebrations')
              .insert({ 
                user_id: userId, 
                goal_id: goalId,
                celebrated_at: new Date().toISOString()
              })

            // Fetch goal start date (learning_goals.created_at)
            const { data: goalRow } = await supabase
              .from('learning_goals')
              .select('created_at')
              .eq('id', goalId)
              .maybeSingle()

            const startDateVal = goalRow?.created_at || new Date().toISOString()
            const todayStr = new Date().toISOString()
            const weeksElapsed = Math.max(1, Math.round((new Date(todayStr).getTime() - new Date(startDateVal).getTime()) / (1000 * 60 * 60 * 24 * 7)))

            // Fetch all phases for this goal
            const { data: phasesList } = await supabase
              .from('roadmap_phases')
              .select('id')
              .eq('roadmap_id', phaseRow.roadmap_id)

            const totalPhases = phasesList?.length || 1

            // 5. Send admin email notification
            try {
              await fetch('/api/admin/notify-goal-completion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  goalName,
                  startDate: startDateVal,
                  completedDate: todayStr,
                  lessonsCount,
                  quizzesCount: uniqueQuizzesPassed,
                  cxpEarned: totalCxp + GOAL_COMPLETION_BONUS
                })
              })
            } catch (emailErr) {
              console.error('Failed to notify admin of goal completion:', emailErr)
            }

            // Set Goal Complete data
            setGoalCompleteData({
              goalId,
              goalName,
              startDate: startDateVal,
              completedDate: todayStr,
              totalTimeWeeks: weeksElapsed,
              phasesCount: totalPhases,
              lessonsCount,
              quizzesCount: uniqueQuizzesPassed,
              cxpEarned: totalCxp + GOAL_COMPLETION_BONUS
            })

            // Save to phaseCompleteData first so certificate template renders correctly in background
            setPhaseCompleteData({
              phaseNumber: phaseRow.phase_number,
              phaseName: phaseRow.title,
              goalName,
              lessonsCount,
              quizzesCount: uniqueQuizzesPassed,
              cxpEarned: totalCxp,
              nextPhaseNumber: null,
              nextPhaseName: null,
              nextPhaseDescription: null,
              phaseId: phaseRow.id,
              nextPhaseId: null,
              roadmapId: phaseRow.roadmap_id,
              topics
            })

            setShowGoalCompleteScreen(true)
            return true
          }
        }

        setShowPhaseCompleteScreen(true)
        return true
      }

    } catch (err) {
      console.error('Error checking phase completion:', err)
    }
    return false
  }

  const formatTime = (timeStr: string) => {
    if (!timeStr) return ''
    const [hoursStr, minutesStr] = timeStr.split(':')
    const hours = parseInt(hoursStr, 10)
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutesStr} ${ampm}`
  }

  // Handle reminder click
  const handleSetReminder = () => {
    setShowTimePicker(true)
  }

  const handleConfirmReminder = async () => {
    try {
      if (userId) {
        const { error } = await supabase
          .from('profiles')
          .update({
            reminder_enabled: true,
            daily_reminder_time: selectedTime,
            reminder_time: selectedTime,
            reminder_timezone: 'Africa/Lagos'
          })
          .eq('id', userId)
        if (error) throw error
      }
      toast(`Reminder set ✓ We will remind you to learn every day at ${formatTime(selectedTime)}`)
      setReminderSet(true)
      setShowTimePicker(false)
    } catch {
      toast('Failed to set reminder.', 'error')
    }
  }

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg text-text-1 flex flex-col items-center justify-center p-6 space-y-4 animate-page-enter">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-mono text-text-2 tracking-wide animate-pulse">
          Calibrating assessment metrics...
        </p>
      </div>
    )
  }

  // Goal Completion takeover
  if (showGoalCompleteScreen && goalCompleteData) {
    return (
      <GoalCelebration
        goalId={goalCompleteData.goalId}
        goalName={goalCompleteData.goalName}
        userName={profile?.full_name || profile?.name || 'Learner'}
        startDate={goalCompleteData.startDate}
        completedDate={goalCompleteData.completedDate}
        totalTimeWeeks={goalCompleteData.totalTimeWeeks}
        phasesCount={goalCompleteData.phasesCount}
        lessonsCount={goalCompleteData.lessonsCount}
        quizzesCount={goalCompleteData.quizzesCount}
        cxpEarned={goalCompleteData.cxpEarned}
        onClaimCertificate={handleClaimCertificate}
        onContinue={handleContinueWithoutClaiming}
      />
    )
  }

  // Share Screen takeover
  if (shareScreenData) {

    return (
      <CertificateShareScreen
        certificateId={shareScreenData.certificateId}
        pngUrl={shareScreenData.pngUrl}
        pdfUrl={shareScreenData.pdfUrl}
        userName={profile?.full_name || profile?.name || 'Learner'}
        goalName={shareScreenData.goalName}
        phaseName={shareScreenData.phaseName}
        phaseNumber={shareScreenData.phaseNumber}
        lessonsCount={shareScreenData.lessonsCount}
        quizzesCount={shareScreenData.quizzesCount}
        cxpEarned={shareScreenData.cxpEarned}
        isGoalCompletion={!shareScreenData.nextPhaseNumber}
        nextPhaseNumber={shareScreenData.nextPhaseNumber}
        onContinue={handleContinueWithoutClaiming}
      />
    )
  }

  // Phase Completion Celebration takeover
  if (showPhaseCompleteScreen && phaseCompleteData) {
    return (
      <PhaseCelebration
        phaseNumber={phaseCompleteData.phaseNumber}
        phaseName={phaseCompleteData.phaseName}
        goalName={phaseCompleteData.goalName}
        lessonsCount={phaseCompleteData.lessonsCount}
        quizzesCount={phaseCompleteData.quizzesCount}
        cxpEarned={phaseCompleteData.cxpEarned}
        nextPhaseNumber={phaseCompleteData.nextPhaseNumber}
        nextPhaseName={phaseCompleteData.nextPhaseName}
        nextPhaseDescription={phaseCompleteData.nextPhaseDescription}
        userName={profile?.name || 'Learner'}
        referralCode={profile?.referral_code || (userId ? `CGN-${userId.substring(0, 4).toUpperCase()}` : '')}
        onClaimCertificate={handleClaimCertificate}
        onContinue={handleContinueWithoutClaiming}
        domain={lessonDomain}
      />

    )
  }

  // Error Screen / Hearts Lost Screen
  if (errorMsg) {
    if (errorMsg === 'OUT_OF_HEARTS') {
      return (
        <div className="min-h-screen bg-bg text-text-1 flex flex-col items-center justify-center p-6 space-y-8 max-w-md mx-auto text-center animate-page-enter">
          <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-full text-rose-500">
            <Heart className="h-12 w-12 fill-current text-rose-500 animate-pulse" />
          </div>
          <div className="space-y-3">
            <h2 className="font-heading text-2xl font-bold text-text-1">Not quite this time.</h2>
            <p className="text-sm text-text-2 leading-relaxed">
              Losing hearts means the content needs another look.
            </p>
            <p className="text-sm text-[#A78BFA] font-medium">
              Review the lesson and try again — you will get it.
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <Button
              onClick={() => router.push(`/dashboard/lesson/${lessonId}`)}
              className="w-full h-13 bg-[#1E2540] hover:bg-[#2E3750] border border-border text-text-1 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.99]"
            >
              Review Lesson
            </Button>
            
            {(profile?.xp ?? 0) >= 150 ? (
              <Button
                onClick={handleCxpRefillHearts}
                disabled={isRefillingHearts}
                className="w-full h-13 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-text-1 font-bold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.25)] flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.99]"
              >
                <Sparkles className="h-4 w-4 fill-current animate-pulse text-text-1" />
                Refill & Retry (150 CXP)
              </Button>
            ) : (
              <div className="space-y-2">
                <Button
                  disabled={true}
                  className="w-full h-13 bg-[#1E2540]/30 border border-border/55 text-text-2/50 font-bold rounded-xl text-xs flex items-center justify-center gap-2"
                >
                  Need 150 CXP to refill (You have {profile?.xp ?? 0} CXP)
                </Button>
                <Button
                  onClick={() => router.push('/dashboard/path?reentry=true')}
                  className="w-full h-13 bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] hover:from-[#4A7AEE] hover:to-[#9067FA] text-text-1 font-bold rounded-xl shadow-[0_0_20px_rgba(91,142,255,0.25)] flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.99]"
                >
                  Review Completed Lessons (+1 Heart)
                </Button>
              </div>
            )}

            <Button
              onClick={() => router.push('/dashboard/settings')}
              variant="ghost"
              className="w-full h-13 bg-surface-alt/50 hover:bg-surface-alt border border-border text-text-2 hover:text-text-1 rounded-xl text-[13px] font-bold cursor-pointer transition active:scale-[0.99]"
            >
              Upgrade to Pro (Infinite Hearts)
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-bg text-text-1 flex flex-col items-center justify-center p-6 space-y-6 max-w-md mx-auto text-center animate-page-enter">
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-full">
          <XCircle className="h-8 w-8 text-rose-500" />
        </div>
        <div className="space-y-2">
          <h2 className="font-heading text-xl font-bold text-text-1">Assessment Interrupted</h2>
          <p className="text-sm text-text-2">{errorMsg}</p>
        </div>
        <div className="flex space-x-3 w-full">
          <Button
            onClick={() => router.push(`/dashboard/lesson/${lessonId}`)}
            className="flex-1 h-11 bg-surface-alt/50 hover:bg-surface-alt border border-border text-text-2 rounded-xl text-xs font-semibold"
          >
            Back to Lesson
          </Button>
          <Button
            onClick={handleRetryQuiz}
            className="flex-1 h-11 bg-primary hover:bg-primary/95 text-text-1 rounded-xl text-xs font-semibold"
          >
            Retry Loading
          </Button>
        </div>
      </div>
    )
  }

  // Practical Exercise Screen (shown between quiz results and end session)
  if (showPracticalScreen && practicalExercise && userId) {
    const handlePracticalDone = () => {
      setShowPracticalScreen(false)
      if (nextLessonId) {
        // Clear the practical from sessionStorage since we're moving on
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(`practical_${lessonId}`)
        }
        router.push(`/dashboard/lesson/${nextLessonId}`)
      } else {
        // No next lesson — go to end of session screen
        setIsEndSession(true)
      }
    }

    return (
      <PracticalExerciseScreen
        practical={practicalExercise}
        userId={userId}
        lessonCacheId={lessonId}
        goalId={lessonGoalId}
        topicName={lessonTitle}
        domain={lessonDomain}
        onComplete={handlePracticalDone}
        onSkip={handlePracticalDone}
        isPro={profile?.subscription_tier !== 'free'}
      />
    )
  }

  // End of Session Screen
  if (isEndSession && quizResult) {
    const xpAward = quizResult.xp?.xpGained ?? 10
    const goalTitle = profile?.main_goal || 'your custom goal'

    return (
      <div className="min-h-screen bg-bg text-text-1 flex flex-col items-center justify-center p-6 space-y-8 max-w-lg mx-auto text-left animate-page-enter">
        <style>{`
          @keyframes slideInUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .animate-slideInUp {
            animation: slideInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}</style>
        
        {/* Title */}
        <div className="space-y-1.5 w-full">
          <h2 className="text-3xl font-extrabold text-text-1 leading-tight">Day 1 complete. 🔥</h2>
          <p className="text-sm text-text-2">You set the foundation today. Here is what you achieved:</p>
        </div>

        {/* Accomplishments Box */}
        <div className="w-full bg-surface border border-border rounded-2xl p-5 space-y-3.5 animate-slideInUp">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 font-bold text-xs">✓</div>
            <p className="text-[13px] text-text-2">Built your <span className="text-[#A78BFA] font-bold">&quot;{goalTitle}&quot;</span> roadmap</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 font-bold text-xs">✓</div>
            <p className="text-[13px] text-text-2">Completed Lesson 1: <span className="text-text-1 font-medium">{lessonTitle}</span></p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 font-bold text-xs">✓</div>
            <p className="text-[13px] text-text-2">Earned <span className="text-[#5B8EFF] font-extrabold">{xpAward} CXP</span></p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 font-bold text-xs">✓</div>
            <p className="text-[13px] text-text-2">Started your streak</p>
          </div>
        </div>

        {/* Tomorrow Mission */}
        <div className="w-full bg-surface-alt/40 border border-border rounded-2xl p-5 space-y-2.5 animate-slideInUp" style={{ animationDelay: '150ms' }}>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#5B8EFF] font-bold block">Tomorrow&apos;s Mission</span>
          {nextLessonId ? (
            <>
              <p className="text-[14px] font-bold text-text-1 leading-snug">Complete Lesson 2: &quot;{nextLessonTitle}&quot;</p>
              <p className="text-[11px] text-text-2 font-medium">Estimated time: {nextLessonTime} minutes</p>
            </>
          ) : (
            <p className="text-[13px] text-text-1">Choose your next goal on the dashboard to build your path!</p>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3 w-full pt-4 animate-slideInUp" style={{ animationDelay: '300ms' }}>
          <Button
            onClick={handleSetReminder}
            disabled={reminderSet}
            className={`w-full h-13 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 text-[14px] ${
              reminderSet
                ? 'bg-surface-alt border border-border text-text-3 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] hover:from-[#4A7AEE] hover:to-[#9067FA] text-text-1 shadow-[0_0_24px_rgba(91,142,255,0.25)] font-bold cursor-pointer transition active:scale-[0.99]'
            }`}
          >
            <Bell className="h-4 w-4" />
            <span>{reminderSet ? `Reminder set for ${formatTime(selectedTime)} daily ⏰` : 'Set a daily reminder'}</span>
          </Button>
          <Button
            onClick={() => router.push('/dashboard')}
            variant="ghost"
            className="w-full h-13 bg-surface-alt/50 hover:bg-surface-alt border border-border text-text-2 hover:text-text-1 rounded-xl text-[13px] font-bold cursor-pointer transition active:scale-[0.99]"
          >
            Go to my dashboard
          </Button>
        </div>

        {showTimePicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-[#111622] border border-border/80 rounded-2xl p-6 w-full max-w-sm space-y-5 shadow-2xl text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                <Bell className="h-6 w-6 animate-bounce-subtle" />
              </div>
              
              <div className="space-y-1">
                <h3 className="font-heading text-lg font-bold text-text-1">When do you want to learn?</h3>
                <p className="text-xs text-text-3">Pick a time for daily study reminders.</p>
              </div>

              <div className="py-1">
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full h-12 bg-[#1a2130] border border-border rounded-xl text-center text-xl font-bold font-mono text-text-1 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowTimePicker(false)}
                  className="flex-1 border-border text-text-2 hover:bg-surface hover:text-text-1 rounded-xl h-11 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmReminder}
                  className="flex-1 bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] hover:from-[#4A7AEE] hover:to-[#9067FA] text-text-1 font-bold rounded-xl h-11 text-xs font-semibold cursor-pointer"
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Quiz Results / Completion View
  if (quizResult) {
    const firstName = profile?.name?.split(' ')[0] || 'Learner'
    const correctCount = quizResult.correctCount
    const xpAward = quizResult.cxpAwarded ?? quizResult.xp?.xpGained ?? 0
    const isRetake = quizResult.isRetake ?? false
    
    let performanceMsg = ""
    if (isRetake) {
      // Retake-specific messages
      if (correctCount >= 5) {
        performanceMsg = `Perfect score on your retake! Your understanding of ${lessonTitle} has clearly improved.`
      } else if (correctCount >= 3) {
        performanceMsg = `Good effort on the retake, ${firstName}. Keep reviewing and you will get there.`
      } else {
        performanceMsg = `Still a tough one. Take another look at the lesson — the concepts will click.`
      }
    } else {
      // First attempt messages
      if (correctCount >= 4) {
        performanceMsg = `Excellent work, ${firstName}. You have a strong grasp of ${lessonTitle}.`
      } else if (correctCount >= 2) {
        performanceMsg = `Good effort, ${firstName}. You are getting there — a couple of concepts to revisit.`
      } else {
        performanceMsg = `This one was tough. Let's review the lesson together before moving on.`
      }
    }

    return (
      <div className="min-h-screen bg-bg text-text-1 flex flex-col items-center justify-center p-6 space-y-8 max-w-md mx-auto text-center animate-page-enter">
        <style>{`
          @keyframes floatUpAndFade {
            0% { opacity: 0; transform: translateY(80px) scale(0.7); }
            15% { opacity: 1; transform: translateY(0) scale(1.15); }
            30% { transform: scale(1.0); }
            100% { opacity: 0; transform: translateY(-130px) scale(0.9); }
          }
          .animate-floatUpAndFade {
            animation: floatUpAndFade 2.4s cubic-bezier(0.25, 1, 0.50, 1) forwards;
          }
        `}</style>

        {/* Floating XP Burst Animation — first attempt only */}
        {showXpAnim && xpAward > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="animate-floatUpAndFade flex flex-col items-center">
              <span className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] drop-shadow-[0_0_24px_rgba(91,142,255,0.45)]">
                +{xpAward} CXP
              </span>
              <span className="text-[10px] font-bold text-[#A78BFA] mt-1.5 tracking-widest uppercase">
                Cognitive energy logged!
              </span>
            </div>
          </div>
        )}

        {/* Floating Referral Welcome Bonus Animation */}
        {showWelcomeBonusAnim && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="animate-floatUpAndFade flex flex-col items-center" style={{ animationDelay: '100ms' }}>
              <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-500 drop-shadow-[0_0_24px_rgba(245,158,11,0.5)]">
                +100 CXP Welcome Bonus 🎉
              </span>
              <span className="text-[10px] font-bold text-amber-500 mt-1.5 tracking-widest uppercase text-center block">
                — You were referred by a friend
              </span>
            </div>
          </div>
        )}


        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-text-1 tracking-tight">
            {isRetake ? 'Retake Complete 🔄' : 'Quiz Complete! 🎉'}
          </h2>
          <p className="text-lg font-semibold text-text-2">
            Score: <span className="text-text-1 font-extrabold">{correctCount}</span> out of 5
          </p>
        </div>

        {/* Performance details */}
        <div className="space-y-4 bg-surface border border-border p-5 rounded-2xl w-full">
          <p className="text-sm text-text-2 leading-relaxed font-medium">
            {performanceMsg}
          </p>

          {/* Hearts status inside results */}
          <div className="flex items-center justify-center gap-1.5 pt-1 border-t border-border/60 mt-3 text-xs text-text-2 font-medium">
            <span>Hearts remaining:</span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3].map((val) => {
                const isActive = val <= hearts
                return (
                  <Heart
                    key={val}
                    className={`h-3.5 w-3.5 ${
                      isActive ? 'text-rose-500 fill-current' : 'text-[#232B4C]'
                    }`}
                  />
                )
              })}
            </div>
          </div>
        </div>

        {/* Streak or Retake Banner */}
        {isRetake ? (
          <div className="w-full py-3.5 px-4 bg-surface-alt/60 border border-border rounded-2xl flex items-center justify-center gap-2">
            <span className="text-xs font-bold text-text-2 tracking-wide">
              Retakes do not award CXP — but your score is recorded.
            </span>
          </div>
        ) : (
          <div className="w-full py-3.5 px-4 bg-gradient-to-r from-[#5B8EFF]/15 to-[#A78BFA]/10 border border-[#5B8EFF]/25 rounded-2xl flex items-center justify-center gap-2">
            <Flame className="h-5 w-5 text-rose-500 fill-current animate-pulse-subtle" />
            <span className="text-xs font-bold text-text-1 tracking-wide">
              🔥 Day 1 Streak — You showed up. That matters.
            </span>
          </div>
        )}

        {/* Perfect Score Quiz Testimonial Popups */}
        {showQuizTestimonialPrompt && !showQuizTestimonialForm && (
          <div className="bg-surface border border-border p-5 rounded-2xl w-full text-center space-y-4 animate-page-enter">
            <h3 className="text-sm font-extrabold text-text-1">Perfect score 🎉</h3>
            <p className="text-xs text-text-2 font-semibold">Enjoying your Cognara journey so far?</p>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowQuizTestimonialForm(true)}
                className="flex-1 h-9 bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] text-text-1 text-xs font-bold rounded-lg cursor-pointer"
              >
                Yes — loving it
              </Button>
              <button
                onClick={() => setShowQuizTestimonialPrompt(false)}
                className="flex-1 h-9 bg-transparent hover:bg-surface-alt border border-border text-text-2 hover:text-text-1 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                type="button"
              >
                Still early days
              </button>
            </div>
          </div>
        )}

        {showQuizTestimonialPrompt && showQuizTestimonialForm && (
          <div className="w-full">
            <TestimonialForm
              moment="phase_complete"
              learningGoal={profile?.main_goal || 'My Learning Goal'}
              onComplete={() => setShowQuizTestimonialPrompt(false)}
              onDismiss={() => setShowQuizTestimonialPrompt(false)}
            />
          </div>
        )}

        {/* Action CTAs */}
        <div className="flex flex-col gap-3 w-full pt-4">
          <Button
            onClick={() => {
              if (practicalExercise && userId) {
                setShowPracticalScreen(true)
              } else {
                setIsEndSession(true)
              }
            }}
            className="w-full h-13 bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] hover:from-[#4A7AEE] hover:to-[#9067FA] text-text-1 font-bold rounded-xl shadow-[0_0_24px_rgba(91,142,255,0.3)] transition-all duration-200 flex items-center justify-center gap-2 text-[14px]"
          >
            <span>Continue →</span>
          </Button>
          <Button
            onClick={() => router.push(`/dashboard/lesson/${lessonId}`)}
            variant="ghost"
            className="w-full h-13 bg-surface-alt/50 hover:bg-surface-alt border border-border text-text-2 hover:text-text-1 rounded-xl text-[13px] font-bold"
          >
            Review this lesson
          </Button>
        </div>
      </div>
    )
  }

  // Active Focus Quiz Mode
  const currentQuestion = questions[currentIdx]
  const questionNumber = currentIdx + 1
  const totalQuestions = questions.length
  const progressPercent = (questionNumber / totalQuestions) * 100

  // Spark coach comments
  let sparkEmotion: 'idle' | 'happy' | 'celebrate' | 'thinking' | 'wave' = 'thinking'
  let sparkBubble = currentQuestion?.type === 'fill_blank'
    ? "Read the question carefully and type your answer in the box."
    : "Read the question carefully and choose the best option."
  const isCorrect = selectedAnswer.trim().toLowerCase() === currentQuestion?.correct_answer.trim().toLowerCase()

  if (isAnswerChecked) {
    if (isCorrect) {
      sparkEmotion = currentIdx % 2 === 0 ? 'celebrate' : 'happy'
      const correctBubbles = [
        "Fabulous! Synaptic connection established! 🧠",
        "Spot on! Your cognitive accuracy is peak. ⚡",
        "Excellent! You've mastered this concept. 🏆",
        "Correct! Keep up this incredible mental focus. 🚀"
      ]
      sparkBubble = correctBubbles[currentIdx % correctBubbles.length]
    } else {
      sparkEmotion = currentIdx % 2 === 0 ? 'thinking' : 'wave'
      const incorrectBubbles = [
        "Synapse misfire! Let's check the explanation below. 🔍",
        "Not quite, but every mistake is a learning hook! 🔄",
        "Almost! Review the explanation to reinforce your learning. 📚",
        "No worries, mistakes are how our brains adapt! 🧠"
      ]
      sparkBubble = incorrectBubbles[currentIdx % incorrectBubbles.length]
    }
  } else {
    if (selectedAnswer) {
      sparkEmotion = 'idle'
      sparkBubble = "Looking good! Click 'Check Answer' to test your hypothesis. 🧪"
    } else {
      sparkEmotion = 'thinking'
      const thinkingBubbles = currentQuestion?.type === 'fill_blank'
        ? [
            "Activate your critical thinking pathways! ⚡",
            "Take your time... Think of the best term to fill in the blank. 🧠",
            "Recall the key concepts from the lesson to find the correct word. 🎯",
            "Consider the context of the sentence. What word fits best? 📚"
          ]
        : [
            "Activate your critical thinking pathways! ⚡",
            "Take your time... Let's analyze this concept carefully. 🧠",
            "Select the option that matches the cognitive target. 🎯",
            "Study the options. Which one makes the most sense? 📚"
          ]
      sparkBubble = thinkingBubbles[currentIdx % thinkingBubbles.length]
    }
  }

  return (
    <div className="min-h-screen bg-bg text-text-1 flex flex-col animate-page-enter">
      {/* Styles */}
      <style>{`
        @keyframes pulse-subtle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s infinite ease-in-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>

      {/* Minimal Focus Header */}
      <header className="border-b border-border bg-bg/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[760px] mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href={`/dashboard/lesson/${lessonId}`}
            className="flex items-center space-x-2 text-xs text-text-2 hover:text-text-1 transition-colors font-medium group"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Exit Focus Mode</span>
          </Link>
          <div className="flex items-center space-x-3">
            {/* Prominent Hearts Display */}
            {profile && (
              <div className={`flex items-center space-x-1 text-rose-500 text-xs font-mono select-none mr-2 ${
                isHeartAnimating ? 'animate-shake' : ''
              }`}>
                <Heart className={`h-4 w-4 fill-current text-rose-500 ${isHeartAnimating ? 'animate-pulse' : 'animate-pulse-subtle'}`} />
                <span className="font-extrabold text-[13px]">
                  {profile.subscription_tier !== 'free' ? '∞' : hearts}
                </span>
              </div>
            )}
            <AIBadge />
            <span className="text-[10px] font-mono text-text-2 font-bold">
              Question {questionNumber} of {totalQuestions}
            </span>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-[#1E2540] h-1.5">
          <div 
            style={{ width: `${progressPercent}%` }} 
            className="bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] h-full transition-all duration-300" 
          />
        </div>
      </header>

      {/* Main Question Display */}
      <main className="flex-1 max-w-[720px] w-full mx-auto px-4 py-8 md:py-12 space-y-6">
        {/* Question Head */}
        {currentQuestion && (
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#5B8EFF] font-bold block">
              Section Quiz
            </span>
            <h2 className="font-heading text-lg md:text-xl font-semibold leading-relaxed text-text-1">
              {currentQuestion.question}
            </h2>
          </div>
        )}

        {/* Live Spark Mascot Feedback & Guidance */}
        <div className={`p-4 border rounded-xl flex items-center gap-4 transition-all duration-300 ${
          isAnswerChecked 
            ? isCorrect 
              ? 'border-emerald-500/20 bg-emerald-500/5 shadow-[0_0_12px_rgba(16,185,129,0.04)]' 
              : 'border-rose-500/20 bg-rose-500/5 shadow-[0_0_12px_rgba(239,68,68,0.04)]' 
            : 'border-border bg-surface/40'
        }`}>
          <div className="shrink-0 flex items-center justify-center p-1 bg-surface-alt rounded-xl border border-border">
            <Spark emotion={sparkEmotion} size={48} />
          </div>
          <div className="flex-grow space-y-0.5 min-w-0">
            <span className="text-[9px] font-mono font-bold text-[#5B8EFF] uppercase tracking-wider block">Spark Coach</span>
            <p className={`text-[12.5px] font-medium leading-relaxed ${
              isAnswerChecked 
                ? isCorrect 
                  ? 'text-emerald-400' 
                  : 'text-rose-400' 
                : 'text-text-2'
            }`}>
              {sparkBubble}
            </p>
          </div>
        </div>

        {/* Inputs based on type */}
        <div className="py-4">
          {currentQuestion?.type === 'multiple_choice' && (
            <div className="grid grid-cols-1 gap-3">
              {(currentQuestion.options || []).map((option) => {
                const isSelected = selectedAnswer === option
                const isCorrectAnswer = option.trim().toLowerCase() === currentQuestion.correct_answer.trim().toLowerCase()
                
                let btnStyle = 'border-border bg-surface-alt/50 hover:bg-surface-alt text-text-2'
                if (isAnswerChecked) {
                  if (isSelected) {
                    if (isCorrectAnswer) {
                      btnStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                    } else {
                      btnStyle = 'border-rose-500 bg-rose-500/10 text-rose-400 font-bold'
                    }
                  } else if (isCorrectAnswer) {
                    btnStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                  } else {
                    btnStyle = 'border-border opacity-40 text-text-3'
                  }
                } else if (isSelected) {
                  btnStyle = 'border-[#5B8EFF] bg-[#5B8EFF]/10 text-text-1 font-semibold'
                }

                return (
                  <button
                    key={option}
                    disabled={isAnswerChecked}
                    onClick={() => setSelectedAnswer(option)}
                    type="button"
                    className={`w-full text-left p-4 rounded-xl border text-sm transition-all flex items-center justify-between duration-200 ${btnStyle}`}
                  >
                    <span>{option}</span>
                    <div className="shrink-0 ml-3">
                      {isAnswerChecked ? (
                        isCorrectAnswer ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 animate-pulse" />
                        ) : isSelected ? (
                          <XCircle className="h-4 w-4 text-rose-400" />
                        ) : null
                      ) : (
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-[#5B8EFF] bg-[#5B8EFF]' : 'border-border'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {currentQuestion?.type === 'true_false' && (
            <div className="grid grid-cols-2 gap-4">
              {['true', 'false'].map((option) => {
                const isSelected = selectedAnswer === option
                const isCorrectAnswer = option.trim().toLowerCase() === currentQuestion.correct_answer.trim().toLowerCase()
                
                let btnStyle = 'border-border bg-surface-alt/50 hover:bg-surface-alt text-text-2'
                if (isAnswerChecked) {
                  if (isSelected) {
                    if (isCorrectAnswer) {
                      btnStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                    } else {
                      btnStyle = 'border-rose-500 bg-rose-500/10 text-rose-400 font-bold'
                    }
                  } else if (isCorrectAnswer) {
                    btnStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                  } else {
                    btnStyle = 'border-border opacity-40 text-text-3'
                  }
                } else if (isSelected) {
                  btnStyle = 'border-[#5B8EFF] bg-[#5B8EFF]/10 text-text-1 font-semibold'
                }

                return (
                  <button
                    key={option}
                    disabled={isAnswerChecked}
                    onClick={() => setSelectedAnswer(option)}
                    type="button"
                    className={`text-center p-6 rounded-xl border text-base font-semibold capitalize transition-all duration-200 ${btnStyle}`}
                  >
                    {option === 'true' ? 'True' : 'False'}
                  </button>
                )
              })}
            </div>
          )}

          {currentQuestion?.type === 'fill_blank' && (
            <div className="max-w-md space-y-2">
              <input
                disabled={isAnswerChecked}
                value={selectedAnswer}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                placeholder="Type your answer here..."
                type="text"
                className="w-full h-12 px-4 rounded-xl bg-surface-alt border border-border text-text-1 text-sm placeholder-[#3A4262] focus:outline-none focus:border-[#5B8EFF] transition-colors disabled:opacity-75"
              />
              <p className="text-[10px] font-mono text-text-3">
                Tip: Correct spelling is required (single word or short phrase).
              </p>
            </div>
          )}
        </div>

        {/* Action button */}
        {!isAnswerChecked ? (
          <Button
            onClick={handleCheckAnswer}
            disabled={!selectedAnswer.trim()}
            className="w-full h-13 bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] hover:from-[#4A7AEE] hover:to-[#9067FA] text-text-1 font-bold rounded-xl shadow-[0_0_24px_rgba(91,142,255,0.25)] transition-all duration-200 flex items-center justify-center gap-2 text-[14px] disabled:opacity-50"
          >
            Check Answer
          </Button>
        ) : (
          <div className="space-y-6">
            {/* Feedback Panel */}
            {(() => {
              const isCorrect = selectedAnswer.trim().toLowerCase() === currentQuestion.correct_answer.trim().toLowerCase()
              return (
                <div className={`p-5 rounded-xl border flex gap-4 items-start ${
                  isCorrect
                    ? 'border-emerald-500/25 bg-emerald-500/5 text-text-1'
                    : 'border-rose-500/25 bg-rose-500/5 text-text-1'
                }`}>
                  {isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <h4 className={`text-xs font-bold uppercase tracking-widest ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isCorrect ? 'Correct Answer' : 'Incorrect Answer'}
                    </h4>
                    {!isCorrect && (
                      <p className="text-[12px] text-text-2 font-medium mt-1">
                        Correct answer: <span className="font-mono text-emerald-400">{currentQuestion.correct_answer}</span>
                      </p>
                    )}
                    <p className="text-[12.5px] text-text-2 leading-relaxed pt-1 font-medium">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                </div>
              )
            })()}

            <Button
              onClick={handleNextQuestion}
              disabled={isSubmitting}
              className="w-full h-13 bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] hover:from-[#4A7AEE] hover:to-[#9067FA] text-text-1 font-bold rounded-xl shadow-[0_0_24px_rgba(91,142,255,0.3)] transition-all duration-200 flex items-center justify-center text-[14px]"
            >
              {isSubmitting ? 'Saving...' : currentIdx === questions.length - 1 ? 'Submit Assessment' : 'Next Question'}
            </Button>
          </div>
        )}
      </main>

      {/* Hidden Certificate Template for Canvas Capture */}
      {phaseCompleteData && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
          <CertificateTemplate
            userName={profile?.name || 'Learner'}
            phaseName={phaseCompleteData.phaseName}
            phaseNumber={phaseCompleteData.phaseNumber}
            goalName={phaseCompleteData.goalName}
            topicsCovered={phaseCompleteData.topics || []}
            completionDate={new Date().toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
            certificateId={currentGeneratedId || 'CGN-TEMP'}
            isGoalCompletion={phaseCompleteData ? !phaseCompleteData.nextPhaseNumber : false}
            theme={typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
          />
        </div>
      )}


      {/* Generating Overlay Modal */}
      {isGeneratingCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl p-6 text-center space-y-4">
            <div className="w-10 h-10 border-4 border-[#5B8EFF]/20 border-t-[#5B8EFF] rounded-full animate-spin mx-auto" />
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-text-1 uppercase tracking-wider">Preparing Certificate</h3>
              <p className="text-xs text-text-2">Generating your premium high-fidelity document...</p>
            </div>
          </div>
        </div>
      )}

      {/* Friendly Error Overlay Modal */}
      {showFriendlyError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-surface border border-amber-500/20 rounded-2xl shadow-2xl p-6 text-center space-y-5">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center text-amber-500 mx-auto">
              <span className="text-xl">✨</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-text-1">Your certificate is being prepared.</h3>
              <p className="text-xs text-text-2 leading-relaxed">
                It will be ready in your profile within a few minutes.
              </p>
            </div>
            <Button
              onClick={() => {
                setShowFriendlyError(false)
                handleContinueWithoutClaiming()
              }}
              className="w-full h-11 bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] text-text-1 font-bold rounded-xl text-xs cursor-pointer"
            >
              Continue to Phase {phaseCompleteData?.nextPhaseNumber || (phaseCompleteData?.phaseNumber + 1)}
            </Button>
          </div>
        </div>
      )}

      {/* Hidden Streak Badge Template for Canvas Capture */}
      {milestoneStreakDays && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
          <StreakBadgeTemplate
            userName={profile?.name || 'Learner'}
            streakDays={milestoneStreakDays}
          />
        </div>
      )}

      {/* Generating Overlay Modal for Streak Badges */}
      {isGeneratingBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl p-6 text-center space-y-4">
            <div className="w-10 h-10 border-4 border-[#5B8EFF]/20 border-t-[#5B8EFF] rounded-full animate-spin mx-auto" />
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-text-1 uppercase tracking-wider">Generating Badge</h3>
              <p className="text-xs text-text-2">Creating your shareable streak milestone card...</p>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Progress Card Template for Canvas Capture */}
      {milestoneProgressPercent && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
          <ProgressCardTemplate
            userName={bulkUserName || profile?.name || 'Learner'}
            milestonePercent={milestoneProgressPercent}
            goalName={bulkGoalName}
          />
        </div>
      )}

      {/* Generating Overlay Modal for Progress Cards */}
      {isGeneratingProgressCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl p-6 text-center space-y-4 animate-scale-up">
            <div className="w-10 h-10 border-4 border-[#6366F1]/20 border-t-[#6366F1] rounded-full animate-spin mx-auto" />
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-text-1 uppercase tracking-wider">Generating Progress Card</h3>
              <p className="text-xs text-text-2">Creating your shareable goal milestone card...</p>
            </div>
          </div>
        </div>
      )}

      {/* Unified Award Modal for real-time achievements */}
      {currentPendingAward && (
        <AwardModal
          award={currentPendingAward}
          onClose={async () => {
            const awardId = currentPendingAward.id
            await supabase
              .from('cognara_pending_awards')
              .update({
                is_shown: true,
                shown_at: new Date().toISOString()
              })
              .eq('id', awardId)
            setCurrentPendingAward(null)
          }}
        />
      )}
    </div>
  )
}

interface StreakBadgeTemplateProps {
  userName: string
  streakDays: number
}

function StreakBadgeTemplate({ 
  userName, 
  streakDays
}: StreakBadgeTemplateProps) {
  const milestoneConfig: Record<number, { emoji: string; label: string; color: string; message: string }> = {
    7: {
      emoji: '🔥',
      label: '7 Day Streak',
      color: '#F59E0B',
      message: 'One week of consistent learning'
    },
    30: {
      emoji: '⚡',
      label: '30 Day Streak',
      color: '#6366F1',
      message: 'One month of showing up every day'
    },
    100: {
      emoji: '👑',
      label: '100 Day Streak',
      color: '#10B981',
      message: '100 days of unstoppable learning'
    }
  }

  const config = milestoneConfig[streakDays] || milestoneConfig[7]

  return (
    <div
      id={`streak-badge-${streakDays}`}
      style={{
        width: '1200px',
        height: '630px',
        backgroundColor: '#0F1629',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background subtle pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(circle at 50% 50%, ${config.color}15 0%, transparent 70%)`
      }} />

      {/* Cognara logo */}
      <img
        src="/cognara-logo.png"
        alt="Cognara"
        style={{
          height: '40px',
          marginBottom: '32px',
          opacity: 0.9
        }}
      />

      {/* Emoji */}
      <div style={{
        fontSize: '72px',
        marginBottom: '16px',
        lineHeight: 1
      }}>
        {config.emoji}
      </div>

      {/* Streak number */}
      <div style={{
        fontSize: '80px',
        fontWeight: '900',
        color: config.color,
        lineHeight: 1,
        marginBottom: '8px'
      }}>
        {streakDays}
      </div>

      {/* Label */}
      <div style={{
        fontSize: '32px',
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: '16px',
        letterSpacing: '0.05em'
      }}>
        {config.label}
      </div>

      {/* User name */}
      <div style={{
        fontSize: '20px',
        color: '#94A3B8',
        marginBottom: '8px'
      }}>
        {userName}
      </div>

      {/* Message */}
      <div style={{
        fontSize: '18px',
        color: '#64748B',
        marginBottom: '32px'
      }}>
        {config.message}
      </div>

      {/* Cognara URL */}
      <div style={{
        fontSize: '16px',
        color: config.color,
        letterSpacing: '0.1em',
        fontWeight: '600'
      }}>
        cognaralearn.com
      </div>

    </div>
  )
}

interface ProgressCardTemplateProps {
  userName: string
  milestonePercent: number
  goalName: string
}

function ProgressCardTemplate({
  userName,
  milestonePercent,
  goalName
}: ProgressCardTemplateProps) {
  const accentColor = milestonePercent === 25 ? '#3B82F6' : milestonePercent === 50 ? '#8B5CF6' : '#EC4899'
  const emoji = milestonePercent === 25 ? '🚀' : milestonePercent === 50 ? '⚡' : '🏆'
  const text = milestonePercent === 25 
    ? 'One-quarter of the way to mastering this goal!'
    : milestonePercent === 50
    ? 'Halfway mark! Consistency is turning into mastery.'
    : 'Three-quarters complete. The finish line is in sight!'

  return (
    <div
      id={`progress-card-${milestonePercent}`}
      style={{
        width: '1200px',
        height: '630px',
        backgroundColor: '#0F1629',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(circle at 50% 50%, ${accentColor}15 0%, transparent 70%)`
      }} />

      <img
        src="/cognara-logo.png"
        alt="Cognara"
        style={{
          height: '40px',
          marginBottom: '32px',
          opacity: 0.9
        }}
      />

      <span style={{ fontSize: '72px', marginBottom: '16px', lineHeight: 1 }}>
        {emoji}
      </span>
      
      <div style={{
        fontSize: '48px',
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: '12px',
        letterSpacing: '0.05em'
      }}>
        {milestonePercent}% COMPLETE
      </div>
      
      <div style={{
        fontSize: '20px',
        color: accentColor,
        fontWeight: '700',
        marginBottom: '24px',
        textTransform: 'uppercase',
        letterSpacing: '0.1em'
      }}>
        Goal Progress Card
      </div>
      
      <div style={{
        fontSize: '24px',
        color: '#FFFFFF',
        fontWeight: '600',
        marginBottom: '8px'
      }}>
        {userName}
      </div>

      <div style={{
        fontSize: '18px',
        color: '#E2E8F0',
        fontWeight: '500',
        maxWidth: '800px',
        textAlign: 'center',
        lineHeight: '1.4',
        marginBottom: '16px'
      }}>
        {goalName}
      </div>
      
      <div style={{
        fontSize: '16px',
        color: '#94A3B8',
        maxWidth: '800px',
        textAlign: 'center',
        lineHeight: 1.4,
        marginBottom: '32px'
      }}>
        {text}
      </div>

      <div style={{
        fontSize: '16px',
        color: accentColor,
        fontWeight: '600',
        letterSpacing: '0.15em'
      }}>
        COGNARALEARN.COM
      </div>
    </div>
  )
}
