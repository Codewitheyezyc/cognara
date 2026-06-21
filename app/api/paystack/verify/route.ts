import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createBaseClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { reference } = await req.json()
    if (!reference) {
      return NextResponse.json({ error: 'Missing reference' }, { status: 400 })
    }

    // 1. Get the authenticated user's session
    const serverSupabase = await createServerClient()
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Call Paystack API to verify the transaction
    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json({ error: 'Paystack secret key is missing' }, { status: 500 })
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    })

    const data = await response.json()

    if (!data.status || data.data.status !== 'success') {
      return NextResponse.json({ error: 'Transaction verification failed' }, { status: 400 })
    }

    const txData = data.data
    const txUserId = txData.metadata?.user_id

    // 3. Verify user matches the transaction metadata
    if (txUserId !== user.id) {
      return NextResponse.json({ error: 'Transaction owner mismatch' }, { status: 403 })
    }

    // 4. Determine subscription tier and status
    const planType = txData.metadata?.plan_type || 'monthly'
    const subscriptionCode = txData.subscription?.subscription_code || txData.metadata?.subscription_code || ''
    const customerCode = txData.customer?.customer_code || ''
    const tier = planType === 'annual' ? 'pro_yearly' : 'pro_monthly'

    // 5. Update user's profile with elevated service role client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const adminSupabase = createBaseClient(supabaseUrl, supabaseServiceKey)

    const { data: updatedProfile, error: dbError } = await adminSupabase
      .from('profiles')
      .update({
        plan: 'pro',
        subscription_tier: tier,
        subscription_status: 'active',
        subscription_start_date: new Date().toISOString(),
        paystack_customer_code: customerCode,
        paystack_subscription_code: subscriptionCode,
      })
      .eq('id', user.id)
      .select()
      .single()

    if (dbError) {
      console.error('Failed to update profile on transaction verify:', dbError)
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
    }

    // 6. Grant monthly shields
    try {
      await adminSupabase.rpc('grant_monthly_shields')
    } catch (rpcErr) {
      console.error('Failed to grant monthly shields via RPC:', rpcErr)
    }

    return NextResponse.json({ success: true, profile: updatedProfile })

  } catch (err: any) {
    console.error('Error verifying Paystack transaction:', err)
    return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 })
  }
}
