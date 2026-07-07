import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient as createBaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const dynamic = 'force-dynamic'

const getAdminClient = () => {
  return createBaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'placeholder_service_role_key_for_dev'
      ? process.env.SUPABASE_SERVICE_ROLE_KEY
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Authorization Helper
async function verifyAdminAccess() {
  // 1. Check administrative JWT cookie session
  const cookieStore = await cookies()
  const token = cookieStore.get('cognara_admin_session')?.value
  if (token) {
    const secretStr = process.env.ADMIN_JWT_SECRET || 'cognara_admin_fallback_secret_key_for_development_39281'
    const secret = new TextEncoder().encode(secretStr)
    try {
      const decoded = await jwtVerify(token, secret)
      if (decoded.payload.adminId) {
        return true
      }
    } catch (e) {
      // Fallback
    }
  }

  // 2. Fallback check for standard admin users
  try {
    const supabase = getAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user && (user.id === process.env.ADMIN_USER_ID || user.id === process.env.NEXT_PUBLIC_ADMIN_USER_ID)) {
      return true
    }
  } catch (e) {
    // Ignored
  }

  return false
}

export async function GET() {
  try {
    const authorized = await verifyAdminAccess()
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getAdminClient()

    const { data: testimonials, error } = await supabase
      .from('cognara_testimonials')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: setting } = await supabase
      .from('cognara_settings')
      .select('value')
      .eq('key', 'max_homepage_testimonials')
      .maybeSingle()

    return NextResponse.json({ 
      testimonials: testimonials || [],
      maxVisible: setting?.value ? Number(setting.value) : 6
    })
  } catch (err: any) {
    console.error('[Admin Testimonials GET Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const authorized = await verifyAdminAccess()
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, action, value } = body

    const supabase = getAdminClient()

    // Retrieve active admin user ID for audit log
    const cookieStore = await cookies()
    const token = cookieStore.get('cognara_admin_session')?.value
    let adminId = '4c1fbae5-c423-42e7-8394-1112fe00d42e'
    if (token) {
      const secretStr = process.env.ADMIN_JWT_SECRET || 'cognara_admin_fallback_secret_key_for_development_39281'
      const secret = new TextEncoder().encode(secretStr)
      try {
        const decoded = await jwtVerify(token, secret)
        if (decoded.payload.adminId) {
          adminId = decoded.payload.adminId as string
        }
      } catch (e) {}
    }

    if (action === 'update_max_visible') {
      const { error } = await supabase
        .from('cognara_settings')
        .upsert({
          key: 'max_homepage_testimonials',
          value: String(value)
        }, { onConflict: 'key' })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      await supabase.from('cognara_admin_audit_log').insert({
        admin_id: adminId,
        action: 'updated_settings',
        target_type: 'settings',
        target_id: 'max_homepage_testimonials',
        details: { value },
        created_at: new Date().toISOString()
      })

      return NextResponse.json({ success: true })
    }

    if (!id) {
      return NextResponse.json({ error: 'Missing testimonial ID' }, { status: 400 })
    }

    if (action === 'approve') {
      const { error } = await supabase
        .from('cognara_testimonials')
        .update({
          is_approved: true,
          is_visible: true,
          approved_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Send approval email to user if linked profile has email
      const { data: testimonial } = await supabase
        .from('cognara_testimonials')
        .select('*, profiles(email, name)')
        .eq('id', id)
        .maybeSingle()

      if (testimonial?.profiles?.email && process.env.RESEND_API_KEY) {
        try {
          await resend.emails.send({
            from: 'Cognara <hello@cognaralearn.com>',
            to: testimonial.profiles.email,
            subject: 'Your Cognara testimonial is live 🎉',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px; background: #ffffff; color: #333333;">
                <h2 style="color: #3D6AFF; border-bottom: 2px solid #eaeaea; padding-bottom: 10px;">Your Testimonial is Approved!</h2>
                <p>Hi ${testimonial.profiles.name || 'Learner'},</p>
                <p>Your testimonial has been approved and is now live on the Cognara homepage.</p>
                <p>Thank you for sharing your experience. Your story helps others who are just starting their journey.</p>
                <p>— The Cognara Team</p>
              </div>
            `
          })
        } catch (mailErr: any) {
          console.error('[Admin Testimonial Mail Error]', mailErr.message)
        }
      }

      await supabase.from('cognara_admin_audit_log').insert({
        admin_id: adminId,
        action: 'approved_testimonial',
        target_type: 'testimonial',
        target_id: id,
        created_at: new Date().toISOString()
      })
    } else if (action === 'hide') {
      const { error } = await supabase
        .from('cognara_testimonials')
        .update({
          is_visible: false,
          removed_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      await supabase.from('cognara_admin_audit_log').insert({
        admin_id: adminId,
        action: 'hidden_testimonial',
        target_type: 'testimonial',
        target_id: id,
        created_at: new Date().toISOString()
      })
    } else if (action === 'show') {
      const { error } = await supabase
        .from('cognara_testimonials')
        .update({
          is_visible: true
        })
        .eq('id', id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      await supabase.from('cognara_admin_audit_log').insert({
        admin_id: adminId,
        action: 'shown_testimonial',
        target_type: 'testimonial',
        target_id: id,
        created_at: new Date().toISOString()
      })
    } else if (action === 'delete') {
      const { error } = await supabase
        .from('cognara_testimonials')
        .delete()
        .eq('id', id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      await supabase.from('cognara_admin_audit_log').insert({
        admin_id: adminId,
        action: 'deleted_testimonial',
        target_type: 'testimonial',
        target_id: id,
        created_at: new Date().toISOString()
      })
    } else {
      return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[Admin Testimonials POST Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
