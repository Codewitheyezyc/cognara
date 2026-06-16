import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    // 1. Verify admin
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ADMIN_USER_ID = process.env.ADMIN_USER_ID
    if (user.id !== ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Clear all quizzes from the database
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // matches all UUIDs

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'All quiz cache cleared. Quizzes will regenerate on next attempt.'
    })
  } catch (err) {
    console.error('[Admin Regenerate All Quizzes Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
