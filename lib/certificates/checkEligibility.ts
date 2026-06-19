import { createClient } from '@/lib/supabase/server'

export interface LessonDetail {
  title: string
  completed: boolean
  quizPassed: boolean
  score: number | null
}

export interface PhaseEligibilityResult {
  eligible: boolean
  completedLessons: number
  totalLessons: number
  passedQuizzes: number
  totalQuizzes: number
  averageScore: number
  missingItems: string[]
  details: LessonDetail[]
}

export interface GrandEligibilityResult {
  eligible: boolean
  completionPercentage: number
  missingPhases: string[]
  totalAverageScore: number
}

export async function checkPhaseCertificateEligibility(
  userId: string,
  phaseId: string
): Promise<PhaseEligibilityResult> {
  const supabase = await createClient()

  // Get all lessons in phase
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title')
    .eq('phase_id', phaseId)
    .order('order_index', { ascending: true })

  if (!lessons || lessons.length === 0) {
    return { eligible: false, completedLessons: 0, totalLessons: 0,
             passedQuizzes: 0, totalQuizzes: 0, averageScore: 0, missingItems: [], details: [] }
  }

  const lessonIds = lessons.map(l => l.id)

  // Check lesson completion
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('lesson_id, status')
    .eq('user_id', userId)
    .in('lesson_id', lessonIds)

  // Get quizzes for these lessons
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('id, lesson_id')
    .in('lesson_id', lessonIds)

  const quizIds = quizzes?.map(q => q.id) || []
  const lessonToQuizMap = new Map<string, string>()
  quizzes?.forEach(q => {
    if (q.lesson_id) lessonToQuizMap.set(q.lesson_id, q.id)
  })

  // Get best passed quiz attempt or all passed attempts for this user and these quizzes
  const { data: quizAttempts } = await supabase
    .from('quiz_attempts')
    .select('quiz_id, passed, score')
    .eq('user_id', userId)
    .in('quiz_id', quizIds)

  const completedLessonIds = new Set(
    progress?.filter(p => p.status === 'completed').map(p => p.lesson_id) || []
  )

  // Find the highest score and passed status for each quiz
  const quizBestScores = new Map<string, number>()
  const quizPassedMap = new Map<string, boolean>()

  quizAttempts?.forEach(attempt => {
    if (attempt.passed) {
      quizPassedMap.set(attempt.quiz_id, true)
    }
    const currentBest = quizBestScores.get(attempt.quiz_id) || 0
    if (attempt.score > currentBest) {
      quizBestScores.set(attempt.quiz_id, attempt.score)
    }
  })

  const missingItems: string[] = []
  const details: LessonDetail[] = []
  let totalScoreSum = 0
  let scoresCount = 0

  lessons.forEach(lesson => {
    const isCompleted = completedLessonIds.has(lesson.id)
    const quizId = lessonToQuizMap.get(lesson.id)
    const isQuizPassed = quizId ? !!quizPassedMap.get(quizId) : false
    const score = quizId ? (quizBestScores.get(quizId) ?? null) : null

    if (score !== null) {
      totalScoreSum += score
      scoresCount++
    }

    if (!isCompleted) {
      missingItems.push(`Complete lesson: ${lesson.title}`)
    }
    if (!isQuizPassed) {
      missingItems.push(`Pass quiz for: ${lesson.title}`)
    }

    details.push({
      title: lesson.title,
      completed: isCompleted,
      quizPassed: isQuizPassed,
      score
    })
  })

  const averageScore = scoresCount > 0 ? Math.round(totalScoreSum / scoresCount) : 0
  const eligible = missingItems.length === 0 && averageScore >= 60

  const passedQuizzesCount = Array.from(lessonToQuizMap.values()).filter(qId => !!quizPassedMap.get(qId)).length

  return {
    eligible,
    completedLessons: completedLessonIds.size,
    totalLessons: lessons.length,
    passedQuizzes: passedQuizzesCount,
    totalQuizzes: lessons.length,
    averageScore,
    missingItems,
    details
  }
}

export async function checkGrandCertificateEligibility(
  userId: string,
  roadmapId: string
): Promise<GrandEligibilityResult> {
  const supabase = await createClient()

  const { data: phases } = await supabase
    .from('roadmap_phases')
    .select('id, title')
    .eq('roadmap_id', roadmapId)

  if (!phases || phases.length === 0) {
    return { eligible: false, completionPercentage: 0, missingPhases: [], totalAverageScore: 0 }
  }

  const results = await Promise.all(
    phases.map(phase => checkPhaseCertificateEligibility(userId, phase.id))
  )

  const missingPhases = phases
    .filter((_, i) => !results[i].eligible)
    .map(p => p.title)

  const completedPhases = results.filter(r => r.eligible).length
  const completionPercentage = Math.round((completedPhases / phases.length) * 100)

  // Overall average score calculation across all lessons
  let totalScoresSum = 0
  let totalScoresCount = 0

  results.forEach(res => {
    res.details.forEach(d => {
      if (d.score !== null) {
        totalScoresSum += d.score
        totalScoresCount++
      }
    })
  })

  const totalAverageScore = totalScoresCount > 0 ? Math.round(totalScoresSum / totalScoresCount) : 0
  const eligible = missingPhases.length === 0 && totalAverageScore >= 65

  return {
    eligible,
    completionPercentage,
    missingPhases,
    totalAverageScore
  }
}
