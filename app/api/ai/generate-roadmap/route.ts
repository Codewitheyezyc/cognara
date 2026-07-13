export const runtime = 'edge'
export const dynamic = 'force-dynamic'

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

    // 2. Fetch onboarding context from Supabase profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('name, main_goal, experience_level, occupation, daily_study_minutes, subscription_tier, subscription_status, subscription_end_date')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profile) {
      console.error('Error fetching onboarding profile context:', profileError)
      return NextResponse.json({ error: 'User profile not found. Please complete Steps 1 & 2.' }, { status: 404 })
    }

    const goalText = profile.main_goal
    if (!goalText || !goalText.trim()) {
      return NextResponse.json({ error: 'Learning goal not found. Please complete Step 1 first.' }, { status: 400 })
    }

    const level = profile.experience_level || 'beginner'
    const background = profile.occupation || 'Self-taught learner'
    const dailyMinutes = Number(profile.daily_study_minutes || 30)

    // 3. Enforce roadmap rate limits
    const tier = profile.subscription_tier || 'free'
    const statusVal = profile.subscription_status || 'inactive'
    const endDate = profile.subscription_end_date || null
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

    // 4. Standardize subject name from the goal text via Claude Haiku
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
        console.log(`[Intent Mapping] Mapped goal to standardized subject: "${standardizedSubject}"`)
      }
    } catch (err) {
      console.warn('[Intent Mapping] Failed to standardize subject, falling back to goal text:', err)
    }

    const resolvedDepth = 2 // Default calibration depth

    // 5. Generate the curriculum roadmap
    const generatedRoadmap = await generateRoadmap(
      goalText,
      standardizedSubject,
      level,
      dailyMinutes,
      resolvedDepth,
      background
    )

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

    // 6. Save the generated roadmap JSON directly to profiles table
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        main_roadmap: generatedRoadmap
      })
      .eq('id', user.id)

    if (profileUpdateError) {
      console.error('Failed to save main_roadmap JSON to profile:', profileUpdateError)
    }

    // 7. Sync with relational tables for backward compatibility (dashboard rendering)
    
    // Deactivate & archive prior learning goals
    await supabase
      .from('learning_goals')
      .update({ is_active: false, status: 'archived' })
      .eq('user_id', user.id)

    // Insert new learning goal
    const { data: goalData, error: goalError } = await supabase
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

    if (goalError || !goalData) {
      console.error('Error inserting goal:', goalError)
      return NextResponse.json({ error: 'Failed to sync learning goal' }, { status: 500 })
    }

    // Insert roadmap
    const { data: roadmapData, error: roadmapError } = await supabase
      .from('roadmaps')
      .insert({
        goal_id: goalData.id,
        user_id: user.id,
        title: standardizedSubject,
        description: `Your custom roadmap to ${goalText}`,
        ai_generated: true,
      })
      .select('id')
      .single()

    if (roadmapError || !roadmapData) {
      console.error('Error inserting roadmap:', roadmapError)
      return NextResponse.json({ error: 'Failed to sync roadmap record' }, { status: 500 })
    }

    // Insert phases and lessons (topics)
    for (const phase of generatedRoadmap.phases) {
      const { data: phaseData, error: phaseError } = await supabase
        .from('roadmap_phases')
        .insert({
          roadmap_id: roadmapData.id,
          phase_number: phase.phase_number,
          title: phase.phase_name,
          description: `Phase ${phase.phase_number} of your learning path.`,
          duration_days: phase.estimated_weeks * 7,
          order_index: phase.phase_number,
        })
        .select('id')
        .single()

      if (phaseError || !phaseData) {
        console.error('Error inserting phase:', phaseError)
        return NextResponse.json({ error: 'Failed to sync roadmap phases' }, { status: 500 })
      }

      // Map topics from modules sequentially inside the phase
      const lessonInserts = []
      let orderIndex = 1

      for (const mod of phase.modules) {
        for (const topic of mod.topics) {
          lessonInserts.push({
            phase_id: phaseData.id,
            roadmap_id: roadmapData.id,
            user_id: user.id,
            title: topic,
            slug: slugify(topic),
            order_index: orderIndex++,
            content: null, // content is generated lazily on first open (cached)
            ai_generated: true,
          })
        }
      }

      if (lessonInserts.length > 0) {
        const { error: lessonsError } = await supabase
          .from('lessons')
          .insert(lessonInserts)

        if (lessonsError) {
          console.error('Error inserting synced lessons stubs:', lessonsError)
          return NextResponse.json({ error: 'Failed to sync lesson stubs' }, { status: 500 })
        }
      }
    }

    // Pre-generate the first 2 lessons of Phase 1 in the background (fire-and-forget)
    try {
      const { data: firstLessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('roadmap_id', roadmapData.id)
        .order('order_index', { ascending: true })
        .limit(2)

      if (firstLessons && firstLessons.length > 0) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const origin = request.headers.get('origin') || appUrl
        const cookie = request.headers.get('cookie') || ''
        
        firstLessons.forEach((l: any) => {
          fetch(`${origin}/api/ai/generate-lesson`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Cookie': cookie
            },
            body: JSON.stringify({ lessonId: l.id })
          }).catch(err => console.error('[Pre-generate] Failed to prefetch first lesson:', err))
        })
      }
    } catch (err) {
      console.error('[Pre-generate] Error querying first lessons for prefetch:', err)
    }

    return NextResponse.json({ success: true, roadmapId: roadmapData.id })
  } catch (err: any) {
    console.error('[API Roadmap Error]', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
