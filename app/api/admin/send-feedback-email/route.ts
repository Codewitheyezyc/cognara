import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import React from 'react'
import { FeedbackEmail } from '@/emails/FeedbackEmail'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cognaralearn.com'

// Rate limit: Resend free tier allows 2 emails/sec — we add a small delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Admin guard
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== process.env.ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Optional: Allow a dry run to preview without sending
    const body = await request.json().catch(() => ({}))
    const dryRun = body?.dryRun === true

    // 3. Fetch all non-pro users with a real email
    const { data: users, error: dbError } = await supabase
      .from('profiles')
      .select('id, name, email, subscription_tier, plan')
      .not('email', 'is', null)

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    // Filter to free/non-pro users only
    const freeUsers = users.filter(u => {
      const tier = u.subscription_tier || u.plan || 'free'
      return tier === 'free' || tier === null || tier === ''
    })

    if (dryRun) {
      // Return the list of recipients without sending
      return NextResponse.json({
        dryRun: true,
        totalUsers: freeUsers.length,
        recipients: freeUsers.map(u => ({ name: u.name, email: u.email }))
      })
    }

    // 4. Send emails in sequence with small delay to respect rate limits
    const results: { email: string; status: 'sent' | 'failed'; error?: string }[] = []

    for (const user of freeUsers) {
      if (!user.email) continue

      try {
        await resend.emails.send({
          from: 'Isaac from Cognara <hello@cognaralearn.com>',
          to: user.email,
          replyTo: 'hello@cognaralearn.com',
          subject: "What do you actually think of Cognara? 🧠",
          react: React.createElement(FeedbackEmail, {
            userName: user.name || 'there',
            appUrl
          })
        })

        results.push({ email: user.email, status: 'sent' })
        console.log(`[Feedback Email] Sent to ${user.email}`)
      } catch (err: any) {
        results.push({ email: user.email, status: 'failed', error: err.message })
        console.error(`[Feedback Email] Failed for ${user.email}:`, err.message)
      }

      // Small delay to avoid Resend rate limits
      await sleep(600)
    }

    const sent = results.filter(r => r.status === 'sent').length
    const failed = results.filter(r => r.status === 'failed').length

    return NextResponse.json({
      success: true,
      totalUsers: freeUsers.length,
      sent,
      failed,
      results
    })

  } catch (err: any) {
    console.error('[Feedback Email Blast Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
