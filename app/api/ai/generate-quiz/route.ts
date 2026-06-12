import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateQuiz } from '@/lib/ai/quiz'
import { GeneratedLesson } from '@/types/ai'
import { checkRateLimit } from '@/lib/ai/rateLimit'

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

    // 2. Parse request body
    const body = await request.json()
    const { lessonId } = body

    if (!lessonId) {
      return NextResponse.json({ error: 'Missing required lessonId parameter' }, { status: 400 })
    }

    // 3. Check if quiz already exists for this lesson and user
    const { data: existingQuiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('lesson_id', lessonId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingQuiz) {
      return NextResponse.json({
        quizId: existingQuiz.id,
        questions: existingQuiz.questions,
      })
    }

    // 4. Fetch lesson to verify access and get details
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (lessonError || !lesson) {
      return NextResponse.json({ error: 'Lesson not found or access denied' }, { status: 404 })
    }

    // 5. Fetch roadmap context for subject/level
    const { data: roadmap, error: roadmapError } = await supabase
      .from('roadmaps')
      .select('goal_id')
      .eq('id', lesson.roadmap_id)
      .maybeSingle()

    if (roadmapError || !roadmap) {
      return NextResponse.json({ error: 'Roadmap context not found' }, { status: 500 })
    }

    // 6. Fetch learning goal context
    const { data: goal, error: goalError } = await supabase
      .from('learning_goals')
      .select('subject, level')
      .eq('id', roadmap.goal_id)
      .maybeSingle()

    if (goalError || !goal) {
      return NextResponse.json({ error: 'Learning goal context not found' }, { status: 500 })
    }

    // Extract takeaways if lesson has been generated
    const lessonContent = lesson.content as unknown as GeneratedLesson | null
    const takeaways = lessonContent?.key_takeaways || []

    // 6.5. Enforce Rate Limit (30 per day)
    const rateLimit = await checkRateLimit(supabase, user.id, 'quiz', 30)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Daily quiz generation limit reached. Please try again tomorrow.' },
        { status: 429 }
      )
    }

    // 7. Generate quiz questions
    const generatedQuiz = await generateQuiz(
      lesson.title,
      goal.subject,
      goal.level,
      takeaways
    )

    // 8. Insert new quiz into database
    const { data: newQuiz, error: insertError } = await supabase
      .from('quizzes')
      .insert({
        lesson_id: lessonId,
        user_id: user.id,
        questions: generatedQuiz.questions,
        ai_generated: true,
      })
      .select('id')
      .single()

    if (insertError || !newQuiz) {
      console.error('Error saving new quiz:', insertError)
      return NextResponse.json({ error: 'Failed to save quiz' }, { status: 500 })
    }

    return NextResponse.json({
      quizId: newQuiz.id,
      questions: generatedQuiz.questions,
    })
  } catch (err) {
    console.error('[API Generate Quiz Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
