import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 'mock_resend_api_key')

export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json()

    // Basic validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (message.length < 20) {
      return NextResponse.json({
        error: 'Message too short. Please provide more detail.'
      }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cognaralearn.com'

    // Send notification to you (the owner)
    await resend.emails.send({
      from: 'Cognara Contact <noreply@cognaralearn.com>',
      to: process.env.CONTACT_RECEIVER_EMAIL || 'hello@cognaralearn.com',
      subject: `[Cognara Contact] ${subject} — from ${name}`,
      html: `
        <h2>New contact form submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p style="background: #f4f4f4; padding: 16px; border-radius: 8px;">
          ${message.replace(/\n/g, '<br>')}
        </p>
        <p><a href="mailto:${email}">Reply to ${name}</a></p>
      `
    })

    // Send confirmation to the visitor
    await resend.emails.send({
      from: 'Cognara <hello@cognaralearn.com>',
      to: email,
      subject: `We received your message, ${name.split(' ')[0]}`,
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 520px;
                    margin: 0 auto; padding: 40px 20px;
                    background: #0A0C14; color: #F0F4FF; text-align: center;">
          <img src="${appUrl}/icon-192.png" width="48" height="48" alt="Cognara" style="margin: 0 auto 8px; display: block;" />
          <h2 style="color: #5B8EFF; margin: 0; font-size: 20px;">Cognara</h2>
          <h3 style="color: #F0F4FF;">
            Thanks for reaching out, ${name.split(' ')[0]}!
          </h3>
          <p style="color: #8B95B3; line-height: 1.65;">
            We have received your message and will get back to you
            within 24 hours.
          </p>
          <p style="color: #8B95B3; line-height: 1.65;">
            While you wait, feel free to explore Cognara and
            start your first learning journey for free.
          </p>
          <a href="${appUrl}/signup"
             style="display: inline-block; background: #5B8EFF;
                    color: white; padding: 12px 24px;
                    border-radius: 10px; text-decoration: none;
                    font-weight: 600; margin-top: 16px;">
            Try Cognara Free →
          </a>
          <p style="color: #4A5272; font-size: 12px; margin-top: 32px;">
            Cognara · cognaralearn.com
          </p>
        </div>
      `
    })

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('[Contact Form] Error:', err)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
