import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // User must be authenticated to submit
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { first_name, last_initial, learning_goal, testimonial_text, star_rating } = await req.json()
    if (!first_name || !last_initial || !learning_goal || !testimonial_text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Insert into Supabase (will default is_approved to false)
    const { data, error } = await supabase
      .from('cognara_testimonials')
      .insert({
        user_id: user.id,
        first_name,
        last_initial,
        learning_goal,
        testimonial_text,
        star_rating: star_rating || null,
        is_approved: false
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Send email notification to hello@cognaralearn.com via Resend
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: 'Cognara Alerts <alerts@cognaralearn.com>',
          to: 'hello@cognaralearn.com',
          subject: `New testimonial submitted by ${first_name} — review in admin dashboard`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px; background: #ffffff; color: #333333;">
              <h2 style="color: #3D6AFF; border-bottom: 2px solid #eaeaea; padding-bottom: 10px;">New Testimonial Submitted</h2>
              <p><strong>Name:</strong> ${first_name} ${last_initial}.</p>
              <p><strong>Learning Goal:</strong> ${learning_goal}</p>
              <p><strong>Rating:</strong> ${star_rating ? '⭐'.repeat(star_rating) : 'None'}</p>
              <div style="background: #f4f6fc; padding: 15px; border-left: 4px solid #3D6AFF; font-style: italic; margin: 20px 0; border-radius: 4px;">
                "${testimonial_text}"
              </div>
              <p>Review and approve this testimonial directly in the Cognara Admin Dashboard.</p>
              <div style="margin-top: 30px;">
                <a href="https://cognaralearn.com/admin" style="background-color: #3D6AFF; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Go to Admin Dashboard</a>
              </div>
            </div>
          `
        })
        console.log(`[Resend Alert] Sent admin alert for testimonial by ${first_name}`)
      } catch (err: any) {
        console.error('[Resend Alert Error] Failed to send email alert:', err.message)
      }
    }

    return NextResponse.json({ success: true, testimonial: data })
  } catch (err: any) {
    console.error('[Testimonial Submit API Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
