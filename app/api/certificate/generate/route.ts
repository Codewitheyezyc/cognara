import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { PhaseCertificate } from '@/components/certificate/PhaseCertificate'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const phaseId = searchParams.get('phaseId')

    if (!phaseId) {
      return NextResponse.json({ error: 'Missing phaseId parameter' }, { status: 400 })
    }

    // 2. Fetch phase details & parent roadmap
    const { data: phaseData, error: phaseErr } = await supabase
      .from('roadmap_phases')
      .select('phase_number, title, roadmap_id')
      .eq('id', phaseId)
      .maybeSingle()

    if (phaseErr || !phaseData) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 })
    }

    const { canClaimCertificate } = await import('@/lib/certificates/claim')
    const claimCheck = await canClaimCertificate(user.id, phaseData.phase_number, false)
    if (!claimCheck.canClaim) {
      return NextResponse.json({ error: claimCheck.message || 'Pro subscription required to claim this certificate' }, { status: 403 })
    }

    // 3. Fetch lessons for the phase and verify completion
    const { data: phaseLessons } = await supabase
      .from('lessons')
      .select('id')
      .eq('phase_id', phaseId)

    if (!phaseLessons || phaseLessons.length === 0) {
      return NextResponse.json({ error: 'No lessons found in this phase' }, { status: 400 })
    }

    const lessonIds = phaseLessons.map(l => l.id)

    // Check completed progress for these lessons
    const { data: completedProgress } = await supabase
      .from('lesson_progress')
      .select('lesson_id, completed_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .in('lesson_id', lessonIds)

    const completedCount = completedProgress?.length || 0
    if (completedCount !== phaseLessons.length) {
      return NextResponse.json({ 
        error: 'Phase is not fully completed yet',
        details: { completed: completedCount, total: phaseLessons.length }
      }, { status: 400 })
    }

    // Determine completion date (the latest completed_at date)
    let completionDate = new Date()
    if (completedProgress && completedProgress.length > 0) {
      const dates = completedProgress.map(p => p.completed_at ? new Date(p.completed_at).getTime() : 0)
      const maxDate = Math.max(...dates)
      if (maxDate > 0) {
        completionDate = new Date(maxDate)
      }
    }

    const formattedDate = completionDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })

    // 4. Fetch subject from learning goal
    let subject = 'General'
    if (phaseData.roadmap_id) {
      const { data: roadmapData } = await supabase
        .from('roadmaps')
        .select('goal_id')
        .eq('id', phaseData.roadmap_id)
        .maybeSingle()
      if (roadmapData?.goal_id) {
        const { data: goalData } = await supabase
          .from('learning_goals')
          .select('subject')
          .eq('id', roadmapData.goal_id)
          .maybeSingle()
        if (goalData?.subject) {
          subject = goalData.subject
        }
      }
    }

    // 5. Fetch profile name
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .maybeSingle()

    const studentName = profile?.name || 'Cognara Learner'

    // 6. Calculate average quiz score of all quizzes in the phase
    let avgScore = 100
    // Get quizzes for the phase lessons
    const { data: phaseQuizzes } = await supabase
      .from('quizzes')
      .select('id')
      .in('lesson_id', lessonIds)

    const quizIds = phaseQuizzes?.map(q => q.id) || []
    if (quizIds.length > 0) {
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('quiz_id, score')
        .eq('user_id', user.id)
        .in('quiz_id', quizIds)

      if (attempts && attempts.length > 0) {
        // Group attempts by quiz_id and find the highest score for each
        const highestScores: Record<string, number> = {}
        attempts.forEach(att => {
          highestScores[att.quiz_id] = Math.max(highestScores[att.quiz_id] || 0, att.score)
        })
        const scores = Object.values(highestScores)
        avgScore = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
      }
    }

    // 7. Generate certificate details
    const certId = `${user.id.slice(0, 8)}-${phaseId.slice(0, 8)}`.toUpperCase()

    // 8. Render PDF using @react-pdf/renderer
    const pdfBuffer = await renderToBuffer(
      React.createElement(PhaseCertificate, {
        studentName,
        phaseTitle: phaseData.title,
        subject,
        avgScore,
        lessonsCount: phaseLessons.length,
        completionDate: formattedDate,
        certId
      })
    )

    // 9. Return PDF buffer
    return new Response(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate_${phaseId}.pdf"`,
      },
    })
  } catch (err) {
    console.error('[API Generate Certificate Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
