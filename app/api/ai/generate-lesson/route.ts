import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateLesson } from '@/lib/ai/lesson'
import { checkRateLimit } from '@/lib/ai/rateLimit'
import { logApiUsage } from '@/lib/ai/logUsage'
import { checkRateLimit as checkNewRateLimit } from '@/lib/rateLimit'

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
    const { lessonId, forceRegenerate } = body

    if (!lessonId) {
      return NextResponse.json({ error: 'Missing required lessonId parameter' }, { status: 400 })
    }

    if (forceRegenerate) {
      // Check user subscription tier
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_status, subscription_end_date')
        .eq('id', user.id)
        .maybeSingle()

      const tier = profile?.subscription_tier || 'free'
      const statusVal = profile?.subscription_status || 'inactive'
      const endDate = profile?.subscription_end_date || null
      const isPro = (tier === 'pro_monthly' || tier === 'pro_yearly') && 
        (statusVal === 'active' || statusVal === 'trialing' || statusVal === 'trailing') && 
        (!endDate || new Date(endDate) > new Date())

      const limitResult = await checkNewRateLimit({
        featureKey: `lesson_regen_${lessonId}`,
        dailyLimit: isPro ? 2 : 0,
        userId: user.id
      })

      if (!limitResult.allowed) {
        return NextResponse.json(
          { error: 'You have reached the maximum of 2 regenerations for this lesson.' },
          { status: 429 }
        )
      }
    }

    // 3. Fetch lesson & confirm ownership
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (lessonError || !lesson) {
      return NextResponse.json({ error: 'Lesson not found or access denied' }, { status: 404 })
    }

    // 4. Fetch phase details to supply context
    const { data: phase, error: phaseError } = await supabase
      .from('roadmap_phases')
      .select('title')
      .eq('id', lesson.phase_id)
      .maybeSingle()

    if (phaseError || !phase) {
      return NextResponse.json({ error: 'Roadmap phase context not found' }, { status: 500 })
    }

    // 5. Fetch learning goal details to supply subject & level parameters
    const { data: roadmap, error: roadmapError } = await supabase
      .from('roadmaps')
      .select('goal_id')
      .eq('id', lesson.roadmap_id)
      .maybeSingle()

    if (roadmapError || !roadmap) {
      return NextResponse.json({ error: 'Roadmap context not found' }, { status: 500 })
    }

    const { data: goal, error: goalError } = await supabase
      .from('learning_goals')
      .select('subject, level, depth_level')
      .eq('id', roadmap.goal_id)
      .maybeSingle()

    if (goalError || !goal) {
      return NextResponse.json({ error: 'Learning goal context not found' }, { status: 500 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('learning_depth, learning_style, main_goal, occupation, preferred_study_time, daily_study_minutes, learning_style_detail')
      .eq('id', user.id)
      .maybeSingle()

    const depthLevel = goal.depth_level ?? profile?.learning_depth ?? 2

    // 6. Check multi-depth cache — skip if content is mock/template data
    const contentMap = (lesson.content && typeof lesson.content === 'object') ? (lesson.content as any) : null
    const cachedLesson = contentMap ? contentMap[depthLevel] : null

    // Check if the cached lesson is a mock fallback (e.g. from prior failure or unconfigured state)
    const isMockLesson = (content: any): boolean => {
      if (!content || typeof content !== 'object') return true
      if (content._isMock === true) return true
      
      const sections = content.sections || []
      if (sections.length === 0) return true
      
      const sectionTexts = sections.map((s: any) => 
        JSON.stringify(s).toLowerCase()
      ).join(' ')
      
      const mockMarkers = [
        'baking a cake',
        'toy box',
        'sorting warehouse',
        'lego instructions',
        'cookie cutter',
        'light switch',
        'smart thermostat',
        'legacy approach (messy / coupled)',
        'legacy var (hoisted & function scoped)',
        'incorrect (mutating props)',
        'direct mutation (no re-render)',
        'leaky listener (memory leak risk)'
      ]
      
      return mockMarkers.some(marker => sectionTexts.includes(marker))
    }

    const cachedIsMock = isMockLesson(cachedLesson)

    if (cachedLesson && !cachedIsMock && !forceRegenerate) {
      // Ensure it is marked in progress if not already completed
      const { data: progress } = await supabase
        .from('lesson_progress')
        .select('status')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle()

      if (!progress) {
        await supabase.from('lesson_progress').insert({
          user_id: user.id,
          lesson_id: lessonId,
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
      }

      return NextResponse.json({ content: cachedLesson })
    }

    if (cachedLesson && cachedIsMock) {
      console.log(`[generate-lesson] Cached content for lesson ${lessonId} depth ${depthLevel} is mock data — forcing regeneration with Claude.`)
    }

    // 7. Enforce Rate Limit (30 per day)
    const rateLimit = await checkRateLimit(supabase, user.id, 'lesson', 30)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Daily lesson generation limit reached. Please try again tomorrow.' },
        { status: 429 }
      )
    }

    // 8. Generate the lesson content (simulated AI)
    const generatedLesson = await generateLesson(
      lesson.title,
      phase.title,
      goal.subject,
      goal.level,
      Number(depthLevel),
      profile
    )

    const usage = (generatedLesson as any)._usage
    if (usage) {
      await logApiUsage(
        user.id,
        'lesson',
        usage.model,
        usage.input_tokens,
        usage.output_tokens
      )
    }

    // 9. Only persist REAL Claude content to the DB — never cache mock/template data
    const generatedIsMock = (generatedLesson as any)._isMock === true

    if (!generatedIsMock) {
      const updatedContent = {
        ...(contentMap || {}),
        [depthLevel]: generatedLesson
      }

      const { error: updateError } = await supabase
        .from('lessons')
        .update({
          content: updatedContent,
          generated_at: new Date().toISOString(),
        })
        .eq('id', lessonId)

      if (updateError) {
        console.error('[generate-lesson] Failed to cache lesson content:', updateError)
      } else {
        console.log(`[generate-lesson] Cached real Claude content for lesson ${lessonId} depth ${depthLevel}`)
      }
    } else {
      console.warn(`[generate-lesson] Claude not configured or failed — serving mock content without caching. Check ANTHROPIC_API_KEY in environment variables.`)
    }

    // 8. Record lesson progress as "in_progress" (if not already completed)
    const { data: progress } = await supabase
      .from('lesson_progress')
      .select('status')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .maybeSingle()

    if (!progress) {
      await supabase.from('lesson_progress').insert({
        user_id: user.id,
        lesson_id: lessonId,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({ content: generatedLesson })
  } catch (err: any) {
    console.error('[API Lesson Generation Error]', err)
    const errorMessage = err?.message || 'Lesson generation failed. Check your Anthropic API key and account credits at console.anthropic.com.'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
