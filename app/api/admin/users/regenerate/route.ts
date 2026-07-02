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
  let newGoalId: string | null = null
  let oldGoalId: string | null = null
  try {
    const supabase = await createClient()

    // 1. Verify admin
    const { data: { user: adminUser }, error: authError } = await supabase.auth.getUser()
    const isAdmin = adminUser && (adminUser.id === process.env.ADMIN_USER_ID || adminUser.id === '4c1fbae5-c423-42e7-8394-1112fe00d42e')
    if (authError || !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 })
    }

    // 2. Fetch user's active goal and profile details
    const { data: userGoal } = await supabase
      .from('learning_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle()

    if (!userGoal) {
      return NextResponse.json({ error: 'Active goal not found for this user.' }, { status: 404 })
    }
    oldGoalId = userGoal.id

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 })
    }

    // 3. Fetch active roadmap ID
    const { data: activeRoadmap } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('goal_id', userGoal.id)
      .eq('user_id', userId)
      .maybeSingle()

    if (!activeRoadmap) {
      return NextResponse.json({ error: 'Active roadmap not found for this goal.' }, { status: 404 })
    }

    // 4. Take snapshot of old progress before generating anything
    // Fetch all old roadmap phases
    const { data: oldPhases } = await supabase
      .from('roadmap_phases')
      .select('*')
      .eq('roadmap_id', activeRoadmap.id)

    // Fetch all old roadmap lessons
    const { data: oldLessons } = await supabase
      .from('lessons')
      .select('*')
      .eq('roadmap_id', activeRoadmap.id)

    const oldLessonIds = oldLessons?.map(l => l.id) || []
    const { data: oldProgress } = oldLessonIds.length > 0 ? await supabase
      .from('lesson_progress')
      .select('*')
      .in('lesson_id', oldLessonIds)
      : { data: [] }

    // Fetch quiz attempts for those lessons
    const { data: oldQuizzes } = oldLessonIds.length > 0 ? await supabase
      .from('quizzes')
      .select('id, lesson_id')
      .in('lesson_id', oldLessonIds)
      : { data: [] }

    const oldQuizIds = oldQuizzes?.map(q => q.id) || []
    const { data: oldAttempts } = oldQuizIds.length > 0 ? await supabase
      .from('quiz_attempts')
      .select('*')
      .in('quiz_id', oldQuizIds)
      : { data: [] }

    const progressMap = new Map<string, any>()
    oldProgress?.forEach(p => progressMap.set(p.lesson_id, p))

    const quizMap = new Map<string, any>()
    oldQuizzes?.forEach(q => {
      const attempts = oldAttempts?.filter(a => a.quiz_id === q.id) || []
      const maxScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : null
      quizMap.set(q.lesson_id, maxScore)
    })

    const oldLessonsByPhase = new Map<string, any[]>()
    oldLessons?.forEach(l => {
      if (!oldLessonsByPhase.has(l.phase_id)) {
        oldLessonsByPhase.set(l.phase_id, [])
      }
      oldLessonsByPhase.get(l.phase_id)!.push(l)
    })

    const completedLessonsSnapshot = []
    const phaseCompletionsSnapshot = []
    let highestPhaseCompleted = 0

    for (const phase of oldPhases || []) {
      const phaseLessons = oldLessonsByPhase.get(phase.id) || []
      let completedInPhase = 0
      
      for (const lesson of phaseLessons) {
        const prog = progressMap.get(lesson.id)
        if (prog && prog.status === 'completed') {
          completedInPhase++
          completedLessonsSnapshot.push({
            title: lesson.title,
            phase_number: phase.phase_number,
            started_at: prog.started_at,
            completed_at: prog.completed_at,
            time_spent_secs: prog.time_spent_secs,
            quiz_score: quizMap.get(lesson.id) || null
          })
        }
      }

      const isFullyCompleted = phaseLessons.length > 0 && completedInPhase === phaseLessons.length
      if (isFullyCompleted && phase.phase_number > highestPhaseCompleted) {
        highestPhaseCompleted = phase.phase_number
      }

      phaseCompletionsSnapshot.push({
        phase_number: phase.phase_number,
        phase_name: phase.title,
        total_lessons: phaseLessons.length,
        completed_lessons: completedInPhase,
        completed_at: new Date().toISOString()
      })
    }

    const snapshot = {
      completedLessons: completedLessonsSnapshot,
      completedPhases: phaseCompletionsSnapshot.filter(p => p.completed_lessons === p.total_lessons),
      phaseCompletions: phaseCompletionsSnapshot,
      highestPhaseCompleted
    }

    // Save snapshot in table
    const { error: snapshotError } = await supabase
      .from('cognara_upgrade_snapshots')
      .insert({
        user_id: userId,
        goal_id: userGoal.id,
        snapshot_data: snapshot
      })

    if (snapshotError) {
      console.error('Failed to create upgrade snapshot:', snapshotError)
      return NextResponse.json({ error: 'Failed to create safety snapshot before upgrade' }, { status: 500 })
    }

    // 5. Generate new improved roadmap with current prompt (dynamic phase count!)
    const goalText = userGoal.goal_text
    const level = userGoal.level
    const background = profile.occupation || 'Self-taught learner'
    const dailyMinutes = Number(userGoal.daily_minutes || 30)

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
      console.warn('[Admin Upgrade Intent Mapping] Failed to standardize subject:', err)
    }

    const resolvedDepth = userGoal.depth_level || 2

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
      .eq('id', userId)

    // Deactivate & archive old learning goal
    await supabase
      .from('learning_goals')
      .update({ is_active: false, status: 'archived' })
      .eq('id', userGoal.id)

    // Insert new learning goal
    const { data: newGoal, error: newGoalError } = await supabase
      .from('learning_goals')
      .insert({
        user_id: userId,
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
      throw new Error('Failed to create new goal')
    }
    newGoalId = newGoal.id

    // Insert new roadmap
    const { data: newRoadmap, error: newRoadmapError } = await supabase
      .from('roadmaps')
      .insert({
        goal_id: newGoal.id,
        user_id: userId,
        title: standardizedSubject,
        description: `Your improved custom roadmap to ${goalText}`,
        ai_generated: true,
      })
      .select('id')
      .single()

    if (newRoadmapError || !newRoadmap) {
      console.error('Error inserting new roadmap:', newRoadmapError)
      throw new Error('Failed to create new roadmap')
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
        throw new Error('Failed to create roadmap phases')
      }

      const lessonInserts = []
      let orderIndex = 1

      for (const mod of phase.modules) {
        for (const topic of mod.topics) {
          lessonInserts.push({
            phase_id: phaseData.id,
            roadmap_id: newRoadmap.id,
            user_id: userId,
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
          .select('id, title, order_index')

        if (lessonsError || !insertedLessons) {
          console.error('Error inserting new lessons:', lessonsError)
          throw new Error('Failed to create lesson stubs')
        }

        // Determine completions for this phase number
        const snapPhase = snapshot.phaseCompletions.find(p => p.phase_number === phase.phase_number)
        if (snapPhase && snapPhase.completed_lessons > 0) {
          const isFullyCompleted = snapPhase.completed_lessons === snapPhase.total_lessons
          let lessonsToMark = []

          if (isFullyCompleted) {
            lessonsToMark = insertedLessons
          } else {
            // Sort new lessons sequentially and take the first N completed lessons
            const sortedNewLessons = [...insertedLessons].sort((a, b) => a.order_index - b.order_index)
            lessonsToMark = sortedNewLessons.slice(0, snapPhase.completed_lessons)
          }

          if (lessonsToMark.length > 0) {
            const progressInserts = []
            for (const newLesson of lessonsToMark) {
              const oldCompleted = snapshot.completedLessons.find(
                cl => cl.phase_number === phase.phase_number && cl.title.toLowerCase().trim() === newLesson.title.toLowerCase().trim()
              ) || snapshot.completedLessons.find(
                cl => cl.phase_number === phase.phase_number
              )

              progressInserts.push({
                user_id: userId,
                lesson_id: newLesson.id,
                status: 'completed',
                started_at: oldCompleted?.started_at || new Date().toISOString(),
                completed_at: oldCompleted?.completed_at || new Date().toISOString(),
                time_spent_secs: oldCompleted?.time_spent_secs || 600
              })

              // Insert quiz stubs
              const { data: quizData } = await supabase
                .from('quizzes')
                .insert({
                  lesson_id: newLesson.id,
                  user_id: userId,
                  questions: []
                })
                .select('id')
                .single()

              if (quizData) {
                await supabase
                  .from('quiz_attempts')
                  .insert({
                    quiz_id: quizData.id,
                    user_id: userId,
                    answers: [],
                    score: oldCompleted?.quiz_score || 100,
                    passed: true,
                    time_spent_secs: 60
                  })
              }
            }

            const { error: progInsertError } = await supabase
              .from('lesson_progress')
              .insert(progressInserts)

            if (progInsertError) {
              console.error('Error inserting progress mappings:', progInsertError)
            }
          }
        }
      }
    }

    // Determine user's start position based on snapshot
    const firstIncompletePhase = generatedRoadmap.phases.find(
      p => p.phase_number > snapshot.highestPhaseCompleted
    )
    const userStartsFrom = firstIncompletePhase ? firstIncompletePhase.phase_number : 1

    return NextResponse.json({
      success: true,
      newPhaseCount: generatedRoadmap.phases.length,
      preservedPhases: snapshot.completedPhases.length,
      userStartsFrom
    })
  } catch (err: any) {
    console.error('[Admin API Roadmap Upgrade Error]', err)
    // Rollback: reactivate old goal and delete new goal
    const supabase = await createClient()
    if (newGoalId) {
      await supabase.from('learning_goals').delete().eq('id', newGoalId)
    }
    if (oldGoalId) {
      await supabase.from('learning_goals').update({ is_active: true }).eq('id', oldGoalId)
    }
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
