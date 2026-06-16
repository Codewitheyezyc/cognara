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
    if (authError || !user || user.id !== process.env.ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
    const supabase = await createClient()

    // 1. Verify admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== process.env.ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse payload
    const { userId, tier } = await request.json()
    if (!userId || !tier) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // 3. Update subscription details
    const isPro = tier === 'pro'
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_tier: tier,
        plan: tier,
        subscription_status: isPro ? 'active' : 'inactive',
        subscription_start_date: isPro ? new Date().toISOString() : null,
        subscription_end_date: null // Unlimited tier or manual
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
    const supabase = await createClient()

    // 1. Verify admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== process.env.ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    const adminClient = getAdminClient()
    
    // First, try deleting auth user (this will cascade delete profile in a linked DB setup, or we delete profile manually)
    let deletedAuth = false
    try {
      const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId)
      if (!authDeleteError) {
        deletedAuth = true
      } else {
        console.warn('[Admin User DELETE] Auth service deletion failed (likely mock service role key):', authDeleteError.message)
      }
    } catch (e) {
      console.warn('[Admin User DELETE] Auth delete throw:', e)
    }

    // Delete from profiles (fallback / explicit deletion of database entry)
    const { error: dbDeleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (dbDeleteError) {
      return NextResponse.json({ error: dbDeleteError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: deletedAuth 
        ? 'User fully deleted from Auth and Database' 
        : 'User deleted from Database profiles (auth record might persist if using mock service key)' 
    })

  } catch (err: any) {
    console.error('[Admin Users DELETE Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
