'use client'

import React, { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Flame, Award, Heart, Sparkles, Calendar, BookOpen, Clock, CheckCircle2, ChevronRight, HelpCircle, X, ShieldAlert, Bell } from 'lucide-react'
import { getLevelInfo } from '@/lib/leveling'
import { Spark } from '@/components/mascot/Spark'
import { SparkDrawer } from '@/components/lesson/SparkDrawer'
import { useToast } from '@/components/ui/toast'
import { SoundEffects } from '@/lib/sound'
import { Logo } from '@/components/ui/Logo'
import { ProfileDropdown } from '@/components/dashboard/ProfileDropdown'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  // Loading & States
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Data States
  const [profile, setProfile] = useState<any>(null)
  const [goal, setGoal] = useState<any>(null)
  const [roadmap, setRoadmap] = useState<any>(null)
  const [phases, setPhases] = useState<any[]>([])
  const [lessons, setLessons] = useState<any[]>([])
  const [progress, setProgress] = useState<any[]>([])
  const [quizAttempts, setQuizAttempts] = useState<any[]>([])
  const [streakData, setStreakData] = useState<any>(null)
  const [dailyQuest, setDailyQuest] = useState<any>(null)

  // Interactive States
  const [activeModal, setActiveModal] = useState<'streak' | 'cxp' | 'hearts' | null>(null)
  const [isSparkOpen, setIsSparkOpen] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [isRefillingHearts, setIsRefillingHearts] = useState(false)

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

      setProfile((prev: any) => ({
        ...prev,
        hearts: 3,
        xp: Math.max(0, (prev.xp || 0) - 150)
      }))

      SoundEffects.play('success')

      window.dispatchEvent(new CustomEvent('cognara_hearts_changed', {
        detail: { hearts: 3 }
      }))

      toast('Hearts refilled! ❤️ 3/3 Cognitive Energy')
    } catch (err) {
      console.error('Failed to refill hearts:', err)
      toast('Failed to refill hearts with CXP.', 'error')
    } finally {
      setIsRefillingHearts(false)
    }
  }

  // TOP BAR layout integration states
  const [email, setEmail] = useState<string>('')
  const [recentBadgeEmoji, setRecentBadgeEmoji] = useState<string>('')
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const notificationsRef = useRef<HTMLDivElement>(null)
  const [showStreakBreak, setShowStreakBreak] = useState(false)
  const [show5DayAbsence, setShow5DayAbsence] = useState(false)
  const [dismissedStreakCard, setDismissedStreakCard] = useState(false)


  // Load custom notifications dynamically
  useEffect(() => {
    if (profile && streakData?.current_streak !== undefined) {
      const items = [
        {
          id: 'streak',
          title: 'Daily Streak Active! 🔥',
          body: `You have maintained a study streak of ${streakData.current_streak} days. Keep it up!`,
          time: 'Today',
          read: false
        },
        {
          id: 'path',
          title: 'Roadmap Compiled! 🗺️',
          body: `Your path for "${roadmap?.title || 'learning goals'}" is live.`,
          time: 'Recently',
          read: true
        },
        {
          id: 'profile',
          title: 'Welcome to Cognara ✨',
          body: `Personalizing details for ${profile.name || 'your profile'}.`,
          time: 'Active',
          read: true
        }
      ]
      setNotifications(items)
    }
  }, [profile, streakData?.current_streak, roadmap?.title])

  // Click outside listener for notifications dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false)
      }
    }
    if (isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isNotificationsOpen])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleDismissStreakCard = async () => {
    setDismissedStreakCard(true)
    try {
      await supabase
        .from('profiles')
        .update({ dismissed_streak_nudge: true })
        .eq('id', profile.id)
    } catch (err) {
      console.error('Failed to dismiss streak card in Supabase:', err)
    }
  }

  const handleInviteFriend = async () => {
    const referralCode = profile?.referral_code || `CGN-${profile?.id?.substring(0, 4).toUpperCase()}`
    const referralLink = `https://www.cognaralearn.com/signup?ref=${referralCode}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Cognara',
          text: `I have maintained a learning streak on Cognara. Try it free and earn bonus CXP:`,
          url: referralLink
        })
      } catch (err) {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(referralLink)
      toast('Referral link copied — share it with a friend!', 'success')
    }
  }


  // Load dashboard details on mount
  useEffect(() => {
    async function loadDashboard() {
      try {
        setIsLoading(true)

        // 1. Authenticate user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        setUserId(user.id)
        setEmail(user.email || '')

        // 2. Fetch User Profile
        const { data: profRow } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (!profRow) {
          router.push('/onboarding')
          return
        }
        setProfile(profRow)

        // Fetch latest badge
        const { data: latestBadge } = await supabase
          .from('user_badges')
          .select('badge_emoji')
          .eq('user_id', user.id)
          .order('earned_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (latestBadge) {
          setRecentBadgeEmoji(latestBadge.badge_emoji)
        }

        // 3. Fetch Active Goal
        const { data: goalRow } = await supabase
          .from('learning_goals')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle()

        if (!goalRow) {
          router.push('/onboarding')
          return
        }
        setGoal(goalRow)

        // 4. Fetch Roadmap
        const { data: roadmapRow } = await supabase
          .from('roadmaps')
          .select('*')
          .eq('goal_id', goalRow.id)
          .eq('user_id', user.id)
          .maybeSingle()

        if (!roadmapRow) {
          router.push('/onboarding')
          return
        }
        setRoadmap(roadmapRow)

        // 5. Fetch Sibling Phases & Lessons (in parallel)
        const [phasesRes, lessonsRes, progressRes, quizRes, streakRes] = await Promise.all([
          supabase.from('roadmap_phases').select('*').eq('roadmap_id', roadmapRow.id).order('phase_number', { ascending: true }),
          supabase.from('lessons').select('*').eq('roadmap_id', roadmapRow.id),
          supabase.from('lesson_progress').select('*').eq('user_id', user.id),
          supabase.from('quiz_attempts').select('*').eq('user_id', user.id).order('attempted_at', { ascending: false }),
          supabase.from('streaks').select('*').eq('user_id', user.id).maybeSingle()
        ])

        setPhases(phasesRes.data || [])
        setProgress(progressRes.data || [])
        setQuizAttempts(quizRes.data || [])
        
        const streakDataVal = streakRes.data || {
          current_streak: 0,
          longest_streak: 0,
          last_activity_at: null,
          shields_available: 0
        }
        setStreakData(streakDataVal)

        // Sort lessons sequentially: by phase_number first, then by order_index
        const sortedPhases = [...(phasesRes.data || [])].sort((a, b) => a.phase_number - b.phase_number)
        const lessonsByPhase: Record<string, any[]> = {}
        lessonsRes.data?.forEach((l: any) => {
          if (!lessonsByPhase[l.phase_id]) {
            lessonsByPhase[l.phase_id] = []
          }
          lessonsByPhase[l.phase_id].push(l)
        })

        const orderedLessons: any[] = []
        sortedPhases.forEach((phase) => {
          const phaseLessons = lessonsByPhase[phase.id] || []
          phaseLessons.sort((a: any, b: any) => a.order_index - b.order_index)
          orderedLessons.push(...phaseLessons)
        })
        setLessons(orderedLessons)

        // 6. Fetch Daily Quests
        try {
          const questResponse = await fetch('/api/quests')
          if (questResponse.ok) {
            const questData = await questResponse.json()
            if (questData.daily && questData.daily.length > 0) {
              // Find first incomplete/unclaimed quest, or default to first
              const activeQuest = questData.daily.find((q: any) => !q.claimed) || questData.daily[0]
              setDailyQuest(activeQuest)
            }
          }
        } catch (questErr) {
          console.warn('Failed to load daily quests:', questErr)
        }

      } catch (err) {
        console.error('Error loading dashboard data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboard()
  }, [supabase, router])

  // Handle Quest Claiming
  const handleClaimQuest = async () => {
    if (!dailyQuest || isClaiming) return
    setIsClaiming(true)
    try {
      const res = await fetch('/api/quests/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questKey: dailyQuest.key,
          resetDate: dailyQuest.resetDate,
          xpReward: dailyQuest.xpReward
        })
      })

      if (res.ok) {
        toast(`Quest Claimed! +${dailyQuest.xpReward} CXP earned ⚡`)
        SoundEffects.play('achievement')
        
        // Update local quest state
        setDailyQuest((prev: any) => prev ? { ...prev, claimed: true } : null)
        
        // Update user XP locally
        setProfile((prev: any) => prev ? { ...prev, xp: (prev.xp || 0) + dailyQuest.xpReward } : null)
        window.dispatchEvent(new CustomEvent('cognara_xp_gained', {
          detail: {
            xpGained: dailyQuest.xpReward,
            newXp: (profile?.xp || 0) + dailyQuest.xpReward,
            newLevel: getLevelInfo((profile?.xp || 0) + dailyQuest.xpReward).level,
            leveledUp: false
          }
        }))
      } else {
        toast('Failed to claim quest reward.', 'error')
      }
    } catch {
      toast('Error claiming quest reward.', 'error')
    } finally {
      setIsClaiming(false)
    }
  }

  // 1. Check if streak broke since last login
  const lastActivity = streakData?.last_activity_at
  let isStreakBroken = false
  let diffDays = 0
  if (lastActivity && streakData?.current_streak > 0) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const lastDate = new Date(lastActivity)
    lastDate.setHours(0, 0, 0, 0)
    diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays > 1) {
      const hasShield = (diffDays === 2 && (streakData.shields_available || 0) > 0)
      if (!hasShield) {
        isStreakBroken = true
      }
    }
  }

  useEffect(() => {
    if (!isLoading) {
      if (diffDays >= 5) {
        const dismissed = sessionStorage.getItem('dismissed_5day_absence')
        if (dismissed !== 'true') {
          setShow5DayAbsence(true)
        }
      } else if (isStreakBroken) {
        const dismissed = sessionStorage.getItem('dismissed_streak_break')
        if (dismissed !== 'true') {
          setShowStreakBreak(true)
        }
      }
    }
  }, [isLoading, diffDays, isStreakBroken])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0C14] text-[#F0F4FF] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-mono text-[#8B95B3] tracking-wide animate-pulse">
          Syncing learning telemetry...
        </p>
      </div>
    )
  }

  // Derive metrics
  const levelInfo = getLevelInfo(profile?.xp || 0)
  const completedIds = new Set(progress?.filter((p) => p.status === 'completed').map((p) => p.lesson_id) || [])
  const completedLessonsCount = completedIds.size
  const totalLessonsCount = lessons.length
  const progressRatio = totalLessonsCount > 0 ? (completedLessonsCount / totalLessonsCount) * 100 : 0

  // 1. Where am I? Find active lesson
  const activeLessonIdx = lessons.findIndex((l) => !completedIds.has(l.id))
  const activeLesson = activeLessonIdx !== -1 ? lessons[activeLessonIdx] : lessons[lessons.length - 1]

  // Check if today's lesson is already completed
  const hasCompletedToday = activeLessonIdx === -1 // all completed

  // Calculate Phase and Module labels for active lesson
  let activePhaseNumber = 1
  let activePhaseTitle = ''
  if (activeLesson) {
    const ph = phases.find(p => p.id === activeLesson.phase_id)
    if (ph) {
      activePhaseNumber = ph.phase_number
      activePhaseTitle = ph.title
    }
  } else if (phases.length > 0) {
    const lastPhase = phases[phases.length - 1]
    activePhaseNumber = lastPhase.phase_number
    activePhaseTitle = lastPhase.title
  }

  // Calculate active module number and module title from profile.main_roadmap
  let activeModuleNumber = 1
  let activeModuleTitle = ''
  let totalModulesInPhase = 1
  if (profile?.main_roadmap) {
    const rawPhases = profile.main_roadmap.phases || []
    const currentRawPhase = rawPhases.find((p: any) => p.phase_number === activePhaseNumber)
    if (currentRawPhase) {
      totalModulesInPhase = (currentRawPhase.modules || []).length || 1
      const rawModules = currentRawPhase.modules || []
      
      const lessonToFind = activeLesson || lessons[lessons.length - 1]
      if (lessonToFind) {
        const currentRawModule = rawModules.find((m: any) => 
          (m.topics || []).some((topic: string) => topic.toLowerCase() === lessonToFind.title.toLowerCase())
        )
        if (currentRawModule) {
          activeModuleNumber = currentRawModule.module_number || 1
          activeModuleTitle = currentRawModule.module_name || ''
        } else {
          // Default to last module if lesson is completed/not found
          activeModuleNumber = totalModulesInPhase
          activeModuleTitle = rawModules[rawModules.length - 1]?.module_name || ''
        }
      }
    }
  }

  // Calculate estimated completion date
  const dailyStudyMinutes = profile?.daily_study_minutes || 30
  const remainingLessons = totalLessonsCount - completedLessonsCount
  const remainingMinutes = remainingLessons * 10 // 10 mins per lesson + quiz estimate
  const remainingDays = Math.ceil(remainingMinutes / dailyStudyMinutes)
  
  const compDate = new Date()
  compDate.setDate(compDate.getDate() + remainingDays)
  const formattedCompDate = compDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })


  const handleStreakBreakJumpIn = async () => {
    if (!userId || !streakData) return
    setIsLoading(true)
    try {
      const todayStr = new Date().toISOString().split('T')[0]
      
      // Log streak break event to Supabase
      await supabase
        .from('cognara_engagement_events')
        .insert({
          user_id: userId,
          event_type: 'streak_break',
          event_data: {
            previous_streak: streakData.current_streak,
            last_activity_at: streakData.last_activity_at,
            action: 'jump_back_in'
          }
        })

      // Reset streak to Day 1 in streaks table
      await supabase
        .from('streaks')
        .update({
          current_streak: 1,
          last_activity_at: todayStr,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      // Update local state
      setStreakData((prev: any) => ({
        ...prev,
        current_streak: 1,
        last_activity_at: todayStr
      }))

      // Hide streak break screen
      setShowStreakBreak(false)
      
      // Load active lesson (shortened session)
      if (activeLesson) {
        router.push(`/dashboard/lesson/${activeLesson.id}?reentry=true`)
      }
    } catch (err) {
      console.error('Error in handleStreakBreakJumpIn:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStreakBreakRemindLater = async () => {
    if (userId && streakData) {
      try {
        await supabase
          .from('cognara_engagement_events')
          .insert({
            user_id: userId,
            event_type: 'streak_break',
            event_data: {
              previous_streak: streakData.current_streak,
              last_activity_at: streakData.last_activity_at,
              action: 'remind_later'
            }
          })
      } catch (err) {
        console.error('Error logging remind later event:', err)
      }
    }
    sessionStorage.setItem('dismissed_streak_break', 'true')
    setShowStreakBreak(false)
  }

  const handle5DayAbsenceJumpIn = async () => {
    if (!userId || !streakData) return
    setIsLoading(true)
    try {
      const todayStr = new Date().toISOString().split('T')[0]
      
      // Log 5-day absence event to Supabase
      await supabase
        .from('cognara_engagement_events')
        .insert({
          user_id: userId,
          event_type: 'streak_break',
          event_data: {
            previous_streak: streakData.current_streak,
            last_activity_at: streakData.last_activity_at,
            action: 'show_adjusted_plan',
            diff_days: diffDays
          }
        })

      // Reset streak to Day 1 in streaks table
      await supabase
        .from('streaks')
        .update({
          current_streak: 1,
          last_activity_at: todayStr,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      // Update local state
      setStreakData((prev: any) => ({
        ...prev,
        current_streak: 1,
        last_activity_at: todayStr
      }))

      sessionStorage.setItem('dismissed_5day_absence', 'true')
      setShow5DayAbsence(false)
      
      // Load active lesson (shortened session)
      if (activeLesson) {
        router.push(`/dashboard/lesson/${activeLesson.id}?reentry=true`)
      }
    } catch (err) {
      console.error('Error in handle5DayAbsenceJumpIn:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handle5DayAbsenceRemindLater = async () => {
    if (userId && streakData) {
      try {
        await supabase
          .from('cognara_engagement_events')
          .insert({
            user_id: userId,
            event_type: 'streak_break',
            event_data: {
              previous_streak: streakData.current_streak,
              last_activity_at: streakData.last_activity_at,
              action: 'remind_later_5day',
              diff_days: diffDays
            }
          })
      } catch (err) {
        console.error('Error logging 5-day remind later event:', err)
      }
    }
    sessionStorage.setItem('dismissed_5day_absence', 'true')
    setShow5DayAbsence(false)
  }

  // Sibling next lesson context (for serializing Spark chat)
  const activeLessonContent = activeLesson?.content as any
  const lessonBodyContent = (activeLessonContent && typeof activeLessonContent === 'object')
    ? (activeLessonContent[profile?.learning_depth ?? 2] || Object.values(activeLessonContent)[0])
    : activeLessonContent
  const sparkLessonContext = lessonBodyContent
    ? (lessonBodyContent.sections || [])
        .map((s: any) => [s.heading, s.body || s.callout_body || s.code_snippet || ''].filter(Boolean).join('\n'))
        .join('\n\n')
    : ''

  // Spark Check-In Condition Evaluation
  let showSpark = false
  let sparkMsg = ""

  // Evaluation 1: Quiz Failure last session
  const latestQuizAttempt = quizAttempts[0]
  const failedLastQuiz = latestQuizAttempt && !latestQuizAttempt.passed

  // Evaluation 2: Absent for 2+ days
  const lastActivityDate = streakData?.last_activity_at ? new Date(streakData.last_activity_at) : null
  const isAbsent2Days = lastActivityDate 
    ? (new Date().getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24) >= 2 
    : false

  // Evaluation 3: Just Completed a Phase (all lessons in a phase completed in the last 24 hours)
  const completedPhases = phases.filter(phase => {
    const phaseLessons = lessons.filter(l => l.phase_id === phase.id)
    return phaseLessons.length > 0 && phaseLessons.every(l => completedIds.has(l.id))
  })
  const isPhaseCompletedRecently = completedPhases.some(phase => {
    const phaseLessons = lessons.filter(l => l.phase_id === phase.id)
    return phaseLessons.some(l => {
      const prog = progress.find(p => p.lesson_id === l.id && p.status === 'completed')
      if (!prog || !prog.completed_at) return false
      const timeDiff = new Date().getTime() - new Date(prog.completed_at).getTime()
      return timeDiff <= 24 * 60 * 60 * 1000 // 24 hours
    })
  })

  // Evaluation 4: Streak At Risk today (streak active, last activity yesterday, no lessons/quizzes completed today)
  const hasActivityToday = progress.some(p => {
    if (p.status !== 'completed' || !p.completed_at) return false
    return new Date(p.completed_at).toDateString() === new Date().toDateString()
  }) || quizAttempts.some(qa => {
    return new Date(qa.attempted_at).toDateString() === new Date().toDateString()
  })
  const isLastActivityYesterday = lastActivityDate 
    ? (new Date().toDateString() !== lastActivityDate.toDateString() && 
       (new Date().getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24) < 2)
    : false
  const isStreakAtRisk = (streakData?.current_streak > 0) && isLastActivityYesterday && !hasActivityToday

  if (failedLastQuiz) {
    showSpark = true
    sparkMsg = "Hey! Don't sweat that last quiz. Mistakes are just proof that you're pushing your boundaries. Let's review the lesson and try again together — you've got this!"
  } else if (isAbsent2Days) {
    showSpark = true
    sparkMsg = "Welcome back! I've missed our study sessions. Life gets busy, but showing up today is a huge win. Let's ease back in with our next lesson!"
  } else if (isPhaseCompletedRecently) {
    showSpark = true
    sparkMsg = "Woohoo! You completed a whole phase recently! That's a massive milestone. Take a second to celebrate, then let's keep this momentum going!"
  } else if (isStreakAtRisk) {
    showSpark = true
    sparkMsg = "Your streak is at risk today! Just 10-15 minutes of learning is all it takes to keep the fire burning. Let's do this!"
  }

  // Quick Stats Calculations (This week metrics)
  const getSunday = () => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day
    const sun = new Date(today.setDate(diff))
    sun.setHours(0,0,0,0)
    return sun
  }
  const weekStart = getSunday()
  const completedThisWeek = progress.filter(p => p.status === 'completed' && p.completed_at && new Date(p.completed_at) >= weekStart).length
  const quizzesPassedThisWeek = quizAttempts.filter(qa => qa.passed && qa.attempted_at && new Date(qa.attempted_at) >= weekStart).length
  
  let cxpEarnedThisWeek = completedThisWeek * 100
  quizAttempts.forEach(qa => {
    if (qa.attempted_at && new Date(qa.attempted_at) >= weekStart) {
      let quizXp = 10
      if (qa.score === 100) quizXp = 100
      else if (qa.score >= 80) quizXp = 80
      else if (qa.score >= 60) quizXp = 60
      else if (qa.score >= 40) quizXp = 40
      else if (qa.score >= 20) quizXp = 20
      cxpEarnedThisWeek += quizXp
    }
  })

  let totalSeconds = completedThisWeek * 5 * 60 // 5 mins per lesson estimate
  quizAttempts.forEach(qa => {
    if (qa.attempted_at && new Date(qa.attempted_at) >= weekStart) {
      totalSeconds += qa.time_spent_secs || 120
    }
  })
  const hoursSpent = Math.floor(totalSeconds / 3600)
  const minsSpent = Math.floor((totalSeconds % 3600) / 60)

  if (showStreakBreak) {
    return (
      <div className="min-h-screen bg-[#0A0C14] text-[#F0F4FF] flex items-center justify-center p-4">
        <div className="flex flex-col items-center justify-center text-center p-6 space-y-6 max-w-sm mx-auto min-h-[85vh] animate-page-enter">
          <div className="p-4 bg-[#1A203C] rounded-2xl border border-[#2E3750] shadow-inner mb-2 animate-pulse-subtle">
            <Spark emotion="thinking" size={80} />
          </div>
          
          <h2 className="text-2xl font-extrabold text-white">Hey {profile?.name || 'there'}.</h2>
          
          <div className="space-y-4 text-sm text-[#C8D0E8] leading-relaxed">
            <p>
              &ldquo;Your streak broke. That happens — life gets busy and that is okay.&rdquo;
            </p>
            
            <div className="bg-[#111424] border border-[#1E2540]/60 rounded-2xl p-4 text-left space-y-2 mt-4 select-none">
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-[#5B8EFF] font-bold">Here is what you have already built:</h4>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{completedLessonsCount} lessons completed</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{quizAttempts.filter(qa => qa.passed).length} quizzes passed</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{Math.round(progressRatio)}% of your {roadmap?.title || profile?.main_goal || 'Goal'} roadmap done</span>
              </div>
            </div>
            
            <p>
              &ldquo;That progress is still here. Every lesson you completed still counts.&rdquo;
            </p>
            
            <p className="font-semibold text-white">
              Ready to start a new streak?
            </p>
          </div>

          <div className="w-full space-y-3 pt-4">
            <Button
              onClick={handleStreakBreakJumpIn}
              className="w-full h-12 bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] hover:from-[#4A7AEE] hover:to-[#9067FA] text-white font-bold rounded-xl shadow-[0_0_20px_rgba(91,142,255,0.25)] cursor-pointer"
            >
              Jump back in — 10 minutes
            </Button>
            <button
              onClick={handleStreakBreakRemindLater}
              className="text-xs text-[#8B95B3] hover:text-white transition font-bold block mx-auto py-2 cursor-pointer"
              type="button"
            >
              Remind me later
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (show5DayAbsence) {
    return (
      <div className="min-h-screen bg-[#0A0C14] text-[#F0F4FF] flex items-center justify-center p-4">
        <div className="flex flex-col items-center justify-center text-center p-6 space-y-6 max-w-sm mx-auto min-h-[85vh] animate-page-enter">
          <div className="p-4 bg-[#1A203C] rounded-2xl border border-[#2E3750] shadow-inner mb-2 animate-pulse-subtle">
            <Spark emotion="wave" size={80} />
          </div>
          
          <h2 className="text-2xl font-extrabold text-white">Hey {profile?.name || 'there'}.</h2>
          
          <div className="space-y-4 text-sm text-[#C8D0E8] leading-relaxed">
            <p>
              &ldquo;It&apos;s been a few days.&rdquo;
            </p>
            <p>
              &ldquo;I&apos;ve looked at where you are in your roadmap and adjusted tomorrow&apos;s mission to help you ease back in.&rdquo;
            </p>
            <p>
              &ldquo;You&apos;ve already done the hard part — starting. Let&apos;s not let that work go to waste.&rdquo;
            </p>
          </div>

          <div className="w-full space-y-3 pt-4">
            <Button
              onClick={handle5DayAbsenceJumpIn}
              className="w-full h-12 bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] hover:from-[#4A7AEE] hover:to-[#9067FA] text-white font-bold rounded-xl shadow-[0_0_20px_rgba(91,142,255,0.25)] cursor-pointer"
            >
              Show me my adjusted plan
            </Button>
            <button
              onClick={handle5DayAbsenceRemindLater}
              className="text-xs text-[#8B95B3] hover:text-white transition font-bold block mx-auto py-2 cursor-pointer"
              type="button"
            >
              Remind me later
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[680px] mx-auto w-full py-4 space-y-8 animate-page-enter">
      {/* Modals styles */}
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-modal {
          animation: modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* SECTION 1 — TODAY'S MISSION */}
      <section className="relative overflow-hidden border border-[#1E2540] bg-[#111424] p-6 rounded-3xl shadow-lg flex flex-col gap-5">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-gradient-to-br from-[#5B8EFF]/10 to-[#A78BFA]/15 blur-[65px] opacity-60 pointer-events-none" />

        <div className="relative space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#5B8EFF] font-bold block">
            Today&apos;s Mission
          </span>
          <p className="text-xs text-[#8B95B3] font-semibold">
            {roadmap?.title || profile?.main_goal || 'Goal'} — Phase {activePhaseNumber} · Module {activeModuleNumber}
          </p>
          {activeLesson && (
            <>
              <h3 className="text-2xl font-extrabold text-white tracking-tight leading-snug">
                {activeLesson.title}
              </h3>
              <p className="text-[#C8D0E8] text-[13px] leading-relaxed line-clamp-2">
                {activeLesson.description || 'Gain standard depth insights on this topic.'}
              </p>
            </>
          )}
        </div>

        {activeLesson && !hasCompletedToday && (
          <div className="relative flex items-center justify-between text-xs text-[#8B95B3] font-medium border-t border-[#1E2540]/60 pt-4">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Estimated time: {lessonBodyContent?.estimated_minutes || 5} minutes
              </span>
              <span className="flex items-center gap-1 text-[#5B8EFF]">
                <Sparkles className="h-3.5 w-3.5" />
                CXP reward: +100
              </span>
            </div>
          </div>
        )}

        <div className="relative w-full mt-1">
          {hasCompletedToday ? (
            <div className="space-y-4 text-center py-4">
              <div className="flex flex-col items-center justify-center gap-1">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold mb-1">✓</div>
                <p className="text-sm font-bold text-white">Today&apos;s mission complete ✓</p>
                <p className="text-xs text-[#8B95B3]">Come back tomorrow for your next lesson</p>
              </div>
              <Button
                onClick={() => router.push(`/dashboard/path`)}
                className="w-full h-10 bg-[#1C2036] hover:bg-[#282F52] border border-[#282F52] text-[#8B95B3] hover:text-white font-bold rounded-xl text-xs transition-colors"
              >
                Get ahead — start tomorrow&apos;s lesson
              </Button>
            </div>
          ) : (
            activeLesson && (
              <Link href={`/dashboard/lesson/${activeLesson.id}`}>
                <Button
                  className="w-full h-13 bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] hover:from-[#4A7AEE] hover:to-[#9067FA] text-white font-bold rounded-xl shadow-[0_0_24px_rgba(91,142,255,0.3)] transition-all duration-200 flex items-center justify-center gap-2 text-[14px] cursor-pointer"
                >
                  <span>Continue Learning →</span>
                </Button>
              </Link>
            )
          )}
        </div>
      </section>

      {/* 7 Day Streak Referral Nudge Card */}
      {streakData?.current_streak === 7 && !profile?.dismissed_streak_nudge && !dismissedStreakCard && (
        <div className="relative overflow-hidden border border-[#A78BFA]/30 bg-gradient-to-r from-amber-500/10 via-[#A78BFA]/10 to-[#111424] p-5 rounded-2xl shadow-lg flex flex-col gap-3 animate-fadeIn">
          {/* Close Button */}
          <button
            onClick={handleDismissStreakCard}
            className="absolute top-3.5 right-3.5 text-[#8B95B3] hover:text-[#F0F4FF] transition cursor-pointer"
          >
            <X size={16} />
          </button>

          <div className="space-y-1 pr-6">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
              <span>7 day streak 🔥</span>
            </h3>
            <p className="text-xs text-[#8B95B3] leading-relaxed">
              You are building something real. Know someone who should be too? Invite a friend to join you on Cognara.
            </p>
          </div>

          <div className="w-full">
            <Button
              onClick={handleInviteFriend}
              className="h-9 px-4 bg-gradient-to-r from-[#A78BFA] to-[#8B5CF6] hover:from-[#9067FA] hover:to-[#7C3AED] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              Invite a friend
            </Button>
          </div>
        </div>
      )}

      {/* SECTION 2 — MY PROGRESS */}
      <section className="border border-[#1E2540]/60 bg-[#111424]/40 p-6 rounded-2xl space-y-4">

        <div className="space-y-1">
          <h4 className="text-[14px] font-bold text-white truncate">{roadmap?.title || profile?.main_goal || 'Goal'}</h4>
          <div className="w-full h-2.5 bg-[#1E2540] rounded-full overflow-hidden mt-2">
            <div 
              className="h-full bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressRatio}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-[#8B95B3] font-medium pt-1">
            <span>Phase {activePhaseNumber} of {phases.length || 1} · Module {activeModuleNumber} of {totalModulesInPhase}</span>
            <span className="font-bold text-white">{Math.round(progressRatio)}% Complete</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[#8B95B3] pt-1">
          <p className="font-semibold text-white">Estimated completion: {formattedCompDate}</p>
        </div>

        <div className="pt-2">
          <Button
            onClick={() => router.push('/dashboard/path')}
            variant="ghost"
            className="h-9 px-4 bg-[#141A30]/50 hover:bg-[#1E2540]/60 border border-[#1E2540] text-[#8B95B3] hover:text-white text-xs font-semibold rounded-xl"
          >
            View full roadmap
          </Button>
        </div>
      </section>

      {/* SECTION 3 — SPARK CHECK-IN */}
      {showSpark && (
        <section className="border border-primary/20 bg-[#12162B] p-5 rounded-2xl flex gap-4 items-start animate-page-enter">
          <div className="shrink-0 flex items-center justify-center p-1 bg-[#1A203C] rounded-xl border border-[#2E3750] shadow-inner animate-pulse-subtle">
            <Spark emotion={failedLastQuiz ? 'thinking' : 'wave'} size={52} />
          </div>
          <div className="space-y-3 flex-grow min-w-0">
            <div className="space-y-0.5">
              <span className="text-[9px] font-mono font-bold text-[#5B8EFF] uppercase tracking-wider block">Spark says:</span>
              <p className="text-xs text-[#C8D0E8] leading-relaxed font-medium">
                &ldquo;{sparkMsg}&rdquo;
              </p>
            </div>
            {activeLesson && (
              <Button
                onClick={() => setIsSparkOpen(true)}
                className="h-8 px-3.5 bg-gradient-to-br from-[#5B8EFF] to-[#A78BFA] text-white font-bold rounded-lg text-[11px] shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer"
              >
                Talk to Spark
              </Button>
            )}
          </div>
        </section>
      )}

      {/* SECTION 4 — DAILY QUEST */}
      {dailyQuest && (
        <section className="border border-[#1E2540]/60 bg-[#111424]/40 p-5 rounded-2xl space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#A78BFA] font-bold block">
                Daily Quest
              </span>
              <h4 className="text-[14px] font-bold text-white">{dailyQuest.title}</h4>
              <p className="text-xs text-[#8B95B3]">{dailyQuest.description}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-mono font-extrabold text-[#5B8EFF]">Reward: +{dailyQuest.xpReward} CXP</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] text-[#8B95B3] font-mono">
              <span>Quest Progress</span>
              <span>{dailyQuest.progress} / {dailyQuest.target}</span>
            </div>
            <div className="w-full h-1.5 bg-[#1E2540] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] transition-all duration-300"
                style={{ width: `${(dailyQuest.progress / dailyQuest.target) * 100}%` }}
              />
            </div>
          </div>

          <div className="pt-1">
            {dailyQuest.claimed ? (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 select-none">
                <CheckCircle2 className="h-3.5 w-3.5" /> Quest Complete
              </span>
            ) : dailyQuest.completed ? (
              <Button
                onClick={handleClaimQuest}
                disabled={isClaiming}
                className="h-9 px-4 bg-gradient-to-br from-[#5B8EFF] to-[#A78BFA] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                {isClaiming ? 'Claiming...' : 'Claim Reward ⚡'}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  const targetElement = document.querySelector('section')
                  targetElement?.scrollIntoView({ behavior: 'smooth' })
                }}
                variant="ghost"
                className="h-9 px-4 bg-[#141A30]/50 hover:bg-[#1E2540]/60 border border-[#1E2540] text-[#8B95B3] hover:text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Start Quest
              </Button>
            )}
          </div>
        </section>
      )}

      {/* SECTION 5 — QUICK STATS */}
      <section className="border-t border-[#1E2540]/40 pt-6 space-y-3">
        <h4 className="text-xs font-bold text-[#8B95B3] uppercase tracking-wider select-none">This week:</h4>
        <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-xs text-[#C8D0E8]">
          <div className="flex justify-between border-b border-[#1E2540]/40 pb-1">
            <span>Lessons completed</span>
            <span className="font-bold text-white font-mono">{completedThisWeek}</span>
          </div>
          <div className="flex justify-between border-b border-[#1E2540]/40 pb-1">
            <span>Quizzes passed</span>
            <span className="font-bold text-white font-mono">{quizzesPassedThisWeek}</span>
          </div>
          <div className="flex justify-between border-b border-[#1E2540]/40 pb-1">
            <span>CXP earned</span>
            <span className="font-bold text-[#5B8EFF] font-mono">+{cxpEarnedThisWeek}</span>
          </div>
          <div className="flex justify-between border-b border-[#1E2540]/40 pb-1">
            <span>Time spent learning</span>
            <span className="font-bold text-white font-mono">{hoursSpent} hrs {minsSpent} mins</span>
          </div>
        </div>
      </section>

      {/* SPARK DIALOGUE DRAWER */}
      {activeLesson && (
        <SparkDrawer
          isOpen={isSparkOpen}
          onClose={() => setIsSparkOpen(false)}
          lessonId={activeLesson.id}
          lessonTitle={activeLesson.title}
          lessonContent={sparkLessonContext}
          userName={profile?.name}
          subject={goal?.subject || 'Development'}
        />
      )}

      {/* INTERACTIVE MODALS */}
      {mounted && activeModal && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setActiveModal(null)}
        >
          <div 
            className="bg-[#111424] border border-[#1E2540] rounded-2xl max-w-sm w-full p-6 space-y-5 animate-modal shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#141A30] hover:bg-[#1E2540] flex items-center justify-center text-[#8B95B3] hover:text-white transition-colors cursor-pointer"
              type="button"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {/* Streak Modal */}
            {activeModal === 'streak' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Flame className="h-8 w-8 text-rose-500 fill-current animate-pulse-subtle" />
                  <div>
                    <h3 className="text-lg font-bold text-white">Streak History</h3>
                    <p className="text-xs text-[#8B95B3]">Consistency is the key to memory adaptation</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 py-2 border-y border-[#1E2540]/60">
                  <div className="text-center">
                    <span className="text-[10px] uppercase text-[#8B95B3] font-bold">Current Streak</span>
                    <p className="text-3xl font-extrabold text-white font-mono mt-1">{streakData?.current_streak || 0}d</p>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] uppercase text-[#8B95B3] font-bold">Longest Streak</span>
                    <p className="text-3xl font-extrabold text-[#A78BFA] font-mono mt-1">{streakData?.longest_streak || 0}d</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase text-[#5B8EFF] font-bold">7-Day Study Log</span>
                  <div className="flex justify-between items-center bg-[#0A0C14] p-3 rounded-xl">
                    {[6, 5, 4, 3, 2, 1, 0].map((offset) => {
                      const date = new Date()
                      date.setDate(date.getDate() - offset)
                      const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)
                      
                      // Check if activity occurred on this offset day
                      const hasActivity = progress.some(p => {
                        if (!p.completed_at) return false
                        return new Date(p.completed_at).toDateString() === date.toDateString()
                      }) || quizAttempts.some(qa => {
                        return new Date(qa.attempted_at).toDateString() === date.toDateString()
                      })

                      return (
                        <div key={offset} className="flex flex-col items-center gap-1.5">
                          <span className="text-[10px] text-[#4A5272] font-bold">{dayLabel}</span>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center border text-[10px] font-bold ${
                            hasActivity 
                              ? 'bg-rose-500/10 border-rose-500/40 text-rose-500' 
                              : 'border-[#1E2540] text-[#3E4562] bg-[#111424]'
                          }`}>
                            {hasActivity ? '🔥' : '•'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* CXP Modal */}
            {activeModal === 'cxp' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-8 w-8 text-[#5B8EFF] fill-current animate-pulse" />
                  <div>
                    <h3 className="text-lg font-bold text-white">CXP Level Breakdown</h3>
                    <p className="text-xs text-[#8B95B3]">Cognara Experience Points metrics</p>
                  </div>
                </div>

                <div className="space-y-3 bg-[#0A0C14] p-4 rounded-xl">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-bold text-white">Level {levelInfo.level}</span>
                    <span className="text-xs font-bold text-[#5B8EFF] font-mono">{levelInfo.xpWithinLevel} / {levelInfo.xpNeededForLevelUp} XP</span>
                  </div>
                  <div className="w-full h-2 bg-[#1E2540] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] transition-all duration-300"
                      style={{ width: `${levelInfo.progressPercentage}%` }}
                    />
                  </div>
                  <p className="text-[10.5px] text-[#8B95B3] leading-relaxed">
                    You need exactly <strong className="text-white">{levelInfo.xpNeededForLevelUp - levelInfo.xpWithinLevel} CXP</strong> to level up to Rank {levelInfo.level + 1}!
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase text-[#A78BFA] font-bold">How to earn points:</span>
                  <ul className="space-y-2 text-[11.5px] text-[#C8D0E8] leading-relaxed select-none">
                    <li className="flex justify-between">
                      <span>✓ Completed Study Module</span>
                      <strong className="text-white">+100 CXP</strong>
                    </li>
                    <li className="flex justify-between">
                      <span>✓ Quiz Scores</span>
                      <strong className="text-white">+10 to +100 CXP</strong>
                    </li>
                    <li className="flex justify-between">
                      <span>✓ Claim Daily Quest</span>
                      <strong className="text-white">+50 to +100 CXP</strong>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Hearts Modal */}
            {activeModal === 'hearts' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Heart className="h-8 w-8 text-rose-500 fill-current animate-pulse-subtle" />
                  <div>
                    <h3 className="text-lg font-bold text-white">Cognitive Energy (Hearts)</h3>
                    <p className="text-xs text-[#8B95B3]">Cognitive energy controls quiz attempts</p>
                  </div>
                </div>

                <div className="bg-[#0A0C14] p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#8B95B3] font-bold uppercase">Energy Reserves</span>
                    <div className="flex items-center gap-1 text-sm font-extrabold text-white">
                      {[1, 2, 3].map((heartIdx) => {
                        const isProUser = profile?.subscription_tier !== 'free' || profile?.id === process.env.NEXT_PUBLIC_ADMIN_USER_ID || profile?.id === '4c1fbae5-c423-42e7-8394-1112fe00d42e'
                        const heartsCount = profile?.hearts ?? 3
                        const hasHeart = isProUser || heartsCount >= heartIdx
                        return (
                          <Heart 
                            key={heartIdx} 
                            className={`h-4.5 w-4.5 ${hasHeart ? 'text-rose-500 fill-rose-500/80' : 'text-[#3E4562] fill-transparent'}`} 
                          />
                        )
                      })}
                      <span className="ml-1 font-mono">{profile?.subscription_tier !== 'free' ? '∞' : `${profile?.hearts ?? 3}/3`}</span>
                    </div>
                  </div>
                  <p className="text-[10.5px] text-[#8B95B3] leading-relaxed">
                    Hearts protect you from burning out. Quizzes cost <strong>1 Heart</strong> if you fail. Refills cost 150 CXP, or you can review lessons to earn them back.
                  </p>
                </div>

                {profile?.subscription_tier === 'free' && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-[#1E2540]/60">
                    {(profile?.hearts ?? 3) < 3 && (
                      <Button
                        onClick={handleCxpRefillHearts}
                        disabled={isRefillingHearts || (profile?.xp ?? 0) < 150}
                        className="w-full h-10 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-white" />
                        <span>Refill Hearts (Costs 150 CXP)</span>
                      </Button>
                    )}
                    <Button
                      onClick={() => {
                        setActiveModal(null)
                        router.push('/dashboard/path')
                      }}
                      className="w-full h-10 bg-[#5B8EFF] hover:bg-[#4A7AEE] text-white font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Review completed lessons (+1 Heart)
                    </Button>
                    <Button
                      onClick={() => {
                        setActiveModal(null)
                        router.push('/dashboard/settings')
                      }}
                      variant="ghost"
                      className="w-full h-10 border border-[#1E2540] text-[#8B95B3] hover:text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Upgrade to Pro (Infinite Hearts)
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
