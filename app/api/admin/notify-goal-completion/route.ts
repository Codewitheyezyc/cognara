import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { goalName, startDate, completedDate, lessonsCount, quizzesCount, cxpEarned } = await req.json()

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .maybeSingle()

    const name = profile?.name || 'Learner'

    // Format dates
    const formattedStart = new Date(startDate).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
    const formattedEnd = new Date(completedDate).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })

    // Send email notification to hello@cognaralearn.com via Resend
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: 'Cognara Alerts <alerts@cognaralearn.com>',
          to: 'hello@cognaralearn.com',
          subject: `🏆 Goal completed on Cognara — ${name}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px; background: #ffffff; color: #333333;">
              <h2 style="color: #F59E0B; border-bottom: 2px solid #eaeaea; padding-bottom: 10px; margin-top: 0;">🏆 Goal Completed!</h2>
              <p><strong>${name}</strong> just completed their <strong>${goalName}</strong> learning goal on Cognara.</p>
              
              <h3 style="color: #333333; margin-top: 20px; border-bottom: 1px solid #eaeaea; padding-bottom: 5px;">Journey Stats:</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <tr>
                  <td style="padding: 6px 0; color: #666666;"><strong>Started:</strong></td>
                  <td style="padding: 6px 0; text-align: right;">${formattedStart}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666666;"><strong>Completed:</strong></td>
                  <td style="padding: 6px 0; text-align: right;">${formattedEnd}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666666;"><strong>Lessons:</strong></td>
                  <td style="padding: 6px 0; text-align: right;">${lessonsCount} completed</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666666;"><strong>Quizzes:</strong></td>
                  <td style="padding: 6px 0; text-align: right;">${quizzesCount} passed</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666666;"><strong>Total CXP:</strong></td>
                  <td style="padding: 6px 0; text-align: right; color: #3D6AFF; font-weight: bold;">+${cxpEarned} CXP</td>
                </tr>
              </table>
              
              <p style="margin-top: 30px; font-weight: bold; color: #F59E0B; text-align: center; font-size: 16px;">
                This is what Cognara is built for.
              </p>
            </div>
          `
        })
        console.log(`[Resend Alert] Sent admin alert for goal completion by ${name}`)
      } catch (err: any) {
        console.error('[Resend Alert Error] Failed to send email alert:', err.message)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[Notify Goal Completion API Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
