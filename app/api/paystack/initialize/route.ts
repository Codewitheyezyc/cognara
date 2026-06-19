import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { plan, cancelUrl } = await req.json()

    if (!plan || !['monthly', 'annual'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan. Must be "monthly" or "annual".' }, { status: 400 })
    }

    // Get the authenticated user's email from Supabase session
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user?.email) {
      return NextResponse.json({ error: 'You must be logged in to subscribe.' }, { status: 401 })
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json({ error: 'Payment configuration missing.' }, { status: 500 })
    }

    const planCode = plan === 'annual'
      ? process.env.PAYSTACK_ANNUAL_PLAN_CODE
      : process.env.PAYSTACK_MONTHLY_PLAN_CODE

    if (!planCode) {
      return NextResponse.json({ error: 'Plan code not configured.' }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.cognaralearn.com'
    const callbackUrl = `${appUrl}/dashboard/settings?payment=success&plan=${plan}`
    const cancelAction = cancelUrl || `${appUrl}/dashboard/settings`

    // Initialize Paystack transaction
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: plan === 'annual' ? 4500000 : 450000, // in kobo: ₦45,000 annual, ₦4,500 monthly
        plan: planCode,
        callback_url: callbackUrl,
        metadata: {
          user_id: user.id,
          plan_type: plan,
          cancel_action: cancelAction,
        },
      }),
    })

    const data = await response.json()

    if (!data.status || !data.data?.authorization_url) {
      console.error('Paystack initialize failed:', data)
      return NextResponse.json({ error: data.message || 'Failed to initialize payment.' }, { status: 502 })
    }

    return NextResponse.json({
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Error initializing Paystack transaction:', err)
    return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 })
  }
}
