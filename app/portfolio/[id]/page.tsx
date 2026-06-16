'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  GraduationCap, Award, Calendar, CheckCircle2, Flame, BarChart2, 
  ShieldAlert, Sparkles, ArrowRight, Loader2
} from 'lucide-react'
import { LinkedinIcon, TwitterIcon, InstagramIcon, FacebookIcon } from '@/components/ui/SocialIcons'
import { Button } from '@/components/ui/button'

interface CompletedRoadmap {
  id: string
  title: string
  description: string
  created_at: string
  lessonsCount: number
  avgScore: number
}

interface Badge {
  id: string
  badge_key: string
  badge_label: string
  badge_emoji: string
  earned_at: string
}

interface ProfileData {
  id: string
  name: string
  avatar_url: string | null
  occupation: string | null
  country: string | null
  linkedin_url: string | null
  twitter_url: string | null
  instagram_url: string | null
  facebook_url: string | null
  portfolio_public: boolean
  created_at: string
}

const ALL_BADGE_META: Record<string, { label: string; emoji: string; description: string }> = {
  phase_1: { emoji: '🌱', label: 'First Steps', description: 'Completed Phase 1' },
  phase_2: { emoji: '🔥', label: 'Building Momentum', description: 'Completed Phase 2' },
  phase_3: { emoji: '⚡', label: 'Halfway There', description: 'Completed Phase 3' },
  phase_4: { emoji: '🎯', label: 'Advanced Learner', description: 'Completed Phase 4' },
  phase_5: { emoji: '🏆', label: 'Graduate', description: 'Completed full roadmap' },
  streak_7: { emoji: '🔥', label: 'Week Warrior', description: '7 day streak' },
  streak_30: { emoji: '💎', label: 'Consistent', description: '30 day streak' },
  perfect_quiz: { emoji: '⭐', label: 'Perfect Score', description: '100% on a quiz' },
  speed_learner: { emoji: '⚡', label: 'Speed Learner', description: '3 lessons in one day' }
}

export default function PublicPortfolioPage() {
  const params = useParams()
  const router = useRouter()
  const profileId = params.id as string

  // State
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [stats, setStats] = useState({
    totalLessonsCompleted: 0,
    avgQuizScore: 0,
    recordStreak: 0,
    currentStreak: 0
  })
  const [completedRoadmaps, setCompletedRoadmaps] = useState<CompletedRoadmap[]>([])
  const [badges, setBadges] = useState<Badge[]>([])

  useEffect(() => {
    async function fetchPublicData() {
      if (!profileId) return
      try {
        setLoading(true)
        setErrorMsg('')
        
        const res = await fetch(`/api/portfolio/${profileId}`)
        if (!res.ok) {
          if (res.status === 403) {
            setErrorMsg('This learning portfolio is private.')
          } else if (res.status === 404) {
            setErrorMsg('Profile not found.')
          } else {
            setErrorMsg('Could not load portfolio details.')
          }
          setLoading(false)
          return
        }

        const data = await res.json()
        setProfile(data.profile)
        setStats(data.stats)
        setCompletedRoadmaps(data.completedRoadmaps || [])
        setBadges(data.badges || [])
        setLoading(false)
      } catch (err) {
        console.error(err)
        setErrorMsg('Failed to establish connection to server.')
        setLoading(false)
      }
    }

    fetchPublicData()
  }, [profileId])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg text-text-1 flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs font-semibold text-text-2 tracking-wide">Retrieving verified achievements...</p>
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-bg text-text-1 flex flex-col items-center justify-center p-6 space-y-6 max-w-sm mx-auto text-center">
        <div className="p-4 bg-surface rounded-full border border-border shadow-md">
          <ShieldAlert className="h-10 w-10 text-amber-500" />
        </div>
        <div className="space-y-2">
          <h1 className="font-heading text-lg font-bold text-text-1">Portfolio Unavailable</h1>
          <p className="text-xs text-text-2 leading-relaxed">{errorMsg}</p>
        </div>
        <Link href="/">
          <Button variant="default" className="text-xs font-semibold px-6 h-10 rounded-xl">
            Go to Cognara Home
          </Button>
        </Link>
      </div>
    )
  }

  const initialsUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile?.name || 'Learner')}`

  return (
    <div className="min-h-screen bg-bg text-text-1 relative overflow-x-hidden flex flex-col justify-between">
      {/* Background glowing effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/5 opacity-40 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-accent/5 opacity-40 blur-[130px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="w-full max-w-5xl mx-auto px-6 py-5 flex items-center justify-between z-10 border-b border-border/40 bg-bg/80 backdrop-blur-md sticky top-0">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-black text-sm shadow-[0_0_12px_rgba(91,142,255,0.25)] group-hover:scale-105 transition-transform duration-200">
            C
          </div>
          <span className="font-heading font-bold text-base tracking-tight text-text-1 select-none">
            Cognara <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5 ml-1.5 font-bold uppercase tracking-wider">Portfolio</span>
          </span>
        </Link>
        <Link href="/signup">
          <Button size="sm" className="text-[11px] font-bold h-8.5 rounded-lg px-4 bg-primary hover:bg-primary/95 text-white shadow-xs">
            Start Learning Free
          </Button>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-4xl mx-auto px-6 py-10 md:py-16 space-y-12 z-10">
        {/* Profile Card */}
        <section className="bg-surface/85 backdrop-blur-md rounded-2xl border border-border p-6 md:p-8 shadow-lg flex flex-col md:flex-row gap-6 items-center justify-between text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-5">
            <img
              src={profile?.avatar_url || initialsUrl}
              alt={profile?.name}
              className="w-24 h-24 rounded-full border-2 border-primary/20 object-cover shadow-md"
            />
            <div className="space-y-1.5">
              <h1 className="text-2xl font-extrabold text-text-1 tracking-tight flex items-center justify-center md:justify-start gap-2">
                <span>{profile?.name}</span>
                <span className="flex items-center gap-0.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400 uppercase tracking-wider select-none shrink-0">
                  ✓ Verified Learner
                </span>
              </h1>
              <p className="text-text-2 text-sm font-semibold">{profile?.occupation || 'Student'}</p>
              {profile?.country && (
                <p className="text-text-3 text-[10px] uppercase tracking-wider font-extrabold">{profile.country}</p>
              )}
            </div>
          </div>

          {/* Social Profiles */}
          <div className="flex flex-col items-center md:items-end gap-3.5">
            <span className="text-[10px] font-bold text-text-3 uppercase tracking-wider">Connect with user</span>
            <div className="flex gap-2">
              {profile?.linkedin_url && (
                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-surface hover:bg-surface-alt border border-border rounded-xl text-text-2 hover:text-text-1 transition shadow-xs" title="LinkedIn">
                  <LinkedinIcon className="h-4.5 w-4.5" />
                </a>
              )}
              {profile?.twitter_url && (
                <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-surface hover:bg-surface-alt border border-border rounded-xl text-text-2 hover:text-text-1 transition shadow-xs" title="Twitter / X">
                  <TwitterIcon className="h-4.5 w-4.5" />
                </a>
              )}
              {profile?.instagram_url && (
                <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-surface hover:bg-surface-alt border border-border rounded-xl text-text-2 hover:text-text-1 transition shadow-xs" title="Instagram">
                  <InstagramIcon className="h-4.5 w-4.5" />
                </a>
              )}
              {profile?.facebook_url && (
                <a href={profile.facebook_url} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-surface hover:bg-surface-alt border border-border rounded-xl text-text-2 hover:text-text-1 transition shadow-xs" title="Facebook">
                  <FacebookIcon className="h-4.5 w-4.5" />
                </a>
              )}
              {!profile?.linkedin_url && !profile?.twitter_url && !profile?.instagram_url && !profile?.facebook_url && (
                <span className="text-text-3 text-[11px] font-medium italic">No social profiles linked</span>
              )}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Streak */}
          <div className="bg-surface/70 backdrop-blur-md rounded-2xl border border-border p-5 shadow-xs flex items-center space-x-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-3 uppercase tracking-wider">Record Streak</p>
              <p className="text-xl font-bold text-text-1 mt-0.5">{stats.recordStreak} Days</p>
              <p className="text-[10px] text-text-2">Consistent learning habit</p>
            </div>
          </div>

          {/* Lessons Completed */}
          <div className="bg-surface/70 backdrop-blur-md rounded-2xl border border-border p-5 shadow-xs flex items-center space-x-4">
            <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-xl">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-3 uppercase tracking-wider">Lessons Finished</p>
              <p className="text-xl font-bold text-text-1 mt-0.5">{stats.totalLessonsCompleted} Lessons</p>
              <p className="text-[10px] text-text-2">Milestones completed</p>
            </div>
          </div>

          {/* Avg Score */}
          <div className="bg-surface/70 backdrop-blur-md rounded-2xl border border-border p-5 shadow-xs flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <BarChart2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-3 uppercase tracking-wider">Avg Assessment Score</p>
              <p className="text-xl font-bold text-text-1 mt-0.5">{stats.avgQuizScore}%</p>
              <p className="text-[10px] text-text-2">Across all modules</p>
            </div>
          </div>
        </section>

        {/* Completed Roadmaps */}
        <section className="space-y-5">
          <div className="flex items-center space-x-2 border-b border-border/80 pb-3">
            <GraduationCap className="h-5 w-5 text-primary" strokeWidth={1.5} />
            <h2 className="font-heading text-lg font-bold text-text-1">Completed Subjects</h2>
          </div>

          {completedRoadmaps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedRoadmaps.map((rm) => (
                <div 
                  key={rm.id} 
                  className="bg-surface/70 backdrop-blur-sm border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-sm text-text-1 leading-snug pr-4">{rm.title}</h3>
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-[9px] font-bold text-amber-400 shrink-0">
                        <Award className="h-3 w-3" />
                        <span>Certified</span>
                      </span>
                    </div>
                    <p className="text-xs text-text-2 line-clamp-2 leading-relaxed">
                      {rm.description || 'Custom learning curriculum completed successfully on Cognara.'}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between text-[10px] text-text-3 font-semibold uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-text-3" />
                      <span>{new Date(rm.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span>{rm.lessonsCount} lessons</span>
                      <span className="font-semibold text-text-1">{rm.avgScore}% avg score</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-surface/40 border border-dashed border-border/60 p-10 text-center max-w-md mx-auto">
              <span className="text-2xl">📚</span>
              <h3 className="font-bold text-xs text-text-1 mt-2">Active roadmaps underway</h3>
              <p className="text-[11px] text-text-2 mt-1">This user is currently mastering their subjects. Completed roadmaps will appear here once finalized.</p>
            </div>
          )}
        </section>

        {/* Badges Grid */}
        <section className="space-y-5">
          <div className="flex items-center space-x-2 border-b border-border/80 pb-3">
            <Award className="h-5 w-5 text-primary" strokeWidth={1.5} />
            <h2 className="font-heading text-lg font-bold text-text-1">Earned Badges</h2>
          </div>

          {badges.length > 0 ? (
            <div className="flex flex-wrap gap-4 p-5 rounded-2xl bg-surface/50 border border-border justify-center sm:justify-start">
              {badges.map((item) => {
                const meta = ALL_BADGE_META[item.badge_key]
                const emoji = meta?.emoji || item.badge_emoji || '🏅'
                const label = meta?.label || item.badge_label || 'Badge'
                const description = meta?.description || ''

                return (
                  <div 
                    key={item.id} 
                    className="flex flex-col items-center gap-1.5 w-20 group cursor-help text-center"
                    title={`${label}: ${description}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center shadow-[0_0_12px_rgba(91,142,255,0.15)] group-hover:scale-105 transition duration-200">
                      <span className="text-2xl">{emoji}</span>
                    </div>
                    <span className="text-[9px] font-bold text-text-2 group-hover:text-text-1 transition truncate w-full px-0.5">
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-surface/40 border border-dashed border-border/60 p-8 text-center max-w-md mx-auto">
              <p className="text-[11px] text-text-3 italic">No credentials or badges unlocked yet.</p>
            </div>
          )}
        </section>

        {/* Viral Marketing CTA Card */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-[#1E1B18] via-[#151311] to-[#1E1B18] border border-border p-8 text-center space-y-6 shadow-xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[350px] h-[350px] rounded-full bg-primary/10 blur-[90px] pointer-events-none" />

          <div className="max-w-md mx-auto space-y-3 relative z-10">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-wider mb-2">
              <Sparkles className="h-3 w-3 text-primary animate-pulse" />
              <span>Create Your Own Path</span>
            </div>
            <h2 className="font-heading text-2xl font-extrabold text-text-1">Master Any Subject with Cognara</h2>
            <p className="text-xs text-text-2 leading-relaxed">
              Cognara uses Claude to generate custom, structured roadmaps, bite-sized lessons, and interactive assessments tailored exactly to your learning style.
            </p>
          </div>

          <div className="relative z-10">
            <Link href="/signup">
              <Button className="h-11 px-8 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(91,142,255,0.25)] text-xs inline-flex items-center gap-2">
                <span>Start Learning on Cognara</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border/40 bg-surface/30 py-6 text-center text-[10px] text-text-3 font-semibold uppercase tracking-wider select-none">
        &copy; {new Date().getFullYear()} Cognara. Powered by AI.
      </footer>
    </div>
  )
}
