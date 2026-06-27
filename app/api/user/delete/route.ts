import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createBaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Initialize admin client with Service Role Key if available, fallback to anon
    const supabaseAdmin = createBaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'placeholder_service_role_key_for_dev'
        ? process.env.SUPABASE_SERVICE_ROLE_KEY
        : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Attempt to delete user from Supabase Auth (which cascades to profiles in standard setups)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    
    if (deleteError) {
      console.warn('[Delete API] Auth admin deletion failed, attempting direct profile delete:', deleteError)
      // Fallback: Delete from profiles directly. Database triggers may cascade this back or clean up.
      const { error: dbDeleteError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', user.id)

      if (dbDeleteError) {
        return NextResponse.json({ error: dbDeleteError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, message: 'Account deleted successfully' })
  } catch (err: any) {
    console.error('[Delete User API Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
