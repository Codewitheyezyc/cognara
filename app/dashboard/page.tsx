import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Flame, Award, BookOpen, CheckCircle, Zap, BrainCircuit, ArrowRight, Map, Lock } from 'lucide-react'
import AICoachInsight from '@/components/dashboard/AICoachInsight'
import { MascotWelcomeManager } from '@/components/mascot/MascotWelcomeManager'
import { getUserSubscription } from '@/lib/subscription'
import StreakVitals from '@/components/dashboard/StreakVitals'
import { getLevelInfo } from '@/lib/leveling'
import QuestsWidget from '@/components/dashboard/QuestsWidget'
import SparkDialogue from '@/components/dashboard/SparkDialogue'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { isPro } = await getUserSubscription()

  // 1. Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }



  // 2. Fetch Profile details
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, has_seen_welcome, xp, level')
    .eq('id', user.id)
    .maybeSingle()

  const name = profile?.name || 'Learner'
  const hasSeenWelcome = profile?.has_seen_welcome ?? false
  const levelInfo = getLevelInfo(profile?.xp || 0)

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
  const { data: rawLessons } = await supabase
    .from('lessons')
    .select('*')
    .eq('roadmap_id', roadmap.id)

  // Sort lessons sequentially: by phase_number first, then by order_index
  const lessonsByPhase: Record<string, any[]> = {}
  rawLessons?.forEach((l: any) => {
    if (!lessonsByPhase[l.phase_id]) {
      lessonsByPhase[l.phase_id] = []
    }
    lessonsByPhase[l.phase_id].push(l)
  })

  const sortedPhases = [...(phases || [])].sort((a, b) => a.phase_number - b.phase_number)
  const lessons: any[] = []
  sortedPhases.forEach((phase) => {
    const phaseLessons = lessonsByPhase[phase.id] || []
    phaseLessons.sort((a, b) => a.order_index - b.order_index)
    lessons.push(...phaseLessons)
  })

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
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const streakData = streakRow || {
    current_streak: 0,
    longest_streak: 0,
    last_activity_at: null,
    shields_available: 0,
    shields_used_this_month: 0,
  }

  // Quick Greeting time builder
  const hours = new Date().getHours()
  const greeting = hours < 12 ? 'Good morning' : hours < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-8 animate-page-enter">
      {/* Mascot Welcome & Streak Milestone Manager */}
      <MascotWelcomeManager
        userName={name}
        hasSeenWelcome={hasSeenWelcome}
        currentStreak={streakData.current_streak}
      />

      {/* Live Mascot Spark Dialogue Bubble banner */}
      <SparkDialogue
        userName={name}
        streak={streakData.current_streak}
        level={levelInfo.level}
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
        <div className="lg:col-span-2 space-y-6">
          {/* Active Lesson Card (with Learning Pulse) */}
          <div className="relative group overflow-hidden rounded-[10px] border border-border bg-surface p-6 shadow-md flex flex-col justify-between min-h-[200px]">
            {/* Signature Learning Pulse background gradient element */}
            <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-gradient-to-br from-primary/10 to-accent/15 blur-[60px] opacity-75 pointer-events-none group-hover:scale-110 transition-transform duration-500 animate-learning-pulse" />

            <div className="relative space-y-3">
              <div className="flex items-center space-x-2 text-primary">
                <Zap className="h-4 w-4" strokeWidth={1.5} />
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Active Milestone</span>
              </div>
              {activeLesson && (
                <>
                  <h3 className="font-heading text-2xl font-bold text-text-1 tracking-tight">
                    {activeLesson.title}
                  </h3>
                  <p className="text-text-2 text-xs leading-relaxed max-w-md">
                    Resume your custom path. We generated detailed explanations, code instances, exercises, and quizzes for this concept.
                  </p>
                </>
              )}
            </div>

            <div className="relative mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
              <span className="text-xs text-text-2 font-medium">
                Goal: {goal.subject} ({goal.level})
              </span>
              {activeLesson && (
                <Link href={`/dashboard/lesson/${activeLesson.id}`}>
                  <Button className="bg-primary hover:bg-primary/90 text-white text-xs px-4 h-9 shadow-[0_0_12px_rgba(91,142,255,0.2)] rounded-sm">
                    <span>Continue Lesson</span>
                    <ArrowRight className="ml-1 h-3.5 w-3.5" strokeWidth={2} />
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Time-Attack Speed Run Banner */}
          <div className="relative group overflow-hidden rounded-[10px] border border-border bg-gradient-to-r from-violet-600/10 via-primary/5 to-transparent p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Glowing blur */}
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-violet-500/15 rounded-full blur-[50px] pointer-events-none group-hover:scale-110 transition-transform duration-500" />
            
            <div className="space-y-2 relative min-w-0">
              <div className="flex items-center space-x-2 text-violet-500">
                <Zap className="h-4 w-4 fill-current animate-pulse text-violet-500" strokeWidth={1.5} />
                <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold">Time-Attack Mode</span>
              </div>
              <h3 className="font-heading text-xl font-bold text-text-1 tracking-tight">
                Lightning Round Review
              </h3>
              <p className="text-text-2 text-xs leading-relaxed max-w-md">
                Got 60 seconds? Challenge your brain with a fast-paced active recall test. Build streaks to earn up to 4x XP!
              </p>
            </div>

            <div className="relative shrink-0">
              <Link href="/dashboard/speedrun">
                <Button className="bg-violet-600 hover:bg-violet-700 text-white text-xs px-5 h-10 shadow-[0_0_12px_rgba(139,92,246,0.25)] rounded-sm font-semibold flex items-center gap-1.5 transition-all hover:scale-[1.03] active:scale-[0.97]">
                  <span>Play Speed Run</span>
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar Column: Learning Vitals + Daily & Weekly Quests */}
        <div className="space-y-6 flex flex-col lg:col-span-1">
          {/* Quick Stats Card */}
          <div className="rounded-[10px] border border-border bg-surface p-6 shadow-md space-y-6">
            <h4 className="text-xs font-mono uppercase tracking-wider text-text-2">Learning Vitals</h4>
            
            <div className="flex flex-col gap-3">
              {/* Row 1: Streak & Quiz side-by-side */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center p-3 bg-surface-alt/45 border border-border/80 rounded-xl">
                  <StreakVitals initialStreak={streakData} isPro={isPro} />
                </div>

                <div className="flex items-center space-x-3 p-3 bg-surface-alt/45 border border-border/80 rounded-xl">
                  <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center border border-primary/15 shrink-0">
                    <Award className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-lg font-bold text-text-1 font-mono leading-none mb-1">{avgScore}%</span>
                    <span className="text-[10px] text-text-3 truncate">Quiz Average</span>
                  </div>
                </div>
              </div>

              {/* Row 2: Level & XP card (Full Width) */}
              <div className="flex items-center space-x-3 p-3 bg-accent/5 rounded-xl border border-accent/10">
                <div className="w-10 h-10 rounded-md bg-accent/10 text-accent flex items-center justify-center border border-accent/15 shrink-0">
                  <BrainCircuit className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-text-1 font-sans leading-none">Lvl {levelInfo.level}</span>
                      <span className="text-[10px] text-text-3 mt-1.5 leading-none">Current Level</span>
                    </div>
                    <span className="text-[10.5px] text-accent font-semibold font-mono leading-none">{levelInfo.xpWithinLevel} / {levelInfo.xpNeededForLevelUp} XP</span>
                  </div>
                  {/* XP Progress Bar */}
                  <div className="w-full h-1.5 bg-border rounded-full overflow-hidden mt-1.5">
                    <div 
                      className="h-full bg-accent transition-all duration-300"
                      style={{ width: `${levelInfo.progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Completed Path card (Full Width) */}
              <div className="flex items-center space-x-3 p-3 bg-success/5 rounded-xl border border-success/10">
                <div className="w-10 h-10 rounded-md bg-success/10 text-success flex items-center justify-center border border-success/15 shrink-0">
                  <BookOpen className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-text-1 font-sans leading-none">{completedLessonsCount} / {totalLessonsCount}</span>
                      <span className="text-[10px] text-text-3 mt-1.5 leading-none">Lessons Completed</span>
                    </div>
                    <span className="text-[10.5px] text-success font-semibold font-mono leading-none">{Math.round(progressRatio)}%</span>
                  </div>
                  {/* Visual Progress Bar */}
                  <div className="w-full h-1.5 bg-border rounded-full overflow-hidden mt-1.5">
                    <div 
                      className="h-full bg-success transition-all duration-300"
                      style={{ width: `${progressRatio}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Daily & Weekly Cognitive Quests Card */}
          <QuestsWidget />
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
      <AICoachInsight isPro={isPro} />
    </div>
  )
}
