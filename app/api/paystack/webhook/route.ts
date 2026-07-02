import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export async function POST(req: Request) {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) {
      console.error('[Paystack Webhook Error] PAYSTACK_SECRET_KEY is not configured.')
      return NextResponse.json({ error: 'Config missing' }, { status: 500 })
    }

    // 1. Verify Paystack Signature
    const signature = req.headers.get('x-paystack-signature')
    if (!signature) {
      console.warn('[Paystack Webhook Warning] Missing signature header.')
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }

    const payloadText = await req.text()
    const hash = crypto
      .createHmac('sha512', secretKey)
      .update(payloadText)
      .digest('hex')

    if (hash !== signature) {
      console.warn('[Paystack Webhook Warning] Invalid signature hash mismatch.')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const eventData = JSON.parse(payloadText)
    const event = eventData.event
    const txData = eventData.data

    console.log(`[Paystack Webhook] Received event: ${event}`)

    // Initialize Supabase admin client using Service Role key
    const hasServiceKey = 
      process.env.SUPABASE_SERVICE_ROLE_KEY && 
      process.env.SUPABASE_SERVICE_ROLE_KEY !== 'placeholder_service_role_key_for_dev'

    if (!hasServiceKey) {
      console.error('[Paystack Webhook Error] SUPABASE_SERVICE_ROLE_KEY is missing.')
      return NextResponse.json({ error: 'Database access credentials missing' }, { status: 500 })
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const metadata = txData.metadata || {}
    const userId = metadata.user_id
    const planType = metadata.plan || metadata.plan_type || 'monthly'

    if (event === 'charge.success') {
      if (!userId) {
        console.warn('[Paystack Webhook Warning] charge.success missing user_id in metadata.')
        return NextResponse.json({ error: 'Missing user_id metadata' }, { status: 400 })
      }

      const tier = planType === 'annual' ? 'pro_yearly' : 'pro_monthly'
      const subscriptionCode = txData.subscription?.subscription_code || metadata.subscription_code || txData.reference || ''
      const customerCode = txData.customer?.customer_code || ''
      const amount = txData.amount || 0
      const currency = txData.currency || 'NGN'

      const startDate = new Date()
      const endDate = new Date()
      if (planType === 'annual') {
        endDate.setFullYear(startDate.getFullYear() + 1)
      } else {
        endDate.setMonth(startDate.getMonth() + 1)
      }

      console.log(`[Paystack Webhook] Upgrading user ${userId} to ${tier}...`)

      // A. Update Profiles subscription status
      const { error: profileError } = await adminSupabase
        .from('profiles')
        .update({
          plan: 'pro',
          subscription_tier: tier,
          subscription_status: 'active',
          subscription_start_date: startDate.toISOString(),
          subscription_end_date: endDate.toISOString(),
          paystack_customer_code: customerCode,
          paystack_subscription_code: subscriptionCode,
        })
        .eq('id', userId)

      if (profileError) {
        console.error('[Paystack Webhook Error] Failed to update user profile:', profileError)
        return NextResponse.json({ error: 'Profile update failed' }, { status: 500 })
      }

      // B. Insert/Upsert into cognara_subscriptions
      const { error: subError } = await adminSupabase
        .from('cognara_subscriptions')
        .upsert({
          user_id: userId,
          subscription_code: subscriptionCode,
          customer_code: customerCode,
          plan_code: txData.plan?.plan_code || null,
          status: 'active',
          amount: amount,
          currency: currency,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'subscription_code' })

      if (subError) {
        console.error('[Paystack Webhook Error] Failed to insert subscription details:', subError)
        // We do not fail the request since profile update succeeded
      }

      // C. Grant monthly shields
      try {
        await adminSupabase.rpc('grant_monthly_shields')
      } catch (rpcErr) {
        console.error('[Paystack Webhook Error] Failed to grant monthly shields:', rpcErr)
      }

      console.log(`[Paystack Webhook] User ${userId} upgraded successfully.`)
    }

    // ── subscription.create — save subscription & customer codes ─────────────
    else if (event === 'subscription.create') {
      const subUserId = txData.metadata?.user_id
      const subscriptionCode = txData.subscription_code
      const customerCode = txData.customer?.customer_code

      console.log(`[Paystack Webhook] subscription.create — sub_code: ${subscriptionCode}, customer: ${customerCode}`)

      if (subUserId && subscriptionCode) {
        const { error: codeUpdateErr } = await adminSupabase
          .from('cognara_subscriptions')
          .update({
            subscription_code: subscriptionCode,
            customer_code: customerCode || null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', subUserId)
          .eq('status', 'active')

        if (codeUpdateErr) {
          console.error('[Paystack Webhook Error] Failed to save subscription codes:', codeUpdateErr)
        }

        // Also keep profiles table in sync with customer code
        if (customerCode) {
          await adminSupabase
            .from('profiles')
            .update({ paystack_customer_code: customerCode, paystack_subscription_code: subscriptionCode })
            .eq('id', subUserId)
        }
      }
    }

    // ── invoice.payment_failed — recurring charge failed, send retry email ────
    else if (event === 'invoice.payment_failed') {
      const email = txData.customer?.email
      const customerCode = txData.customer?.customer_code
      console.warn(`[Paystack Webhook] invoice.payment_failed for customer: ${customerCode} (${email})`)

      if (email && process.env.RESEND_API_KEY) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY)
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.cognaralearn.com'

          await resend.emails.send({
            from: 'Cognara Payments <hello@cognaralearn.com>',
            to: email,
            subject: 'Action required — Cognara Pro renewal payment failed',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
                <h2 style="color: #f59e0b; font-size: 20px; font-weight: bold; margin-top: 0;">Renewal Payment Failed ⚠️</h2>
                <p>Hello,</p>
                <p>We were unable to charge your card for your <strong>Cognara Pro</strong> renewal. This can happen if your card has expired or your bank declined the charge.</p>
                <p>Paystack will automatically retry the charge. If three attempts fail, your subscription will be cancelled and your account will revert to the free plan.</p>
                <p><strong>To avoid losing access, please update your payment method:</strong></p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${appUrl}/dashboard/settings" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Update Payment Method</a>
                </div>
                <p>If you have any questions, contact us at hello@cognaralearn.com.</p>
                <p>Best regards,<br>The Cognara Team</p>
              </div>
            `,
          })
          console.log('[Paystack Webhook] Sent invoice.payment_failed retry email.')
        } catch (err: any) {
          console.error('[Paystack Webhook Error] Failed to send retry email:', err.message)
        }
      }
    }

    // ── subscription.disable — all retries failed, downgrade to free ──────────
    else if (event === 'subscription.disable') {
      const customerCode = txData.customer?.customer_code
      const email = txData.customer?.email
      console.warn(`[Paystack Webhook] subscription.disable — downgrading customer: ${customerCode}`)

      // Look up the user by customer code in cognara_subscriptions
      const { data: subRow, error: lookupErr } = await adminSupabase
        .from('cognara_subscriptions')
        .select('user_id')
        .eq('customer_code', customerCode)
        .maybeSingle()

      if (lookupErr) {
        console.error('[Paystack Webhook Error] Failed to look up subscription by customer_code:', lookupErr)
      }

      // Fallback: look up in profiles table
      let resolvedUserId = subRow?.user_id
      if (!resolvedUserId && customerCode) {
        const { data: profileRow } = await adminSupabase
          .from('profiles')
          .select('id')
          .eq('paystack_customer_code', customerCode)
          .maybeSingle()
        resolvedUserId = profileRow?.id
      }

      if (resolvedUserId) {
        // Expire the subscription record
        await adminSupabase
          .from('cognara_subscriptions')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('user_id', resolvedUserId)
          .eq('status', 'active')

        // Downgrade profile to free
        await adminSupabase
          .from('profiles')
          .update({
            plan: 'free',
            subscription_tier: 'free',
            subscription_status: 'expired',
          })
          .eq('id', resolvedUserId)

        console.log(`[Paystack Webhook] User ${resolvedUserId} downgraded to free due to subscription.disable.`)

        // Send cancellation email
        if (email && process.env.RESEND_API_KEY) {
          try {
            const resend = new Resend(process.env.RESEND_API_KEY)
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.cognaralearn.com'

            await resend.emails.send({
              from: 'Cognara Payments <hello@cognaralearn.com>',
              to: email,
              subject: 'Your Cognara Pro subscription has ended',
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
                  <h2 style="color: #ef4444; font-size: 20px; font-weight: bold; margin-top: 0;">Subscription Ended</h2>
                  <p>Hello,</p>
                  <p>We were unable to process your Cognara Pro renewal after multiple attempts. Your subscription has been cancelled and your account has been moved to the free plan.</p>
                  <p>Your progress, streaks, and learning history are all safely saved. You can resubscribe at any time to get full Pro access back immediately.</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${appUrl}/dashboard/settings" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Resubscribe to Pro</a>
                  </div>
                  <p>Questions? Email us at hello@cognaralearn.com.</p>
                  <p>Best regards,<br>The Cognara Team</p>
                </div>
              `,
            })
            console.log('[Paystack Webhook] Sent subscription.disable downgrade email.')
          } catch (err: any) {
            console.error('[Paystack Webhook Error] Failed to send cancellation email:', err.message)
          }
        }
      } else {
        console.warn(`[Paystack Webhook] subscription.disable — could not find user for customer_code: ${customerCode}`)
      }
    }

    // ── charge.failed — one-time payment failure notification ─────────────────
    else if (event === 'charge.failed') {
      const email = txData.customer?.email
      console.warn(`[Paystack Webhook] charge.failed event received for email: ${email}`)

      if (email && process.env.RESEND_API_KEY) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY)
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.cognaralearn.com'

          await resend.emails.send({
            from: 'Cognara Payments <hello@cognaralearn.com>',
            to: email,
            subject: 'Cognara Pro Upgrade Payment Failed ❌',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <h2 style="color: #ef4444; margin-top: 10px; font-size: 20px; font-weight: bold;">Payment Attempt Failed ❌</h2>
                </div>
                <p>Hello,</p>
                <p>We noticed that your recent payment attempt for <strong>Cognara Pro</strong> did not go through successfully.</p>
                <p>This could be due to standard network timeouts, card authorization challenges, or bank limits. Rest assured, your card has not been charged, and your free learning goal features remain fully active.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${appUrl}/dashboard/payment-failure?plan=${planType}" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Try Upgrade Again</a>
                </div>
                <p>If you have any questions, feel free to contact us at hello@cognaralearn.com.</p>
                <p>Best regards,<br>The Cognara Team</p>
              </div>
            `,
          })
          console.log('[Paystack Webhook] Sent charge.failed notification email.')
        } catch (err: any) {
          console.error('[Paystack Webhook Error] Failed to send failed notification email:', err.message)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[Paystack Webhook Error] Fatal handler error:', err)
    return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 })
  }
}
