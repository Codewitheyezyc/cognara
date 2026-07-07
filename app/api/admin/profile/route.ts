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

async function getAdminIdFromSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('cognara_admin_session')?.value
  if (!token) return null

  const secretStr = process.env.ADMIN_JWT_SECRET || 'cognara_admin_fallback_secret_key_for_development_39281'
  const secret = new TextEncoder().encode(secretStr)
  try {
    const { payload } = await jwtVerify(token, secret)
    return (payload.adminId as string) || null
  } catch (err) {
    return null
  }
}

export async function GET() {
  try {
    const adminId = await getAdminIdFromSession()
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getAdminClient()
    const { data: admin, error } = await supabase
      .from('cognara_admin_users')
      .select('id, email, full_name, role, avatar_url')
      .eq('id', adminId)
      .maybeSingle()

    if (error || !admin) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 })
    }

    return NextResponse.json({ admin })
  } catch (err: any) {
    console.error('[Admin Profile GET Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const adminId = await getAdminIdFromSession()
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fullName, avatarUrl } = await req.json()
    if (!fullName) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    }

    const supabase = getAdminClient()
    const { error } = await supabase
      .from('cognara_admin_users')
      .update({
        full_name: fullName,
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', adminId)

    if (error) {
      console.error('Error updating admin profile:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully' })
  } catch (err: any) {
    console.error('[Admin Profile PUT Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
