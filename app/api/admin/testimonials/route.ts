import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Admin check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== process.env.ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
    const supabase = await createClient()
    
    // Admin check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== process.env.ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, action } = await req.json()
    if (!id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (action === 'approve') {
      const { error } = await supabase
        .from('cognara_testimonials')
        .update({ is_approved: true })
        .eq('id', id)
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else if (action === 'reject') {
      // Reject deletes the testimonial to keep DB clean
      const { error } = await supabase
        .from('cognara_testimonials')
        .delete()
        .eq('id', id)
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[Admin Testimonials POST Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
