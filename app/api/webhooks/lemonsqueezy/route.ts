import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-signature')

    // Verify webhook is actually from Lemonsqueezy
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
    if (!secret) {
      console.error('LEMONSQUEEZY_WEBHOOK_SECRET environment variable is not set')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    const hmac = crypto.createHmac('sha256', secret)
    const digest = hmac.update(body).digest('hex')

    if (signature !== digest) {
      console.warn('Invalid signature received for Lemonsqueezy webhook')
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

    const eventType = event.meta.event_name
    const customerId = event.data.attributes.customer_id
    const subscriptionId = event.data.id
    const userEmail = event.data.attributes.user_email
    const variantId = String(event.data.attributes.variant_id)
    const status = event.data.attributes.status
    const endsAt = event.data.attributes.ends_at

    // Determine plan from variant ID
    const MONTHLY_VARIANT_ID = String(process.env.LEMONSQUEEZY_MONTHLY_VARIANT_ID || '')
    const YEARLY_VARIANT_ID = String(process.env.LEMONSQUEEZY_YEARLY_VARIANT_ID || '')

    const tier = variantId === YEARLY_VARIANT_ID ? 'pro_yearly' : 'pro_monthly'

    console.log(`Processing Lemonsqueezy event ${eventType} for ${userEmail} (variant: ${variantId})`)

    switch (eventType) {
      case 'subscription_created':
      case 'subscription_updated':
        const { error: upsertError } = await supabase
          .from('profiles')
          .update({
            subscription_tier: tier,
            subscription_status: status === 'active' ? 'active' : 'inactive',
            subscription_start_date: new Date().toISOString(),
            subscription_end_date: endsAt,
            lemonsqueezy_customer_id: String(customerId),
            lemonsqueezy_subscription_id: String(subscriptionId)
          })
          .eq('email', userEmail)

        if (upsertError) {
          console.error('Failed to update user profile on subscription update/create:', upsertError)
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
        }
        break

      case 'subscription_cancelled':
        const { error: cancelError } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'cancelled',
            subscription_end_date: endsAt
          })
          .eq('lemonsqueezy_subscription_id', String(subscriptionId))

        if (cancelError) {
          console.error('Failed to update user profile on subscription cancel:', cancelError)
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
        }
        break

      case 'subscription_expired':
        const { error: expireError } = await supabase
          .from('profiles')
          .update({
            subscription_tier: 'free',
            subscription_status: 'inactive',
            subscription_end_date: endsAt
          })
          .eq('lemonsqueezy_subscription_id', String(subscriptionId))

        if (expireError) {
          console.error('Failed to update user profile on subscription expire:', expireError)
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
        }
        break
      
      default:
        console.log(`Unhandled Lemonsqueezy webhook event type: ${eventType}`)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Error in Lemonsqueezy webhook handler:', err)
    return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 })
  }
}
