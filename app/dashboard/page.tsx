import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Flame, Award, BookOpen, CheckCircle, Zap, BrainCircuit, ArrowRight, Map, Lock } from 'lucide-react'
import AICoachInsight from '@/components/dashboard/AICoachInsight'
import { getUserSubscription } from '@/lib/subscription'
import { MascotWelcomeManager } from '@/components/mascot/MascotWelcomeManager'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1.5. Fetch subscription status
  const { isPro } = await getUserSubscription()

  // 2. Fetch Profile Name & welcome seen state
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, has_seen_welcome')
    .eq('id', user.id)
    .maybeSingle()

  const name = profile?.name || 'Learner'
  const hasSeenWelcome = profile?.has_seen_welcome ?? false

  // 3. Fetch Active Goal
  const { data: goal } = await supabase
    .from('learning_goals')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!goal) {
    redirect('/onboarding')
  }

  // 4. Fetch Active Roadmap
  const { data: roadmap } = await supabase
    .from('roadmaps')
    .select('*')
    .eq('goal_id', goal.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!roadmap) {
    redirect('/onboarding')
  }

  // 5. Fetch Phases
  const { data: phases } = await supabase
    .from('roadmap_phases')
    .select('*')
    .eq('roadmap_id', roadmap.id)
    .order('phase_number', { ascending: true })

  // 6. Fetch Lessons
  const { data: lessons } = await supabase
    .from('lessons')
    .select('*')
    .eq('roadmap_id', roadmap.id)
    .order('order_index', { ascending: true })

  // 7. Fetch Lesson Progress
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', user.id)

  const completedIds = new Set(
    progress?.filter((p) => p.status === 'completed').map((p) => p.lesson_id) || []
  )

  // 8. Find Active Lesson to display (first uncompleted lesson)
  const activeLesson = lessons?.find((l) => !completedIds.has(l.id)) || lessons?.[0]

  // 9. Calculate completion metrics
  const totalLessonsCount = lessons?.length || 0
  const completedLessonsCount = completedIds.size
  const progressRatio = totalLessonsCount > 0 ? (completedLessonsCount / totalLessonsCount) * 100 : 0

  // 10. Fetch Average Quiz Score
  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('score')
    .eq('user_id', user.id)

  const avgScore =
    attempts && attempts.length > 0
      ? Math.round(attempts.reduce((acc, curr) => acc + curr.score, 0) / attempts.length)
      : 0

  // 11. Fetch Streak
  const { data: streakRow } = await supabase
    .from('streaks')
    .select('current_streak')
    .eq('user_id', user.id)
    .maybeSingle()

  const currentStreak = streakRow?.current_streak || 0

  // Quick Greeting time builder
  const hours = new Date().getHours()
  const greeting = hours < 12 ? 'Good morning' : hours < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-8 animate-page-enter">
      {/* Mascot Welcome & Streak Milestone Manager */}
      <MascotWelcomeManager
        userName={name}
        hasSeenWelcome={hasSeenWelcome}
        currentStreak={currentStreak}
      />

      {/* 1. Welcoming Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-text-1">
          {greeting}, {name}
        </h1>
        <p className="text-text-2 text-sm mt-1">Here is your customized focus summary for today.</p>
      </div>

      {/* 2. Top row: Active Lesson + Stats card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Lesson Card (with Learning Pulse) */}
        <div className="lg:col-span-2 relative group overflow-hidden rounded-[10px] border border-border bg-surface p-6 shadow-md flex flex-col justify-between min-h-[200px]">
          {/* Signature Learning Pulse background gradient element */}
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-gradient-to-br from-primary/10 to-accent/15 blur-[60px] opacity-75 pointer-events-none group-hover:scale-110 transition-transform duration-500 animate-learning-pulse" />

          <div className="relative space-y-3">
            <div className="flex items-center space-x-2 text-primary">
              <Zap className="h-4 w-4" strokeWidth={1.5} />
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Active Milestone</span>
            </div>
            {activeLesson ? (
              <>
                <h3 className="font-heading text-2xl font-bold text-text-1 tracking-tight">
                  {activeLesson.title}
                </h3>
                <p className="text-text-2 text-xs leading-relaxed max-w-md">
                  Resume your custom path. We generated detailed explanations, code instances, exercises, and quizzes for this concept.
                </p>
              </>
            ) : (
              <>
                <h3 className="font-heading text-2xl font-bold text-text-1 tracking-tight">
                  Roadmap Completed!
                </h3>
                <p className="text-text-2 text-xs leading-relaxed max-w-md">
                  Congratulations! You have completed every lesson in your roadmap. Head to onboarding to create a new goal.
                </p>
              </>
            )}
          </div>

          <div className="relative mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
            <span className="text-xs text-text-2 font-medium">
              Goal: {goal.subject} ({goal.level})
            </span>
            {activeLesson ? (
              <Link href={`/dashboard/lesson/${activeLesson.id}`}>
                <Button className="bg-primary hover:bg-primary/90 text-white text-xs px-4 h-9 shadow-[0_0_12px_rgba(91,142,255,0.2)] rounded-sm">
                  <span>Continue Lesson</span>
                  <ArrowRight className="ml-1 h-3.5 w-3.5" strokeWidth={2} />
                </Button>
              </Link>
            ) : (
              <Link href="/onboarding">
                <Button className="bg-accent hover:bg-accent/90 text-white text-xs px-4 h-9 rounded-sm">
                  <span>New Goal</span>
                  <ArrowRight className="ml-1 h-3.5 w-3.5" strokeWidth={2} />
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Quick Stats Grid Column */}
        <div className="rounded-[10px] border border-border bg-surface p-6 shadow-md space-y-6 flex flex-col justify-between">
          <h4 className="text-xs font-mono uppercase tracking-wider text-text-2">Learning Vitals</h4>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Streak stat card */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-md bg-accent-warm/10 text-accent-warm flex items-center justify-center border border-accent-warm/15">
                <Flame className="h-5 w-5 fill-current" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-text-1 font-mono">{currentStreak}d</span>
                <span className="text-[10px] text-text-2">Active Streak</span>
              </div>
            </div>

            {/* Quiz avg stat card */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center border border-primary/15">
                <Award className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-text-1 font-mono">{avgScore}%</span>
                <span className="text-[10px] text-text-2">Quiz Average</span>
              </div>
            </div>

            {/* Completion ratio stat card */}
            <div className="flex items-center space-x-3 col-span-2 mt-2">
              <div className="w-10 h-10 rounded-md bg-success/10 text-success flex items-center justify-center border border-success/15">
                <BookOpen className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-bold text-text-1 font-mono">
                    {completedLessonsCount}/{totalLessonsCount}
                  </span>
                  <span className="text-[10px] text-text-2">Completed</span>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full h-1 bg-border rounded-full mt-1.5 overflow-hidden">
                  <div 
                    className="h-full bg-success transition-all duration-300"
                    style={{ width: `${progressRatio}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Horizontal Phase track card map */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg font-bold text-text-1">Curriculum Roadmap Track</h3>
          <Link href="/dashboard/path" className="text-xs text-primary hover:underline flex items-center space-x-1">
            <span>View Full Path</span>
            <ArrowRight className="h-3 w-3" strokeWidth={2} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {phases?.slice(0, 3).map((phase) => {
            const isPhaseActive = activeLesson?.phase_id === phase.id
            return (
              <div
                key={phase.id}
                className={`p-5 rounded-[10px] border bg-surface flex flex-col justify-between space-y-4 transition-all duration-150 ${
                  isPhaseActive 
                    ? 'border-primary shadow-[0_0_12px_rgba(91,142,255,0.05)] bg-surface-alt' 
                    : 'border-border'
                }`}
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-accent font-semibold">
                    Phase {phase.phase_number}
                  </span>
                  <h4 className="text-sm font-bold text-text-1 line-clamp-1">{phase.title}</h4>
                  <p className="text-text-2 text-xs line-clamp-2 leading-relaxed">
                    {phase.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] text-text-2 pt-2 border-t border-border/50">
                  <span className="font-mono">{phase.duration_days ? `${Math.round(phase.duration_days / 7)} weeks` : ''}</span>
                  {isPhaseActive && (
                    <span className="font-mono text-primary font-semibold flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1 animate-pulse" />
                      Active Phase
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 4. AI Coach Insight Banner */}
      {isPro ? (
        <AICoachInsight />
      ) : (
        <div style={{
          padding: '16px 20px',
          background: 'var(--color-surface)',
          border: '1px dashed var(--color-border)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Lock size={18} style={{ color: 'var(--color-text-3)', flexShrink: 0 }} />
          <div>
            <div style={{ color: 'var(--color-text-2)', fontSize: '14px' }}>
              AI insights available on Pro
            </div>
            <Link
              href="/upgrade"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                fontSize: '13px',
                cursor: 'pointer',
                padding: 0,
                marginTop: '4px',
                display: 'inline-block'
              }}
            >
              Upgrade to unlock →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
