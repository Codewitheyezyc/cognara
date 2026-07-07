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

export async function GET() {
  try {
    // 1. Authenticate Admin Session JWT
    const cookieStore = await cookies()
    const adminToken = cookieStore.get('cognara_admin_session')?.value

    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const secretStr = process.env.ADMIN_JWT_SECRET || 'cognara_admin_fallback_secret_key_for_development_39281'
    const secret = new TextEncoder().encode(secretStr)

    try {
      await jwtVerify(adminToken, secret)
    } catch (err) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const supabase = getAdminClient()

    // 2. Fetch logs joined with admin users details
    const { data: logs, error: dbError } = await supabase
      .from('cognara_admin_audit_log')
      .select(`
        *,
        cognara_admin_users (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (dbError) {
      console.error('Error fetching admin logs:', dbError)
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
    }

    const formattedLogs = (logs || []).map((l: any) => ({
      ...l,
      admin: Array.isArray(l.cognara_admin_users) ? l.cognara_admin_users[0] : l.cognara_admin_users
    }))

    return NextResponse.json({ logs: formattedLogs })
  } catch (err: any) {
    console.error('[Admin Logs Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
