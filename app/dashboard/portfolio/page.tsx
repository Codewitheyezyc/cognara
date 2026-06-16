'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { 
  GraduationCap, Share2, Award, ClipboardCopy, Calendar, CheckCircle2, 
  Flame, Clock, BarChart2, Globe, Settings, Eye, EyeOff, Loader2 
} from 'lucide-react'
import { LinkedinIcon, TwitterIcon, InstagramIcon, FacebookIcon } from '@/components/ui/SocialIcons'

interface CompletedRoadmap {
  id: string
  title: string
  description: string
  created_at: string
  lessonsCount: number
  avgScore: number
}

interface UserStats {
  totalLessonsCompleted: number
  avgQuizScore: number
  recordStreak: number
  currentStreak: number
}

export default function DashboardPortfolioPage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  // State
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<UserStats>({
    totalLessonsCompleted: 0,
    avgQuizScore: 0,
    recordStreak: 0,
    currentStreak: 0
  })
  const [completedRoadmaps, setCompletedRoadmaps] = useState<CompletedRoadmap[]>([])

  useEffect(() => {
    async function loadPortfolioData() {
      try {
        setLoading(true)
        // 1. Get auth user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        // 2. Fetch profile details
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
        
        setProfile(profileRow)

        // 3. Fetch cumulative stats
        // A. Total Completed Lessons
        const { count: completedLessonsCount } = await supabase
          .from('lesson_progress')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed')

        // B. Average Quiz Score
        const { data: quizAttempts } = await supabase
          .from('quiz_attempts')
          .select('score')
          .eq('user_id', user.id)
        
        const avgQuiz = quizAttempts && quizAttempts.length > 0
          ? Math.round(quizAttempts.reduce((sum: number, item: any) => sum + item.score, 0) / quizAttempts.length)
          : 0

        // C. Streak details
        const { data: streakRow } = await supabase
          .from('streaks')
          .select('current_streak, longest_streak')
          .eq('user_id', user.id)
          .maybeSingle()

        setStats({
          totalLessonsCompleted: completedLessonsCount || 0,
          avgQuizScore: avgQuiz,
          recordStreak: streakRow?.longest_streak || 0,
          currentStreak: streakRow?.current_streak || 0
        })

        // 4. Fetch Completed Roadmaps
        // Fetch all roadmaps
        const { data: roadmaps } = await supabase
          .from('roadmaps')
          .select('*')
          .eq('user_id', user.id)

        const completedList: CompletedRoadmap[] = []

        if (roadmaps && roadmaps.length > 0) {
          // Fetch all user's lesson progress to cross reference
          const { data: progress } = await supabase
            .from('lesson_progress')
            .select('lesson_id')
            .eq('user_id', user.id)
            .eq('status', 'completed')
          
          const completedLessonIds = new Set(progress?.map((p: any) => p.lesson_id) || [])

          for (const rm of roadmaps) {
            // Fetch lessons in this roadmap
            const { data: rmLessons } = await supabase
              .from('lessons')
              .select('id')
              .eq('roadmap_id', rm.id)

            if (rmLessons && rmLessons.length > 0) {
              const lessonsCount = rmLessons.length
              const completedInRoadmap = rmLessons.filter((l: any) => completedLessonIds.has(l.id)).length
              
              // If fully completed
              if (completedInRoadmap === lessonsCount) {
                // Calculate average quiz score inside this roadmap
                const { data: quizzes } = await supabase
                  .from('quizzes')
                  .select('id')
                  .in('lesson_id', rmLessons.map((l: any) => l.id))
                
                let rmAvgScore = 0
                const quizIds = quizzes?.map((q: any) => q.id) || []
                if (quizIds.length > 0) {
                  const { data: rmAttempts } = await supabase
                    .from('quiz_attempts')
                    .select('score')
                    .eq('user_id', user.id)
                    .in('quiz_id', quizIds)
                  
                  if (rmAttempts && rmAttempts.length > 0) {
                    rmAvgScore = Math.round(rmAttempts.reduce((sum: number, item: any) => sum + item.score, 0) / rmAttempts.length)
                  }
                }

                completedList.push({
                  id: rm.id,
                  title: rm.title,
                  description: rm.description || '',
                  created_at: rm.created_at,
                  lessonsCount,
                  avgScore: rmAvgScore
                })
              }
            }
          }
        }

        setCompletedRoadmaps(completedList)
        setLoading(false)
      } catch (err) {
        console.error(err)
        setLoading(false)
      }
    }

    loadPortfolioData()
  }, [supabase, router])

  const copyShareLink = () => {
    if (!profile?.id) return
    const shareUrl = `${window.location.origin}/portfolio/${profile.id}`
    navigator.clipboard.writeText(shareUrl)
    toast('Public portfolio link copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-xs font-semibold text-text-2">Loading learning portfolio...</p>
        </div>
      </div>
    )
  }

  const initialsUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile?.name || 'Learner')}`

  return (
    <div className="space-y-8 animate-page-enter max-w-4xl pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-text-1">Learning Portfolio</h1>
          <p className="text-text-2 text-sm mt-1">Reflect on your finished subjects, view verified credentials, and share your learning achievements.</p>
        </div>
        {profile?.portfolio_public ? (
          <Button
            onClick={copyShareLink}
            className="w-full md:w-auto h-10 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl shadow-[0_0_16px_rgba(91,142,255,0.2)] text-xs flex items-center justify-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            <span>Share Portfolio Link</span>
          </Button>
        ) : (
          <Button
            onClick={() => router.push('/dashboard/profile')}
            className="w-full md:w-auto h-10 bg-surface border border-border hover:bg-surface-alt text-text-1 font-bold rounded-xl text-xs flex items-center justify-center gap-2"
          >
            <Settings className="h-4 w-4 text-text-2" />
            <span>Enable Sharing in Profile</span>
          </Button>
        )}
      </div>

      {/* Profile Overview Card */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-md flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
          <img
            src={profile?.avatar_url || initialsUrl}
            alt={profile?.name || 'Learner'}
            className="w-20 h-20 rounded-full border border-border object-cover shadow-sm"
          />
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-text-1">{profile?.name || 'Learner'}</h2>
            <p className="text-text-2 text-xs font-semibold">{profile?.occupation || 'Student'}</p>
            {profile?.country && (
              <p className="text-text-3 text-[10px] uppercase tracking-wider font-bold">{profile.country}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
          {/* Privacy status */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold select-none bg-surface-alt/50">
            {profile?.portfolio_public ? (
              <>
                <Eye className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Public (Link sharing enabled)</span>
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-amber-500">Private Portfolio</span>
              </>
            )}
          </div>

          {/* Social icons */}
          <div className="flex gap-2">
            {profile?.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-surface-alt hover:bg-border border border-border rounded-lg text-text-2 hover:text-text-1 transition" title="LinkedIn">
                <LinkedinIcon className="h-4 w-4" />
              </a>
            )}
            {profile?.twitter_url && (
              <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-surface-alt hover:bg-border border border-border rounded-lg text-text-2 hover:text-text-1 transition" title="Twitter / X">
                <TwitterIcon className="h-4 w-4" />
              </a>
            )}
            {profile?.instagram_url && (
              <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-surface-alt hover:bg-border border border-border rounded-lg text-text-2 hover:text-text-1 transition" title="Instagram">
                <InstagramIcon className="h-4 w-4" />
              </a>
            )}
            {profile?.facebook_url && (
              <a href={profile.facebook_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-surface-alt hover:bg-border border border-border rounded-lg text-text-2 hover:text-text-1 transition" title="Facebook">
                <FacebookIcon className="h-4 w-4" />
              </a>
            )}
            {!profile?.linkedin_url && !profile?.twitter_url && !profile?.instagram_url && !profile?.facebook_url && (
              <span className="text-text-3 text-[10px] font-medium italic">No social profiles linked</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Streak */}
        <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-3 uppercase tracking-wider">Record Streak</p>
            <p className="text-xl font-bold text-text-1 mt-0.5">{stats.recordStreak} Days</p>
            <p className="text-[10px] text-text-2">Current streak: {stats.currentStreak} days</p>
          </div>
        </div>

        {/* Lessons Completed */}
        <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-xl">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-3 uppercase tracking-wider">Lessons Finished</p>
            <p className="text-xl font-bold text-text-1 mt-0.5">{stats.totalLessonsCompleted} Lessons</p>
            <p className="text-[10px] text-text-2">Across all learning paths</p>
          </div>
        </div>

        {/* Avg Quiz Score */}
        <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <BarChart2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-3 uppercase tracking-wider">Average Quiz Score</p>
            <p className="text-xl font-bold text-text-1 mt-0.5">{stats.avgQuizScore}%</p>
            <p className="text-[10px] text-text-2">High score retained per quiz</p>
          </div>
        </div>
      </div>

      {/* Completed Roadmaps Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 border-b border-border pb-3">
          <GraduationCap className="h-5 w-5 text-primary" strokeWidth={1.5} />
          <h2 className="font-heading text-lg font-bold text-text-1">Completed Subjects</h2>
        </div>

        {completedRoadmaps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedRoadmaps.map((rm) => (
              <div 
                key={rm.id} 
                className="bg-surface border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-primary/20 transition-all duration-200"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-sm text-text-1 leading-snug pr-4">{rm.title}</h3>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-[9px] font-bold text-amber-400 shrink-0">
                      <Award className="h-3 w-3" />
                      <span>Certified</span>
                    </span>
                  </div>
                  <p className="text-xs text-text-2 line-clamp-2 leading-relaxed">
                    {rm.description || 'Custom learning curriculum completed successfully on Cognara.'}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between text-[11px] text-text-3 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-text-3" />
                    <span>Done {new Date(rm.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span>{rm.lessonsCount} lessons</span>
                    <span className="font-semibold text-text-1">{rm.avgScore}% avg</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center max-w-md mx-auto space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-surface-alt border border-border flex items-center justify-center text-xl">
              🎓
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-text-1">No completed roadmaps yet</h3>
              <p className="text-xs text-text-2 leading-relaxed">
                Finish all phases and pass the quizzes of your active roadmap to generate your credentials and list them in your portfolio.
              </p>
            </div>
            <Button
              onClick={() => router.push('/dashboard/path')}
              className="bg-primary text-white text-xs font-bold px-4 h-9 rounded-xl"
            >
              Continue Learning
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
