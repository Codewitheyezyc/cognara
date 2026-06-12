import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Map as MapIcon } from 'lucide-react'
import { RoadmapPhaseCard } from '@/components/dashboard/RoadmapPhaseCard'
import { getUserSubscription, isLessonAccessible } from '@/lib/subscription'

export const dynamic = 'force-dynamic'

export default async function PathPage() {
  const supabase = await createClient()

  // 1. Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1.5. Fetch subscription tier
  const { isPro } = await getUserSubscription()

  // 2. Fetch the user's active learning goal & roadmap
  const { data: goal } = await supabase
    .from('learning_goals')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!goal) {
    redirect('/onboarding')
  }

  const { data: roadmap } = await supabase
    .from('roadmaps')
    .select('*')
    .eq('goal_id', goal.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!roadmap) {
    redirect('/onboarding')
  }

  // 3. Fetch phases for the active roadmap
  const { data: phases } = await supabase
    .from('roadmap_phases')
    .select('*')
    .eq('roadmap_id', roadmap.id)
    .order('phase_number', { ascending: true })

  // 4. Fetch lessons for this roadmap
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, phase_id, title, slug, order_index')
    .eq('roadmap_id', roadmap.id)
    .order('order_index', { ascending: true })

  // 5. Fetch lesson progress entries to show status
  const { data: progressList } = await supabase
    .from('lesson_progress')
    .select('lesson_id, status')
    .eq('user_id', user.id)

  const progressMap = new Map<string, string>()
  progressList?.forEach((p) => {
    progressMap.set(p.lesson_id, p.status)
  })

  // Group lessons by phase_id
  const lessonsByPhase: {
    [key: string]: Array<{ id: string; phase_id: string; title: string; slug: string | null; order_index: number }>
  } = {}
  lessons?.forEach((lesson) => {
    if (!lessonsByPhase[lesson.phase_id]) {
      lessonsByPhase[lesson.phase_id] = []
    }
    lessonsByPhase[lesson.phase_id].push(lesson)
  })

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-12 animate-page-enter">
      {/* Roadmap Header */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-primary">
          <MapIcon className="h-5 w-5" strokeWidth={1.5} />
          <span className="text-xs font-mono uppercase tracking-wider font-semibold">Your Learning Path</span>
        </div>
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-1">{roadmap.title}</h1>
        <p className="text-text-2 text-sm md:text-base leading-relaxed">{roadmap.description}</p>
      </div>

      {/* Visual Timeline Path */}
      <div className="relative border-l border-border pl-6 ml-4 space-y-12">
        {phases?.map((phase, pIdx) => {
          const phaseLessons = lessonsByPhase[phase.id] || []
          
          const mappedLessons = phaseLessons.map(lesson => {
            const status = progressMap.get(lesson.id) || 'not_started'
            const isAccessible = isLessonAccessible(phase.phase_number, lesson.order_index, isPro)
            return {
              id: lesson.id,
              title: lesson.title,
              description: `Lesson ${lesson.order_index} • Ready to learn`,
              order_index: lesson.order_index,
              isAccessible,
              status: status as 'not_started' | 'in_progress' | 'completed'
            }
          })

          const isFullyLocked = !isPro && phase.phase_number >= 3

          return (
            <div key={phase.id} className="relative">
              {/* Timeline dot identifier */}
              <div className="absolute -left-[31px] top-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-surface border border-primary shadow-[0_0_8px_rgba(91,142,255,0.4)]">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              </div>

              <RoadmapPhaseCard
                phaseNumber={phase.phase_number}
                title={phase.title}
                description={phase.description || ''}
                lessons={mappedLessons}
                isFullyLocked={isFullyLocked}
                isPro={isPro}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
