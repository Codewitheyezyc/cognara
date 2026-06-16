import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Verify admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== process.env.ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Database Ping (calculate latency)
    const dbStart = Date.now()
    const { error: dbPingError } = await supabase.from('profiles').select('id').limit(1)
    const dbLatency = Date.now() - dbStart
    const dbStatus = dbPingError ? 'Offline' : 'Online'

    // 3. Env variables checks
    const envCheck = {
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      ADMIN_USER_ID: !!process.env.ADMIN_USER_ID,
      NEXT_PUBLIC_ADMIN_USER_ID: !!process.env.NEXT_PUBLIC_ADMIN_USER_ID
    }

    // 4. API Usage Logs
    // Today (last 24 hours)
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    const { data: todayLogs, error: todayLogsErr } = await supabase
      .from('api_usage_log')
      .select('tokens_used, cost_usd, created_at')
      .gte('created_at', twentyFourHoursAgo.toISOString())

    const todayCalls = todayLogs?.length || 0
    const todayTokens = todayLogs?.reduce((sum, log) => sum + (log.tokens_used || 0), 0) || 0
    const todayCostUsd = todayLogs?.reduce((sum, log) => sum + Number(log.cost_usd || 0), 0) || 0

    // Monthly so far (since start of current month)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: monthlyLogs, error: monthlyLogsErr } = await supabase
      .from('api_usage_log')
      .select('tokens_used, cost_usd')
      .gte('created_at', startOfMonth.toISOString())

    const monthlyCalls = monthlyLogs?.length || 0
    const monthlyTokens = monthlyLogs?.reduce((sum, log) => sum + (log.tokens_used || 0), 0) || 0
    const monthlyCostUsd = monthlyLogs?.reduce((sum, log) => sum + Number(log.cost_usd || 0), 0) || 0

    // Last used API call time
    const { data: lastCall } = await supabase
      .from('api_usage_log')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const lastUsedTimeStr = lastCall?.created_at || null

    return NextResponse.json({
      db: {
        status: dbStatus,
        latency: `${dbLatency}ms`
      },
      envCheck,
      usage: {
        today: {
          calls: todayCalls,
          tokens: todayTokens,
          costUsd: Number(todayCostUsd.toFixed(4)),
          costNaira: Math.round(todayCostUsd * 1500)
        },
        monthly: {
          calls: monthlyCalls,
          tokens: monthlyTokens,
          costUsd: Number(monthlyCostUsd.toFixed(4)),
          costNaira: Math.round(monthlyCostUsd * 1500)
        },
        lastUsed: lastUsedTimeStr
      }
    })

  } catch (err: any) {
    console.error('[Admin System GET Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
