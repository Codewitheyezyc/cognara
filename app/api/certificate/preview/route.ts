import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { PhaseCertificate } from '@/components/certificate/PhaseCertificate'
import { RoadmapCertificate } from '@/components/certificate/RoadmapCertificate'

export const dynamic = 'force-dynamic'

// Dummy data for preview rendering — no database queries needed
const PHASE_PREVIEW_DATA = {
  studentName: 'Isaac Emmanuel',
  phaseTitle: 'Phase 2: CSS Box Model & Responsive Layouts',
  subject: 'Web Development',
  avgScore: 92,
  lessonsCount: 6,
  completionDate: 'June 17, 2026',
  certId: 'A1B2C3D4-E5F6G7H8'
}

const ROADMAP_PREVIEW_DATA = {
  studentName: 'Isaac Emmanuel',
  roadmapTitle: 'Web Development Foundations Path (Intermediate)',
  subject: 'Web Development',
  avgScore: 88,
  totalLessons: 18,
  totalPhases: 3,
  completionDate: 'Jun 17, 2026',
  certId: 'MASTER-A1B2C3D4-E5F6G7H8'
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Verify admin only
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID
    if (user.id !== adminId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // 2. Read type param: 'phase' or 'roadmap'
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'phase'

    // 3. Render the correct certificate with dummy data
    let pdfBuffer: Buffer

    if (type === 'roadmap') {
      pdfBuffer = await renderToBuffer(
        React.createElement(RoadmapCertificate, ROADMAP_PREVIEW_DATA)
      ) as unknown as Buffer
    } else {
      pdfBuffer = await renderToBuffer(
        React.createElement(PhaseCertificate, PHASE_PREVIEW_DATA)
      ) as unknown as Buffer
    }

    const filename = type === 'roadmap'
      ? 'PREVIEW_master_certificate.pdf'
      : 'PREVIEW_phase_certificate.pdf'

    return new Response(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('[Certificate Preview Error]', err)
    return NextResponse.json({ error: 'Preview generation failed' }, { status: 500 })
  }
}
