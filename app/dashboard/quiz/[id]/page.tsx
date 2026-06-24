'use client'

import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle2, XCircle, Flame, Clock, Award, RotateCcw, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { QuizQuestion } from '@/types/ai'
import AIBadge from '@/components/lesson/AIBadge'
import { QuizResultModal } from '@/components/mascot/QuizResultModal'
import MascotOverlay from '@/components/mascot/MascotOverlay'
import { Spark } from '@/components/mascot/Spark'

const BADGE_DESCRIPTIONS: Record<string, string> = {
  phase_1: 'Completed Phase 1',
  phase_2: 'Completed Phase 2',
  phase_3: 'Completed Phase 3',
  phase_4: 'Completed Phase 4',
  phase_5: 'Completed full roadmap',
  streak_7: '7 day streak',
  streak_30: '30 day streak',
  perfect_quiz: '100% on a quiz',
  speed_learner: '3 lessons in one day'
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr
}

function prepareQuizQuestions(questions: QuizQuestion[]): QuizQuestion[] {
  const shuffledQuestions = shuffleArray(questions)
  return shuffledQuestions.map(q => {
    if (q.type === 'multiple_choice' && q.options) {
      return {
        ...q,
        options: shuffleArray(q.options)
      }
    }
    return q
  })
}

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const lessonId = params.id as string
  const supabase = createClient()

  // States
  const [lessonTitle, setLessonTitle] = useState('')
  const [quizId, setQuizId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [isAnswerChecked, setIsAnswerChecked] = useState(false)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  
  // Scoring / Submission
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [quizResult, setQuizResult] = useState<{
    score: number
    passed: boolean
    correctCount: number
    totalCount: number
    streak: { current: number; longest: number }
    roadmapCompleted?: boolean
    roadmapId?: string | null
    xp?: { xpGained: number; newXp: number; newLevel: number; leveledUp: boolean } | null
  } | null>(null)

  // Loading / Error
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  // Badge celebration states
  const [newBadges, setNewBadges] = useState<any[]>([])
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0)
  const [phaseId, setPhaseId] = useState('')
  const [phaseTitle, setPhaseTitle] = useState('')

  // Timer
  const [timeSpentSecs, setTimeSpentSecs] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch quiz details on mount
  useEffect(() => {
    async function loadQuiz() {
      try {
        setIsLoading(true)
        setErrorMsg('')

        // 1. Authenticate user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        // 2. Fetch lesson details
        const { data: lesson, error: lessonErr } = await supabase
          .from('lessons')
          .select('title, phase_id')
          .eq('id', lessonId)
          .maybeSingle()
 
        if (lessonErr || !lesson) {
          router.push('/dashboard/path')
          return
        }
        setLessonTitle(lesson.title)
        if (lesson.phase_id) {
          setPhaseId(lesson.phase_id)
          const { data: phaseRow } = await supabase
            .from('roadmap_phases')
            .select('title')
            .eq('id', lesson.phase_id)
            .maybeSingle()
          if (phaseRow) {
            setPhaseTitle(phaseRow.title)
          }
        }

        // 3. Load or generate quiz
        const res = await fetch('/api/ai/generate-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId }),
        })

        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data.questions) {
          setErrorMsg(data.error || "Spark is having trouble building this assessment. Let's try reloading the page!");
          setIsLoading(false);
          return;
        }

        setQuizId(data.quizId)
        setQuestions(prepareQuizQuestions(data.questions || []))
        setIsLoading(false)

        // Start timer
        setTimeSpentSecs(0)
        timerRef.current = setInterval(() => {
          setTimeSpentSecs((prev) => prev + 1)
        }, 1000)
      } catch (err: any) {
        console.error(err)
        setErrorMsg('We had trouble connecting to the study server. Please check your internet connection or try again.')
        setIsLoading(false)
      }
    }

    loadQuiz()

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [lessonId, supabase, router])

  // Handle checking active question's answer
  const handleCheckAnswer = () => {
    if (!selectedAnswer.trim()) return

    const currentQuestion = questions[currentIdx]
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: selectedAnswer,
    }))
    setIsAnswerChecked(true)
  }

  // Handle proceeding to next question or final results submission
  const handleNextQuestion = async () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1)
      setSelectedAnswer('')
      setIsAnswerChecked(false)
    } else {
      // Final submission
      if (timerRef.current) clearInterval(timerRef.current)
      setIsSubmitting(true)
      try {
        const res = await fetch('/api/quiz/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quizId,
            answers: userAnswers,
            timeSpentSecs,
          }),
        })

        const result = await res.json()
        if (!res.ok) {
          throw new Error(result.error || 'Failed to submit quiz results')
        }

        setQuizResult(result)

        // Dispatch XP gained event
        if (result.xp) {
          window.dispatchEvent(new CustomEvent('cognara_xp_gained', {
            detail: {
              xpGained: result.xp.xpGained,
              newXp: result.xp.newXp,
              newLevel: result.xp.newLevel,
              leveledUp: result.xp.leveledUp
            }
          }))
        }

        // Trigger badge check on quiz submission
        try {
          const badgeRes = await fetch('/api/badges/check-and-award', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quizScore: result.score,
              lessonId,
              currentStreak: result.streak?.current
            })
          })
          if (badgeRes.ok) {
            const badgeData = await badgeRes.json()
            if (badgeData.newBadges && badgeData.newBadges.length > 0) {
              setNewBadges(badgeData.newBadges)
              setCurrentBadgeIndex(0)
            }
          }
        } catch (badgeErr) {
          console.error('Error checking badges on quiz submit:', badgeErr)
        }
      } catch (err: any) {
        console.error(err)
        setErrorMsg(err.message || 'Failed to save quiz score.')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  // Reset quiz state to retry
  const handleRetryQuiz = () => {
    // Reshuffle questions and options on retake to reinforce active recall
    setQuestions(prevQuestions => prepareQuizQuestions(prevQuestions))
    setCurrentIdx(0)
    setSelectedAnswer('')
    setIsAnswerChecked(false)
    setUserAnswers({})
    setQuizResult(null)
    setErrorMsg('')
    setTimeSpentSecs(0)
    timerRef.current = setInterval(() => {
      setTimeSpentSecs((prev) => prev + 1)
    }, 1000)
  }

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg text-text-1 flex flex-col items-center justify-center p-6 space-y-4 animate-page-enter">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-mono text-text-2 tracking-wide animate-pulse">
          Calibrating assessment metrics...
        </p>
      </div>
    )
  }

  // Error Screen
  if (errorMsg) {
    return (
      <div className="min-h-screen bg-bg text-text-1 flex flex-col items-center justify-center p-6 space-y-6 max-w-md mx-auto">
        <div className="p-4 bg-error/10 border border-error/20 rounded-full">
          <AlertTriangle className="h-8 w-8 text-error" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="font-heading text-xl font-bold text-text-1">Assessment Interrupted</h2>
          <p className="text-sm text-text-2">{errorMsg}</p>
        </div>
        <div className="flex space-x-3 w-full">
          <Button
            onClick={() => router.push(`/dashboard/lesson/${lessonId}`)}
            className="flex-1 h-11 bg-transparent border border-border hover:bg-surface-alt text-text-1 rounded-sm text-xs font-semibold"
          >
            Back to Lesson
          </Button>
          <Button
            onClick={handleRetryQuiz}
            className="flex-1 h-11 bg-primary hover:bg-primary/95 text-white rounded-sm text-xs font-semibold"
          >
            Retry Loading
          </Button>
        </div>
      </div>
    )
  }

  // Results View
  if (quizResult) {
    return (
      <div className="min-h-screen bg-bg text-text-1 flex flex-col items-center justify-center p-4 md:p-8 animate-page-enter">
        <QuizResultModal
          score={quizResult.score}
          passed={quizResult.passed}
          lessonTitle={lessonTitle}
          xpGained={quizResult.xp?.xpGained}
          onContinue={() => {
            if (quizResult.roadmapCompleted && quizResult.roadmapId) {
              router.push(`/dashboard/roadmap-complete/${quizResult.roadmapId}`)
            } else if (quizResult.passed) {
              router.push('/dashboard/path')
            } else {
              router.push(`/dashboard/lesson/${lessonId}`)
            }
          }}
          onRetry={handleRetryQuiz}
        />

        {newBadges.length > 0 && currentBadgeIndex < newBadges.length && (
          (() => {
            const badge = newBadges[currentBadgeIndex]
            const isPhaseBadge = badge.badge_key.startsWith('phase')
            
            return (
              <MascotOverlay
                emotion="celebrate"
                messages={
                  isPhaseBadge
                    ? [
                        `Phase complete! 🏆`,
                        `You finished every lesson in ${phaseTitle || badge.badge_label}`,
                        `Your certificate is ready to download.`
                      ]
                    : [
                        `New badge earned! ${badge.badge_emoji}`,
                        `${badge.badge_label}`,
                        BADGE_DESCRIPTIONS[badge.badge_key] || ''
                      ]
                }
                ctaLabel={isPhaseBadge ? "Download Certificate" : "Keep going!"}
                onDismiss={() => {
                  if (isPhaseBadge) {
                    window.open(`/api/certificate/generate?phaseId=${phaseId}`, '_blank')
                  }
                  
                  if (currentBadgeIndex + 1 < newBadges.length) {
                    setCurrentBadgeIndex(currentBadgeIndex + 1)
                  } else {
                    setNewBadges([])
                    window.dispatchEvent(new Event('badge-earned'))
                    router.refresh()
                  }
                }}
              />
            )
          })()
        )}
      </div>
    )
  }

  // Active Focus Mode View
  const currentQuestion = questions[currentIdx]
  const questionNumber = currentIdx + 1
  const totalQuestions = questions.length
  const progressPercent = (questionNumber / totalQuestions) * 100

  // Derive Spark's state during the quiz
  let sparkEmotion: 'idle' | 'happy' | 'celebrate' | 'thinking' | 'wave' = 'thinking'
  let sparkBubble = "Read the question carefully and choose the best option."
  const isCorrect = selectedAnswer.trim().toLowerCase() === currentQuestion.correct_answer.trim().toLowerCase()

  if (isAnswerChecked) {
    if (isCorrect) {
      sparkEmotion = currentIdx % 2 === 0 ? 'celebrate' : 'happy'
      const correctBubbles = [
        "Fabulous! Synaptic connection established! 🧠",
        "Spot on! Your cognitive accuracy is peak. ⚡",
        "Excellent choice! You've mastered this concept. 🏆",
        "Correct! Keep up this incredible mental focus. 🚀"
      ]
      sparkBubble = correctBubbles[currentIdx % correctBubbles.length]
    } else {
      sparkEmotion = currentIdx % 2 === 0 ? 'thinking' : 'wave'
      const incorrectBubbles = [
        "Synapse misfire! Let's check the explanation below. 🔍",
        "Not quite, but every mistake is a learning hook! 🔄",
        "Almost! Review the explanation to reinforce your learning. 📚",
        "No worries, mistakes are how our brains adapt! 🧠"
      ]
      sparkBubble = incorrectBubbles[currentIdx % incorrectBubbles.length]
    }
  } else {
    if (selectedAnswer) {
      sparkEmotion = 'idle'
      sparkBubble = "Looking good! Click 'Check Answer' to test your hypothesis. 🧪"
    } else {
      sparkEmotion = 'thinking'
      const thinkingBubbles = [
        "Activate your critical thinking pathways! ⚡",
        "Take your time... Let's analyze this concept carefully. 🧠",
        "Select the option that matches the cognitive target. 🎯",
        "Study the options. Which one makes the most sense? 📚"
      ]
      sparkBubble = thinkingBubbles[currentIdx % thinkingBubbles.length]
    }
  }

  return (
    <div className="min-h-screen bg-bg text-text-1 flex flex-col animate-page-enter">
      {/* Minimal Focus Header */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[760px] mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href={`/dashboard/lesson/${lessonId}`}
            className="flex items-center space-x-2 text-xs text-text-2 hover:text-text-1 transition-colors font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Exit Focus Mode</span>
          </Link>
          <div className="flex items-center space-x-3">
            <AIBadge />
            <span className="text-[10px] font-mono text-text-2">
              Question {questionNumber} of {totalQuestions}
            </span>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-border h-1">
          <div 
            style={{ width: `${progressPercent}%` }} 
            className="bg-primary h-full transition-all duration-300" 
          />
        </div>
      </header>

      {/* Main Question Display */}
      <main className="flex-1 max-w-[720px] w-full mx-auto px-4 py-8 md:py-12 space-y-6">
        {/* Question Head */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-accent font-semibold">
            Section Quiz
          </span>
          <h2 className="font-heading text-lg md:text-xl font-semibold leading-snug text-text-1">
            {currentQuestion.question}
          </h2>
        </div>

        {/* Live Spark Mascot Feedback & Guidance */}
        <div className={`p-4 border rounded-xl flex items-center gap-4 transition-all duration-300 ${
          isAnswerChecked 
            ? isCorrect 
              ? 'border-success/20 bg-success/5 shadow-[0_0_12px_rgba(16,185,129,0.04)]' 
              : 'border-error/20 bg-error/5 shadow-[0_0_12px_rgba(239,68,68,0.04)]' 
            : 'border-border/80 bg-surface-alt/45'
        }`}>
          <div className="shrink-0 flex items-center justify-center p-1 bg-surface rounded-xl border border-border/40">
            <Spark emotion={sparkEmotion} size={48} />
          </div>
          <div className="flex-grow space-y-0.5 min-w-0">
            <span className="text-[9px] font-mono font-bold text-primary uppercase tracking-wider block">Spark Coach</span>
            <p className={`text-[12px] font-medium leading-relaxed ${
              isAnswerChecked 
                ? isCorrect 
                  ? 'text-success' 
                  : 'text-error' 
                : 'text-text-2'
            }`}>
              {sparkBubble}
            </p>
          </div>
        </div>

        {/* Inputs based on type */}
        <div className="py-4">
          {currentQuestion.type === 'multiple_choice' && (
            <div className="grid grid-cols-1 gap-3">
              {(currentQuestion.options || []).map((option) => {
                const isSelected = selectedAnswer === option
                return (
                  <button
                    key={option}
                    disabled={isAnswerChecked}
                    onClick={() => setSelectedAnswer(option)}
                    type="button"
                    className={`w-full text-left p-4 rounded-[10px] border text-sm font-medium transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-primary bg-primary/5 text-primary shadow-[0_0_12px_rgba(91,142,255,0.06)]'
                        : 'border-border bg-surface hover:bg-surface-alt text-text-2 hover:text-text-1'
                    } disabled:opacity-95`}
                  >
                    <span>{option}</span>
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-primary bg-primary' : 'border-text-3'
                    }`}>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {currentQuestion.type === 'true_false' && (
            <div className="grid grid-cols-2 gap-4">
              {['true', 'false'].map((option) => {
                const isSelected = selectedAnswer === option
                return (
                  <button
                    key={option}
                    disabled={isAnswerChecked}
                    onClick={() => setSelectedAnswer(option)}
                    type="button"
                    className={`text-center p-6 rounded-[10px] border text-base font-semibold capitalize transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 text-primary shadow-[0_0_12px_rgba(91,142,255,0.06)]'
                        : 'border-border bg-surface hover:bg-surface-alt text-text-2 hover:text-text-1'
                    } disabled:opacity-95`}
                  >
                    {option === 'true' ? 'True' : 'False'}
                  </button>
                )
              })}
            </div>
          )}

          {currentQuestion.type === 'fill_blank' && (
            <div className="max-w-md space-y-2">
              <input
                disabled={isAnswerChecked}
                value={selectedAnswer}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                placeholder="Type your answer here..."
                type="text"
                className="w-full h-11 px-4 rounded-sm bg-surface border border-border text-text-1 text-sm placeholder:text-text-3 focus:outline-none focus:border-primary transition-colors disabled:opacity-75"
              />
              <p className="text-[10px] font-mono text-text-3">
                Tip: Correct spelling is required (single word or short phrase).
              </p>
            </div>
          )}
        </div>

        {/* Action button */}
        {!isAnswerChecked ? (
          <Button
            onClick={handleCheckAnswer}
            disabled={!selectedAnswer.trim()}
            className="w-full h-11 bg-primary hover:bg-primary/95 text-white rounded-sm text-xs font-semibold tracking-wide uppercase disabled:opacity-50"
          >
            Check Answer
          </Button>
        ) : (
          <div className="space-y-6">
            {/* Feedback Panel */}
            {(() => {
              const isCorrect = selectedAnswer.trim().toLowerCase() === currentQuestion.correct_answer.trim().toLowerCase()
              return (
                <div className={`p-5 rounded-[10px] border flex gap-4 items-start ${
                  isCorrect
                    ? 'border-success/20 bg-success/5 text-text-1'
                    : 'border-error/20 bg-error/5 text-text-1'
                }`}>
                  {isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-2">
                    <h4 className={`text-sm font-bold uppercase tracking-wider ${isCorrect ? 'text-success' : 'text-error'}`}>
                      {isCorrect ? 'Correct Answer' : 'Incorrect Answer'}
                    </h4>
                    {!isCorrect && (
                      <p className="text-xs text-text-2">
                        Correct answer: <span className="font-mono font-semibold text-text-1">{currentQuestion.correct_answer}</span>
                      </p>
                    )}
                    <p className="text-xs text-text-2 leading-relaxed">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                </div>
              )
            })()}

            <Button
              onClick={handleNextQuestion}
              disabled={isSubmitting}
              className="w-full h-11 bg-primary hover:bg-primary/95 text-white rounded-sm text-xs font-semibold tracking-wide uppercase"
            >
              {isSubmitting ? 'Saving...' : currentIdx === questions.length - 1 ? 'Submit Assessment' : 'Next Question'}
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
