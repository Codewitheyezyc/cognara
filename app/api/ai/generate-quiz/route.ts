import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateQuiz } from '@/lib/ai/quiz'
import { GeneratedLesson } from '@/types/ai'
import { checkRateLimit } from '@/lib/ai/rateLimit'
import { quizHasWrongContent } from '@/lib/ai/validateQuiz'
import { anthropic } from '@/lib/ai/client'
import { QUIZ_SYSTEM_PROMPT_STRICT, buildQuizUserMessage, isTechnicalSubject } from '@/lib/ai/prompts'


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
      .select('subject, level, depth_level')
      .eq('id', roadmap.goal_id)
      .maybeSingle()

    if (goalError || !goal) {
      return NextResponse.json({ error: 'Learning goal context not found' }, { status: 500 })
    }

    // Extract takeaways if lesson has been generated
    const contentMap = lesson.content as any
    const lessonContent = (contentMap && typeof contentMap === 'object')
      ? (contentMap[goal.depth_level ?? 2] || Object.values(contentMap)[0])
      : contentMap
    const takeaways = (lessonContent as any)?.key_takeaways || []

    const summarySection = (lessonContent as any)?.sections?.find(
      (s: any) => s.type === 'summary'
    )
    const lessonSummary = summarySection?.body || takeaways.join('\n')

    // 6.5. Enforce Rate Limit (30 per day)
    const rateLimit = await checkRateLimit(supabase, user.id, 'quiz', 30)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Daily quiz generation limit reached. Please try again tomorrow.' },
        { status: 429 }
      )
    }

    // 7. Generate quiz questions
    let generatedQuiz = await generateQuiz(
      lesson.title,
      goal.subject,
      goal.level,
      takeaways,
      lessonSummary
    )

    // Validate quiz content matches subject
    if (quizHasWrongContent(generatedQuiz.questions, goal.subject)) {
      console.warn('[Quiz] Wrong content detected — regenerating')

      if (anthropic) {
        try {
          const params = {
            lessonTitle: lesson.title,
            subject: goal.subject,
            level: goal.level,
            keyTakeaways: takeaways,
            lessonSummary: lessonSummary
          }

          // Regenerate once with even stronger prompt
          const retryResponse = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1500,
            system: QUIZ_SYSTEM_PROMPT_STRICT
              .replace(/{subject}/g, goal.subject)
              .replace(/{lessonTitle}/g, lesson.title)
              .replace(/{isTechnical}/g, isTechnicalSubject(goal.subject) ? 'YES' : 'NO'),
            messages: [{
              role: 'user',
              content: buildQuizUserMessage(params) +
                '\n\nWARNING: Previous generation had wrong subject content. ' +
                'Every option MUST be about ' + goal.subject + ' only. ' +
                'No technology, programming, or database content allowed.'
            }]
          })

          // Use retry response
          const retryText = retryResponse.content[0].type === 'text'
            ? retryResponse.content[0].text : ''
          const jsonMatch = retryText.match(/\{[\s\S]*\}/)
          const jsonString = jsonMatch ? jsonMatch[0] : retryText
          const retryParsed = JSON.parse(jsonString.trim())

          if (retryParsed && Array.isArray(retryParsed.questions)) {
            generatedQuiz = retryParsed
          }
        } catch (retryErr) {
          console.error('[Quiz Retry] Error during quiz regeneration:', retryErr)
        }
      } else {
        console.warn('[Quiz] Anthropic client not configured for retry. Fallback to default questions.')
      }
    }

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
