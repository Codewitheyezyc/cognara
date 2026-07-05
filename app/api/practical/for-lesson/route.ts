import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDomainFromSubject } from '@/lib/ai/lessonCache'
import { generatePracticalExercise } from '@/lib/ai/practical'

/**
 * Fallback endpoint — fetches the practical exercise for a given lesson.
 * Used by the quiz page when sessionStorage doesn't have the practical
 * (e.g. quiz opened in a new tab, or page was refreshed).
 *
 * Resolution order:
 *  1. Check cognara_lesson_cache for a row matching domain + subject + topic
 *  2. If none found — generate it fresh (Claude Haiku) and write it to cache
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { lessonId } = await request.json()
    if (!lessonId) {
      return NextResponse.json({ error: 'Missing lessonId' }, { status: 400 })
    }

    // Fetch lesson to get title and roadmap context
    const { data: lesson } = await supabase
      .from('lessons')
      .select('title, roadmap_id, phase_id')
      .eq('id', lessonId)
      .maybeSingle()

    if (!lesson) {
      return NextResponse.json({ practicalExercise: null })
    }

    // Get subject from learning goal
    const { data: roadmap } = await supabase
      .from('roadmaps')
      .select('goal_id')
      .eq('id', lesson.roadmap_id)
      .maybeSingle()

    if (!roadmap?.goal_id) {
      return NextResponse.json({ practicalExercise: null })
    }

    const { data: goal } = await supabase
      .from('learning_goals')
      .select('subject, depth_level')
      .eq('id', roadmap.goal_id)
      .maybeSingle()

    if (!goal?.subject) {
      return NextResponse.json({ practicalExercise: null })
    }

    const domain = getDomainFromSubject(goal.subject)

    // Look up cognara_lesson_cache — match by subject + topic (title)
    const { data: cacheRow } = await supabase
      .from('cognara_lesson_cache')
      .select('id, practical_exercise')
      .eq('subject', goal.subject)
      .eq('topic', lesson.title)
      .maybeSingle()

    // If found with a practical — return it directly
    if (cacheRow?.practical_exercise) {
      return NextResponse.json({ practicalExercise: cacheRow.practical_exercise })
    }

    // No practical found — generate it fresh with Claude Haiku and patch the cache
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('occupation')
        .eq('id', user.id)
        .maybeSingle()

      const practicalExercise = await generatePracticalExercise({
        topic: lesson.title,
        domain,
        subject: goal.subject,
        userLevel: goal.depth_level ?? 2,
        userBackground: profile?.occupation || 'Learner',
        keyTakeaways: [],
      })

      if (practicalExercise && cacheRow?.id) {
        // Patch the existing cache row with the freshly generated practical
        await supabase
          .from('cognara_lesson_cache')
          .update({
            practical_exercise: practicalExercise,
            practical_starter_code: practicalExercise.starter_code || null,
            practical_expected_output: practicalExercise.expected_output || null,
            practical_language: practicalExercise.language || null,
            practical_complexity: practicalExercise.complexity || null
          })
          .eq('id', cacheRow.id)
        console.log(`[practical/for-lesson] Generated and cached practical for "${lesson.title}"`)
      }

      return NextResponse.json({ practicalExercise })
    } catch (genErr) {
      console.error('[practical/for-lesson] Failed to generate practical (non-critical):', genErr)
      return NextResponse.json({ practicalExercise: null })
    }
  } catch (err: any) {
    console.error('[practical/for-lesson] Error:', err)
    return NextResponse.json({ practicalExercise: null })
  }
}
