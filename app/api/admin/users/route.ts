import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient as createBaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const getAdminClient = () => {
  return createBaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'placeholder_service_role_key_for_dev'
      ? process.env.SUPABASE_SERVICE_ROLE_KEY
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Authorization Helper
async function verifyAdminAccess() {
  const cookieStore = await cookies()
  const token = cookieStore.get('cognara_admin_session')?.value
  if (token) {
    const secretStr = process.env.ADMIN_JWT_SECRET || 'cognara_admin_fallback_secret_key_for_development_39281'
    const secret = new TextEncoder().encode(secretStr)
    try {
      const decoded = await jwtVerify(token, secret)
      if (decoded.payload.adminId) {
        return true
      }
    } catch (e) {
      // Fallback
    }
  }

  // Legacy fallback
  try {
    const tempClient = createBaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user } } = await tempClient.auth.getUser()
    if (user && (user.id === process.env.ADMIN_USER_ID || user.id === process.env.NEXT_PUBLIC_ADMIN_USER_ID)) {
      return true
    }
  } catch (e) {
    // Ignored
  }

  return false
}

export async function GET() {
  try {
    const authorized = await verifyAdminAccess()
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getAdminClient()

    // 2. Fetch all users joined with active learning goals and calculate last active date
    const { data: usersData, error: dbError } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        email,
        created_at,
        subscription_tier,
        plan,
        avatar_url
      `)

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    // Fetch active goals and last activity for all users to merge
    const { data: activeGoals } = await supabase
      .from('learning_goals')
      .select('user_id, subject')
      .eq('is_active', true)

    const { data: lessonActivity } = await supabase
      .from('lesson_progress')
      .select('user_id, started_at, completed_at')
    
    const { data: quizActivity } = await supabase
      .from('quiz_attempts')
      .select('user_id, attempted_at')

    // Map helpers
    const goalMap = new Map<string, string>()
    activeGoals?.forEach(g => {
      if (g.subject) goalMap.set(g.user_id, g.subject)
    })

    const activityMap = new Map<string, number>()
    // Initialize with created_at
    usersData.forEach(u => {
      activityMap.set(u.id, new Date(u.created_at).getTime())
    })

    lessonActivity?.forEach(a => {
      const current = activityMap.get(a.user_id) || 0
      const startedTime = a.started_at ? new Date(a.started_at).getTime() : 0
      const completedTime = a.completed_at ? new Date(a.completed_at).getTime() : 0
      activityMap.set(a.user_id, Math.max(current, startedTime, completedTime))
    })

    quizActivity?.forEach(a => {
      const current = activityMap.get(a.user_id) || 0
      const attemptedTime = a.attempted_at ? new Date(a.attempted_at).getTime() : 0
      activityMap.set(a.user_id, Math.max(current, attemptedTime))
    })

    // Merge everything
    const formattedUsers = usersData.map(u => {
      const lastActiveTime = activityMap.get(u.id) || new Date(u.created_at).getTime()
      return {
        ...u,
        current_subject: goalMap.get(u.id) || 'None',
        last_active: new Date(lastActiveTime).toISOString()
      }
    })

    // Sort by last active descending
    formattedUsers.sort((a, b) => new Date(b.last_active).getTime() - new Date(a.last_active).getTime())

    return NextResponse.json({ users: formattedUsers })

  } catch (err: any) {
    console.error('[Admin Users GET Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const authorized = await verifyAdminAccess()
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getAdminClient()

    // 2. Parse payload
    const { userId, tier } = await request.json()
    if (!userId || !tier) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // 3. Update subscription details
    const isPro = tier === 'pro' || tier === 'pro_monthly' || tier === 'pro_yearly'
    const resolvedTier = isPro ? 'pro_monthly' : 'free'
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_tier: resolvedTier,
        plan: resolvedTier,
        subscription_status: isPro ? 'active' : 'inactive',
        subscription_start_date: isPro ? new Date().toISOString() : null,
        subscription_end_date: null
      })
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: `User upgraded to ${tier} successfully` })

  } catch (err: any) {
    console.error('[Admin Users PUT Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const authorized = await verifyAdminAccess()
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getAdminClient()

    // 2. Parse payload
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 })
    }

    // Protect admin account from self-deletion
    if (userId === process.env.ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Cannot delete the admin account' }, { status: 400 })
    }

    // Delete from profiles (which will automatically trigger deletion of auth.users via database trigger)
    const { error: dbDeleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (dbDeleteError) {
      return NextResponse.json({ error: dbDeleteError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User account successfully deleted from database and auth'
    })

  } catch (err: any) {
    console.error('[Admin Users DELETE Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
