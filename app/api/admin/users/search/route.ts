import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Verify admin
    const { data: { user: adminUser }, error: authError } = await supabase.auth.getUser()
    const isAdmin = adminUser && (adminUser.id === process.env.ADMIN_USER_ID || adminUser.id === '4c1fbae5-c423-42e7-8394-1112fe00d42e')
    if (authError || !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()

    if (!query) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 })
    }

    // 2. Find user in profiles by ID, Name, or Email (with UUID format check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const isUUID = uuidRegex.test(query)

    let orFilter = `email.ilike.%${query}%,name.ilike.%${query}%`
    if (isUUID) {
      orFilter = `id.eq.${query}`
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .or(orFilter)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 3. Fetch active goal
    const { data: activeGoal } = await supabase
      .from('learning_goals')
      .select('*')
      .eq('user_id', profile.id)
      .eq('is_active', true)
      .maybeSingle()

    // 4. Fetch active roadmap and phase count
    let phaseCount = 0
    let roadmapDate = null
    let roadmapId = null
    
    if (activeGoal) {
      const { data: activeRoadmap } = await supabase
        .from('roadmaps')
        .select('*')
        .eq('goal_id', activeGoal.id)
        .eq('user_id', profile.id)
        .maybeSingle()

      if (activeRoadmap) {
        roadmapId = activeRoadmap.id
        roadmapDate = activeRoadmap.created_at
        
        const { count } = await supabase
          .from('roadmap_phases')
          .select('*', { count: 'exact', head: true })
          .eq('roadmap_id', activeRoadmap.id)

        phaseCount = count || 0
      }
    }

    return NextResponse.json({
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        goal: activeGoal ? activeGoal.goal_text : 'No active goal',
        goalId: activeGoal ? activeGoal.id : null,
        roadmapId,
        phaseCount,
        roadmapDate,
        version: profile.roadmap_upgraded ? 'Upgraded (v3)' : 'Original'
      }
    })
  } catch (err: any) {
    console.error('[Admin Search User Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
