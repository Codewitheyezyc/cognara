'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/Logo'
import { Loader2, Sparkles, CheckCircle2, AlertCircle, ChevronRight, ArrowLeft, Lock, ChevronDown, ChevronUp, Map, Rocket } from 'lucide-react'
import { clientSideFilter } from '@/lib/contentSafety/keywordFilter'

const SUGGESTED_GOALS = [
  { label: 'Become a Developer', text: 'I want to become a software developer, learn React, Next.js, and build production-grade web applications.' },
  { label: 'Social Media Marketing', text: 'I want to master social media marketing to grow online brand presence, design content calendars, and run campaigns.' },
  { label: 'Business Strategy', text: 'I want to learn business strategy and entrepreneurship frameworks to validate product-market fit and scale a business.' },
  { label: 'Data Analysis', text: 'I want to master data analysis, SQL, Python, and visualization tools to interpret business metrics and make data-driven decisions.' },
  { label: 'Other', text: '' }
]

const Q1_OPTIONS = [
  { label: 'Complete beginner — I\'m starting from zero', value: 'beginner' },
  { label: 'Some knowledge — I\'ve explored this before', value: 'intermediate' },
  { label: 'Intermediate — I know the basics, want to go deeper', value: 'advanced' }
]

const Q2_OPTIONS = [
  { label: 'Student', value: 'Student' },
  { label: 'Working professional', value: 'Working professional' },
  { label: 'Entrepreneur / Business owner', value: 'Business owner' },
  { label: 'Career changer', value: 'Career changer' },
  { label: 'Self-taught learner', value: 'Self-taught learner' }
]

const Q3_OPTIONS = [
  { label: '15–20 minutes', value: 15 },
  { label: '30–45 minutes', value: 30 },
  { label: '1 hour or more', value: 60 }
]

const LOADING_MESSAGES = [
  "Structuring your learning phases...",
  "Ordering topics from foundation to mastery...",
  "Calibrating to your level...",
  "Building your personalised roadmap...",
  "Almost ready..."
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  
  // Wizard steps: 1 = Goal, 2 = Context Questions, 3 = Roadmap Generation Loading, 4 = Roadmap Reveal
  const [step, setStep] = useState(1)
  
  // Sub-steps for step 2 (Questions 1, 2, 3)
  const [subStep, setSubStep] = useState(1)

  // Step 1 Form state
  const [goalText, setGoalText] = useState('')
  const [selectedChip, setSelectedChip] = useState<string | null>(null)
  const [isSubmittingGoal, setIsSubmittingGoal] = useState(false)
  const [successGoal, setSuccessGoal] = useState<string | null>(null)

  // Step 2 Form state
  const [q1Selection, setQ1Selection] = useState<string | null>(null)
  const [q2Selection, setQ2Selection] = useState<string | null>(null)
  const [q3Selection, setQ3Selection] = useState<number | null>(null)
  const [isSubmittingContext, setIsSubmittingContext] = useState(false)
  const [successContext, setSuccessContext] = useState<any>(null)

  // Step 3 Form state (Roadmap Generation)
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false)
  const [successRoadmap, setSuccessRoadmap] = useState<any>(null)
  const [roadmapError, setRoadmapError] = useState<string | null>(null)
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0)

  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Step 4 state (Roadmap Reveal)
  const [userName, setUserName] = useState<string | null>(null)
  const [firstLessonId, setFirstLessonId] = useState<string | null>(null)
  const [expandedModuleKey, setExpandedModuleKey] = useState<string | null>(null)
  const [isLoadingFirstLesson, setIsLoadingFirstLesson] = useState(false)

  // 1. Authenticate and get user
  useEffect(() => {
    async function checkUser() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) {
          router.push('/login')
          return
        }
        setUserId(user.id)

        // Prepopulate with existing data if any
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, main_goal, experience_level, occupation, daily_study_minutes, main_roadmap')
          .eq('id', user.id)
          .maybeSingle()

        if (profile) {
          if (profile.name) setUserName(profile.name)
          if (profile.main_goal) setGoalText(profile.main_goal)
          if (profile.experience_level) setQ1Selection(profile.experience_level)
          if (profile.occupation) setQ2Selection(profile.occupation)
          if (profile.daily_study_minutes) setQ3Selection(profile.daily_study_minutes)
          if (profile.main_roadmap) setSuccessRoadmap(profile.main_roadmap)
        }

        // Check if there is a referral source in sessionStorage and sync it
        if (typeof window !== 'undefined') {
          const refSource = sessionStorage.getItem('referral_source')
          if (refSource) {
            await supabase
              .from('profiles')
              .update({ referral_source: refSource })
              .eq('id', user.id)
            sessionStorage.removeItem('referral_source')
          }
        }
      } catch (err) {
        console.error('[Onboarding] Error checking user session:', err)
      } finally {
        setIsLoadingUser(false)
      }
    }
    checkUser()
  }, [supabase, router])

  // Step 3: Rotate loading messages every 2 seconds
  useEffect(() => {
    if (step === 3 && isGeneratingRoadmap) {
      const interval = setInterval(() => {
        setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length)
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [step, isGeneratingRoadmap])

  // Step 3: Trigger roadmap generation API call
  const triggerRoadmapGeneration = async () => {
    setRoadmapError(null)
    setSuccessRoadmap(null)
    setIsGeneratingRoadmap(true)
    setLoadingMsgIndex(0)

    try {
      const res = await fetch('/api/ai/generate-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate roadmap.')
      }

      // Fetch the saved main_roadmap JSON to show in success screen
      const { data: profile } = await supabase
        .from('profiles')
        .select('main_roadmap')
        .eq('id', userId!)
        .maybeSingle()

      setSuccessRoadmap(profile?.main_roadmap)
    } catch (err: any) {
      console.error('[Onboarding] Error generating roadmap:', err)
      setRoadmapError(err.message || 'An unexpected connection issue occurred.')
    } finally {
      setIsGeneratingRoadmap(false)
    }
  }

  // Trigger roadmap generation when entering step 3
  useEffect(() => {
    if (step === 3) {
      triggerRoadmapGeneration()
    }
  }, [step])

  const handleChipClick = (chipLabel: string, text: string) => {
    setSelectedChip(chipLabel)
    if (chipLabel === 'Other') {
      setGoalText('')
      const textarea = document.getElementById('goal-textarea')
      if (textarea) textarea.focus()
    } else {
      setGoalText(text)
      setErrorMsg(null)
    }
  }

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!goalText.trim()) {
      setErrorMsg('Please write or select a goal to build your roadmap.')
      return
    }

    if (!userId) {
      setErrorMsg('User session not found. Please log in again.')
      return
    }

    setErrorMsg(null)
    setSuccessGoal(null)
    setIsSubmittingGoal(true)

    // Run safety filter
    const safetyCheck = clientSideFilter(goalText)
    if (!safetyCheck.passed) {
      setErrorMsg(safetyCheck.reason || 'This goal contains content not supported on Cognara.')
      setIsSubmittingGoal(false)
      return
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ main_goal: goalText.trim() })
        .eq('id', userId)

      if (error) throw error

      setSuccessGoal(goalText.trim())
    } catch (err: any) {
      console.error('[Onboarding] Error saving goal:', err)
      setErrorMsg(err.message || 'Failed to save your goal. Please try again.')
    } finally {
      setIsSubmittingGoal(false)
    }
  }

  // Transitions to Step 2
  const proceedToStep2 = () => {
    setStep(2)
    setSubStep(1)
    setErrorMsg(null)
  }

  // Transitions between Step 2 questions
  const handleQ1Select = (val: string) => {
    setQ1Selection(val)
    setSubStep(2)
  }

  const handleQ2Select = (val: string) => {
    setQ2Selection(val)
    setSubStep(3)
  }

  const handleQ3Select = async (val: number) => {
    setQ3Selection(val)
    
    if (!q1Selection || !q2Selection) {
      setErrorMsg('Please make sure you answer all previous questions.')
      return
    }

    if (!userId) {
      setErrorMsg('User session not found. Please log in again.')
      return
    }

    setErrorMsg(null)
    setIsSubmittingContext(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          experience_level: q1Selection,
          occupation: q2Selection,
          daily_study_minutes: val
        })
        .eq('id', userId)

      if (error) throw error

      setSuccessContext({
        level: Q1_OPTIONS.find(o => o.value === q1Selection)?.label,
        occupation: Q2_OPTIONS.find(o => o.value === q2Selection)?.label,
        minutes: val
      })
    } catch (err: any) {
      console.error('[Onboarding] Error saving context questions:', err)
      setErrorMsg(err.message || 'Failed to save preferences. Please try again.')
    } finally {
      setIsSubmittingContext(false)
    }
  }

  const proceedToStep3 = () => {
    setStep(3)
    setErrorMsg(null)
  }

  const proceedToStep4 = () => {
    setStep(4)
    setErrorMsg(null)
  }

  // Step 4: Fetch the first lesson ID when step 4 loads
  useEffect(() => {
    if (step !== 4 || !userId) return
    const fetchFirstLesson = async () => {
      setIsLoadingFirstLesson(true)
      try {
        // Get active roadmap for this user
        const { data: goal } = await supabase
          .from('learning_goals')
          .select('id')
          .eq('user_id', userId)
          .eq('is_active', true)
          .maybeSingle()

        if (!goal) return

        const { data: roadmapRow } = await supabase
          .from('roadmaps')
          .select('id')
          .eq('goal_id', goal.id)
          .eq('user_id', userId)
          .maybeSingle()

        if (!roadmapRow) return

        // Get phase 1
        const { data: phase1 } = await supabase
          .from('roadmap_phases')
          .select('id')
          .eq('roadmap_id', roadmapRow.id)
          .eq('phase_number', 1)
          .maybeSingle()

        if (!phase1) return

        // Get first lesson in phase 1
        const { data: lesson } = await supabase
          .from('lessons')
          .select('id')
          .eq('phase_id', phase1.id)
          .eq('roadmap_id', roadmapRow.id)
          .order('order_index', { ascending: true })
          .limit(1)
          .maybeSingle()

        if (lesson) setFirstLessonId(lesson.id)
      } catch (err) {
        console.error('[Onboarding Step 4] Failed to fetch first lesson:', err)
      } finally {
        setIsLoadingFirstLesson(false)
      }
    }
    fetchFirstLesson()
  }, [step, userId])

  if (isLoadingUser) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0A0C14] text-[#F0F4FF]">
        <div className="animate-pulse flex flex-col items-center space-y-4">
          <Logo className="h-8 w-8" />
          <span className="font-heading text-lg font-semibold tracking-wide text-[#8B95B3]">Loading your profile...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[#0A0C14] px-4 py-8">
      {/* Premium background radial glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[450px] h-[450px] rounded-full bg-violet-600/10 blur-[130px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-lg animate-page-enter">
        
        {/* Brand Header */}
        {step !== 3 && step !== 4 && (
          <div className="flex flex-col items-center mb-8 text-center animate-fadeIn">
            <Logo className="h-10 w-10 mb-2 filter drop-shadow-[0_0_12px_rgba(91,142,255,0.4)]" />
            <h1 className="font-heading text-2xl font-bold tracking-tight text-[#F0F4FF]">Cognara</h1>
            <p className="text-xs uppercase tracking-widest text-[#5B8EFF] mt-1 font-semibold">AI Achievement Platform</p>
          </div>
        )}

        {/* Wizard step cards */}
        <div className="rounded-xl border border-[#1E2540] bg-[#111520]/80 backdrop-blur-md p-6 sm:p-8 shadow-2xl shadow-black/40">
          
          {errorMsg && step !== 3 && (
            <div className="mb-5 rounded-lg bg-[#F87171]/10 p-3 text-xs text-[#F87171] border border-[#F87171]/20 flex items-start space-x-2 animate-fadeIn">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ==================== STEP 1: GOAL INPUT ==================== */}
          {step === 1 && (
            <>
              {successGoal ? (
                <div className="space-y-6 py-4 text-center animate-page-enter">
                  <div className="relative flex items-center justify-center w-14 h-14 rounded-full border border-[#34D399]/30 bg-[#34D399]/10 text-[#34D399] mx-auto shadow-[0_0_20px_rgba(52,211,153,0.15)]">
                    <CheckCircle2 className="h-8 w-8" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-heading text-lg font-bold text-[#F0F4FF]">Goal Saved Successfully!</h3>
                    <p className="text-xs text-[#8B95B3] max-w-sm mx-auto leading-relaxed">
                      Your goal has been written to your profile:
                    </p>
                    <div className="bg-[#171C2E] border border-[#1E2540] rounded-lg p-3 text-sm text-[#F0F4FF] italic font-medium max-w-md mx-auto">
                      &quot;{successGoal}&quot;
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button
                      onClick={proceedToStep2}
                      className="w-full h-12 bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] text-[#0A0C14] hover:text-white font-bold rounded-lg shadow-[0_0_20px_rgba(91,142,255,0.25)] flex items-center justify-center gap-1.5 transition-all duration-200"
                    >
                      <span>Continue to Context Questions</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleGoalSubmit} className="space-y-5">
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#5B8EFF] bg-[#5B8EFF]/10 px-2.5 py-1 rounded-full font-bold">Redesign Onboarding</span>
                      <span className="text-xs font-mono text-[#8B95B3]">Step 1 of 4</span>
                    </div>
                    <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#F0F4FF] tracking-tight mt-3">
                      What do you want to achieve?
                    </h2>
                    <p className="text-sm text-[#8B95B3] leading-relaxed">
                      Define the goal you want to reach. Cognara will use this to outline your roadmap, tailor lessons, and keep you accountable.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <textarea
                      id="goal-textarea"
                      rows={4}
                      value={goalText}
                      placeholder="e.g. I want to become a frontend developer, learn React, and get hired this year."
                      onChange={(e) => {
                        setGoalText(e.target.value)
                        setErrorMsg(null)
                      }}
                      className="w-full p-4 bg-[#171C2E] border border-[#1E2540] focus:border-[#5B8EFF] focus:ring-1 focus:ring-[#5B8EFF] rounded-lg text-sm text-[#F0F4FF] placeholder-[#4A5272] outline-none resize-none transition-all duration-200 leading-relaxed font-sans"
                      disabled={isSubmittingGoal}
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-xs font-semibold text-[#8B95B3] uppercase tracking-wider">Suggested Goals:</label>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTED_GOALS.map((chip) => {
                        const isSelected = selectedChip === chip.label
                        return (
                          <button
                            key={chip.label}
                            type="button"
                            onClick={() => handleChipClick(chip.label, chip.text)}
                            className={`px-3 py-1.5 text-xs rounded-full border transition-all duration-150 cursor-pointer ${
                              isSelected
                                ? 'bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] text-[#0A0C14] border-transparent font-bold shadow-[0_0_12px_rgba(91,142,255,0.25)]'
                                : 'bg-[#171C2E] hover:bg-[#1E2540] border-[#1E2540] hover:border-[#8B95B3] text-[#8B95B3] hover:text-[#F0F4FF]'
                            }`}
                            disabled={isSubmittingGoal}
                          >
                            {chip.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={isSubmittingGoal}
                      className="w-full h-12 bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] hover:from-[#4A7AEE] hover:to-[#9067FA] text-[#0A0C14] hover:text-white font-bold rounded-lg shadow-[0_0_20px_rgba(91,142,255,0.25)] transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      {isSubmittingGoal ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Saving Goal...</span>
                        </>
                      ) : (
                        <span>Build My Roadmap →</span>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* ==================== STEP 2: CONTEXT QUESTIONS ==================== */}
          {step === 2 && (
            <>
              {successContext ? (
                <div className="space-y-6 py-4 text-center animate-page-enter">
                  <div className="relative flex items-center justify-center w-14 h-14 rounded-full border border-[#34D399]/30 bg-[#34D399]/10 text-[#34D399] mx-auto shadow-[0_0_20px_rgba(52,211,153,0.15)]">
                    <CheckCircle2 className="h-8 w-8" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-heading text-lg font-bold text-[#F0F4FF]">Context Preferences Saved!</h3>
                    <p className="text-xs text-[#8B95B3] max-w-sm mx-auto leading-relaxed">
                      We have written your answers directly to your profile:
                    </p>
                    
                    <div className="bg-[#171C2E] border border-[#1E2540] rounded-lg p-4 text-left text-xs space-y-2 max-w-sm mx-auto mt-2">
                      <div className="flex justify-between text-[#8B95B3]">
                        <span>Experience Level:</span>
                        <span className="text-[#F0F4FF] font-semibold">{successContext.level}</span>
                      </div>
                      <div className="flex justify-between text-[#8B95B3]">
                        <span>Occupation/Background:</span>
                        <span className="text-[#F0F4FF] font-semibold">{successContext.occupation}</span>
                      </div>
                      <div className="flex justify-between text-[#8B95B3]">
                        <span>Study Time:</span>
                        <span className="text-[#F0F4FF] font-semibold">{successContext.minutes} mins / day</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button
                      onClick={proceedToStep3}
                      className="w-full h-12 bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] text-[#0A0C14] hover:text-white font-bold rounded-lg shadow-[0_0_20px_rgba(91,142,255,0.25)] flex items-center justify-center gap-1.5 transition-all duration-200"
                    >
                      <span>Build My Roadmap</span>
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between text-xs font-mono text-[#8B95B3] border-b border-[#1E2540]/30 pb-3">
                    <span>Step 2 of 4 — Calibration</span>
                    <span className="text-[#5B8EFF] font-semibold">Question {subStep} of 3</span>
                  </div>

                  {subStep === 1 && (
                    <div className="space-y-4 animate-page-enter">
                      <h3 className="font-heading text-lg sm:text-xl font-bold text-[#F0F4FF] leading-snug">
                        How familiar are you with &quot;{goalText || 'your goal'}&quot;?
                      </h3>
                      <div className="space-y-2.5 mt-2">
                        {Q1_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleQ1Select(opt.value)}
                            className={`w-full text-left p-4 rounded-lg border text-sm transition-all duration-150 cursor-pointer ${
                              q1Selection === opt.value
                                ? 'bg-[#171C2E] border-[#5B8EFF] text-[#F0F4FF] font-medium'
                                : 'bg-[#171C2E]/40 border-[#1E2540] text-[#8B95B3] hover:text-[#F0F4FF] hover:border-[#8B95B3]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {subStep === 2 && (
                    <div className="space-y-4 animate-page-enter">
                      <h3 className="font-heading text-lg sm:text-xl font-bold text-[#F0F4FF] leading-snug">
                        What describes you best?
                      </h3>
                      <div className="space-y-2.5 mt-2">
                        {Q2_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleQ2Select(opt.value)}
                            className={`w-full text-left p-4 rounded-lg border text-sm transition-all duration-150 cursor-pointer ${
                              q2Selection === opt.value
                                ? 'bg-[#171C2E] border-[#5B8EFF] text-[#F0F4FF] font-medium'
                                : 'bg-[#171C2E]/40 border-[#1E2540] text-[#8B95B3] hover:text-[#F0F4FF] hover:border-[#8B95B3]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {subStep === 3 && (
                    <div className="space-y-4 animate-page-enter">
                      <h3 className="font-heading text-lg sm:text-xl font-bold text-[#F0F4FF] leading-snug">
                        How much time can you dedicate per day?
                      </h3>
                      <div className="space-y-2.5 mt-2">
                        {isSubmittingContext ? (
                          <div className="flex flex-col items-center justify-center py-8 space-y-3">
                            <Loader2 className="h-8 w-8 text-[#5B8EFF] animate-spin" />
                            <span className="text-xs text-[#8B95B3]">Saving preferences to Supabase...</span>
                          </div>
                        ) : (
                          Q3_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => handleQ3Select(opt.value)}
                              className={`w-full text-left p-4 rounded-lg border text-sm transition-all duration-150 cursor-pointer ${
                                q3Selection === opt.value
                                  ? 'bg-[#171C2E] border-[#5B8EFF] text-[#F0F4FF] font-medium'
                                  : 'bg-[#171C2E]/40 border-[#1E2540] text-[#8B95B3] hover:text-[#F0F4FF] hover:border-[#8B95B3]'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {subStep > 1 && !isSubmittingContext && (
                    <div className="flex justify-center pt-2">
                      <button
                        type="button"
                        onClick={() => setSubStep(prev => prev - 1)}
                        className="text-xs text-[#8B95B3] hover:text-[#F0F4FF] flex items-center gap-1 transition duration-150 cursor-pointer font-medium"
                      >
                        <ArrowLeft className="h-3 w-3" />
                        <span>Back</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ==================== STEP 3: ROADMAP LOADING SCREEN ==================== */}
          {step === 3 && (
            <div className="space-y-8 py-6 flex flex-col items-center justify-center text-center animate-page-enter">
              
              {isGeneratingRoadmap ? (
                <>
                  {/* Logo / Mascot Centered with filter shadow glow */}
                  <div className="relative mb-2">
                    <div className="absolute inset-0 rounded-full bg-[#5B8EFF]/20 blur-xl filter animate-pulse" />
                    <Logo className="h-16 w-16 relative z-10 filter drop-shadow-[0_0_16px_rgba(91,142,255,0.5)] animate-bounce duration-1000" />
                  </div>

                  {/* Dynamic Progress Bar */}
                  <div className="w-full max-w-xs h-2 bg-[#171C2E] border border-[#1E2540] rounded-full overflow-hidden relative">
                    <div className="h-full bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] rounded-full absolute top-0 left-0 w-1/3 animate-[loading-bar_1.6s_infinite_linear]" />
                  </div>

                  {/* Rotating Loading Text Messages */}
                  <div className="h-6">
                    <p className="text-sm font-medium text-[#8B95B3] tracking-wide animate-pulse">
                      {LOADING_MESSAGES[loadingMsgIndex]}
                    </p>
                  </div>
                </>
              ) : roadmapError ? (
                /* Failed Generation Error State */
                <div className="space-y-5 animate-fadeIn">
                  <div className="relative flex items-center justify-center w-14 h-14 rounded-full border border-[#F87171]/30 bg-[#F87171]/10 text-[#F87171] mx-auto shadow-[0_0_20px_rgba(248,113,113,0.15)]">
                    <AlertCircle className="h-8 w-8" strokeWidth={1.5} />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-heading text-lg font-bold text-[#F0F4FF]">Roadmap Generation Failed</h3>
                    <p className="text-xs text-[#8B95B3] max-w-sm mx-auto leading-relaxed">
                      {roadmapError}
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <Button
                      onClick={triggerRoadmapGeneration}
                      className="w-full h-11 bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] text-[#0A0C14] hover:text-white font-bold rounded-lg transition-all duration-200"
                    >
                      Try Again
                    </Button>
                    
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-xs text-[#8B95B3] hover:text-[#F0F4FF] transition font-medium"
                    >
                      Go Back to Preferences
                    </button>
                  </div>
                </div>
              ) : (
                /* Success Screen for Step 3 Review */
                <div className="space-y-6 animate-page-enter">
                  <div className="relative flex items-center justify-center w-14 h-14 rounded-full border border-[#34D399]/30 bg-[#34D399]/10 text-[#34D399] mx-auto shadow-[0_0_20px_rgba(52,211,153,0.15)]">
                    <CheckCircle2 className="h-8 w-8" strokeWidth={1.5} />
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-heading text-lg font-bold text-[#F0F4FF]">Roadmap Generated!</h3>
                    <p className="text-xs text-[#8B95B3] max-w-sm mx-auto leading-relaxed">
                      We have custom-built your personalized learning path based on your goals and preferences:
                    </p>

                   {successRoadmap && (
                      <div className="bg-[#171C2E] border border-[#1E2540] rounded-lg p-4 text-left text-xs space-y-2 max-w-sm mx-auto mt-2 leading-relaxed">
                        <div className="flex justify-between text-[#8B95B3]">
                          <span>Goal:</span>
                          <span className="text-[#F0F4FF] font-semibold truncate max-w-[200px]">{successRoadmap.goal}</span>
                        </div>
                        <div className="flex justify-between text-[#8B95B3]">
                          <span>Duration:</span>
                          <span className="text-[#F0F4FF] font-semibold">{successRoadmap.estimated_weeks} Weeks</span>
                        </div>
                        <div className="flex justify-between text-[#8B95B3]">
                          <span>Phases:</span>
                          <span className="text-[#F0F4FF] font-semibold">{(successRoadmap.phases || []).length} Phases</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[#1E2540]/60 pt-4 mt-2">
                    <p className="text-xs text-[#8B95B3] flex items-center justify-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-[#5B8EFF]" />
                      Your roadmap is ready — tap the button below to see it
                    </p>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ==================== STEP 4: ROADMAP REVEAL ==================== */}
          {step === 4 && successRoadmap && (
            <div className="animate-page-enter pb-28">
              {/* Personalised Header */}
              <div className="space-y-1 mb-6">
                <div className="flex items-center gap-2 text-[#5B8EFF] mb-2">
                  <Map className="h-4 w-4" />
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Your Personalised Roadmap</span>
                </div>
                <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#F0F4FF] tracking-tight leading-tight">
                  Your roadmap is ready{userName ? `, ${userName.split(' ')[0]}` : ''}.&nbsp;✨
                </h2>
                <p className="text-sm text-[#8B95B3] leading-relaxed">
                  Here is your path to <span className="text-[#A78BFA] font-semibold">{successRoadmap.goal || goalText}</span>
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 bg-[#5B8EFF]/10 border border-[#5B8EFF]/20 text-[#5B8EFF] text-[11px] font-semibold rounded-full px-3 py-1">
                  <span>⏱</span>
                  <span>Estimated completion: {successRoadmap.estimated_weeks} weeks at your chosen pace</span>
                </div>
              </div>

              {/* Phase Cards */}
              <div className="space-y-3">
                {(successRoadmap.phases || []).map((phase: any, phaseIdx: number) => {
                  const isPhase1 = phaseIdx === 0
                  return (
                    <div key={phase.phase_number} className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                      isPhase1
                        ? 'border-[#5B8EFF]/40 bg-gradient-to-br from-[#111a30] to-[#12102a] shadow-[0_0_20px_rgba(91,142,255,0.08)]'
                        : 'border-[#1E2540] bg-[#0d1020]/60 opacity-60'
                    }`}>
                      {/* Phase Header */}
                      <div className={`flex items-start justify-between p-4 ${
                        isPhase1 ? 'border-b border-[#5B8EFF]/20' : ''
                      }`}>
                        <div className="flex items-start gap-3">
                          {/* Phase number bubble */}
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            isPhase1
                              ? 'bg-gradient-to-br from-[#5B8EFF] to-[#A78BFA] text-white shadow-[0_0_12px_rgba(91,142,255,0.35)]'
                              : 'bg-[#1E2540] text-[#4A5272]'
                          }`}>
                            {phase.phase_number}
                          </div>
                          <div className="space-y-0.5">
                            <p className={`text-[10px] font-mono uppercase tracking-wider font-bold ${
                              isPhase1 ? 'text-[#5B8EFF]' : 'text-[#4A5272]'
                            }`}>
                              Phase {phase.phase_number}
                            </p>
                            <h3 className={`font-heading font-bold text-sm leading-snug ${
                              isPhase1 ? 'text-[#F0F4FF]' : 'text-[#4A5272]'
                            }`}>
                              {phase.phase_name}
                            </h3>
                            <p className={`text-[11px] ${
                              isPhase1 ? 'text-[#8B95B3]' : 'text-[#3A4262]'
                            }`}>
                              {phase.estimated_weeks} week{phase.estimated_weeks !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        {!isPhase1 && (
                          <div className="flex flex-col items-end gap-1">
                            <Lock className="h-4 w-4 text-[#3A4262]" />
                            <span className="text-[9px] text-[#3A4262] font-semibold">Complete Phase 1 to unlock</span>
                          </div>
                        )}
                        {isPhase1 && (
                          <div className="flex items-center gap-1 text-[#34D399] text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse"></span>
                            <span>Active</span>
                          </div>
                        )}
                      </div>

                      {/* Phase 1 Modules — expanded and tappable */}
                      {isPhase1 && (
                        <div className="p-3 space-y-2">
                          {(phase.modules || []).map((mod: any, modIdx: number) => {
                            const moduleKey = `p${phase.phase_number}-m${mod.module_number}`
                            const isOpen = expandedModuleKey === moduleKey
                            return (
                              <div key={mod.module_number} className="rounded-lg border border-[#1E2540] bg-[#0D1020]/80 overflow-hidden">
                                {/* Module tap row */}
                                <button
                                  type="button"
                                  onClick={() => setExpandedModuleKey(isOpen ? null : moduleKey)}
                                  className="w-full flex items-center justify-between px-3 py-2.5 text-left cursor-pointer hover:bg-[#171C2E] transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-md bg-[#5B8EFF]/15 flex items-center justify-center text-[10px] font-bold text-[#5B8EFF]">
                                      {mod.module_number}
                                    </div>
                                    <span className="text-xs font-semibold text-[#C8D0E8]">{mod.module_name}</span>
                                  </div>
                                  {isOpen
                                    ? <ChevronUp className="h-3.5 w-3.5 text-[#5B8EFF] flex-shrink-0" />
                                    : <ChevronDown className="h-3.5 w-3.5 text-[#4A5272] flex-shrink-0" />}
                                </button>
                                {/* Topics list */}
                                {isOpen && (
                                  <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-[#1E2540] animate-fadeIn">
                                    {(mod.topics || []).map((topic: string, topicIdx: number) => (
                                      <div key={topicIdx} className="flex items-center gap-2 text-[11px] text-[#8B95B3]">
                                        <div className="w-1 h-1 rounded-full bg-[#5B8EFF]/50 flex-shrink-0"></div>
                                        <span>{topic}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Locked phase module summary (non-tappable) */}
                      {!isPhase1 && (phase.modules || []).length > 0 && (
                        <div className="px-4 pb-3 pt-1 space-y-1">
                          {(phase.modules || []).map((mod: any) => (
                            <div key={mod.module_number} className="flex items-center gap-2 text-[11px] text-[#3A4262]">
                              <Lock className="h-2.5 w-2.5 flex-shrink-0" />
                              <span>{mod.module_name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ==================== FIXED BOTTOM CTA (Step 3 Success & Step 4) ==================== */}
      {(step === 3 && successRoadmap && !isGeneratingRoadmap && !roadmapError) && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-[#0A0C14] via-[#0A0C14]/95 to-transparent pointer-events-none">
          <div className="max-w-lg mx-auto pointer-events-auto">
            <Button
              onClick={proceedToStep4}
              className="w-full h-13 bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] hover:from-[#4A7AEE] hover:to-[#9067FA] text-white font-bold rounded-xl shadow-[0_0_24px_rgba(91,142,255,0.35)] transition-all duration-200 flex items-center justify-center gap-2 text-base"
            >
              <Sparkles className="h-4.5 w-4.5" />
              <span>View My Roadmap →</span>
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-[#0A0C14] via-[#0A0C14]/95 to-transparent">
          <div className="max-w-lg mx-auto">
            <Button
              onClick={() => {
                if (firstLessonId) {
                  router.push(`/dashboard/lesson/${firstLessonId}`)
                } else {
                  router.push('/dashboard/path')
                }
              }}
              disabled={isLoadingFirstLesson}
              className="w-full h-13 bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] hover:from-[#4A7AEE] hover:to-[#9067FA] text-white font-bold rounded-xl shadow-[0_0_24px_rgba(91,142,255,0.35)] transition-all duration-200 flex items-center justify-center gap-2 text-base disabled:opacity-70"
            >
              {isLoadingFirstLesson ? (
                <><Loader2 className="h-4 w-4 animate-spin" /><span>Preparing your first lesson...</span></>
              ) : (
                <><Rocket className="h-4.5 w-4.5" /><span>Start Phase 1 →</span></>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Tailwind animation keyframe values defined in globals.css or inject here */}
      <style jsx global>{`
        @keyframes loading-bar {
          0% {
            left: -33%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
    </div>
  )
}
