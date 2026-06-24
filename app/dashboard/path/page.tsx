import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserSubscription, isLessonAccessible } from '@/lib/subscription'
import { checkPhaseCertificateEligibility } from '@/lib/certificates/checkEligibility'
import { PathClientWrapper } from '@/components/dashboard/PathClientWrapper'

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

  // Fetch subscription status
  const { isPro } = await getUserSubscription()

  // 2. Fetch the user's active learning goal & roadmap
  const { data: goal } = await supabase
    .from('learning_goals')
    .select('id, subject, level')
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
    .select('id, phase_id, title, slug, order_index, description')
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
    [key: string]: Array<{ id: string; phase_id: string; title: string; slug: string | null; order_index: number; description: string | null }>
  } = {}
  lessons?.forEach((lesson) => {
    if (!lessonsByPhase[lesson.phase_id]) {
      lessonsByPhase[lesson.phase_id] = []
    }
    lessonsByPhase[lesson.phase_id].push(lesson)
  })

  // 6. Fetch certificate eligibility for each phase
  const eligibilities = await Promise.all(
    (phases || []).map((phase) =>
      checkPhaseCertificateEligibility(user.id, phase.id)
    )
  )

  // Map raw data into structural format for client wrapper
  const mappedPhases = (phases || []).map((phase, index) => {
    const phaseLessons = lessonsByPhase[phase.id] || []
    const eligibility = eligibilities[index]

    const mappedLessons = phaseLessons.map((lesson) => {
      const status = progressMap.get(lesson.id) || 'not_started'
      return {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description || `Lesson ${lesson.order_index} • Ready to learn`,
        order_index: lesson.order_index,
        isAccessible: isLessonAccessible(phase.phase_number, lesson.order_index, isPro),
        status: status as 'not_started' | 'in_progress' | 'completed'
      }
    })

    return {
      id: phase.id,
      phase_number: phase.phase_number,
      title: phase.title,
      description: phase.description || '',
      lessons: mappedLessons,
      eligibility: eligibility
    }
  })

  return (
    <PathClientWrapper
      roadmap={{
        id: roadmap.id,
        title: roadmap.title,
        description: roadmap.description
      }}
      phases={mappedPhases}
      isPro={isPro}
    />
  )
}
