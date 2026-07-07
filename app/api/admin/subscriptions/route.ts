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
    // 1. Verify admin session
    const cookieStore = await cookies()
    const adminToken = cookieStore.get('cognara_admin_session')?.value
    let authorized = false

    if (adminToken) {
      const secretStr = process.env.ADMIN_JWT_SECRET || 'cognara_admin_fallback_secret_key_for_development_39281'
      const secret = new TextEncoder().encode(secretStr)
      try {
        const decoded = await jwtVerify(adminToken, secret)
        if (decoded.payload.adminId) {
          authorized = true
        }
      } catch (err) {
        // Ignored
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getAdminClient()

    // 2. Fetch subscriptions joined with profile details
    const { data: subs, error: dbError } = await supabase
      .from('cognara_subscriptions')
      .select(`
        *,
        profiles (
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (dbError) {
      console.error('Error fetching admin subscriptions:', dbError)
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
    }

    // Fetch total users count for conversion rate calculation
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    const activeSubs = (subs || []).filter((s: any) => s.status === 'active')
    let mrr = 0
    activeSubs.forEach((s: any) => {
      const amountNaira = s.amount_paid ? s.amount_paid / 100 : 0
      if (s.plan === 'pro_yearly' || s.plan === 'pro_annual') {
        mrr += amountNaira / 12
      } else {
        mrr += amountNaira
      }
    })

    const totalUsersCount = totalUsers || 1
    const conversionRate = (activeSubs.length / totalUsersCount) * 100

    const formatted = (subs || []).map((s: any) => {
      const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
      const amountNaira = s.amount_paid ? s.amount_paid / 100 : 0
      return {
        id: s.id,
        user_name: profile?.name || 'Anonymous Student',
        user_email: profile?.email || '',
        plan: s.plan === 'pro_yearly' || s.plan === 'pro_annual' ? 'Pro Annual' : 'Pro Monthly',
        status: s.status || 'inactive',
        amount: `₦${amountNaira.toLocaleString()}`,
        payment_method: 'Paystack',
        started_at: s.started_at ? new Date(s.started_at).toLocaleDateString() : 'N/A'
      }
    })

    return NextResponse.json({
      subscriptions: formatted,
      metrics: {
        mrr,
        activeCount: activeSubs.length,
        conversionRate: parseFloat(conversionRate.toFixed(1))
      }
    })
  } catch (err: any) {
    console.error('[Admin Subscriptions API Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
