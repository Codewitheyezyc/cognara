import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient as createBaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

const getAdminClient = () => {
  return createBaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'placeholder_service_role_key_for_dev'
      ? process.env.SUPABASE_SERVICE_ROLE_KEY
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate Admin Session JWT
    const cookieStore = await cookies()
    const adminToken = cookieStore.get('cognara_admin_session')?.value

    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const secretStr = process.env.ADMIN_JWT_SECRET || 'cognara_admin_fallback_secret_key_for_development_39281'
    const secret = new TextEncoder().encode(secretStr)

    let payload: any
    try {
      const decoded = await jwtVerify(adminToken, secret)
      payload = decoded.payload
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
    }

    const adminId = payload.adminId
    const supabase = getAdminClient()

    // Verify admin is active
    const { data: admin } = await supabase
      .from('cognara_admin_users')
      .select('*')
      .eq('id', adminId)
      .eq('is_active', true)
      .maybeSingle()

    if (!admin) {
      return NextResponse.json({ error: 'Admin account inactive' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'send') {
      const { to, subject, html } = body
      if (!to || !subject || !html) {
        return NextResponse.json({ error: 'To, subject, and html body are required' }, { status: 400 })
      }

      if (!process.env.RESEND_API_KEY) {
        return NextResponse.json({ error: 'Resend API Key not configured' }, { status: 500 })
      }

      await resend.emails.send({
        from: 'Isaac from Cognara <hello@cognaralearn.com>',
        to,
        replyTo: 'hello@cognaralearn.com',
        subject,
        html
      })

      return NextResponse.json({ success: true })
    } else if (action === 'log') {
      const { subject, audience, total_recipients, sent, failed } = body

      const { error: logErr } = await supabase
        .from('cognara_admin_audit_log')
        .insert({
          admin_id: adminId,
          action: 'sent_broadcast_email',
          target_type: 'broadcast',
          target_id: 'all',
          details: {
            subject,
            audience,
            total_recipients,
            sent,
            failed
          },
          created_at: new Date().toISOString()
        })

      if (logErr) {
        console.error('[Admin Broadcast Log] DB Error:', logErr)
        return NextResponse.json({ error: logErr.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 })
    }
  } catch (err: any) {
    console.error('[Admin Broadcast API Error]', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
