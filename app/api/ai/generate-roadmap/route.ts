import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateRoadmap } from '@/lib/ai/roadmap'
import { checkRateLimit } from '@/lib/ai/rateLimit'

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .trim()
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1.5. Enforce Rate Limit (5 per day)
    const rateLimit = await checkRateLimit(supabase, user.id, 'roadmap', 5)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Daily roadmap generation limit reached. Please try again tomorrow.' },
        { status: 429 }
      )
    }

    // 2. Parse request payload
    const body = await request.json()
    const { goalText, subject, level, dailyMinutes, name, learningDepth } = body

    if (!goalText || !subject || !level || !dailyMinutes) {
      return NextResponse.json(
        { error: 'Missing required onboarding parameters' },
        { status: 400 }
      )
    }

    // 3. Update Profile Name & Learning Depth if provided
    if (name || learningDepth) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          ...(name ? { name } : {}),
          ...(learningDepth ? { learning_depth: Number(learningDepth) } : {})
        })
        .eq('id', user.id)

      if (profileError) {
        console.error('Error updating profile:', profileError)
      }
    }

    // 4. Generate the curriculum roadmap (simulated AI)
    const generatedRoadmap = await generateRoadmap(goalText, subject, level, Number(dailyMinutes))

    // 5. Deactivate prior learning goals for this user
    await supabase
      .from('learning_goals')
      .update({ is_active: false })
      .eq('user_id', user.id)

    // 6. Insert new learning goal
    const { data: goalData, error: goalError } = await supabase
      .from('learning_goals')
      .insert({
        user_id: user.id,
        goal_text: goalText,
        subject,
        level,
        daily_minutes: Number(dailyMinutes),
        depth_level: Number(learningDepth || 2),
        is_active: true,
      })
      .select('id')
      .single()

    if (goalError || !goalData) {
      console.error('Error inserting goal:', goalError)
      return NextResponse.json({ error: 'Failed to create learning goal' }, { status: 500 })
    }

    // 7. Insert roadmap
    const { data: roadmapData, error: roadmapError } = await supabase
      .from('roadmaps')
      .insert({
        goal_id: goalData.id,
        user_id: user.id,
        title: generatedRoadmap.title,
        description: generatedRoadmap.description,
        ai_generated: true,
      })
      .select('id')
      .single()

    if (roadmapError || !roadmapData) {
      console.error('Error inserting roadmap:', roadmapError)
      return NextResponse.json({ error: 'Failed to create roadmap' }, { status: 500 })
    }

    // 8. Insert phases and lessons
    for (const phase of generatedRoadmap.phases) {
      const { data: phaseData, error: phaseError } = await supabase
        .from('roadmap_phases')
        .insert({
          roadmap_id: roadmapData.id,
          phase_number: phase.phase_number,
          title: phase.title,
          description: phase.description,
          duration_days: phase.duration_weeks * 7,
          order_index: phase.phase_number,
        })
        .select('id')
        .single()

      if (phaseError || !phaseData) {
        console.error('Error inserting phase:', phaseError)
        return NextResponse.json({ error: 'Failed to create roadmap phases' }, { status: 500 })
      }

      // Insert lesson stubs inside this phase
      const lessonInserts = phase.lessons.map((lesson) => ({
        phase_id: phaseData.id,
        roadmap_id: roadmapData.id,
        user_id: user.id,
        title: lesson.title,
        slug: slugify(lesson.title),
        order_index: lesson.order_index,
        content: null, // content is generated lazily on first open (Phase 3)
        ai_generated: true,
      }))

      const { error: lessonsError } = await supabase.from('lessons').insert(lessonInserts)

      if (lessonsError) {
        console.error('Error inserting lessons stubs:', lessonsError)
        return NextResponse.json({ error: 'Failed to create lesson stubs' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, roadmapId: roadmapData.id })
  } catch (err) {
    console.error('[API Roadmap Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
