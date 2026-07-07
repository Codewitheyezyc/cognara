import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { SignJWT } from 'jose'
import { createClient as createBaseClient } from '@supabase/supabase-js'

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
    const { email, password } = await request.json()

    if (!email || !password) {
      return Response.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()

    // Find admin user
    const { data: admin, error: adminError } = await supabase
      .from('cognara_admin_users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .maybeSingle()

    if (adminError || !admin) {
      return Response.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, admin.password_hash)

    if (!passwordMatch) {
      return Response.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create admin session JWT
    const secretStr = process.env.ADMIN_JWT_SECRET || 'cognara_admin_fallback_secret_key_for_development_39281'
    const secret = new TextEncoder().encode(secretStr)

    const token = await new SignJWT({
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('8h')
      .sign(secret)

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('cognara_admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    })

    // Update last login
    await supabase
      .from('cognara_admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', admin.id)

    // Log the login action
    await supabase.from('cognara_admin_audit_log').insert({
      admin_id: admin.id,
      action: 'admin_login',
      target_type: 'admin_user',
      target_id: admin.id,
      details: { email: admin.email },
      created_at: new Date().toISOString(),
    })

    return Response.json({ success: true })
  } catch (err: any) {
    console.error('[Admin Login API Error]', err)
    return Response.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
