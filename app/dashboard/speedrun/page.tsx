'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { SoundEffects } from '@/lib/sound'
import { 
  Zap, 
  Flame, 
  RotateCcw, 
  Award, 
  Timer, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Sparkles, 
  Play, 
  ArrowRight,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import { QuizQuestion } from '@/types/ai'

export default function SpeedRunPage() {
  const router = useRouter()
  const supabase = createClient()

  // Game States
  const [gameState, setGameState] = useState<'loading' | 'instructions' | 'countdown' | 'playing' | 'gameover'>('loading')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  
  // Stats & Progress
  const [timeLeft, setTimeLeft] = useState(60.0) // 60 seconds
  const [score, setScore] = useState(0)
  const [xpEarned, setXpEarned] = useState(0)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [totalAnswered, setTotalAnswered] = useState(0)
  
  // Game countdown
  const [gameCountdown, setGameCountdown] = useState(3)
  
  // Feedback indicator state ('correct' | 'incorrect' | null)
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  
  // User ID and Profile
  const [userId, setUserId] = useState<string | null>(null)
  const [isSavingXp, setIsSavingXp] = useState(false)
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const xpEarnedRef = useRef(0)

  // Load questions
  const loadGameData = async () => {
    try {
      setGameState('loading')
      
      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)

      // Fetch speedrun questions
      const res = await fetch('/api/speedrun/questions')
      if (!res.ok) throw new Error('Failed to load questions')
      const data = await res.json()
      
      setQuestions(data.questions || [])
      setGameState('instructions')
    } catch (err) {
      console.error('[Speedrun] Error loading game:', err)
      setGameState('instructions') // fallback
    }
  }

  useEffect(() => {
    loadGameData()
    return () => {
      stopTimer()
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    }
  }, [])

  // Start the 3-2-1 countdown
  const startCountdown = () => {
    setGameState('countdown')
    setGameCountdown(3)
    
    // Reset gameplay metrics
    setTimeLeft(60.0)
    setScore(0)
    setXpEarned(0)
    xpEarnedRef.current = 0
    setStreak(0)
    setMaxStreak(0)
    setCorrectCount(0)
    setTotalAnswered(0)
    setCurrentIdx(0)
    setFeedback(null)
    setSelectedOption(null)

    countdownIntervalRef.current = setInterval(() => {
      setGameCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!)
          startGameplay()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Start the actual game timer and action
  const startGameplay = () => {
    setGameState('playing')
    startTimer()
  }

  const startTimer = () => {
    stopTimer()
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          stopTimer()
          endGame()
          return 0
        }
        return Number((prev - 0.1).toFixed(1))
      })
    }, 100) // Ticks every 100ms for smooth bar transitions
  }

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  // Handle game end
  const endGame = async () => {
    setGameState('gameover')
    stopTimer()
    SoundEffects.play('achievement')

    const currentXp = xpEarnedRef.current

    if (currentXp > 0 && userId) {
      setIsSavingXp(true)
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('add_xp', {
          user_id: userId,
          amount: currentXp
        })

        if (!rpcError && rpcData) {
          // Dispatch global XP update event so topbar syncs
          window.dispatchEvent(new CustomEvent('cognara_xp_gained', {
            detail: {
              xpGained: currentXp,
              newXp: rpcData.xp,
              newLevel: rpcData.level,
              leveledUp: rpcData.leveled_up
            }
          }))
          router.refresh()
        }
      } catch (err) {
        console.error('[Speedrun] Error saving XP:', err)
      } finally {
        setIsSavingXp(false)
      }
    }
  }

  // Calculate multiplier
  const getMultiplier = (currStreak: number) => {
    if (currStreak >= 9) return 4
    if (currStreak >= 6) return 3
    if (currStreak >= 3) return 2
    return 1
  }

  // Handle option selection
  const handleOptionSelect = (option: string) => {
    if (feedback !== null || gameState !== 'playing') return
    
    setSelectedOption(option)
    const currentQuestion = questions[currentIdx]
    const isCorrect = option.trim().toLowerCase() === currentQuestion.correct_answer.trim().toLowerCase()

    setTotalAnswered(prev => prev + 1)

    if (isCorrect) {
      setFeedback('correct')
      SoundEffects.play('success')
      
      const newStreak = streak + 1
      setStreak(newStreak)
      if (newStreak > maxStreak) {
        setMaxStreak(newStreak)
      }

      const multiplier = getMultiplier(newStreak)
      const points = 10 * multiplier
      setXpEarned(prev => {
        const next = prev + points
        xpEarnedRef.current = next
        return next
      })
      setCorrectCount(prev => prev + 1)
      
      // Add +2s to the clock (cap at 99s to keep UI clean)
      setTimeLeft(prev => Math.min(99.0, Number((prev + 2.0).toFixed(1))))

      // Quick move to next question
      setTimeout(() => {
        advanceQuestion()
      }, 400)

    } else {
      setFeedback('incorrect')
      SoundEffects.play('failure')
      setStreak(0) // Reset multiplier streak

      // Delay slightly so they can see the correct answer highlighted
      setTimeout(() => {
        advanceQuestion()
      }, 700)
    }
  }

  const advanceQuestion = () => {
    setFeedback(null)
    setSelectedOption(null)
    
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1)
    } else {
      // Loop back to shuffled questions or just end game
      // To keep action going, reshuffle questions and reset index
      const shuffled = [...questions].sort(() => Math.random() - 0.5)
      setQuestions(shuffled)
      setCurrentIdx(0)
    }
  }

  const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0
  const currentMultiplier = getMultiplier(streak)

  // Loading Screen
  if (gameState === 'loading') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-xs font-mono text-text-3 animate-pulse uppercase tracking-widest">
          Assembling Lightning Round synaptic matrix...
        </p>
      </div>
    )
  }

  // Instructions/Pre-start Screen
  if (gameState === 'instructions') {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 animate-page-enter">
        <div className="flex items-center space-x-2 text-text-3 mb-6">
          <Link href="/dashboard" className="flex items-center space-x-1.5 hover:text-text-1 transition-colors text-xs font-semibold">
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden space-y-8">
          {/* Decorative Glow */}
          <div className="absolute -right-24 -top-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-24 -bottom-24 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="text-center space-y-3 relative">
            <div className="inline-flex p-3 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl border border-primary/30 text-primary mb-2 shadow-inner">
              <Zap className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-text-1">
              Time-Attack Lightning Round
            </h1>
            <p className="text-text-2 text-xs md:text-sm max-w-md mx-auto leading-relaxed">
              Test your recall speeds! Review active concepts under pressure to cement long-term memory pathways.
            </p>
          </div>

          {/* Rules / Specs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
            <div className="p-4 rounded-xl bg-surface-alt border border-border/80 flex flex-col items-center text-center space-y-2">
              <Timer className="h-6 w-6 text-primary" />
              <h3 className="text-xs font-bold text-text-1 font-mono uppercase">60s Clock</h3>
              <p className="text-[11px] text-text-3 leading-relaxed">
                Race against time! Correct answers add <strong className="text-text-1">+2 seconds</strong> to your remaining clock.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-alt border border-border/80 flex flex-col items-center text-center space-y-2">
              <TrendingUp className="h-6 w-6 text-accent" />
              <h3 className="text-xs font-bold text-text-1 font-mono uppercase">XP Multiplier</h3>
              <p className="text-[11px] text-text-3 leading-relaxed">
                Build a streak of correct answers to unlock multipliers: 1x ➔ 2x ➔ 3x ➔ <strong className="text-accent font-extrabold">4x XP</strong>!
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-alt border border-border/80 flex flex-col items-center text-center space-y-2">
              <Flame className="h-6 w-6 text-accent-warm" />
              <h3 className="text-xs font-bold text-text-1 font-mono uppercase">Mistakes Reset</h3>
              <p className="text-[11px] text-text-3 leading-relaxed">
                An incorrect choice immediately drops your multiplier back to 1x. Keep your focus high!
              </p>
            </div>
          </div>

          {/* Footer Call to Action */}
          <div className="pt-4 border-t border-border/60 text-center space-y-4 relative">
            {questions.length === 0 ? (
              <p className="text-xs text-amber-500 font-medium">
                No quiz questions found in your completed path. We will load fallback trivia to get you started!
              </p>
            ) : (
              <p className="text-[11px] text-text-3 font-mono">
                Questions are synchronized from your completed milestones.
              </p>
            )}

            <Button
              onClick={startCountdown}
              className="w-full sm:w-auto px-8 h-12 bg-primary hover:bg-primary/95 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2 mx-auto"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Start Challenge Mode</span>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Pre-game Countdown Screen (3, 2, 1, GO!)
  if (gameState === 'countdown') {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center">
        <div className="text-center space-y-6">
          <span className="text-[10px] font-mono tracking-widest text-primary uppercase font-bold animate-pulse">
            Powering Up Neurons
          </span>
          <div className="h-32 flex items-center justify-center">
            <h1 className="text-8xl md:text-9xl font-black text-primary font-heading animate-ping">
              {gameCountdown === 0 ? 'GO!' : gameCountdown}
            </h1>
          </div>
          <p className="text-xs text-text-3 font-mono">
            Lightning Round starts in a flash...
          </p>
        </div>
      </div>
    )
  }

  // Game Over / Results Screen
  if (gameState === 'gameover') {
    return (
      <div className="max-w-md mx-auto py-8 px-4 animate-page-enter">
        <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-2xl space-y-8 text-center relative overflow-hidden">
          {/* Sparkles background glow */}
          <div className="absolute -right-20 -top-20 w-48 h-48 bg-primary/10 rounded-full blur-2xl" />
          <div className="absolute -left-20 -bottom-20 w-48 h-48 bg-accent/10 rounded-full blur-2xl" />

          {/* Badge/Award Icon */}
          <div className="inline-flex p-4 bg-accent/10 border border-accent/20 rounded-full text-accent mb-2">
            <Award className="h-10 w-10 text-accent animate-pulse" />
          </div>

          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-black text-text-1">Time Up!</h1>
            <p className="text-text-2 text-xs font-medium">Here is your Lightning Round report card</p>
          </div>

          {/* XP Banner */}
          <div className="p-4 bg-gradient-to-r from-primary/10 via-accent/10 to-transparent border border-primary/20 rounded-xl space-y-1 relative">
            <div className="absolute top-2 right-2 text-primary">
              <Sparkles className="h-4 w-4 fill-current animate-bounce" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold">Total Rewards Earned</span>
            <div className="text-3xl font-black text-primary font-mono">+{xpEarned} XP</div>
            {isSavingXp && (
              <span className="text-[9px] font-mono text-text-3 block animate-pulse">Syncing rewards to cloud...</span>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 bg-surface-alt rounded-lg border border-border/50">
              <span className="text-[10px] font-mono text-text-3 uppercase block mb-1">Accuracy</span>
              <span className="text-lg font-bold text-text-1 font-mono">{accuracy}%</span>
            </div>
            <div className="p-3 bg-surface-alt rounded-lg border border-border/50">
              <span className="text-[10px] font-mono text-text-3 uppercase block mb-1">Answers</span>
              <span className="text-lg font-bold text-text-1 font-mono">{correctCount}/{totalAnswered}</span>
            </div>
            <div className="p-3 bg-surface-alt rounded-lg border border-border/50">
              <span className="text-[10px] font-mono text-text-3 uppercase block mb-1">Max Streak</span>
              <span className="text-lg font-bold text-accent-warm font-mono">{maxStreak}🔥</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-border/60 flex flex-col gap-3">
            <Button
              onClick={startCountdown}
              className="w-full h-11 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="h-4.5 w-4.5" />
              <span>Challenge Again</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                router.refresh()
                router.push('/dashboard')
              }}
              className="w-full h-11 border border-border text-text-2 hover:bg-surface-alt font-semibold text-xs rounded-xl cursor-pointer"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Active Gameplay Screen
  const currentQuestion = questions[currentIdx]
  
  // Timer Color logic
  let timerColor = 'bg-primary'
  if (timeLeft < 15.0) {
    timerColor = 'bg-error animate-pulse'
  } else if (timeLeft < 30.0) {
    timerColor = 'bg-amber-500'
  }

  return (
    <div className="max-w-2xl mx-auto py-4 px-4 animate-page-enter">
      {/* Header with Exit & Stats */}
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={endGame}
          className="flex items-center space-x-1.5 text-text-3 hover:text-text-1 text-xs font-semibold bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Exit Session</span>
        </button>

        {/* Live Metrics Display */}
        <div className="flex items-center space-x-4">
          {/* XP Gained counter */}
          <div className="flex items-center space-x-1 text-primary text-xs font-mono font-bold">
            <Sparkles className="h-4 w-4 fill-current text-primary animate-pulse" />
            <span>{xpEarned} XP</span>
          </div>

          {/* Consecutive Correct Answer Streak Flame */}
          <div className="flex items-center space-x-1 text-accent-warm text-xs font-mono font-bold">
            <Flame className="h-4 w-4 fill-current text-accent-warm" />
            <span>{streak} Streak</span>
          </div>
        </div>
      </div>

      {/* Visual Timer Progress Bar */}
      <div className="w-full h-2 bg-border rounded-full overflow-hidden mb-6 relative border border-border/20">
        <div 
          className={`h-full transition-all duration-100 ease-linear ${timerColor}`}
          style={{ width: `${Math.min(100, (timeLeft / 60) * 100)}%` }}
        />
      </div>

      {/* Main card viewport */}
      {currentQuestion ? (
        <div className="space-y-6">
          {/* Timer Clock Badge and Multiplier Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Countdown Text */}
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-surface-alt border border-border rounded-full shadow-sm">
              <Timer className="h-4 w-4 text-text-2" />
              <span className="font-mono text-sm font-bold text-text-1">
                Time Remaining: <strong className={timeLeft < 15 ? 'text-error font-extrabold' : 'text-text-1 font-bold'}>{timeLeft}s</strong>
              </span>
            </div>

            {/* Streak Multiplier Badge */}
            <div className="flex items-center space-x-1.5">
              {[1, 2, 3, 4].map((mult) => {
                const isActive = currentMultiplier >= mult
                const badgeColor = mult === 4 
                  ? 'bg-accent/15 text-accent border-accent/25'
                  : mult === 3 
                    ? 'bg-amber-500/15 text-amber-500 border-amber-500/25'
                    : mult === 2
                      ? 'bg-primary/15 text-primary border-primary/25'
                      : 'bg-text-3/15 text-text-3 border-text-3/25'

                return (
                  <div
                    key={mult}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border transition-all duration-300 ${
                      isActive 
                        ? `${badgeColor} scale-100 opacity-100 shadow-sm` 
                        : 'bg-transparent text-text-3/40 border-border/40 scale-95 opacity-50'
                    }`}
                  >
                    {mult}x
                  </div>
                )
              })}
            </div>
          </div>

          {/* Question card */}
          <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-lg relative min-h-[160px] flex flex-col justify-center">
            {/* Section label */}
            <span className="text-[10px] font-mono tracking-widest text-primary uppercase font-bold mb-3 block">
              Question {totalAnswered + 1}
            </span>
            <h2 className="font-heading text-lg md:text-xl font-bold leading-relaxed text-text-1">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Options grid */}
          <div className="grid grid-cols-1 gap-3">
            {(currentQuestion.options || []).map((option) => {
              const isSelected = selectedOption === option
              const isCorrectAnswer = option.trim().toLowerCase() === currentQuestion.correct_answer.trim().toLowerCase()
              
              // Answer visual indicators
              let optionStyle = 'border-border bg-surface hover:bg-surface-alt text-text-2 hover:text-text-1'
              
              if (feedback !== null) {
                if (isCorrectAnswer) {
                  // highlight correct answer in green on confirm
                  optionStyle = 'border-success bg-success/10 text-success shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                } else if (isSelected && !isCorrectAnswer) {
                  // highlight incorrect selection in red
                  optionStyle = 'border-error bg-error/10 text-error shadow-[0_0_12px_rgba(239,68,68,0.1)]'
                } else {
                  optionStyle = 'border-border bg-surface/50 text-text-3 opacity-60'
                }
              } else if (isSelected) {
                optionStyle = 'border-primary bg-primary/5 text-primary'
              }

              return (
                <button
                  key={option}
                  disabled={feedback !== null}
                  onClick={() => handleOptionSelect(option)}
                  className={`w-full p-4 text-left text-sm font-semibold rounded-xl border transition-all duration-150 flex items-center justify-between group disabled:cursor-not-allowed ${optionStyle}`}
                >
                  <span className="pr-4">{option}</span>
                  <div className="shrink-0">
                    {feedback !== null && isCorrectAnswer && (
                      <CheckCircle2 className="h-5 w-5 text-success animate-bounce" />
                    )}
                    {feedback !== null && isSelected && !isCorrectAnswer && (
                      <XCircle className="h-5 w-5 text-error" />
                    )}
                    {feedback === null && (
                      <span className="w-5 h-5 rounded-full border border-border group-hover:border-primary transition flex items-center justify-center text-[10px] font-mono text-text-3 group-hover:text-primary">
                        ➜
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Quick instructions reminder */}
          <div className="text-center">
            <span className="text-[10px] text-text-3 font-mono">
              Speed: +2s on Correct • Streak multiplier rewards up to 4x XP
            </span>
          </div>
        </div>
      ) : (
        <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4 bg-surface border border-border rounded-2xl p-6 text-center">
          <Zap className="h-10 w-10 text-amber-500 animate-bounce" />
          <h3 className="font-heading text-lg font-bold text-text-1">Synthesizing Questions</h3>
          <p className="text-xs text-text-2 max-w-xs mx-auto leading-relaxed">
            Running low on synaptic questions. We will pull and shuffle a fresh batch now!
          </p>
          <Button 
            onClick={loadGameData} 
            className="bg-primary hover:bg-primary/95 text-white text-xs px-4 h-9 shadow-[0_0_12px_rgba(91,142,255,0.2)]"
          >
            Reload Questions
          </Button>
        </div>
      )}
    </div>
  )
}
