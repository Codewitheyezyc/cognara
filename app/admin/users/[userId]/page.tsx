'use client'

import React, { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Flame, Award, BookOpen, Clock, 
  User, CheckCircle, XCircle, CreditCard, Calendar
} from 'lucide-react'

interface UserDetailProps {
  params: Promise<{ userId: string }>
}

interface DetailData {
  profile: {
    id: string
    name: string | null
    email: string
    created_at: string
    subscription_tier: string
    plan: string
    avatar_url: string | null
    subscription_status: string | null
    subscription_start_date: string | null
    subscription_end_date: string | null
  }
  streak: {
    current: number
    record: number
    lastActive: string
  }
  learningJourney: {
    subject: string
    roadmapTitle: string
    currentPhase: number
    totalPhases: number
    lessonsCompleted: number
    lessonsTotal: number
    avgScore: number
    quizzesTaken: number
  }
  recentQuizzes: Array<{
    attempted_at: string
    score: number
    passed: boolean
    lesson_title: string
  }>
  badges: Array<{
    id: string
    badge_name: string
    badge_emoji: string
    earned_at: string
  }>
}

export default function AdminUserDetail(props: UserDetailProps) {
  const params = use(props.params)
  const { userId } = params
  const router = useRouter()

  const [data, setData] = useState<DetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/admin/users/${userId}`)
        if (res.ok) {
          const resData = await res.json()
          setData(resData)
        } else {
          const err = await res.json()
          setError(err.error || 'Failed to load user details')
        }
      } catch (err) {
        setError('Error fetching user data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [userId])

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-xs font-semibold text-text-2">Loading profile details...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-surface p-8 rounded-2xl border border-border text-center max-w-md mx-auto space-y-4">
        <XCircle className="h-10 w-10 text-error mx-auto" />
        <h3 className="text-sm font-bold text-text-1">Error Loading Profile</h3>
        <p className="text-xs text-text-2">{error || 'User details not found'}</p>
        <Link 
          href="/admin/users" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-surface-alt hover:bg-border border border-border text-xs font-bold text-text-2 hover:text-text-1 rounded-lg transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Users List</span>
        </Link>
      </div>
    )
  }

  const { profile, streak, learningJourney, recentQuizzes, badges } = data
  const name = profile.name || 'Learner'
  const initialsUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
  const isPro = profile.subscription_tier !== 'free'

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <div>
        <Link 
          href="/admin/users" 
          className="inline-flex items-center gap-2 text-xs font-bold text-text-2 hover:text-text-1 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Users</span>
        </Link>
      </div>

      {/* USER HERO PROFILE CARD */}
      <div className="bg-surface p-6 rounded-2xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={profile.avatar_url || initialsUrl}
            alt={name}
            className="w-14 h-14 rounded-full border border-border object-cover"
          />
          <div className="space-y-0.5">
            <h2 className="text-lg font-black text-text-1 tracking-tight">{name}</h2>
            <p className="text-xs text-text-2">{profile.email}</p>
            <p className="text-[10px] text-text-3 font-semibold">
              Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div>
          <span className={`
            px-3 py-1 rounded-full text-xs font-extrabold border uppercase tracking-wider
            ${isPro 
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
              : 'bg-surface-alt text-text-2 border-border'
            }
          `}>
            {isPro ? 'Pro Member' : 'Free Member'}
          </span>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Metric 1: Streak */}
        <div className="bg-surface p-5 rounded-2xl border border-border flex flex-col justify-between h-28">
          <div className="flex justify-between items-center text-[10px] font-bold text-text-2 uppercase tracking-wide">
            <span>Daily Streak</span>
            <Flame className="h-4 w-4 text-orange-500 fill-current" />
          </div>
          <div>
            <p className="text-xl font-black text-text-1 font-heading">🔥 {streak.current} days</p>
            <p className="text-[9px] text-text-3 font-semibold mt-1">Personal record: 🏆 {streak.record} days</p>
          </div>
        </div>

        {/* Metric 2: Completed Lessons */}
        <div className="bg-surface p-5 rounded-2xl border border-border flex flex-col justify-between h-28">
          <div className="flex justify-between items-center text-[10px] font-bold text-text-2 uppercase tracking-wide">
            <span>Learning Roadmap</span>
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xl font-black text-text-1 font-heading">
              {learningJourney.lessonsCompleted} / {learningJourney.lessonsTotal}
            </p>
            <p className="text-[9px] text-text-3 font-semibold mt-1">
              Phase {learningJourney.currentPhase} of {learningJourney.totalPhases} ({learningJourney.subject})
            </p>
          </div>
        </div>

        {/* Metric 3: Quiz Score */}
        <div className="bg-surface p-5 rounded-2xl border border-border flex flex-col justify-between h-28 col-span-2 lg:col-span-1">
          <div className="flex justify-between items-center text-[10px] font-bold text-text-2 uppercase tracking-wide">
            <span>Quiz Performance</span>
            <Award className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-xl font-black text-text-1 font-heading">🎯 {learningJourney.avgScore}%</p>
            <p className="text-[9px] text-text-3 font-semibold mt-1">Across {learningJourney.quizzesTaken} quiz attempts</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: RECENT QUIZZES */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="p-5 border-b border-border bg-surface-alt/45 select-none">
            <h3 className="text-xs font-bold text-text-1 uppercase tracking-wider">Recent Quiz Attempts</h3>
          </div>
          <div className="divide-y divide-border/60 max-h-[300px] overflow-y-auto">
            {recentQuizzes.length > 0 ? (
              recentQuizzes.map((quiz, i) => (
                <div key={i} className="p-4 flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-3">
                    {quiz.passed ? (
                      <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="h-4.5 w-4.5 text-rose-500 shrink-0" />
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-text-1 truncate max-w-[200px]">{quiz.lesson_title}</span>
                      <span className="text-[9px] text-text-3">
                        {new Date(quiz.attempted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <span className={`font-bold font-mono ${quiz.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {quiz.score}%
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-text-3 font-semibold">No quiz attempts logged</div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: BADGES EARNED */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="p-5 border-b border-border bg-surface-alt/45 select-none">
            <h3 className="text-xs font-bold text-text-1 uppercase tracking-wider">Earned Badges</h3>
          </div>
          <div className="p-5 max-h-[300px] overflow-y-auto">
            {badges.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {badges.map((b) => (
                  <div 
                    key={b.id} 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-alt border border-border rounded-xl text-xs font-semibold"
                    title={`Earned on ${new Date(b.earned_at).toLocaleDateString()}`}
                  >
                    <span className="text-base">{b.badge_emoji}</span>
                    <span className="text-text-1 text-[11px] font-bold">{b.badge_name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-text-3 font-semibold">No badges earned yet</div>
            )}
          </div>
        </div>
      </div>

      {/* SUBSCRIPTION CARD */}
      <div className="bg-surface p-6 rounded-2xl border border-border space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-text-1 uppercase tracking-wider select-none border-b border-border pb-3">
          <CreditCard className="h-4.5 w-4.5 text-primary" />
          <span>Subscription & Billing Details</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-semibold">
          <div className="space-y-1">
            <p className="text-text-3">Plan Status</p>
            <p className="text-text-1 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${profile.subscription_status === 'active' ? 'bg-emerald-500' : 'bg-text-3'}`} />
              <span className="capitalize">{profile.subscription_status || 'Inactive'}</span>
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-text-3">Start Date</p>
            <p className="text-text-1 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-text-2" />
              <span>
                {profile.subscription_start_date 
                  ? new Date(profile.subscription_start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                  : 'N/A'
                }
              </span>
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-text-3">Next Renewal / Expiry</p>
            <p className="text-text-1 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-text-2" />
              <span>
                {profile.subscription_end_date 
                  ? new Date(profile.subscription_end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                  : 'Never (Lifetime / Manual)'
                }
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
