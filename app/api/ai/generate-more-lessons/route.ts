import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaudeJSON } from '@/lib/ai/client'
import { MORE_LESSONS_SYSTEM_PROMPT, buildMoreLessonsUserMessage } from '@/lib/ai/prompts'
import { logApiUsage } from '@/lib/ai/logUsage'

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

    // 2. Parse request payload
    const body = await request.json()
    const { phaseId } = body

    if (!phaseId) {
      return NextResponse.json({ error: 'Missing phaseId' }, { status: 400 })
    }

    // 3. Fetch phase details
    const { data: phase, error: phaseError } = await supabase
      .from('roadmap_phases')
      .select('*')
      .eq('id', phaseId)
      .single()

    if (phaseError || !phase) {
      console.error('Error fetching phase:', phaseError)
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 })
    }

    // If phase has already been marked as complete, return immediately
    if (phase.has_more === false) {
      return NextResponse.json({ success: true, complete: true, lessons: [] })
    }

    // 4. Fetch roadmap details
    const { data: roadmap, error: roadmapError } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('id', phase.roadmap_id)
      .single()

    if (roadmapError || !roadmap) {
      console.error('Error fetching roadmap:', roadmapError)
      return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 })
    }

    // 5. Fetch learning goal details
    const { data: goal, error: goalError } = await supabase
      .from('learning_goals')
      .select('*')
      .eq('id', roadmap.goal_id)
      .single()

    if (goalError || !goal) {
      console.error('Error fetching goal:', goalError)
      return NextResponse.json({ error: 'Learning goal not found' }, { status: 404 })
    }

    // 6. Fetch existing lessons in this phase
    const { data: existingLessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('title, description, order_index')
      .eq('phase_id', phaseId)
      .order('order_index', { ascending: true })

    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError)
      return NextResponse.json({ error: 'Failed to fetch existing lessons' }, { status: 500 })
    }

    // 7. Define AI fallback mock
    const mockFallback = async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      const lastLesson = existingLessons?.[existingLessons.length - 1]
      const lastTitle = lastLesson ? lastLesson.title : 'Introduction'
      
      // If we already have 8 lessons in fallback, mark complete
      if (existingLessons && existingLessons.length >= 8) {
        return {
          complete: true,
          lessons: []
        }
      }

      return {
        complete: false,
        lessons: [
          {
            title: `${lastTitle} (Part 2)`,
            description: `A deeper practical continuation covering advanced aspects of ${lastTitle}.`
          },
          {
            title: `Applying ${lastTitle} Concepts`,
            description: `Build a production-ready application layout utilizing all core features of ${lastTitle}.`
          }
        ]
      }
    }

    // 8. Generate new lessons from Claude
    const userPrompt = buildMoreLessonsUserMessage({
      goalText: goal.goal_text,
      subject: goal.subject,
      level: goal.level,
      phaseTitle: phase.title,
      phaseDescription: phase.description || '',
      existingLessons: existingLessons || [],
      depthLevel: goal.depth_level || 2
    })

    const result = await callClaudeJSON<any>(
      MORE_LESSONS_SYSTEM_PROMPT,
      userPrompt,
      mockFallback
    )

    const usage = (result as any)._usage
    if (usage) {
      await logApiUsage(
        user.id,
        'roadmap',
        usage.model,
        usage.input_tokens,
        usage.output_tokens
      )
    }

    // 9. Process the results
    const isComplete = result.complete || !result.lessons || result.lessons.length === 0

    if (isComplete) {
      // Mark phase as complete (no more lessons can be added)
      const { error: updateError } = await supabase
        .from('roadmap_phases')
        .update({ has_more: false })
        .eq('id', phaseId)

      if (updateError) {
        console.error('Error updating phase has_more:', updateError)
      }

      return NextResponse.json({ success: true, complete: true, lessons: [] })
    }

    // Insert new lessons stubs
    const startIdx = (existingLessons?.length || 0) + 1
    const lessonInserts = result.lessons.map((lesson: any, index: number) => ({
      phase_id: phaseId,
      roadmap_id: phase.roadmap_id,
      user_id: user.id,
      title: lesson.title,
      slug: slugify(lesson.title),
      order_index: startIdx + index,
      content: null,
      ai_generated: true,
    }))

    const { error: insertError } = await supabase
      .from('lessons')
      .insert(lessonInserts)

    if (insertError) {
      console.error('Error inserting new lessons stubs:', insertError)
      return NextResponse.json({ error: 'Failed to save new lessons' }, { status: 500 })
    }

    // If the response explicitly said complete, also update the phase's has_more flag
    if (result.complete) {
      await supabase
        .from('roadmap_phases')
        .update({ has_more: false })
        .eq('id', phaseId)
    }

    return NextResponse.json({
      success: true,
      complete: result.complete || false,
      lessons: lessonInserts
    })
  } catch (err) {
    console.error('[API More Lessons Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
