import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { RoadmapCertificate } from '@/components/certificate/RoadmapCertificate'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const roadmapId = searchParams.get('roadmapId')

    if (!roadmapId) {
      return NextResponse.json({ error: 'Missing roadmapId parameter' }, { status: 400 })
    }

    // 2. Fetch roadmap + goal
    const { data: roadmap, error: roadmapErr } = await supabase
      .from('roadmaps')
      .select('title, goal_id, user_id')
      .eq('id', roadmapId)
      .maybeSingle()

    if (roadmapErr || !roadmap) {
      return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 })
    }

    // 3. Verify user owns this roadmap
    if (roadmap.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { canClaimCertificate } = await import('@/lib/certificates/claim')
    const claimCheck = await canClaimCertificate(user.id, 0, true)
    if (!claimCheck.canClaim) {
      return NextResponse.json({ error: claimCheck.message || 'Pro subscription required to claim this certificate' }, { status: 403 })
    }

    // 4. Fetch subject from learning goal
    let subject = 'General'
    if (roadmap.goal_id) {
      const { data: goal } = await supabase
        .from('learning_goals')
        .select('subject')
        .eq('id', roadmap.goal_id)
        .maybeSingle()
      if (goal?.subject) subject = goal.subject
    }

    // 5. Fetch ALL phases for this roadmap
    const { data: phases, error: phasesErr } = await supabase
      .from('roadmap_phases')
      .select('id, title')
      .eq('roadmap_id', roadmapId)

    if (phasesErr || !phases || phases.length === 0) {
      return NextResponse.json({ error: 'No phases found in this roadmap' }, { status: 400 })
    }

    const totalPhases = phases.length
    const allPhaseIds = phases.map(p => p.id)

    // 6. Fetch ALL lessons across all phases
    const { data: allLessons } = await supabase
      .from('lessons')
      .select('id, phase_id')
      .in('phase_id', allPhaseIds)

    if (!allLessons || allLessons.length === 0) {
      return NextResponse.json({ error: 'No lessons found in this roadmap' }, { status: 400 })
    }

    const totalLessons = allLessons.length
    const allLessonIds = allLessons.map(l => l.id)

    // 7. Verify ALL lessons are completed
    const { data: completedProgress } = await supabase
      .from('lesson_progress')
      .select('lesson_id, completed_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .in('lesson_id', allLessonIds)

    const completedCount = completedProgress?.length || 0
    if (completedCount !== totalLessons) {
      return NextResponse.json({
        error: 'Roadmap is not fully completed yet',
        details: { completed: completedCount, total: totalLessons }
      }, { status: 400 })
    }

    // 8. Determine completion date (the latest completed_at)
    let completionDate = new Date()
    if (completedProgress && completedProgress.length > 0) {
      const dates = completedProgress.map(p => p.completed_at ? new Date(p.completed_at).getTime() : 0)
      const maxDate = Math.max(...dates)
      if (maxDate > 0) completionDate = new Date(maxDate)
    }

    const formattedDate = completionDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })

    // 9. Calculate overall average quiz score across all lessons
    let avgScore = 100
    const { data: allQuizzes } = await supabase
      .from('quizzes')
      .select('id')
      .in('lesson_id', allLessonIds)

    const allQuizIds = allQuizzes?.map(q => q.id) || []
    if (allQuizIds.length > 0) {
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('quiz_id, score')
        .eq('user_id', user.id)
        .in('quiz_id', allQuizIds)

      if (attempts && attempts.length > 0) {
        // Use highest score per quiz
        const highestScores: Record<string, number> = {}
        attempts.forEach(att => {
          highestScores[att.quiz_id] = Math.max(highestScores[att.quiz_id] || 0, att.score)
        })
        const scores = Object.values(highestScores)
        avgScore = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
      }
    }

    // 10. Fetch student name
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .maybeSingle()

    const studentName = profile?.name || 'Cognara Learner'

    // 11. Build unique cert ID
    const certId = `MASTER-${user.id.slice(0, 8)}-${roadmapId.slice(0, 8)}`.toUpperCase()

    // 12. Render PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(RoadmapCertificate, {
        studentName,
        roadmapTitle: roadmap.title,
        subject,
        avgScore,
        totalLessons,
        totalPhases,
        completionDate: formattedDate,
        certId
      })
    )

    return new Response(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="master_certificate_${roadmapId}.pdf"`,
      },
    })
  } catch (err) {
    console.error('[API Generate Roadmap Certificate Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
