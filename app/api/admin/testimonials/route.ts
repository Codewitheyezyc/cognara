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

    const { data, error } = await supabase
      .from('cognara_testimonials')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ testimonials: data || [] })
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

    const { id, is_approved } = await req.json()
    if (!id) {
      return NextResponse.json({ error: 'Missing testimonial ID' }, { status: 400 })
    }

    const supabase = getAdminClient()

    const { error } = await supabase
      .from('cognara_testimonials')
      .update({ is_approved })
      .eq('id', id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[Admin Testimonials POST Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
