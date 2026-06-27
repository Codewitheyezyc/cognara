'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Trophy, Star, ArrowRight, Share2, Award, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { Logo } from '@/components/ui/Logo'
import confetti from 'canvas-confetti'

interface GoalCelebrationProps {
  goalId: string
  goalName: string
  userName: string
  startDate: string
  completedDate: string
  totalTimeWeeks: number
  phasesCount: number
  lessonsCount: number
  quizzesCount: number
  cxpEarned: number
  onClaimCertificate: () => void
  onContinue: () => void
}

// Spark message depending on name
const getSparkQuote = (name: string) => {
  return `${name}, I have watched you go from the beginning of this journey to the end. Every lesson, every quiz, every day you showed up — it led here. This certificate is yours. You earned it.`
}

export function GoalCelebration({
  goalId,
  goalName,
  userName,
  startDate,
  completedDate,
  totalTimeWeeks,
  phasesCount,
  lessonsCount,
  quizzesCount,
  cxpEarned,
  onClaimCertificate,
  onContinue
}: GoalCelebrationProps) {
  const supabase = createClient()
  const { toast } = useToast()

  // State sequences: 1 = Moment 1 (Arrival), 2 = Moment 2 (Celebration)
  const [moment, setMoment] = useState(1)

  // Testimonial Form States
  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [testimonialText, setTestimonialText] = useState('')
  const [submittingTestimonial, setSubmittingTestimonial] = useState(false)
  const [testimonialSubmitted, setTestimonialSubmitted] = useState(false)

  // Referral copy state
  const [referralCopied, setReferralCopied] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: prof } = await supabase
          .from('profiles')
          .select('referral_code')
          .eq('id', user.id)
          .maybeSingle()
        if (prof) {
          setProfile(prof)
        }
      }
    }
    loadUser()
  }, [])


  // Suggest goals based on completed goal name
  const getSuggestedGoals = () => {
    const lowerGoal = goalName.toLowerCase()
    if (lowerGoal.includes('marketing') || lowerGoal.includes('social media')) {
      return ['Content Creation', 'Digital Marketing Strategy', 'Business Strategy']
    } else if (lowerGoal.includes('frontend') || lowerGoal.includes('developer') || lowerGoal.includes('web') || lowerGoal.includes('software')) {
      return ['Backend Development', 'UI/UX Design', 'React Advanced']
    } else {
      return ['Financial Management', 'Marketing Strategy', 'Leadership and Management']
    }
  }

  // Moment 1 timer -> Moment 2
  useEffect(() => {
    if (moment === 1) {
      const timer = setTimeout(() => {
        setMoment(2)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [moment])

  // Trigger confetti burst on Moment 2 appearance
  useEffect(() => {
    if (moment === 2) {
      // First burst - center
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { x: 0.5, y: 0.5 },
        colors: ['#F59E0B', '#D97706', '#6366F1', '#8B5CF6', '#FFFFFF']
      })

      // Second burst - left side
      const t1 = setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ['#F59E0B', '#6366F1', '#FFFFFF']
        })
      }, 300)

      // Third burst - right side
      const t2 = setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ['#F59E0B', '#6366F1', '#FFFFFF']
        })
      }, 600)

      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }
  }, [moment])

  // Submit testimonial
  const handleTestimonialSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testimonialText.trim()) return

    setSubmittingTestimonial(true)
    try {
      const nameParts = userName.trim().split(' ')
      const firstName = nameParts[0] || 'Learner'
      const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1][0].toUpperCase() : 'C'

      const response = await fetch('/api/testimonials/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_initial: lastInitial,
          learning_goal: goalName,
          testimonial_text: testimonialText.trim(),
          star_rating: rating > 0 ? rating : null
        })
      })

      if (!response.ok) throw new Error('API submission failed')
      setTestimonialSubmitted(true)
      toast('Testimonial shared successfully!')

      // Send admin notification email about GOAL COMPLETION testimonial
      // (This endpoint automatically sends notifications, but the server handles email formatting)
    } catch (err) {
      console.error('Failed to submit testimonial:', err)
      toast('Failed to submit testimonial. Please try again.')
    } finally {
      setSubmittingTestimonial(false)
    }
  }

  // Invite Friend (Copy Link / Share referral)
  const handleInviteFriend = async () => {
    const referralCode = profile?.referral_code || `CGN-${userId?.substring(0, 4).toUpperCase()}`
    const referralLink = `https://www.cognaralearn.com/signup?ref=${referralCode}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Cognara',
          text: `I just completed my ${goalName} goal on Cognara. Try it free and earn bonus CXP:`,
          url: referralLink
        })
      } catch (err) {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(referralLink)
      setReferralCopied(true)
      toast('Referral link copied — share it with someone who has a goal.')
      setTimeout(() => setReferralCopied(false), 3000)
    }
  }


  // Helper formatting for dates
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  // MOMENT 1: The Arrival
  if (moment === 1) {
    return (
      <div className="fixed inset-0 z-50 bg-bg flex flex-col items-center justify-center p-6 select-none animate-fade-in-celebrate">
        {/* Glow behind logo */}
        <div className="absolute w-[300px] h-[300px] rounded-full bg-gradient-to-br from-amber-500/10 to-amber-600/15 blur-3xl opacity-60 animate-learning-pulse pointer-events-none" />
        
        {/* Continuous slow gold particles rising */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-[-10px] left-[15%] w-1.5 h-1.5 bg-amber-500/40 rounded-full animate-bubble" style={{ animationDelay: '0.2s', animationDuration: '4s' }} />
          <div className="absolute bottom-[-10px] left-[45%] w-2 h-2 bg-amber-400/40 rounded-full animate-bubble" style={{ animationDelay: '1.2s', animationDuration: '5.5s' }} />
          <div className="absolute bottom-[-10px] left-[75%] w-1 h-1 bg-amber-600/40 rounded-full animate-bubble" style={{ animationDelay: '2.5s', animationDuration: '3.5s' }} />
        </div>

        <div className="space-y-6 text-center z-10">
          <Logo className="h-12 w-12 mx-auto text-amber-500 animate-pulse" />
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-amber-300 tracking-tight leading-none">
            You did it.
          </h1>
        </div>
      </div>
    )
  }

  // MOMENT 2: The Celebration (Main screen scrollable)
  return (
    <div className="fixed inset-0 z-50 bg-bg text-text-1 overflow-y-auto select-none animate-fade-in-celebrate pb-32">
      
      {/* Background glow highlights */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-amber-500/5 to-amber-600/10 blur-[120px] opacity-40 animate-learning-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-accent/5 to-primary/5 blur-[100px] opacity-30" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-6 py-12 flex flex-col items-center space-y-10 text-center">
        
        {/* TOP SECTION: Gold Completed Badge */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="goldRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="url(#goldRingGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              className="animate-draw-ring"
            />
          </svg>
          {/* Animated Gold Ring css */}
          <style>{`
            @keyframes drawRing {
              from { stroke-dasharray: 277; stroke-dashoffset: 277; }
              to { stroke-dasharray: 277; stroke-dashoffset: 0; }
            }
            .animate-draw-ring {
              animation: drawRing 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
              transform: rotate(-90deg);
              transform-origin: 50% 50%;
            }
            @keyframes bubbleUp {
              0% { transform: translateY(0) scale(0.8); opacity: 0; }
              20% { opacity: 0.7; }
              90% { opacity: 0.4; }
              100% { transform: translateY(-100vh) scale(1.1); opacity: 0; }
            }
            .animate-bubble {
              animation: bubbleUp 6s linear infinite;
            }
          `}</style>
          <div className="w-24 h-24 rounded-full bg-surface border border-amber-500/30 flex items-center justify-center text-4xl shadow-2xl z-10 animate-scale-up-delayed relative overflow-hidden">
            <Trophy className="h-10 w-10 text-amber-500 fill-current" />
            <div className="absolute inset-0 bg-amber-500/5 animate-pulse" />
          </div>
        </div>

        {/* Celebratory Headers */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-text-1 leading-[1.1]">
            You did it, {userName.split(' ')[0]}.
          </h1>
          <p className="text-sm font-extrabold text-amber-500 font-mono tracking-wider uppercase">
            {goalName} — Complete
          </p>
        </div>

        {/* JOURNEY STATS SECTION */}
        <div className="w-full space-y-4">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-2">
            Your Journey
          </span>
          <div className="bg-surface/80 border border-border rounded-2xl p-5 space-y-4 text-left">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border/40">
              <div>
                <span className="text-[9px] font-mono font-bold text-text-2 uppercase tracking-wider block">Started</span>
                <span className="text-xs font-bold text-text-1 mt-0.5 block">{formatDate(startDate)}</span>
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold text-text-2 uppercase tracking-wider block">Completed</span>
                <span className="text-xs font-bold text-text-1 mt-0.5 block">{formatDate(completedDate)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border/40">
              <div>
                <span className="text-[9px] font-mono font-bold text-text-2 uppercase tracking-wider block">Total Time</span>
                <span className="text-xs font-bold text-text-1 mt-0.5 block">{totalTimeWeeks} weeks</span>
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold text-text-2 uppercase tracking-wider block">Phases</span>
                <span className="text-xs font-bold text-text-1 mt-0.5 block">{phasesCount} complete</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border/40">
              <div>
                <span className="text-[9px] font-mono font-bold text-text-2 uppercase tracking-wider block">Lessons</span>
                <span className="text-xs font-bold text-text-1 mt-0.5 block">{lessonsCount} completed</span>
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold text-text-2 uppercase tracking-wider block">Quizzes</span>
                <span className="text-xs font-bold text-text-1 mt-0.5 block">{quizzesCount} passed</span>
              </div>
            </div>

            <div className="pt-2 text-center">
              <span className="text-[9px] font-mono font-bold text-text-2 uppercase tracking-wider block">Total CXP Earned</span>
              <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent font-mono tracking-tight drop-shadow-[0_0_12px_rgba(91,142,255,0.2)] block mt-1">
                +{cxpEarned} CXP
              </span>
            </div>
          </div>
        </div>

        {/* IDENTITY STATEMENT SECTION */}
        <div className="w-full py-8 border-y border-amber-500/20 space-y-4">
          <p className="text-sm sm:text-base font-semibold text-text-2 tracking-wide">
            You are no longer someone who wanted to
          </p>
          <h3 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent tracking-tight leading-none px-4">
            {goalName}
          </h3>
          <p className="text-lg sm:text-xl font-bold text-text-1 tracking-wide">
            You are someone who did.
          </p>
        </div>

        {/* GOAL COMPLETION CERTIFICATE SECTION */}
        <div className="w-full bg-surface border border-border rounded-2xl p-6 space-y-5">
          <div className="flex items-start gap-4 text-left">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl shrink-0">
              ✨
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-500">
                Spark
              </span>
              <p className="text-xs sm:text-sm text-text-2 leading-relaxed font-semibold">
                &ldquo;{getSparkQuote(userName.split(' ')[0])}&rdquo;
              </p>
            </div>
          </div>

          <Button
            onClick={onClaimCertificate}
            className="w-full h-13 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-text-1 font-extrabold text-[14px] rounded-xl shadow-[0_0_24px_rgba(245,158,11,0.25)] transition duration-150 active:scale-[0.99] cursor-pointer"
          >
            Claim My Goal Certificate 🏆
          </Button>
        </div>

        {/* MOMENT 3: TESTIMONIAL REQUEST */}
        <div className="w-full bg-surface border border-border rounded-2xl p-6 space-y-5 pt-8">
          <div className="space-y-2 text-center">
            <h3 className="text-lg sm:text-xl font-extrabold text-text-1">
              Your story could change someone&apos;s life.
            </h3>
            <p className="text-xs sm:text-sm text-text-2 leading-relaxed font-semibold max-w-sm mx-auto">
              Someone out there has the same goal you just achieved. They are exactly where you were on Day 1 — overwhelmed, unsure, looking for a sign that it is possible.<br /><br />
              Your story is that sign.
            </p>
          </div>

          {!testimonialSubmitted ? (
            <form onSubmit={handleTestimonialSubmit} className="space-y-4">
              {/* Star Rating */}
              <div className="flex items-center justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-3xl transition-transform hover:scale-110 cursor-pointer focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 shrink-0 ${
                        star <= (hoverRating || rating)
                          ? 'fill-amber-500 text-amber-500'
                          : 'text-[#1E2540]'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Text Input */}
              <div className="space-y-1.5">
                <textarea
                  value={testimonialText}
                  onChange={(e) => setTestimonialText(e.target.value.slice(0, 500))}
                  placeholder="What did you achieve? How did Cognara help? What would you tell someone who is just starting?"
                  rows={4}
                  className="w-full bg-bg border border-border focus:border-amber-500/50 rounded-xl p-3.5 text-xs sm:text-sm text-text-1 placeholder-[#8B95B3] focus:outline-none transition resize-none"
                />
                <div className="flex justify-end">
                  <span className="text-[10px] font-mono text-text-2 font-semibold">
                    {testimonialText.length}/500 characters
                  </span>
                </div>
              </div>

              {/* Submit / Skip */}
              <div className="flex flex-col gap-2.5 pt-1">
                <Button
                  type="submit"
                  disabled={submittingTestimonial || !testimonialText.trim()}
                  className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-text-1 font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  {submittingTestimonial ? 'Sharing...' : 'Share my story'}
                </Button>
                
                <button
                  type="button"
                  onClick={() => setTestimonialSubmitted(true)}
                  className="text-[11px] text-text-2 hover:text-text-1 font-bold uppercase tracking-wider block text-center py-2"
                >
                  Maybe later — show me my next goal
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4 text-center">
              <span className="text-[11px] font-mono font-bold text-amber-500 block">
                Story Shared!
              </span>
              <p className="text-xs text-text-2 mt-1 font-semibold">
                Your testimonial has been submitted. Thank you for motivating other learners!
              </p>
            </div>
          )}
        </div>

        {/* MOMENT 4: WHAT COMES NEXT */}
        <div className="w-full border-t border-border/60 pt-8 space-y-6">
          <div className="space-y-1.5 text-center">
            <h3 className="text-lg sm:text-xl font-extrabold text-text-1">
              What do you want to achieve next?
            </h3>
            <p className="text-xs text-text-2 font-semibold">
              Every expert was once a beginner with a goal and a place to start.
            </p>
          </div>

          {/* Goal Chips */}
          <div className="flex flex-wrap justify-center gap-2.5">
            {getSuggestedGoals().map((goal, idx) => (
              <button
                key={idx}
                onClick={onContinue}
                className="px-4 py-2 border border-border hover:border-amber-500/40 bg-surface hover:bg-[#1E2540] text-xs font-bold text-text-2 hover:text-text-1 rounded-full transition cursor-pointer"
              >
                {goal}
              </button>
            ))}
          </div>

          <Button
            onClick={onContinue}
            variant="ghost"
            className="w-full h-12 border border-border hover:bg-surface-alt text-xs font-bold uppercase tracking-wider rounded-xl"
          >
            Choose my own goal
          </Button>

          {/* Referral Section */}
          <div className="border-t border-border/60 pt-6 space-y-4 text-center">
            <h4 className="text-sm font-extrabold text-text-1">
              Know someone with a goal and no clear path?
            </h4>
            <Button
              onClick={handleInviteFriend}
              variant="ghost"
              className="w-full h-12 bg-surface/50 hover:bg-surface-alt border border-border text-text-2 hover:text-text-1 font-bold text-xs uppercase tracking-wider rounded-xl"
            >
              {referralCopied ? (
                <>
                  <Check className="h-4.5 w-4.5 mr-2 text-emerald-400" />
                  Link copied ✓
                </>
              ) : (
                <>
                  <Copy className="h-4.5 w-4.5 mr-2" />
                  Invite a friend to Cognara
                </>
              )}
            </Button>
            <p className="text-[10px] text-text-2 leading-relaxed max-w-xs mx-auto font-medium">
              They get a structured path. You get bonus CXP when they complete their first lesson.
            </p>
          </div>
        </div>

        {/* BOTTOM FINAL DIRECT CONTINUE */}
        <div className="w-full pt-4">
          <Button
            onClick={onContinue}
            className="w-full h-13 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-text-1 font-extrabold text-[14px] rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.99]"
          >
            Start my next goal
            <ArrowRight className="h-4.5 w-4.5" />
          </Button>
        </div>

      </div>
    </div>
  )
}
