import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaudeJSON } from '@/lib/ai/client'
import { PHASE_LESSONS_SYSTEM_PROMPT, buildPhaseLessonsUserMessage } from '@/lib/ai/prompts'
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

    // 4. Check if lessons already exist for this phase. If yes, return them immediately (cached)
    const { data: existingLessons, error: existingError } = await supabase
      .from('lessons')
      .select('id, phase_id, title, slug, order_index')
      .eq('phase_id', phaseId)
      .order('order_index', { ascending: true })

    if (existingError) {
      console.error('Error checking existing lessons:', existingError)
    }

    if (existingLessons && existingLessons.length > 0) {
      return NextResponse.json({ success: true, lessons: existingLessons })
    }

    // 5. Fetch roadmap details
    const { data: roadmap, error: roadmapError } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('id', phase.roadmap_id)
      .single()

    if (roadmapError || !roadmap) {
      console.error('Error fetching roadmap:', roadmapError)
      return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 })
    }

    // 6. Fetch learning goal details
    const { data: goal, error: goalError } = await supabase
      .from('learning_goals')
      .select('*')
      .eq('id', roadmap.goal_id)
      .single()

    if (goalError || !goal) {
      console.error('Error fetching goal:', goalError)
      return NextResponse.json({ error: 'Learning goal not found' }, { status: 404 })
    }

    // 7. Define AI fallback mock
    const mockFallback = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      
      const numLessons = goal.depth_level === 3 ? 12 : 8
      const phaseTitleText = phase.title || 'Topic Foundations'
      
      const generated = []
      for (let i = 1; i <= numLessons; i++) {
        generated.push({
          order_index: i,
          title: `${phaseTitleText} Lesson ${i}`,
          description: `Master core concept ${i} relating to ${phaseTitleText} in this detailed step.`
        })
      }
      return generated
    }

    // 8. Generate lessons from Claude (using Haiku model for speed)
    const userPrompt = buildPhaseLessonsUserMessage({
      goalText: goal.goal_text,
      subject: goal.subject,
      level: goal.level,
      phaseNumber: phase.phase_number,
      phaseTitle: phase.title,
      phaseDescription: phase.description || '',
      depthLevel: goal.depth_level || 2
    })

    const result = await callClaudeJSON<any>(
      PHASE_LESSONS_SYSTEM_PROMPT,
      userPrompt,
      mockFallback,
      'claude-haiku-4-5-20251001'
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

    // Ensure we parse the output array of lessons correctly
    const generatedLessons = Array.isArray(result) ? result : (result.lessons || [])

    if (generatedLessons.length === 0) {
      // If AI returned empty, generate fallback stubs
      const fallbackList = await mockFallback()
      generatedLessons.push(...fallbackList)
    }

    // Insert new lessons stubs into lessons table
    const lessonInserts = generatedLessons.map((lesson: any, index: number) => ({
      phase_id: phaseId,
      roadmap_id: phase.roadmap_id,
      user_id: user.id,
      title: lesson.title,
      slug: slugify(lesson.title),
      order_index: lesson.order_index || (index + 1),
      content: null,
      ai_generated: true,
    }))

    const { data: insertedLessons, error: insertError } = await supabase
      .from('lessons')
      .insert(lessonInserts)
      .select('id, phase_id, title, slug, order_index')

    if (insertError) {
      console.error('Error inserting new lessons stubs:', insertError)
      return NextResponse.json({ error: 'Failed to save new lessons' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      lessons: insertedLessons || []
    })
  } catch (err) {
    console.error('[API Generate Lessons For Phase Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
