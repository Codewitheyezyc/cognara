import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createBaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Admin Client with Service Role Key if available, else Anon Key
const getAdminClient = () => {
  return createBaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'placeholder_service_role_key_for_dev'
      ? process.env.SUPABASE_SERVICE_ROLE_KEY
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Verify admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const adminId = process.env.ADMIN_USER_ID || '4c1fbae5-c423-42e7-8394-1112fe00d42e'
    if (authError || !user || user.id !== adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = getAdminClient()

    // 2. Fetch safety logs joined with profiles
    const { data: logs, error: logsError } = await adminClient
      .from('content_safety_log')
      .select(`
        id,
        goal_text,
        rejection_reason,
        created_at,
        user_id,
        profiles (
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (logsError) {
      return NextResponse.json({ error: logsError.message }, { status: 500 })
    }

    // 3. Fetch approved goals count from learning_goals
    const { data: approvedGoals, error: approvedError } = await adminClient
      .from('learning_goals')
      .select('created_at')

    if (approvedError) {
      return NextResponse.json({ error: approvedError.message }, { status: 500 })
    }

    // Fetch emails by querying profiles table (since user_id links to profile table where email might exist or we can join it)
    // Wait, let's see if the profiles table has emails.
    // Yes! Let's query profiles to build a map of user_id -> email.
    const { data: profiles, error: profilesError } = await adminClient
      .from('profiles')
      .select('id, name, email')

    const profileMap = new Map<string, { name: string; email: string }>()
    if (profiles) {
      profiles.forEach(p => {
        profileMap.set(p.id, { name: p.name || 'Unknown Learner', email: p.email || 'No email' })
      })
    }

    // Calculations
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    
    // Start of this week (Sunday)
    const sunday = new Date(now)
    sunday.setDate(now.getDate() - now.getDay())
    sunday.setHours(0, 0, 0, 0)
    const startOfWeek = sunday.getTime()

    // Rejections today/week
    const rejectionsToday = logs.filter(l => new Date(l.created_at).getTime() >= startOfToday)
    const rejectionsThisWeek = logs.filter(l => new Date(l.created_at).getTime() >= startOfWeek)

    // Approved goals today/week
    const approvedToday = approvedGoals.filter(g => new Date(g.created_at).getTime() >= startOfToday)
    const approvedThisWeek = approvedGoals.filter(g => new Date(g.created_at).getTime() >= startOfWeek)

    const totalGoalsToday = approvedToday.length + rejectionsToday.length
    const totalGoalsThisWeek = approvedThisWeek.length + rejectionsThisWeek.length

    const totalRejectionsCount = logs.length
    const totalApprovedCount = approvedGoals.length
    const totalGoalsCount = totalRejectionsCount + totalApprovedCount

    const rejectionPercentage = totalGoalsCount > 0 ? (totalRejectionsCount / totalGoalsCount) * 100 : 0

    // Repeat offenders maps
    const lifetimeRejections = new Map<string, number>()
    const dailyRejections = new Map<string, number>()

    logs.forEach(l => {
      if (!l.user_id) return
      lifetimeRejections.set(l.user_id, (lifetimeRejections.get(l.user_id) || 0) + 1)
      
      if (new Date(l.created_at).getTime() >= startOfToday) {
        dailyRejections.set(l.user_id, (dailyRejections.get(l.user_id) || 0) + 1)
      }
    })

    // Format logs with user info and flags
    const formattedLogs = logs.map(l => {
      const uId = l.user_id || ''
      const p = profileMap.get(uId) || { name: 'Unknown Learner', email: 'unknown@cognara.com' }
      const lifetime = lifetimeRejections.get(uId) || 0
      const daily = dailyRejections.get(uId) || 0

      return {
        id: l.id,
        goal_text: l.goal_text,
        rejection_reason: l.rejection_reason,
        created_at: l.created_at,
        user: {
          id: uId,
          name: p.name,
          email: p.email
        },
        flaggedRepeat: lifetime >= 3,
        flaggedAbuse: daily >= 5
      }
    })

    return NextResponse.json({
      stats: {
        totalGoalsToday,
        totalGoalsThisWeek,
        totalRejectionsCount,
        rejectionPercentage,
        rejectionsToday: rejectionsToday.length,
        rejectionsThisWeek: rejectionsThisWeek.length,
      },
      logs: formattedLogs
    })

  } catch (err: any) {
    console.error('[Admin Safety GET Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
