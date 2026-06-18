import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-paystack-signature')

    // Verify webhook is actually from Paystack
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) {
      console.error('PAYSTACK_SECRET_KEY environment variable is not set')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    const hash = crypto
      .createHmac('sha512', secret)
      .update(body)
      .digest('hex')

    if (hash !== signature) {
      console.warn('Invalid signature received for Paystack webhook')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)

    // Initialize Supabase Client with service role to bypass RLS for server update
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials in webhook route')
      return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const eventType: string = event.event
    const data = event.data

    console.log(`Processing Paystack event: ${eventType}`)

    switch (eventType) {
      // Successful one-time or subscription payment
      case 'charge.success': {
        const userEmail: string = data.customer?.email
        const planCode: string = data.plan?.plan_code || data.metadata?.plan_code || ''
        const subscriptionCode: string = data.subscription_code || data.metadata?.subscription_code || ''
        const customerId: string = data.customer?.customer_code || ''

        const MONTHLY_PLAN_CODE = process.env.PAYSTACK_MONTHLY_PLAN_CODE || ''
        const YEARLY_PLAN_CODE = process.env.PAYSTACK_YEARLY_PLAN_CODE || ''
        const tier = planCode === YEARLY_PLAN_CODE ? 'pro_yearly' : 'pro_monthly'

        const { error: chargeError } = await supabase
          .from('profiles')
          .update({
            plan: 'pro',
            subscription_tier: tier,
            subscription_status: 'active',
            subscription_start_date: new Date().toISOString(),
            paystack_customer_code: customerId,
            paystack_subscription_code: subscriptionCode,
          })
          .eq('email', userEmail)

        if (chargeError) {
          console.error('Failed to update user profile on charge.success:', chargeError)
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
        }
        break
      }

      // Subscription renewal
      case 'subscription.create':
      case 'invoice.payment_failed': {
        const userEmail: string = data.customer?.email
        const subscriptionCode: string = data.subscription_code || ''
        const nextPaymentDate: string = data.next_payment_date || ''
        const status = eventType === 'subscription.create' ? 'active' : 'past_due'

        const { error: subError } = await supabase
          .from('profiles')
          .update({
            plan: status === 'active' ? 'pro' : 'free',
            subscription_status: status,
            subscription_end_date: nextPaymentDate || null,
          })
          .eq('paystack_subscription_code', subscriptionCode)
          .or(`email.eq.${userEmail}`)

        if (subError) {
          console.error(`Failed to update user profile on ${eventType}:`, subError)
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
        }
        break
      }

      // Subscription cancellation / disabled
      case 'subscription.disable': {
        const subscriptionCode: string = data.subscription_code || ''
        const nextPaymentDate: string = data.next_payment_date || ''

        const { error: disableError } = await supabase
          .from('profiles')
          .update({
            plan: nextPaymentDate && new Date(nextPaymentDate) > new Date() ? 'pro' : 'free',
            subscription_status: 'cancelled',
            subscription_end_date: nextPaymentDate || null,
          })
          .eq('paystack_subscription_code', subscriptionCode)

        if (disableError) {
          console.error('Failed to update user profile on subscription.disable:', disableError)
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
        }
        break
      }

      default:
        console.log(`Unhandled Paystack webhook event type: ${eventType}`)
    }

    return NextResponse.json({ received: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Error in Paystack webhook handler:', err)
    return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 })
  }
}
