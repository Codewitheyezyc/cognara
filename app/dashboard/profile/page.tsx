'use client'

import React, { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  User, Award, Lock, Download, Share2, Camera, Loader2, LogOut, Trash2, 
  Sparkles, Flame, Heart, CheckCircle2, ChevronRight, Bell, Settings2, Shield,
  Mail, KeyRound, AlertTriangle, Activity, BarChart2, BookOpen, Clock, Copy

} from 'lucide-react'
import { getLevelInfo } from '@/lib/leveling'
import { LinkedinIcon, TwitterIcon } from '@/components/ui/SocialIcons'

// Easing Animation Count-up Hook
function useCountUp(target: number, duration: number = 800) {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    if (target <= 0) {
      setCount(0)
      return
    }
    const startTime = performance.now()
    const end = target
    let animationFrameId: number

    const updateCount = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = progress * (2 - progress) // easeOutQuad
      setCount(Math.round(easedProgress * end))

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCount)
      }
    }

    animationFrameId = requestAnimationFrame(updateCount)
    return () => cancelAnimationFrame(animationFrameId)
  }, [target, duration])

  return count
}

// 12 Badges Config
const BADGES_CONFIG = [
  { key: 'first_flame', emoji: '🔥', label: 'First Flame', description: 'Complete your first lesson. The journey of a thousand miles begins with a single flame.' },
  { key: 'quick_mind', emoji: '⚡', label: 'Quick Mind', description: 'Score 5/5 on your first quiz. Instant spark of cognitive understanding!' },
  { key: 'consistent', emoji: '📅', label: 'Consistent', description: 'Achieve a 7-day streak. Showing up every day is how real habits are built.' },
  { key: 'phase_conqueror', emoji: '🏆', label: 'Phase Conqueror', description: 'Complete your first phase. You have fully conquered a major milestone in your roadmap!' },
  { key: 'speed_runner', emoji: '🚀', label: 'Speed Runner', description: 'Complete your first speed run. Testing your memory under time pressure.' },
  { key: 'deep_diver', emoji: '💎', label: 'Deep Diver', description: 'Complete an advanced depth lesson. Diving deep into expert-level content.' },
  { key: 'week_warrior', emoji: '🌟', label: 'Week Warrior', description: 'Maintain a 7-day streak. A week of dedication and momentum!' },
  { key: 'month_master', emoji: '👑', label: 'Month Master', description: 'Maintain a 30-day streak. A full month of showing up and learning.' },
  { key: 'goal_getter', emoji: '🎯', label: 'Goal Getter', description: 'Complete your full learning goal. You set a goal and followed it to the end!' },
  { key: 'knowledge_seeker', emoji: '📚', label: 'Knowledge Seeker', description: 'Complete 10 lessons. Exploring the roadmap one topic at a time.' },
  { key: 'quiz_champion', emoji: '⚡', label: 'Quiz Champion', description: 'Score 5/5 five times in a row. Unstoppable mastery of quizzes.' },
  { key: 'multi_learner', emoji: '🌍', label: 'Multi-Learner', description: 'Start your second learning goal. Always curious, always growing.' },
]

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'profile' | 'progress'>('profile')
  
  // DB States
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [streakData, setStreakData] = useState<any>(null)
  const [userBadges, setUserBadges] = useState<any[]>([])
  const [referralsList, setReferralsList] = useState<any[]>([])
  const [referralStats, setReferralStats] = useState({
    invited: 0,
    joined: 0,
    cxpEarned: 0,
  })
  const [copyingLink, setCopyingLink] = useState(false)

  // Count-up animations for referral stats
  const countInvited = useCountUp(referralStats.invited)
  const countJoined = useCountUp(referralStats.joined)
  const countCxp = useCountUp(referralStats.cxpEarned)

  // Build the unique referral link
  const referralLink = profile?.referral_code
    ? `https://www.cognaralearn.com/signup?ref=${profile.referral_code}`
    : `https://www.cognaralearn.com/signup?ref=CGN-${userId?.substring(0, 4).toUpperCase()}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopyingLink(true)
    toast('Referral link copied to clipboard', 'success')
    setTimeout(() => setCopyingLink(false), 3000)
  }

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Cognara',
          text: `I use Cognara to learn ${profile?.main_goal || 'my goals'}. Try it free and earn bonus CXP:`,
          url: referralLink
        })
      } catch (err) {
        // User cancelled
      }
    } else {
      handleCopyLink()
    }
  }


  
  // Dynamic metrics
  const [stats, setStats] = useState({
    completedLessonsCount: 0,
    perfectQuizzesCount: 0,
    longestStreak: 0,
    completedPhasesCount: 0,
    hasAdvancedLesson: false,
    totalGoalsCount: 1,
    completedGoalsCount: 0,
    quizFiveInARow: false,
  })

  // Goal & Roadmap details
  const [activeGoal, setActiveGoal] = useState<any>(null)
  const [goals, setGoals] = useState<any[]>([])
  const [roadmaps, setRoadmaps] = useState<any[]>([])
  const [phases, setPhases] = useState<any[]>([])
  const [lessons, setLessons] = useState<any[]>([])
  const [progress, setProgress] = useState<any[]>([])
  const [completedPhasesList, setCompletedPhasesList] = useState<any[]>([])
  const [quizAttempts, setQuizAttempts] = useState<any[]>([])
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [userQuests, setUserQuests] = useState<any[]>([])

  // Layout & UI States
  const [isLoading, setIsLoading] = useState(true)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Modals / Details
  const [selectedBadge, setSelectedBadge] = useState<any>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  // Account Settings Forms State
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)
  const [isSavingEmail, setIsSavingEmail] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  // CXP History Load Limit
  const [cxpLimit, setCxpLimit] = useState(5)

  // Load Telemetry Data
  useEffect(() => {
    async function loadProfileData() {
      try {
        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        setUserId(user.id)
        setEditEmail(user.email || '')

        // 1. Fetch Profile
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
        setAvatarUrl(profRow.avatar_url || null)
        setEditName(profRow.name || '')

        // 2. Fetch Streaks
        const { data: streak } = await supabase
          .from('streaks')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
        setStreakData(streak)

        // 3. Fetch Lesson Progress
        const { data: progressData } = await supabase
          .from('lesson_progress')
          .select('*')
          .eq('user_id', user.id)
        setProgress(progressData || [])

        // 4. Fetch Quiz Attempts
        const { data: quizAttemptsData } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('user_id', user.id)
          .order('attempted_at', { ascending: false })
        setQuizAttempts(quizAttemptsData || [])

        // 5. Fetch User Badges
        const { data: badgeData } = await supabase
          .from('user_badges')
          .select('*')
          .eq('user_id', user.id)
        setUserBadges(badgeData || [])

        // 5b. Fetch referrals
        try {
          const { data: refsData, error: refsErr } = await supabase
            .from('cognara_referrals')
            .select('*')
            .eq('referrer_user_id', user.id)
            .order('created_at', { ascending: false })

          if (!refsErr && refsData) {
            setReferralsList(refsData)
            const invited = refsData.length
            const joined = refsData.filter((r: any) => r.status !== 'pending').length
            const cxpEarned = refsData.filter((r: any) => r.status === 'completed_first_lesson' && r.referrer_cxp_awarded).length * 200
            setReferralStats({ invited, joined, cxpEarned })
          }
        } catch (refsFetchErr) {
          console.error('Error fetching referrals for profile:', refsFetchErr)
        }

        // 6. Fetch Goals
        const { data: goalsData } = await supabase
          .from('learning_goals')
          .select('*')
          .eq('user_id', user.id)
        setGoals(goalsData || [])

        // 7. Fetch all roadmaps, phases, lessons, quizzes, user_quests
        const { data: roadmapsData } = await supabase
          .from('roadmaps')
          .select('*')
          .eq('user_id', user.id)
        setRoadmaps(roadmapsData || [])

        const roadmapIds = roadmapsData?.map((r: any) => r.id) || []

        const { data: phasesData } = roadmapIds.length > 0 ? await supabase
          .from('roadmap_phases')
          .select('*')
          .in('roadmap_id', roadmapIds)
          .order('phase_number', { ascending: true })
          : { data: [] }
        setPhases(phasesData || [])

        const { data: lessonsData } = roadmapIds.length > 0 ? await supabase
          .from('lessons')
          .select('*')
          .in('roadmap_id', roadmapIds)
          : { data: [] }
        setLessons(lessonsData || [])

        const { data: quizzesData } = await supabase
          .from('quizzes')
          .select('id, lesson_id')
        setQuizzes(quizzesData || [])

        const { data: questsData } = await supabase
          .from('user_quests')
          .select('*')
          .eq('user_id', user.id)
        setUserQuests(questsData || [])

        // Find active goal & roadmap progress
        const activeG = goalsData?.find((g: any) => g.is_active) || goalsData?.[0]
        setActiveGoal(activeG)

        const activeRoadmap = roadmapsData?.find((r: any) => r.goal_id === activeG?.id)
        const activeRoadmapPhases = activeRoadmap ? (phasesData || []).filter((p: any) => p.roadmap_id === activeRoadmap.id) : []
        const activeRoadmapLessons = activeRoadmap ? (lessonsData || []).filter((l: any) => l.roadmap_id === activeRoadmap.id) : []

        // Derive stats and completion
        const completedIds = new Set(progressData?.filter((p: any) => p.status === 'completed').map((p: any) => p.lesson_id) || [])
        
        let completedPhasesCount = 0
        const completedPhases: any[] = []
        activeRoadmapPhases.forEach((phase: any) => {
          const phaseLessons = activeRoadmapLessons.filter((l: any) => l.phase_id === phase.id)
          if (phaseLessons.length > 0 && phaseLessons.every((l: any) => completedIds.has(l.id))) {
            completedPhasesCount++
            completedPhases.push(phase)
          }
        })
        setCompletedPhasesList(completedPhases)

        const hasAdvancedLesson = profRow.learning_depth >= 4 || progressData?.some((p: any) => {
          const les = activeRoadmapLessons.find((l: any) => l.id === p.lesson_id)
          if (!les) return false
          const ph = activeRoadmapPhases.find((phase: any) => phase.id === les.phase_id)
          return ph ? ph.phase_number > 3 : false
        }) || false

        let quizFiveInARow = false
        if (quizAttemptsData && quizAttemptsData.length >= 5) {
          const recent5 = quizAttemptsData.slice(0, 5)
          quizFiveInARow = recent5.every((att: any) => att.score === 100)
        }

        const totalLessonsCount = activeRoadmapLessons.length
        const completedLessonsCount = activeRoadmapLessons.filter((l: any) => completedIds.has(l.id)).length
        const isGoalCompleted = totalLessonsCount > 0 && completedLessonsCount === totalLessonsCount

        setStats({
          completedLessonsCount: completedIds.size,
          perfectQuizzesCount: quizAttemptsData?.filter((q: any) => q.score === 100).length || 0,
          longestStreak: streak?.longest_streak || 0,
          completedPhasesCount,
          hasAdvancedLesson,
          totalGoalsCount: goalsData?.length || 1,
          completedGoalsCount: isGoalCompleted ? 1 : 0,
          quizFiveInARow,
        })

      } catch (err) {
        console.error('Error fetching profile data:', err)
        toast('Failed to load profile data')
      } finally {
        setIsLoading(false)
      }
    }

    loadProfileData()
  }, [supabase, router])

  // Avatar Upload Logic
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    if (!file.type.startsWith('image/')) {
      toast('Please upload an image file', 'error')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast('Image file must be under 2MB', 'error')
      return
    }

    setUploadingPhoto(true)
    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(`${userId}/avatar.jpg`, file, {
          upsert: true,
          contentType: 'image/jpeg'
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(`${userId}/avatar.jpg`)

      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (dbError) throw dbError

      setAvatarUrl(`${publicUrl}?t=${Date.now()}`)
      toast('Profile photo updated successfully!')
    } catch (err) {
      console.error(err)
      toast('Failed to upload profile photo', 'error')
    } finally {
      setUploadingPhoto(false)
    }
  }

  // Account settings updating handlers
  const handleSaveName = async () => {
    if (!userId || !editName.trim()) return
    setIsSavingName(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: editName.trim() })
        .eq('id', userId)

      if (error) throw error
      setProfile((prev: any) => ({ ...prev, name: editName.trim() }))
      toast('Name updated successfully!')
    } catch (err) {
      console.error(err)
      toast('Failed to update name', 'error')
    } finally {
      setIsSavingName(false)
    }
  }

  const handleSaveEmail = async () => {
    if (!editEmail.trim()) return
    setIsSavingEmail(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: editEmail.trim() })
      if (error) throw error
      toast('Email update requested. Please check both new and old email addresses for confirmation links.')
    } catch (err: any) {
      console.error(err)
      toast(err.message || 'Failed to update email', 'error')
    } finally {
      setIsSavingEmail(false)
    }
  }

  const handleSavePassword = async () => {
    if (!editPassword || editPassword.length < 6) {
      toast('Password must be at least 6 characters', 'error')
      return
    }
    setIsSavingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: editPassword })
      if (error) throw error
      setEditPassword('')
      toast('Password updated successfully!')
    } catch (err: any) {
      console.error(err)
      toast(err.message || 'Failed to update password', 'error')
    } finally {
      setIsSavingPassword(false)
    }
  }

  const handleToggleNotification = async (field: string, currentVal: boolean) => {
    if (!userId) return
    const newVal = !currentVal
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: newVal })
        .eq('id', userId)

      if (error) throw error
      setProfile((prev: any) => ({ ...prev, [field]: newVal }))
      toast('Notification preference saved!')
    } catch (err) {
      console.error(err)
      toast('Failed to update preferences', 'error')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return
    setIsDeleting(true)
    try {
      const res = await fetch('/api/user/delete', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.success) {
        toast('Your account was successfully deleted. Sorry to see you go!')
        await supabase.auth.signOut()
        router.push('/login')
      } else {
        throw new Error(data.error || 'Failed to delete account')
      }
    } catch (err: any) {
      console.error(err)
      toast(err.message || 'Failed to delete account. Contact hello@cognaralearn.com', 'error')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  // Dynamic Badge Earned Checker
  const isBadgeEarned = (key: string) => {
    const earnedKeys = new Set(userBadges.map((b: any) => b.badge_key))
    if (earnedKeys.has(key)) return true
    
    switch (key) {
      case 'first_flame':
        return stats.completedLessonsCount >= 1
      case 'quick_mind':
        return stats.perfectQuizzesCount >= 1
      case 'consistent':
      case 'week_warrior':
        return stats.longestStreak >= 7
      case 'phase_conqueror':
        return stats.completedPhasesCount >= 1
      case 'speed_runner':
        return earnedKeys.has('speed_learner')
      case 'deep_diver':
        return stats.hasAdvancedLesson
      case 'month_master':
        return stats.longestStreak >= 30
      case 'goal_getter':
        return stats.completedGoalsCount >= 1
      case 'knowledge_seeker':
        return stats.completedLessonsCount >= 10
      case 'quiz_champion':
        return stats.quizFiveInARow
      case 'multi_learner':
        return stats.totalGoalsCount >= 2
      default:
        return false
    }
  }

  // Get Badge Earned Date
  const getBadgeEarnedDate = (key: string) => {
    const dbBadge = userBadges.find((b: any) => b.badge_key === key)
    if (dbBadge && dbBadge.earned_at) {
      return new Date(dbBadge.earned_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    }
    if (isBadgeEarned(key)) {
      return 'Earned Milestone'
    }
    return null
  }

  // Count up animations
  const lessonsCompletedCountUp = useCountUp(stats.completedLessonsCount)
  const quizzesPassedCountUp = useCountUp(quizAttempts.filter((q: any) => q.passed).length)
  const xpCountUp = useCountUp(profile?.xp || 0)
  const totalTimeMinutes = stats.completedLessonsCount * 10
  const minutesCountUp = useCountUp(totalTimeMinutes)

  const hours = Math.floor(minutesCountUp / 60)
  const mins = minutesCountUp % 60
  const timeSpentString = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`

  // Streak calendar calculation
  const activityCounts: Record<string, number> = {}
  progress.forEach((p: any) => {
    if (p.completed_at) {
      const dateStr = p.completed_at.split('T')[0]
      activityCounts[dateStr] = (activityCounts[dateStr] || 0) + 1
    }
  })
  quizAttempts.forEach((att: any) => {
    if (att.attempted_at) {
      const dateStr = att.attempted_at.split('T')[0]
      activityCounts[dateStr] = (activityCounts[dateStr] || 0) + 1
    }
  })
  userQuests.forEach((q: any) => {
    if (q.claimed && q.claimed_at) {
      const dateStr = q.claimed_at.split('T')[0]
      activityCounts[dateStr] = (activityCounts[dateStr] || 0) + 1
    }
  })

  const totalActiveDays = Object.keys(activityCounts).length

  // Generate last 30 days
  const calendarDays = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(today.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const isActive = !!activityCounts[dateStr]
    const isToday = i === 0
    calendarDays.push({
      dateStr,
      isActive,
      isToday,
      dayNum: d.getDate()
    })
  }

  const startDayOfWeek = calendarDays.length > 0 ? new Date(calendarDays[0].dateStr).getDay() : 0
  const calendarPaddingCells = Array.from({ length: startDayOfWeek })

  // Goals progress mapping
  const goalsProgress = goals.map((goal: any) => {
    const roadmap = roadmaps.find((r: any) => r.goal_id === goal.id)
    const goalLessons = roadmap ? lessons.filter((l: any) => l.roadmap_id === roadmap.id) : []
    const goalPhases = roadmap ? phases.filter((p: any) => p.roadmap_id === roadmap.id) : []
    
    const completedIds = new Set(progress.filter((p: any) => p.status === 'completed').map((p: any) => p.lesson_id))
    const goalCompletedLessons = goalLessons.filter((l: any) => completedIds.has(l.id))
    
    const totalLessons = goalLessons.length
    const completedLessons = goalCompletedLessons.length
    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
    
    let completedPhases = 0
    goalPhases.forEach((phase: any) => {
      const phaseLessons = goalLessons.filter((l: any) => l.phase_id === phase.id)
      if (phaseLessons.length > 0 && phaseLessons.every((l: any) => completedIds.has(l.id))) {
        completedPhases++
      }
    })

    const goalQuizIds = quizzes.filter((q: any) => goalLessons.some((l: any) => l.id === q.lesson_id)).map((q: any) => q.id)
    const goalQuizAttempts = quizAttempts.filter((att: any) => goalQuizIds.includes(att.quiz_id))
    const passedQuizzes = goalQuizAttempts.filter((att: any) => att.passed).length
    
    const bestScores = new Map<string, number>()
    goalQuizAttempts.forEach((att: any) => {
      const currentBest = bestScores.get(att.quiz_id) || 0
      if (att.score > currentBest) {
        bestScores.set(att.quiz_id, att.score)
      }
    })
    const scoresArray = Array.from(bestScores.values())
    const avgScore = scoresArray.length > 0 ? Math.round(scoresArray.reduce((s, a) => s + a, 0) / scoresArray.length) : 0

    const isCompleted = totalLessons > 0 && completedLessons === totalLessons

    let completionDate = null
    if (isCompleted) {
      const compDates = progress
        .filter((p: any) => p.status === 'completed' && goalLessons.some((l: any) => l.id === p.lesson_id) && p.completed_at)
        .map((p: any) => new Date(p.completed_at).getTime())
      if (compDates.length > 0) {
        completionDate = new Date(Math.max(...compDates)).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })
      }
    }

    const startedDate = new Date(goal.created_at).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })

    return {
      goal,
      roadmap,
      progressPercent,
      completedPhases,
      totalPhases: goalPhases.length,
      completedLessons,
      passedQuizzes,
      avgScore,
      isCompleted,
      startedDate,
      completionDate
    }
  })

  // Quiz Performance calculations
  const bestScoresMap = new Map<string, number>()
  quizAttempts.forEach((att: any) => {
    const currentBest = bestScoresMap.get(att.quiz_id) || 0
    if (att.score > currentBest) {
      bestScoresMap.set(att.quiz_id, att.score)
    }
  })
  const bestScoresList = Array.from(bestScoresMap.values())
  const overallAvgScore = bestScoresList.length > 0 ? Math.round(bestScoresList.reduce((s, a) => s + a, 0) / bestScoresList.length) : 0

  const last10Scores = [...quizAttempts]
    .reverse()
    .slice(-10)
    .map((att: any) => att.score)

  const scoresByLessonId: Record<string, { sum: number; count: number; title: string }> = {}
  quizAttempts.forEach((att: any) => {
    const quizInfo = quizzes.find((q: any) => q.id === att.quiz_id)
    const lessonInfo = lessons.find((l: any) => l.id === quizInfo?.lesson_id)
    if (lessonInfo) {
      if (!scoresByLessonId[lessonInfo.id]) {
        scoresByLessonId[lessonInfo.id] = { sum: 0, count: 0, title: lessonInfo.title }
      }
      scoresByLessonId[lessonInfo.id].sum += att.score
      scoresByLessonId[lessonInfo.id].count += 1
    }
  })

  const strongTopics: any[] = []
  const revisitTopics: any[] = []
  Object.entries(scoresByLessonId).forEach(([lessonId, data]) => {
    const avg = Math.round(data.sum / data.count)
    if (avg >= 80) {
      strongTopics.push({ id: lessonId, title: data.title, avg })
    } else if (avg < 60) {
      revisitTopics.push({ id: lessonId, title: data.title, avg })
    }
  })

  // Weekly activity strip calculations
  const getWeeklyActivity = () => {
    const now = new Date()
    const currentDay = now.getDay()
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay
    const mondayDate = new Date(now)
    mondayDate.setDate(now.getDate() + distanceToMonday)
    mondayDate.setHours(0, 0, 0, 0)

    const daysOfWeek = []
    let totalWeekLessons = 0
    let totalWeekCxp = 0
    let totalWeekActiveDays = 0

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(mondayDate)
      dayDate.setDate(mondayDate.getDate() + i)
      const dayDateStr = dayDate.toISOString().split('T')[0]
      
      const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      const label = labels[i]

      const dayLessonsCount = progress.filter((p: any) => 
        p.status === 'completed' && p.completed_at && p.completed_at.startsWith(dayDateStr)
      ).length

      let dayCxp = dayLessonsCount * 100
      
      quizAttempts.forEach((att: any) => {
        if (att.attempted_at && att.attempted_at.startsWith(dayDateStr)) {
          let xpAward = 10
          if (att.score === 100) xpAward = 100
          else if (att.score >= 80) xpAward = 80
          else if (att.score >= 60) xpAward = 60
          else if (att.score >= 40) xpAward = 40
          else if (att.score >= 20) xpAward = 20
          dayCxp += xpAward
        }
      })

      userQuests.forEach((q: any) => {
        if (q.claimed && q.claimed_at && q.claimed_at.startsWith(dayDateStr)) {
          dayCxp += 30
        }
      })

      const isActive = dayLessonsCount > 0 || dayCxp > 0

      totalWeekLessons += dayLessonsCount
      totalWeekCxp += dayCxp
      if (isActive) totalWeekActiveDays++

      daysOfWeek.push({
        label,
        lessons: dayLessonsCount,
        cxp: dayCxp,
        isActive,
        isToday: dayDateStr === now.toISOString().split('T')[0]
      })
    }

    return {
      daysOfWeek,
      totalWeekLessons,
      totalWeekCxp,
      totalWeekActiveDays
    }
  }

  const weekly = getWeeklyActivity()

  // Reconstruct CXP History
  const lessonEvents = progress
    .filter((p: any) => p.status === 'completed' && p.completed_at)
    .map((p: any) => {
      const lesson = lessons.find((l: any) => l.id === p.lesson_id)
      return {
        event: `Completed Lesson: ${lesson?.title || 'Study Session'}`,
        xp: 100,
        date: new Date(p.completed_at).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        timestamp: new Date(p.completed_at).getTime(),
      }
    })

  const quizEvents = quizAttempts
    .filter((att: any) => att.attempted_at)
    .map((att: any) => {
      const quizInfo = quizzes.find((q: any) => q.id === att.quiz_id)
      const lessonInfo = lessons.find((l: any) => l.id === quizInfo?.lesson_id)
      
      let xpAward = 10
      if (att.score === 100) xpAward = 100
      else if (att.score >= 80) xpAward = 80
      else if (att.score >= 60) xpAward = 60
      else if (att.score >= 40) xpAward = 40
      else if (att.score >= 20) xpAward = 20
      
      return {
        event: `Completed Quiz: ${lessonInfo?.title || 'Concept Check'} (${att.score}%)`,
        xp: xpAward,
        date: new Date(att.attempted_at).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        timestamp: new Date(att.attempted_at).getTime(),
      }
    })

  const questEvents = userQuests
    .filter((q: any) => q.claimed && q.claimed_at)
    .map((q: any) => {
      const label = q.quest_key === 'daily_explorer' ? 'Daily Explorer' : 'Daily Quest'
      return {
        event: `Claimed Quest: ${label}`,
        xp: 30,
        date: new Date(q.claimed_at).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        timestamp: new Date(q.claimed_at).getTime(),
      }
    })

  const sortedEventsAsc = [...lessonEvents, ...quizEvents, ...questEvents]
    .sort((a, b) => a.timestamp - b.timestamp)

  let rTotal = 0
  const cxpHistory = sortedEventsAsc.map(e => {
    rTotal += e.xp
    return {
      ...e,
      runningTotal: rTotal
    }
  }).reverse()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg text-text-1 flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-mono text-text-2 tracking-wide animate-pulse">
          Syncing profile telemetry...
        </p>
      </div>
    )
  }

  const levelInfo = getLevelInfo(profile?.xp || 0)
  const memberDate = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'June 2026'

  // Calculations for active goal card (Profile tab)
  const completedIds = new Set(progress.filter((p: any) => p.status === 'completed').map((p: any) => p.lesson_id))
  
  const remainingLessons = lessons.filter((l: any) => !completedIds.has(l.id)).length
  const dailyStudyMinutes = profile?.daily_study_minutes || 30
  const lessonsPerDay = Math.max(1, dailyStudyMinutes / 10)
  const daysNeeded = Math.ceil(remainingLessons / lessonsPerDay)
  const estDate = new Date()
  estDate.setDate(estDate.getDate() + daysNeeded)
  const formattedEstDate = remainingLessons === 0 
    ? 'Goal Complete!' 
    : estDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })

  const activeLessonIdx = lessons.findIndex((l: any) => !completedIds.has(l.id))
  const nextLesson = activeLessonIdx !== -1 ? lessons[activeLessonIdx] : lessons[lessons.length - 1]
  const activeGoalProgressRatio = lessons.length > 0 ? Math.round((lessons.filter((l: any) => completedIds.has(l.id)).length / lessons.length) * 100) : 0

  let activePhaseNumber = 1
  let totalPhases = phases.length
  if (nextLesson) {
    const ph = phases.find((p: any) => p.id === nextLesson.phase_id)
    if (ph) activePhaseNumber = ph.phase_number
  }

  let activeModuleNumber = 1
  let totalModulesInPhase = 1
  if (profile?.main_roadmap && phases.length > 0) {
    const rawPhases = profile.main_roadmap.phases || []
    const currentRawPhase = rawPhases.find((p: any) => p.phase_number === activePhaseNumber)
    if (currentRawPhase) {
      const rawModules = currentRawPhase.modules || []
      totalModulesInPhase = rawModules.length || 1
      const lessonToFind = nextLesson || lessons[lessons.length - 1]
      if (lessonToFind) {
        const currentRawModule = rawModules.find((m: any) => 
          (m.topics || []).some((topic: string) => topic.toLowerCase() === lessonToFind.title.toLowerCase())
        )
        if (currentRawModule) activeModuleNumber = currentRawModule.module_number || 1
      }
    }
  }

  return (
    <div className="min-h-screen bg-bg text-text-1 pb-24">
      {/* Sticky Tab Switcher Bar */}
      <div className="sticky top-0 z-20 bg-bg/90 backdrop-blur-md border-b border-border py-2 px-4 mb-8">
        <div className="max-w-4xl mx-auto flex items-center justify-center sm:justify-start gap-4">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/20'
                : 'text-text-2 hover:text-text-1 hover:bg-surface-alt/40'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'progress'
                ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/20'
                : 'text-text-2 hover:text-text-1 hover:bg-surface-alt/40'
            }`}
          >
            Progress
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-8 animate-page-enter">
        {activeTab === 'profile' ? (
          <>
             <div className="flex flex-col items-center justify-center text-center p-6 bg-surface border border-border rounded-2xl shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute left-0 bottom-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
              
              {/* Circular Avatar */}
              <div className="relative group">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={profile?.name || 'User'}
                    className="w-24 h-24 rounded-full object-cover border-4 border-border shadow-xl group-hover:opacity-85 transition-opacity"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-extrabold text-white shadow-xl border-4 border-border">
                    {(profile?.name || 'C').charAt(0).toUpperCase()}
                  </div>
                )}
                
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-bg/80 rounded-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  </div>
                )}
              </div>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="mt-3 text-[11px] font-bold text-text-2 hover:text-accent transition-colors flex items-center gap-1.5 cursor-pointer bg-surface-alt border border-border px-3 py-1.5 rounded-full shadow-sm hover:border-primary/40"
              >
                <Camera className="h-3 w-3" />
                Change Photo
              </button>

              <h1 className="mt-4 text-2xl font-extrabold text-text-1 tracking-tight">{profile?.name}</h1>
              <p className="text-text-2 text-xs font-semibold uppercase tracking-wider mt-1">Active Learner</p>

              {/* LEVEL BADGE */}
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-surface-alt border border-border rounded-full text-xs font-mono font-bold shadow-inner">
                <span className="text-primary">Level {levelInfo.level}</span>
                <span className="text-text-2">•</span>
                <span className="text-accent">{levelInfo.rankName}</span>
              </div>

              {/* CXP AVAILABLE BADGE */}
              <Link 
                href="/dashboard/progress" 
                className="block mt-2 text-[11px] font-bold text-accent hover:text-accent/85 hover:underline transition-all cursor-pointer"
              >
                {profile?.xp || 0} CXP available
              </Link>

              {/* MEMBER SINCE */}
              <p className="mt-3 text-xs text-text-2">
                Learning with Cognara since {memberDate}
              </p>
            </div>

            {/* CURRENT GOAL SECTION */}
            {activeGoal ? (
              <div className="p-6 bg-surface border border-border rounded-2xl shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Current Goal
                  </h3>
                  <span className="text-xs font-mono text-text-2 bg-surface-alt px-2.5 py-0.5 rounded">
                    {activeGoalProgressRatio}% complete
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-text-1">{activeGoal.goal_text}</h4>
                  <p className="text-xs text-text-2 font-mono">
                    Phase {activePhaseNumber} of {totalPhases} · Module {activeModuleNumber} of {totalModulesInPhase}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                    style={{ width: `${activeGoalProgressRatio}%` }}
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
                  <p className="text-xs text-text-2 italic">
                    Estimated completion: {formattedEstDate}
                  </p>
                  
                  <Link href={nextLesson ? `/dashboard/lesson/${nextLesson.id}` : `/dashboard/path`}>
                    <Button className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent text-white font-bold px-5 h-10 rounded-xl flex items-center justify-center gap-1.5 shadow-[0_0_16px_rgba(91,142,255,0.2)]">
                      <span>Continue Learning</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : null}

            {/* ACHIEVEMENTS SECTION */}
            <div className="p-6 bg-surface border border-border rounded-2xl shadow-xl space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2 border-b border-border pb-3">
                <Award className="h-4.5 w-4.5" />
                Achievements
              </h3>

              <div className="grid grid-cols-3 gap-4">
                {BADGES_CONFIG.map((badge: any) => {
                  const earned = isBadgeEarned(badge.key)
                  return (
                    <button
                      key={badge.key}
                      onClick={() => setSelectedBadge(badge)}
                      className={`flex flex-col items-center text-center p-3.5 rounded-xl border transition-all duration-200 group cursor-pointer ${
                        earned
                          ? 'bg-surface-alt/30 border-primary/25 hover:border-primary/50'
                          : 'bg-surface border-border/40 opacity-40 hover:opacity-60 hover:border-border'
                      }`}
                    >
                      <div className={`text-3xl filter transition-transform group-hover:scale-110 duration-200 ${!earned && 'grayscale contrast-50'}`}>
                        {earned ? badge.emoji : '🔒'}
                      </div>
                      <span className={`text-[11px] font-bold mt-2 truncate max-w-full ${earned ? 'text-text-1' : 'text-text-2'}`}>
                        {badge.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* REFER FRIENDS SECTION */}
            <div className="p-6 bg-surface border border-border rounded-2xl shadow-xl space-y-6">
              <div className="border-b border-border pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-accent flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-accent" />
                    Refer Friends
                  </h3>
                  <p className="text-[11px] text-text-2 mt-1 leading-relaxed">
                    Invite someone with a goal. You earn <span className="text-accent font-bold">+200 CXP</span> when they complete their first lesson. They earn <span className="text-amber-500 font-bold">+100 CXP</span> welcome bonus.
                  </p>
                </div>
              </div>

              {/* REFERRAL STATS STRIP */}
              <div className="grid grid-cols-3 gap-3.5">
                <div className="bg-surface-alt border border-border rounded-xl p-3.5 text-center space-y-1">
                  <span className="text-2xl font-black text-text-1 font-mono block transition-all duration-300">{countInvited}</span>
                  <span className="text-[10px] font-bold text-text-2 uppercase tracking-wider block">Invited</span>
                </div>
                <div className="bg-surface-alt border border-border rounded-xl p-3.5 text-center space-y-1">
                  <span className="text-2xl font-black text-accent font-mono block transition-all duration-300">{countJoined}</span>
                  <span className="text-[10px] font-bold text-text-2 uppercase tracking-wider block">Joined</span>
                </div>
                <div className="bg-surface-alt border border-border rounded-xl p-3.5 text-center space-y-1">
                  <span className="text-2xl font-black text-amber-500 font-mono block transition-all duration-300">{countCxp}</span>
                  <span className="text-[10px] font-bold text-text-2 uppercase tracking-wider block">CXP Earned</span>
                </div>
              </div>

              {/* REFERRAL LINK BOX */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-text-2 uppercase tracking-widest block">Your referral link</span>
                <div className="flex items-center gap-2 p-3 bg-surface-alt border border-accent/30 rounded-xl">
                  <span className="text-xs text-text-2 font-semibold select-all truncate flex-1 font-mono">
                    {referralLink}
                  </span>
                </div>
              </div>

              {/* SHARE BUTTONS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Button
                  onClick={handleCopyLink}
                  className="w-full h-11 bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Copy className="h-4 w-4" />
                  <span>{copyingLink ? '✓ Copied to clipboard' : 'Copy my referral link'}</span>
                </Button>
                
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `Hey! I have been using Cognara to learn ${profile?.main_goal || 'my goals'} and it is the first app that actually built me a structured path and kept me on track.\n\nTry it free — you get a bonus 100 CXP when you complete your first lesson:\n${referralLink}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-11 bg-[#25D366] hover:bg-[#20BA56] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <span className="font-semibold text-center leading-[44px]">Share on WhatsApp</span>
                </a>

                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `If you have a goal and keep losing the thread — @CognaraLearn builds your personalised path and keeps you accountable every day.\n\nTry it free:\n${referralLink}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-11 bg-black hover:bg-[#111111] border border-border text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <span className="font-semibold text-center leading-[44px]">Share on Twitter/X</span>
                </a>

                <Button
                  onClick={handleShareNative}
                  variant="outline"
                  className="w-full h-11 border border-accent text-accent hover:bg-accent/10 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </Button>
              </div>

              {/* REFERRAL HISTORY */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-text-2 uppercase tracking-widest block">Referral History</span>

                {referralsList.length === 0 ? (
                  /* Empty State 1 */
                  <div className="text-center py-6 px-4 bg-surface-alt border border-border rounded-xl space-y-1.5">
                    <p className="text-xs text-text-1 font-semibold">No referrals yet.</p>
                    <p className="text-[11px] text-text-2">Your unique link is ready — share it with one person today.</p>
                  </div>
                ) : referralsList.filter((r: any) => r.status !== 'pending').length === 0 ? (
                  /* Empty State 2 */
                  <div className="text-center py-6 px-4 bg-surface-alt border border-border rounded-xl space-y-2">
                    <p className="text-xs text-text-1 font-semibold">Your link has been shared.</p>
                    <p className="text-[11px] text-text-2">When a friend signs up and completes their first lesson you will earn +200 CXP.</p>
                    <Button 
                      onClick={handleCopyLink}
                      variant="ghost" 
                      className="text-xs text-accent hover:text-accent/85 font-bold h-7 px-3 cursor-pointer"
                    >
                      Share again
                    </Button>
                  </div>
                ) : (
                  /* History List */
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {referralsList.slice(0, 5).map((refRow: any) => {
                      const createdDate = new Date(refRow.created_at)
                      const monthYear = createdDate.toLocaleString('default', { month: 'long', year: 'numeric' })
                      
                      return (
                        <div key={refRow.id} className="flex items-center justify-between p-3 bg-surface-alt border border-border rounded-xl text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-border flex items-center justify-center text-text-3">
                              <User size={13} />
                            </div>
                            <span className="font-semibold text-text-1">Friend joined {monthYear}</span>
                          </div>
                          
                          <div className="text-right">
                            {refRow.status === 'completed_first_lesson' ? (
                              <div className="text-[11px] font-bold text-emerald-500">
                                <div>Lesson complete ✓</div>
                                <div className="text-[10px] font-medium text-emerald-500/85 font-mono">+200 CXP earned</div>
                              </div>
                            ) : refRow.status === 'expired' ? (
                              <span className="text-[11px] font-semibold text-text-2 bg-border px-2 py-0.5 rounded-md">
                                Expired
                              </span>
                            ) : (
                              <div className="text-[11px] font-bold text-text-2">
                                <div>Signed up</div>
                                <div className="text-[9px] font-medium text-text-3">Waiting for first lesson</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* CERTIFICATES SECTION */}
            <div className="p-6 bg-surface border border-border rounded-2xl shadow-xl space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2 border-b border-border pb-3">
                🎓 My Certificates
              </h3>

              {completedPhasesList.length === 0 ? (
                <div className="py-8 px-4 text-center rounded-xl bg-surface-alt/20 border border-dashed border-border flex flex-col items-center justify-center space-y-2">
                  <Lock className="h-6 w-6 text-text-2" />
                  <p className="text-xs text-text-2 max-w-xs leading-relaxed">
                    Complete your first learning phase to earn your first certificate.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {completedPhasesList.map((phase: any) => {
                    const shareText = `I just earned a Certificate of Completion for Phase ${phase.phase_number} (${phase.title}) on Cognara! 🎓`
                    
                    return (
                      <div key={phase.id} className="p-4 rounded-xl bg-surface-alt/40 border border-border flex flex-col justify-between space-y-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider">
                            Phase {phase.phase_number} Complete
                          </span>
                          <h4 className="text-sm font-extrabold text-text-1 leading-tight">
                            {phase.title}
                          </h4>
                          <p className="text-[10.5px] text-text-2 truncate">
                            Goal: {activeGoal?.goal_text}
                          </p>
                        </div>

                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => window.open(`/api/certificate/generate?phaseId=${phase.id}`, '_blank')}
                            className="w-full h-9 bg-surface hover:bg-surface-alt border border-border text-text-1 hover:text-text-1 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download PDF
                          </button>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => {
                                window.open(
                                  `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                                    window.location.origin
                                  )}&text=${encodeURIComponent(shareText)}`,
                                  '_blank'
                                )
                              }}
                              className="h-8 bg-surface-alt hover:bg-surface border border-border text-text-1 font-bold rounded-lg text-[10.5px] flex items-center justify-center gap-1 transition cursor-pointer"
                            >
                              <LinkedinIcon className="h-3 w-3 fill-current" />
                              LinkedIn
                            </button>
                            <button
                              onClick={() => {
                                window.open(
                                  `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                                    `${shareText}\nJoin me in learning: ${window.location.origin}`
                                  )}`,
                                  '_blank'
                                )
                              }}
                              className="h-8 bg-surface-alt hover:bg-surface border border-border text-text-1 font-bold rounded-lg text-[10.5px] flex items-center justify-center gap-1 transition cursor-pointer"
                            >
                              <TwitterIcon className="h-3 w-3 fill-current" />
                              Twitter
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ACCOUNT SETTINGS */}
            <div className="p-6 bg-surface border border-border rounded-2xl shadow-xl space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2 border-b border-border pb-3">
                <Settings2 className="h-4.5 w-4.5" />
                Account Settings
              </h3>

              <div className="space-y-4">
                {/* Edit Name */}
                <div className="flex flex-col sm:flex-row sm:items-end gap-3 p-4 rounded-xl bg-surface-alt/25 border border-border/60">
                  <div className="flex-grow space-y-1.5">
                    <Label htmlFor="edit-name" className="text-xs text-text-2 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      Full Name
                    </Label>
                    <Input
                      id="edit-name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="My Name"
                      className="bg-bg border-border text-text-1 focus:border-primary"
                    />
                  </div>
                  <Button
                    onClick={handleSaveName}
                    disabled={isSavingName || !editName.trim() || editName.trim() === profile?.name}
                    className="h-10 px-5 bg-surface hover:bg-surface-alt border border-border text-text-1 font-bold rounded-xl transition cursor-pointer disabled:opacity-40"
                  >
                    {isSavingName ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                  </Button>
                </div>

                {/* Change Email */}
                <div className="flex flex-col sm:flex-row sm:items-end gap-3 p-4 rounded-xl bg-surface-alt/25 border border-border/60">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="edit-email" className="text-xs text-text-2 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      Email Address
                    </Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="me@domain.com"
                      className="bg-bg border-border text-text-1 focus:border-primary"
                    />
                  </div>
                  <Button
                    onClick={handleSaveEmail}
                    disabled={isSavingEmail || !editEmail.trim() || editEmail.trim() === profile?.email}
                    className="h-10 px-5 bg-surface hover:bg-surface-alt border border-border text-text-1 font-bold rounded-xl transition cursor-pointer disabled:opacity-40"
                  >
                    {isSavingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update'}
                  </Button>
                </div>

                {/* Change Password */}
                <div className="flex flex-col sm:flex-row sm:items-end gap-3 p-4 rounded-xl bg-surface-alt/25 border border-border/60">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="edit-password" className="text-xs text-text-2 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5" />
                      New Password
                    </Label>
                    <Input
                      id="edit-password"
                      type="password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-bg border-border text-text-1 focus:border-primary"
                    />
                  </div>
                  <Button
                    onClick={handleSavePassword}
                    disabled={isSavingPassword || !editPassword || editPassword.length < 6}
                    className="h-10 px-5 bg-surface hover:bg-surface-alt border border-border text-text-1 font-bold rounded-xl transition cursor-pointer disabled:opacity-40"
                  >
                    {isSavingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Set New'}
                  </Button>
                </div>
              </div>
            </div>

            {/* NOTIFICATION PREFERENCES CARD */}
            <div className="p-6 bg-surface border border-border rounded-2xl shadow-xl space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2 border-b border-border pb-3">
                <Bell className="h-4.5 w-4.5" />
                Notification Preferences
              </h3>
              
              <div className="space-y-4">
                {/* Toggle 1: Daily mission reminder */}
                <div className="flex items-center justify-between py-2.5 border-b border-border/55">
                  <div>
                    <p className="text-xs font-bold text-text-1">Daily mission reminder</p>
                    <p className="text-[10.5px] text-text-2 mt-0.5">Receive reminders at your study hour</p>
                  </div>
                  <button
                    onClick={() => handleToggleNotification('reminder_enabled', profile?.reminder_enabled)}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                      profile?.reminder_enabled ? 'bg-primary' : 'bg-surface-alt'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      profile?.reminder_enabled ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Toggle 2: Streak alerts */}
                <div className="flex items-center justify-between py-2.5 border-b border-border/55">
                  <div>
                    <p className="text-xs font-bold text-text-1">Streak alerts</p>
                    <p className="text-[10.5px] text-text-2 mt-0.5">Alerts when your active streak is at risk</p>
                  </div>
                  <button
                    onClick={() => handleToggleNotification('achievement_notifications', profile?.achievement_notifications)}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                      profile?.achievement_notifications ? 'bg-[#5B8EFF]' : 'bg-[#1A2035]'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      profile?.achievement_notifications ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Toggle 3: Weekly progress summary */}
                <div className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-xs font-bold text-text-1">Weekly progress summary</p>
                    <p className="text-[10.5px] text-text-2 mt-0.5">Recap of your weekly lessons completed</p>
                  </div>
                  <button
                    onClick={() => handleToggleNotification('weekly_summary_enabled', profile?.weekly_summary_enabled)}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                      profile?.weekly_summary_enabled ? 'bg-primary' : 'bg-surface-alt'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      profile?.weekly_summary_enabled ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* PLAN SUBSCRIPTION & ACCOUNT ACTIONS */}
            <div className="p-6 bg-surface border border-border rounded-2xl shadow-xl space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2 border-b border-border pb-3">
                <Shield className="h-4.5 w-4.5" />
                Plan Subscription
              </h3>

              <div className="space-y-6">
                {/* Subscription status */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-surface-alt/30 to-primary/5 border border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[9.5px] font-mono font-bold text-accent uppercase tracking-wider flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Plan Subscription
                    </span>
                    <p className="text-sm font-extrabold text-text-1">
                      {profile?.subscription_tier === 'pro_monthly' || profile?.subscription_tier === 'pro_yearly'
                        ? `${profile?.subscription_tier === 'pro_yearly' ? 'Pro Annual' : 'Pro Monthly'} — Active`
                        : 'Free Plan'}
                    </p>
                  </div>

                  {profile?.subscription_tier === 'pro_monthly' || profile?.subscription_tier === 'pro_yearly' ? (
                    <button
                      onClick={() => toast('Subscription billing portal coming soon!', 'info')}
                      className="h-10 px-5 bg-surface hover:bg-surface-alt border border-border text-text-1 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Manage Subscription
                    </button>
                  ) : (
                    <Link href="/dashboard/settings" className="w-full sm:w-auto">
                      <Button className="w-full sm:w-auto h-10 px-5 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent text-white font-bold rounded-xl text-xs shadow-md shadow-primary/15 active:scale-[0.99] transition duration-150">
                        Upgrade to Pro
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Logout & Danger Area */}
                <div className="flex flex-col sm:flex-row gap-4 pt-2 w-full">
                  <button
                    onClick={handleLogout}
                    className="w-full sm:flex-1 py-3.5 bg-surface-alt hover:bg-surface-alt/80 border border-border text-text-1 hover:text-text-1 font-bold rounded-xl text-sm flex items-center justify-center gap-2.5 transition active:scale-[0.97] cursor-pointer shadow-sm"
                  >
                    <LogOut className="h-4.5 w-4.5" />
                    Log Out
                  </button>
                  <button
                    onClick={() => {
                      setDeleteConfirmText('')
                      setShowDeleteConfirm(true)
                    }}
                    className="w-full sm:flex-1 py-3.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/50 text-rose-500 hover:text-rose-500 font-bold rounded-xl text-sm flex items-center justify-center gap-2.5 transition active:scale-[0.97] cursor-pointer"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* TAB 2 — PROGRESS (Fully Redesigned & Built) */
          <>
            {/* OVERVIEW STATS (2x2 Grid) */}
            <div className="grid grid-cols-2 gap-4">
              {/* Card 1: Completed Lessons */}
              <div className="p-5 bg-surface border border-border rounded-2xl shadow-xl space-y-1 relative overflow-hidden group">
                <div className="absolute right-3 top-3 opacity-15 text-text-1">
                  <BookOpen className="h-8 w-8" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-text-1 tracking-tight transition-transform duration-200 group-hover:scale-105">
                  {lessonsCompletedCountUp}
                </p>
                <p className="text-[10px] sm:text-xs text-text-2 font-bold uppercase tracking-wider">
                  lessons completed
                </p>
              </div>

              {/* Card 2: Quizzes Passed */}
              <div className="p-5 bg-surface border border-border rounded-2xl shadow-xl space-y-1 relative overflow-hidden group">
                <div className="absolute right-3 top-3 opacity-15 text-text-1">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-text-1 tracking-tight transition-transform duration-200 group-hover:scale-105">
                  {quizzesPassedCountUp}
                </p>
                <p className="text-[10px] sm:text-xs text-text-2 font-bold uppercase tracking-wider">
                  quizzes passed
                </p>
              </div>

              {/* Card 3: CXP Earned */}
              <div className="p-5 bg-surface border border-border rounded-2xl shadow-xl space-y-1 relative overflow-hidden group">
                <div className="absolute right-3 top-3 opacity-15 text-text-1">
                  <Sparkles className="h-8 w-8 animate-pulse" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-text-1 tracking-tight transition-transform duration-200 group-hover:scale-105">
                  {xpCountUp}
                </p>
                <p className="text-[10px] sm:text-xs text-text-2 font-bold uppercase tracking-wider">
                  CXP earned
                </p>
              </div>

              {/* Card 4: Time Spent */}
              <div className="p-5 bg-surface border border-border rounded-2xl shadow-xl space-y-1 relative overflow-hidden group">
                <div className="absolute right-3 top-3 opacity-15 text-text-1">
                  <Clock className="h-8 w-8" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-text-1 tracking-tight truncate leading-9">
                  {timeSpentString}
                </p>
                <p className="text-[10px] sm:text-xs text-text-2 font-bold uppercase tracking-wider">
                  time spent learning
                </p>
              </div>
            </div>

            {/* STREAK HISTORY */}
            <div className="p-6 bg-surface border border-border rounded-2xl shadow-xl space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2 border-b border-border pb-3">
                <Flame className="h-4.5 w-4.5" />
                Streak History
              </h3>

              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <div className="p-2 sm:p-3 bg-surface-alt/25 rounded-xl border border-border/50 shadow-inner flex flex-col justify-between min-h-[75px]">
                  <p className="text-lg sm:text-2xl font-black text-text-1 leading-tight">{streakData?.current_streak || 0}d 🔥</p>
                  <p className="text-[9px] sm:text-[10.5px] text-text-2 font-bold uppercase tracking-wider mt-1">Current Streak</p>
                </div>
                <div className="p-2 sm:p-3 bg-surface-alt/25 rounded-xl border border-border/50 shadow-inner flex flex-col justify-between min-h-[75px]">
                  <p className="text-lg sm:text-2xl font-black text-text-1 leading-tight">{streakData?.longest_streak || 0}d</p>
                  <p className="text-[9px] sm:text-[10.5px] text-text-2 font-bold uppercase tracking-wider mt-1">Longest Streak</p>
                </div>
                <div className="p-2 sm:p-3 bg-surface-alt/25 rounded-xl border border-border/50 shadow-inner flex flex-col justify-between min-h-[75px]">
                  <p className="text-lg sm:text-2xl font-black text-text-1 leading-tight">{totalActiveDays}d</p>
                  <p className="text-[9px] sm:text-[10.5px] text-text-2 font-bold uppercase tracking-wider mt-1">Total Active Days</p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <p className="text-xs font-bold text-text-1 text-center">30-Day Activity Calendar</p>
                <div className="grid grid-cols-7 gap-2 max-w-xs mx-auto">
                  {/* Weekday Headers */}
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                    <span key={d} className="text-[9px] font-extrabold text-text-3 text-center uppercase tracking-wider block py-0.5">
                      {d}
                    </span>
                  ))}
                  {/* Empty padding cells to align to correct start weekday */}
                  {calendarPaddingCells.map((_: any, i: number) => (
                    <div key={`pad-${i}`} className="w-8 h-8 opacity-0" />
                  ))}
                  {/* Actual calendar days */}
                  {calendarDays.map((day, idx) => (
                    <div
                      key={idx}
                      className={`relative w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-mono font-bold select-none transition-all duration-200 ${
                        day.isActive
                          ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md shadow-emerald-500/25 font-black'
                          : 'bg-surface-alt/30 border border-border/60 text-text-2/70'
                      } ${day.isToday ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface' : ''}`}

                      title={day.dateStr}
                    >
                      {day.dayNum}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-text-2 text-center italic">
                  "Every green dot is a day you showed up."
                </p>
              </div>
            </div>

            {/* MY LEARNING GOALS LIST */}
            <div className="p-6 bg-surface border border-border rounded-2xl shadow-xl space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2 border-b border-border pb-3">
                🎯 My Learning Goals
              </h3>

              {goalsProgress.length === 0 ? (
                <p className="text-xs text-text-2 text-center italic py-4">No goals configured yet.</p>
              ) : (
                <div className="space-y-4">
                  {goalsProgress.map((gp: any) => {
                    const lastPhase = phases.filter((p: any) => p.roadmap_id === gp.roadmap?.id).slice(-1)[0]
                    return (
                      <div key={gp.goal.id} className="p-5 rounded-xl bg-surface-alt/20 border border-border space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <h4 className="text-base font-extrabold text-text-1 leading-tight">
                              {gp.goal.goal_text}
                            </h4>
                            <p className="text-[10.5px] text-text-2 font-mono">
                              Started: {gp.startedDate} {gp.isCompleted && `· Completed: ${gp.completionDate}`}
                            </p>
                          </div>

                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase tracking-wider shrink-0 ${
                            gp.isCompleted
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                              : 'bg-primary/10 text-primary border border-primary/25'
                          }`}>
                            {gp.isCompleted ? 'Completed' : 'Active'}
                          </span>
                        </div>

                        {/* Goal progress details */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center py-2 border-y border-border/60">
                          <div>
                            <p className="text-xs text-text-2">Phases</p>
                            <p className="text-sm font-bold text-text-1 mt-0.5">{gp.completedPhases} of {gp.totalPhases}</p>
                          </div>
                          <div>
                            <p className="text-xs text-text-2">Lessons</p>
                            <p className="text-sm font-bold text-text-1 mt-0.5">{gp.completedLessons}</p>
                          </div>
                          <div>
                            <p className="text-xs text-text-2">Quizzes Passed</p>
                            <p className="text-sm font-bold text-text-1 mt-0.5">{gp.passedQuizzes}</p>
                          </div>
                          <div>
                            <p className="text-xs text-text-2">Average Score</p>
                            <p className="text-sm font-bold text-text-1 mt-0.5">{gp.avgScore > 0 ? `${gp.avgScore}%` : 'N/A'}</p>
                          </div>
                        </div>

                        {/* Goal Progress bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[11px] font-mono text-text-2">
                            <span>Goal progress</span>
                            <span>{gp.progressPercent}%</span>
                          </div>
                          <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                              style={{ width: `${gp.progressPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* CTA button */}
                        <div className="pt-2 flex justify-end">
                          {gp.isCompleted ? (
                            lastPhase && (
                              <button
                                onClick={() => window.open(`/api/certificate/generate?phaseId=${lastPhase.id}`, '_blank')}
                                className="h-9 px-4 bg-gradient-to-r from-primary to-accent hover:from-[#4A7AEE] hover:to-[#9067FA] text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                              >
                                <Download className="h-3.5 w-3.5" />
                                View Certificate
                              </button>
                            )
                          ) : (
                            <Link href="/dashboard/path">
                              <Button className="h-9 px-4 bg-gradient-to-r from-primary to-accent hover:from-[#4A7AEE] hover:to-[#9067FA] text-white font-bold rounded-lg text-xs shadow-md flex items-center justify-center gap-1 shadow-[#5B8EFF]/20">
                                <span>Continue</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* QUIZ PERFORMANCE SECTION */}
            <div className="p-6 bg-surface border border-border rounded-2xl shadow-xl space-y-6">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <BarChart2 className="h-4.5 w-4.5" />
                  Quiz Performance
                </h3>
                <span className="text-xs font-mono text-text-2">
                  Average Score: <span className="text-text-1 font-bold">{overallAvgScore}%</span>
                </span>
              </div>

              {last10Scores.length === 0 ? (
                <p className="text-xs text-text-2 text-center italic py-6">Take your first quiz to see performance metrics here!</p>
              ) : (
                <div className="space-y-6">
                  {/* SVG Bar Chart for last 10 quiz scores */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-text-2 text-center uppercase tracking-wider">Last 10 Quiz Scores</p>
                    <div className="w-full h-36 flex items-end justify-between gap-2.5 pt-2 px-2 bg-surface-alt/15 border border-border/40 rounded-xl p-4">
                      {last10Scores.map((score, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                          {/* Tooltip on hover */}
                          <span className="text-[9px] font-mono font-bold text-accent opacity-0 group-hover:opacity-100 transition-opacity absolute -translate-y-9 bg-bg px-1 rounded border border-border">
                            {score}%
                          </span>
                          {/* Bar */}
                          <div 
                            className="w-full rounded-t bg-gradient-to-t from-primary to-accent transition-all duration-500 ease-out shadow-[0_0_8px_rgba(91,142,255,0.15)] hover:scale-x-105"
                            style={{ height: `${score}%` }}
                          />
                          {/* Axis Label */}
                          <span className="text-[8px] text-text-2 font-mono mt-1">
                            #{i + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strong vs Revisit Topics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Strong Topics */}
                    <div className="space-y-2.5">
                      <p className="text-xs font-bold text-[#34D399] uppercase tracking-wider">You perform well in:</p>
                      {strongTopics.length > 0 ? (
                        <ul className="space-y-2">
                          {strongTopics.slice(0, 3).map(topic => (
                            <li key={topic.id} className="flex items-center justify-between text-xs p-2 rounded bg-emerald-500/5 border border-emerald-500/10 gap-3">
                              <span className="text-text-2 truncate font-medium">{topic.title}</span>
                              <span className="text-emerald-400 font-bold font-mono text-[10.5px] bg-emerald-500/10 px-2 py-0.5 rounded shrink-0">{topic.avg}%</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[11px] text-text-2 italic">No topics above 80% yet. Keep scoring high on quizzes!</p>
                      )}
                    </div>

                    {/* Topics to Revisit */}
                    <div className="space-y-2.5">
                      <p className="text-xs font-bold text-red-400 uppercase tracking-wider">These topics need more attention:</p>
                      {revisitTopics.length > 0 ? (
                        <ul className="space-y-2">
                          {revisitTopics.slice(0, 3).map(topic => (
                            <li key={topic.id} className="flex items-center justify-between gap-3 text-xs p-2 rounded bg-red-500/5 border border-red-500/10">
                              <span className="text-text-2 truncate font-medium">{topic.title}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-red-400 font-bold font-mono text-[10.5px] bg-red-500/10 px-2 py-0.5 rounded">{topic.avg}%</span>
                                <Link href={`/dashboard/lesson/${topic.id}`}>
                                  <button className="text-[10px] font-bold text-primary hover:underline cursor-pointer">
                                    Review
                                  </button>
                                </Link>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[11px] text-text-2 italic">No topics below 60%. Excellent work — you are mastering your paths!</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* WEEKLY ACTIVITY */}
            <div className="p-6 bg-surface border border-border rounded-2xl shadow-xl space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2 border-b border-border pb-3">
                📅 This Week
              </h3>

              <div className="flex justify-between items-center gap-1.5 sm:gap-2">
                {weekly.daysOfWeek.map((day: any, idx: number) => (
                  <div
                    key={idx}
                    className={`flex-1 flex flex-col items-center p-2 rounded-lg border text-center transition-all ${
                      day.isActive
                        ? 'bg-gradient-to-br from-primary/10 to-accent/10 border-primary/25'
                        : 'bg-surface-alt/10 border-border/40'
                    } ${day.isToday ? 'ring-1 ring-primary' : ''}`}
                  >
                    <span className="text-[10px] text-text-2 font-bold uppercase">{day.label}</span>
                    <span className={`text-sm font-extrabold mt-1.5 ${day.isActive ? 'text-text-1' : 'text-text-2/60'}`}>
                      {day.lessons}
                    </span>
                    <span className="text-[9px] text-text-2 font-mono mt-0.5">
                      {day.cxp > 0 ? `+${day.cxp}` : '0'}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-center text-xs text-text-2 font-mono mt-2">
                This week: <span className="text-text-1 font-bold">{weekly.totalWeekLessons}</span> lessons · <span className="text-text-1 font-bold">{weekly.totalWeekCxp}</span> CXP · <span className="text-text-1 font-bold">{weekly.totalWeekActiveDays}</span> active days
              </p>
            </div>

            {/* CXP HISTORY */}
            <div className="p-6 bg-surface border border-border rounded-2xl shadow-xl space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2 border-b border-border pb-3">
                ⚡ CXP History
              </h3>

              {cxpHistory.length === 0 ? (
                <p className="text-xs text-text-2 text-center italic py-4">No CXP history logs found yet. Start learning!</p>
              ) : (
                <div className="space-y-3">
                  <div className="max-h-60 overflow-y-auto pr-1 space-y-2.5">
                    {cxpHistory.slice(0, cxpLimit).map((event: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-surface-alt/25 border border-border/40 text-xs gap-3">
                        <div className="space-y-1 min-w-0">
                          <p className="font-bold text-text-1 truncate">{event.event}</p>
                          <p className="text-[10px] text-text-2">{event.date}</p>
                        </div>
                        <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                          <span className="font-extrabold text-primary">+{event.xp} CXP</span>
                          <span className="text-[10px] text-text-2 font-mono">Total: {event.runningTotal} CXP</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {cxpLimit < cxpHistory.length && (
                    <button
                      onClick={() => setCxpLimit(prev => prev + 5)}
                      className="w-full h-10 bg-surface hover:bg-surface-alt border border-border text-text-1 hover:text-text-1 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      Load More History
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* BADGE DETAILS MODAL */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl p-6 relative overflow-hidden animate-scale-up">
            <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`text-5xl filter ${!isBadgeEarned(selectedBadge.key) && 'grayscale contrast-50 opacity-40'}`}>
                {isBadgeEarned(selectedBadge.key) ? selectedBadge.emoji : '🔒'}
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-text-1">{selectedBadge.label}</h3>
                <span className={`inline-block text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mt-1.5 ${
                  isBadgeEarned(selectedBadge.key)
                    ? 'bg-primary/15 text-primary border border-primary/20'
                    : 'bg-surface-alt text-text-2'
                }`}>
                  {isBadgeEarned(selectedBadge.key) ? 'Earned' : 'Locked'}
                </span>
              </div>

              <p className="text-xs text-text-2 leading-relaxed">
                {selectedBadge.description}
              </p>

              {isBadgeEarned(selectedBadge.key) && (
                <p className="text-[10px] text-text-2 font-mono pt-2 border-t border-border w-full">
                  Unlocked: {getBadgeEarnedDate(selectedBadge.key)}
                </p>
              )}

              {!isBadgeEarned(selectedBadge.key) && (
                <p className="text-[10px] text-amber-500 font-mono font-bold pt-2 border-t border-border w-full flex items-center justify-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" />
                  Keep learning to unlock
                </p>
              )}

              <Button
                onClick={() => setSelectedBadge(null)}
                className="w-full h-10 bg-surface hover:bg-surface-alt border border-border text-text-1 hover:text-text-1 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-surface border border-red-500/20 rounded-2xl shadow-2xl p-6 relative overflow-hidden animate-scale-up">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-500">
                <AlertTriangle className="h-6 w-6" />
              </div>

              <div>
                <h3 className="text-base font-extrabold text-text-1">Delete Your Account?</h3>
                <p className="text-xs text-text-2 leading-relaxed mt-2">
                  This action is permanent and cannot be undone. All your progress, goals, XP, custom roadmaps, and certificates will be deleted forever.
                </p>
              </div>

              <div className="w-full text-left space-y-1.5">
                <Label htmlFor="delete-confirm" className="text-[11px] text-text-2 font-bold uppercase tracking-wider">
                  Type <span className="text-red-400">DELETE</span> to confirm
                </Label>
                <Input
                  id="delete-confirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="bg-bg border-border text-text-1 focus:border-red-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="h-10 bg-surface hover:bg-surface-alt border border-border text-text-1 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                  className="h-10 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-xs transition cursor-pointer disabled:opacity-40"
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
