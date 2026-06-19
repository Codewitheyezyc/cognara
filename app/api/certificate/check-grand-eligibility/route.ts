import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkGrandCertificateEligibility } from '@/lib/certificates/checkEligibility'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const roadmapId = searchParams.get('roadmapId')
    if (!roadmapId) return NextResponse.json({ error: 'Missing roadmapId' }, { status: 400 })

    const result = await checkGrandCertificateEligibility(user.id, roadmapId)
    return NextResponse.json(result)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
