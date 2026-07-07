import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canUserWriteBlog } from '@/lib/blog/eligibility'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eligibility = await canUserWriteBlog(user.id, supabase)
    return NextResponse.json({ eligibility })
  } catch (err: any) {
    console.error('[Blog Eligibility API Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
