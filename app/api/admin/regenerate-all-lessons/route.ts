import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Admin only route — clears content from all lessons so they
// regenerate fresh when users open them

export async function POST(req: Request) {
  try {
    // Verify admin
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ADMIN_USER_ID = process.env.ADMIN_USER_ID
    if (user.id !== ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Clear all lesson content so it regenerates on next open
    const { error } = await supabase
      .from('lessons')
      .update({ content: null, generated_at: null })
      .neq('id', '00000000-0000-0000-0000-000000000000') // update all

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'All lesson content cleared. Lessons will regenerate on next open.'
    })
  } catch (err) {
    console.error('[Admin Regenerate All Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
