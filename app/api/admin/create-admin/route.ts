import bcrypt from 'bcryptjs'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient as createBaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

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

    const currentAdminId = payload.adminId
    const supabase = getAdminClient()

    // Verify current admin is active and has super_admin permission
    const { data: currentAdmin } = await supabase
      .from('cognara_admin_users')
      .select('*')
      .eq('id', currentAdminId)
      .eq('is_active', true)
      .maybeSingle()

    if (!currentAdmin || currentAdmin.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 })
    }

    // 2. Parse request body
    const { email, password, fullName, role = 'admin' } = await request.json()

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // 3. Verify user doesn't already exist
    const { data: existingAdmin } = await supabase
      .from('cognara_admin_users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingAdmin) {
      return NextResponse.json({ error: 'An admin with this email already exists' }, { status: 400 })
    }

    // 4. Hash password and insert
    const passwordHash = await bcrypt.hash(password, 12)

    const { data: newAdmin, error: insertError } = await supabase
      .from('cognara_admin_users')
      .insert({
        email,
        password_hash: passwordHash,
        full_name: fullName,
        role,
        is_active: true
      })
      .select('id, email, full_name, role')
      .single()

    if (insertError) {
      console.error('Error inserting admin user:', insertError)
      return NextResponse.json({ error: 'Failed to create admin user' }, { status: 500 })
    }

    // 5. Log action
    await supabase.from('cognara_admin_audit_log').insert({
      admin_id: currentAdminId,
      action: 'created_admin_user',
      target_type: 'admin_user',
      target_id: newAdmin.id,
      details: { email: newAdmin.email, role: newAdmin.role },
      created_at: new Date().toISOString()
    })

    return NextResponse.json({ success: true, admin: newAdmin })
  } catch (err: any) {
    console.error('[Admin Create User Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
