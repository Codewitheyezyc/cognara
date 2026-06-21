import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateRoadmap } from '@/lib/ai/roadmap'
import { checkRateLimit as checkNewRateLimit } from '@/lib/rateLimit'
import { logApiUsage } from '@/lib/ai/logUsage'
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

    // 1. Authenticate user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user's subscription tier
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

    const isAdmin = user.id === process.env.ADMIN_USER_ID || user.id === '4c1fbae5-c423-42e7-8394-1112fe00d42e'

    if (!isPro && !isAdmin) {
      // Free users: 1 ever
      const { count: roadmapCount } = await supabase
        .from('roadmaps')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (roadmapCount && roadmapCount >= 1) {
        return NextResponse.json(
          { error: 'Free users are limited to 1 learning roadmap. Please upgrade to Pro to generate a new roadmap.' },
          { status: 403 }
        )
      }
    } else {
      // Pro users: 3 per month
      const limit = await checkNewRateLimit({
        featureKey: 'roadmap_generation',
        limit: 3,
        userId: user.id,
        period: 'monthly'
      })

      if (!limit.allowed) {
        return NextResponse.json(
          { error: 'You have reached your limit of 3 roadmap generations for this month.' },
          { status: 429 }
        )
      }
    }

    // 2. Parse request payload
    const body = await request.json()
    const { goalText, subject, level, dailyMinutes, name, learningDepth, learningStyleDetail } = body

    if (!goalText || !subject || !level || !dailyMinutes) {
      return NextResponse.json(
        { error: 'Missing required onboarding parameters' },
        { status: 400 }
      )
    }

    // Standardize subject name via Claude Haiku
    let standardizedSubject = subject
    try {
      const mappingResult = await callClaudeJSON<StandardizeResult>(
        "You are an expert curriculum intent classifier. Map the user's input subject into a clean, standard, concise 2-4 word subject title representing the primary educational category (e.g. 'React Frontend Development', 'WAEC Mathematics', 'Beginning Acoustic Guitar', 'Baking Basics'). Return JSON ONLY: { \"standardizedSubject\": \"title\" }",
        `Input subject: "${subject}"`,
        async () => ({ standardizedSubject: subject }),
        'claude-haiku-4-5-20251001'
      )
      if (mappingResult.standardizedSubject) {
        standardizedSubject = mappingResult.standardizedSubject
        console.log(`[Intent Mapping] Standardized "${subject}" to "${standardizedSubject}"`)
      }
    } catch (err) {
      console.warn('[Intent Mapping] Failed to standardize subject, falling back to original:', err)
    }

    // 3. Update Profile Name, Learning Depth, & Learning Style if provided
    if (name || learningDepth || learningStyleDetail) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          ...(name ? { name } : {}),
          ...(learningDepth ? { learning_depth: Number(learningDepth) } : {}),
          ...(learningStyleDetail ? { learning_style_detail: learningStyleDetail } : {})
        })
        .eq('id', user.id)

      if (profileError) {
        console.error('Error updating profile:', profileError)
      }
    }

    // 4. Generate the curriculum roadmap (simulated AI)
    const generatedRoadmap = await generateRoadmap(goalText, standardizedSubject, level, Number(dailyMinutes), Number(learningDepth || 2))

    const usage = (generatedRoadmap as any)._usage
    if (usage) {
      await logApiUsage(
        user.id,
        'roadmap',
        usage.model,
        usage.input_tokens,
        usage.output_tokens
      )
    }

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
        subject: standardizedSubject,
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
