import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

// Create Supabase Admin client to bypass RLS for system operations
function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Mock push notification sender
async function sendPushNotification(userId: string, payload: { title: string; body: string; url: string }) {
  console.log(`[Push Notification Mock] Sent to user ${userId}:`, payload)
  return { success: true }
}

// Award CXP and log event
async function awardCXP(userId: string, amount: number, source: string, description: string) {
  const adminDb = createAdminClient()

  // 1. Insert into CXP events log
  await adminDb
    .from('cognara_cxp_events')
    .insert({
      user_id: userId,
      amount: amount,
      source: source,
      description: description,
      created_at: new Date().toISOString()
    })

  // 2. Increment user total CXP via RPC function
  await adminDb.rpc('increment_user_cxp', {
    user_id_input: userId,
    amount_input: amount
  })
}

// Notify referrer of successful conversion
async function notifyReferrer(referrerUserId: string) {
  const adminDb = createAdminClient()

  // 1. Fetch referrer profile details
  const { data: referrer } = await adminDb
    .from('profiles')
    .select('name, email')
    .eq('id', referrerUserId)
    .maybeSingle()

  if (!referrer) return

  const firstName = referrer.name?.split(' ')[0] || 'Learner'

  // 2. Send push notification
  await sendPushNotification(referrerUserId, {
    title: 'Your referral paid off 🎉',
    body: 'Someone you invited just completed their first Cognara lesson. You earned +200 CXP.',
    url: '/dashboard'
  })

  // 3. Insert in-app notification record
  await adminDb
    .from('cognara_notifications')
    .insert({
      user_id: referrerUserId,
      type: 'referral_converted',
      title: '🎉 +200 CXP earned',
      message: 'Someone you invited completed their first lesson.',
      is_read: false,
      action_url: '/profile',
      created_at: new Date().toISOString()
    })

  // 4. Send email notification via Resend
  if (referrer.email && process.env.RESEND_API_KEY) {
    try {
      await resend.emails.send({
        from: 'Cognara <referrals@cognaralearn.com>',
        to: referrer.email,
        subject: '🎉 Your Cognara referral paid off — +200 CXP earned',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px; background: #ffffff; color: #333333;">
            <p>Hi ${firstName},</p>
            
            <p>Someone you invited to Cognara just completed their first lesson.</p>
            
            <p><strong>+200 CXP has been added to your account.</strong></p>
            
            <p>Keep sharing — every friend you bring to Cognara earns you more CXP.</p>
            
            <p style="margin-top: 25px;">
              <a href="https://www.cognaralearn.com/dashboard/profile" style="background: #3D6AFF; color: #ffffff; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                View My Referrals
              </a>
            </p>
            
            <p style="margin-top: 30px; border-top: 1px solid #eaeaea; padding-top: 15px; color: #888888; font-size: 12px;">
              — The Cognara Team
            </p>
          </div>
        `
      })
      console.log(`[Resend Referrals] Sent reward notification email to ${referrer.email}`)
    } catch (err: any) {
      console.error('[Resend Referrals Error] Failed to send email:', err.message)
    }
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await req.json()
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 })
    }

    const adminDb = createAdminClient()

    // 1. Find referral record for this user
    const { data: referral, error } = await adminDb
      .from('cognara_referrals')
      .select('*')
      .eq('referred_user_id', userId)
      .eq('status', 'signed_up')
      .maybeSingle()

    // If no referral found — user signed up organically
    if (error || !referral) {
      return NextResponse.json({ success: true, message: 'Organic user signup (no pending referral found).' })
    }

    // 2. Check 30 day expiry
    const signedUpAt = new Date(referral.created_at)
    const now = new Date()
    const daysSinceSignup = (now.getTime() - signedUpAt.getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceSignup > 30) {
      await adminDb
        .from('cognara_referrals')
        .update({ status: 'expired' })
        .eq('id', referral.id)
      return NextResponse.json({ success: true, message: 'Referral link expired (> 30 days).' })
    }

    // 3. Check monthly referral cap for referrer (50 referrals)
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    const { count: monthlyReferrals } = await adminDb
      .from('cognara_referrals')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_user_id', referral.referrer_user_id)
      .eq('status', 'completed_first_lesson')
      .gte('converted_at', thisMonth.toISOString())

    const referralsCount = monthlyReferrals || 0

    if (referralsCount >= 50) {
      // Cap reached — still mark converted but award no CXP
      await adminDb
        .from('cognara_referrals')
        .update({ status: 'completed_first_lesson', converted_at: now.toISOString() })
        .eq('id', referral.id)
      return NextResponse.json({ success: true, message: 'Monthly referral cap reached (50 limit).' })
    }

    // 4. Check self referral
    if (referral.referrer_user_id === userId) {
      return NextResponse.json({ error: 'Self referral detected' }, { status: 400 })
    }

    // 5. All checks passed — update status
    await adminDb
      .from('cognara_referrals')
      .update({
        status: 'completed_first_lesson',
        converted_at: now.toISOString()
      })
      .eq('id', referral.id)

    // 6. Award CXP to referrer & referred user in parallel
    await Promise.all([
      // Award referrer
      (async () => {
        if (!referral.referrer_cxp_awarded) {
          await awardCXP(
            referral.referrer_user_id,
            200,
            'referral_conversion',
            'Referral converted — friend completed first lesson'
          )
          await adminDb
            .from('cognara_referrals')
            .update({ referrer_cxp_awarded: true })
            .eq('id', referral.id)

          // Notify referrer
          await notifyReferrer(referral.referrer_user_id)
        }
      })(),

      // Award referred user
      (async () => {
        if (!referral.referred_cxp_awarded) {
          await awardCXP(
            userId,
            100,
            'referral_welcome_bonus',
            'Welcome bonus — you were referred by a friend'
          )
          await adminDb
            .from('cognara_referrals')
            .update({ referred_cxp_awarded: true })
            .eq('id', referral.id)
        }
      })()
    ])

    return NextResponse.json({ success: true, converted: true })
  } catch (error: any) {
    // Log error but never crash the lesson completion flow
    console.error('Referral conversion error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
