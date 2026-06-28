import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateRoadmap } from '@/lib/ai/roadmap'
import { callClaudeJSON } from '@/lib/ai/client'

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .trim()
}

interface StandardizeResult {
  standardizedSubject: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { oldRoadmapId, oldGoalId } = body

    if (!oldRoadmapId || !oldGoalId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // 2. Fetch old goal and profile details
    const { data: oldGoal } = await supabase
      .from('learning_goals')
      .select('*')
      .eq('id', oldGoalId)
      .eq('user_id', user.id)
      .maybeSingle()

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (!oldGoal || !profile) {
      return NextResponse.json({ error: 'Goal or profile not found' }, { status: 404 })
    }

    // 3. Fetch completed lessons from the old roadmap
    const { data: oldProgress } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', user.id)

    const completedProgressMap = new Map<string, any>()
    oldProgress?.forEach(p => {
      completedProgressMap.set(p.lesson_id, p)
    })

    const { data: oldLessons } = await supabase
      .from('lessons')
      .select('*')
      .eq('roadmap_id', oldRoadmapId)
      .eq('user_id', user.id)

    const completedLessonTitles = new Map<string, any>()
    oldLessons?.forEach(l => {
      const prog = completedProgressMap.get(l.id)
      if (prog) {
        completedLessonTitles.set(l.title.toLowerCase().trim(), prog)
      }
    })

    // 4. Generate new improved roadmap
    const goalText = oldGoal.goal_text
    const level = oldGoal.level
    const background = profile.occupation || 'Self-taught learner'
    const dailyMinutes = Number(oldGoal.daily_minutes || 30)

    // Standardize subject name
    let standardizedSubject = goalText
    try {
      const mappingResult = await callClaudeJSON<StandardizeResult>(
        "You are an expert curriculum intent classifier. Map the user's input learning goal into a clean, standard, concise 2-4 word subject title representing the primary educational category (e.g. 'React Frontend Development', 'WAEC Mathematics', 'Beginning Acoustic Guitar', 'Baking Basics'). Return JSON ONLY: { \"standardizedSubject\": \"title\" }",
        `Goal: "${goalText}"`,
        async () => ({ standardizedSubject: goalText }),
        'claude-haiku-4-5-20251001'
      )
      if (mappingResult.standardizedSubject) {
        standardizedSubject = mappingResult.standardizedSubject
      }
    } catch (err) {
      console.warn('[Upgrade Intent Mapping] Failed to standardize subject:', err)
    }

    const resolvedDepth = oldGoal.depth_level || 2

    const generatedRoadmap = await generateRoadmap(
      goalText,
      standardizedSubject,
      level,
      dailyMinutes,
      resolvedDepth,
      background
    )

    // Save main_roadmap JSON to profile
    await supabase
      .from('profiles')
      .update({
        main_roadmap: generatedRoadmap,
        roadmap_upgraded: true,
        roadmap_upgrade_dismissed: true,
        upgrade_declined: false
      })
      .eq('id', user.id)

    // 5. Deactivate old learning goal
    await supabase
      .from('learning_goals')
      .update({ is_active: false })
      .eq('id', oldGoalId)

    // Insert new learning goal
    const { data: newGoal, error: newGoalError } = await supabase
      .from('learning_goals')
      .insert({
        user_id: user.id,
        goal_text: goalText,
        subject: standardizedSubject,
        level,
        daily_minutes: dailyMinutes,
        depth_level: resolvedDepth,
        is_active: true,
      })
      .select('id')
      .single()

    if (newGoalError || !newGoal) {
      console.error('Error inserting new goal:', newGoalError)
      return NextResponse.json({ error: 'Failed to create new goal' }, { status: 500 })
    }

    // Insert new roadmap
    const { data: newRoadmap, error: newRoadmapError } = await supabase
      .from('roadmaps')
      .insert({
        goal_id: newGoal.id,
        user_id: user.id,
        title: standardizedSubject,
        description: `Your improved custom roadmap to ${goalText}`,
        ai_generated: true,
      })
      .select('id')
      .single()

    if (newRoadmapError || !newRoadmap) {
      console.error('Error inserting new roadmap:', newRoadmapError)
      return NextResponse.json({ error: 'Failed to create new roadmap' }, { status: 500 })
    }

    // Insert phases and lessons (and map completed progress)
    for (const phase of generatedRoadmap.phases) {
      const { data: phaseData, error: phaseError } = await supabase
        .from('roadmap_phases')
        .insert({
          roadmap_id: newRoadmap.id,
          phase_number: phase.phase_number,
          title: phase.phase_name,
          description: `Phase ${phase.phase_number} of your learning path.`,
          duration_days: phase.estimated_weeks * 7,
          order_index: phase.phase_number,
        })
        .select('id')
        .single()

      if (phaseError || !phaseData) {
        console.error('Error inserting new phase:', phaseError)
        return NextResponse.json({ error: 'Failed to create roadmap phases' }, { status: 500 })
      }

      const lessonInserts = []
      let orderIndex = 1

      for (const mod of phase.modules) {
        for (const topic of mod.topics) {
          lessonInserts.push({
            phase_id: phaseData.id,
            roadmap_id: newRoadmap.id,
            user_id: user.id,
            title: topic,
            slug: slugify(topic),
            order_index: orderIndex++,
            content: null,
            ai_generated: true,
          })
        }
      }

      if (lessonInserts.length > 0) {
        const { data: insertedLessons, error: lessonsError } = await supabase
          .from('lessons')
          .insert(lessonInserts)
          .select('id, title')

        if (lessonsError || !insertedLessons) {
          console.error('Error inserting new lessons:', lessonsError)
          return NextResponse.json({ error: 'Failed to create lesson stubs' }, { status: 500 })
        }

        // Map completed progress
        const progressInserts = []
        for (const lesson of insertedLessons) {
          const matchingOldProg = completedLessonTitles.get(lesson.title.toLowerCase().trim())
          if (matchingOldProg) {
            progressInserts.push({
              user_id: user.id,
              lesson_id: lesson.id,
              status: matchingOldProg.status,
              started_at: matchingOldProg.started_at,
              completed_at: matchingOldProg.completed_at,
              time_spent_secs: matchingOldProg.time_spent_secs
            })
          }
        }

        if (progressInserts.length > 0) {
          const { error: progInsertError } = await supabase
            .from('lesson_progress')
            .insert(progressInserts)

          if (progInsertError) {
            console.error('Error inserting progress mappings:', progInsertError)
          }
        }
      }
    }

    return NextResponse.json({ success: true, roadmapId: newRoadmap.id })
  } catch (err: any) {
    console.error('[API Roadmap Upgrade Error]', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
