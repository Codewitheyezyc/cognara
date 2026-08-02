import { SupabaseClient } from '@supabase/supabase-js'

export interface ProgressUpdate {
  phaseName: string
  completedInPhase: number
  totalInPhase: number
  phasePercent: number
  overallPercent: number
  lessonsRemaining: number
}

/**
 * Calculates phase and overall roadmap progress for a user after completing a lesson.
 */
export async function getProgressUpdate(
  supabase: SupabaseClient,
  userId: string,
  lessonId: string
): Promise<ProgressUpdate | null> {
  try {
    // 1. Get the current lesson to find phase_id & roadmap_id
    const { data: targetLesson, error: lessonError } = await supabase
      .from('lessons')
      .select('phase_id, roadmap_id')
      .eq('id', lessonId)
      .maybeSingle()

    if (lessonError || !targetLesson) {
      console.error('[ProgressUpdate] Failed to fetch target lesson:', lessonError)
      return null
    }

    const { phase_id: phaseId, roadmap_id: roadmapId } = targetLesson

    // 2. Fetch current phase title and info
    const { data: phaseData, error: phaseError } = await supabase
      .from('roadmap_phases')
      .select('id, title, phase_number')
      .eq('id', phaseId)
      .maybeSingle()

    if (phaseError || !phaseData) {
      console.error('[ProgressUpdate] Failed to fetch phase details:', phaseError)
      return null
    }

    // 3. Fetch all lessons in this phase
    const { data: phaseLessons } = await supabase
      .from('lessons')
      .select('id')
      .eq('phase_id', phaseId)

    const phaseLessonIds = (phaseLessons || []).map(l => l.id)
    const totalInPhase = phaseLessonIds.length

    // 4. Fetch all lessons across the whole roadmap
    const { data: allRoadmapLessons } = await supabase
      .from('lessons')
      .select('id')
      .eq('roadmap_id', roadmapId)

    const roadmapLessonIds = (allRoadmapLessons || []).map(l => l.id)
    const totalOverall = roadmapLessonIds.length

    // 5. Fetch completed lessons for user
    const { data: completedProgress } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .eq('status', 'completed')

    const completedLessonSet = new Set((completedProgress || []).map(p => p.lesson_id))

    const completedInPhase = phaseLessonIds.filter(id => completedLessonSet.has(id)).length
    const completedOverall = roadmapLessonIds.filter(id => completedLessonSet.has(id)).length

    const phasePercent = totalInPhase > 0 ? Math.round((completedInPhase / totalInPhase) * 100) : 0
    const overallPercent = totalOverall > 0 ? Math.round((completedOverall / totalOverall) * 100) : 0
    const lessonsRemaining = Math.max(0, totalInPhase - completedInPhase)

    const phaseName = phaseData.title
      ? `Phase ${phaseData.phase_number}: ${phaseData.title}`
      : `Phase ${phaseData.phase_number}`

    return {
      phaseName,
      completedInPhase,
      totalInPhase,
      phasePercent,
      overallPercent,
      lessonsRemaining
    }
  } catch (err) {
    console.error('[ProgressUpdate] Unexpected error in progress calculation:', err)
    return null
  }
}
