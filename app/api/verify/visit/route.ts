import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { certificateId, referrer, action } = await req.json()

    if (!certificateId) {
      return NextResponse.json({ error: 'Missing certificateId' }, { status: 400 })
    }

    // Parse visitor IP and hash it securely
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1'
    const ipHash = createHash('sha256').update(ip).digest('hex')

    if (action === 'convert') {
      // Find the last visit for this IP hash and certificate, and set converted to true
      const { error } = await supabase
        .from('cognara_verify_page_visits')
        .update({ converted: true })
        .eq('certificate_id', certificateId)
        .eq('visitor_ip_hash', ipHash)
      
      if (error) {
        console.error('Error updating conversion state:', error)
      }
      return NextResponse.json({ success: true, action: 'convert' })
    }

    // Default action: 'visit'
    // Parse referrer source
    let platform = 'direct'
    if (referrer) {
      const lowerRef = referrer.toLowerCase()
      if (lowerRef.includes('linkedin')) platform = 'linkedin'
      else if (lowerRef.includes('twitter') || lowerRef.includes('t.co') || lowerRef.includes('x.com')) platform = 'twitter'
      else if (lowerRef.includes('whatsapp') || lowerRef.includes('wa.me')) platform = 'whatsapp'
      else platform = lowerRef.substring(0, 100) // Truncate longer custom referrer strings
    }

    const { data, error } = await supabase
      .from('cognara_verify_page_visits')
      .insert({
        certificate_id: certificateId,
        visitor_ip_hash: ipHash,
        referrer: platform,
        converted: false
      })
      .select()

    if (error) {
      console.error('Error logging verify page visit:', error)
    }

    return NextResponse.json({ success: true, visit: data?.[0] || null })
  } catch (err: any) {
    console.error('[Verify Visit API Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
