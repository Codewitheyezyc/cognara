'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import StepName from '@/components/onboarding/StepName'
import StepGoal from '@/components/onboarding/StepGoal'
import StepLearningStyle from '@/components/onboarding/StepLearningStyle'
import StepLevel from '@/components/onboarding/StepLevel'
import StepDepth from '@/components/onboarding/StepDepth'
import StepTime from '@/components/onboarding/StepTime'
import GeneratingPath from '@/components/onboarding/GeneratingPath'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  // Onboarding Wizard Form State
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [goalText, setGoalText] = useState('')
  const [subject, setSubject] = useState('')
  const [learningStyleDetail, setLearningStyleDetail] = useState<any>(null)
  const [level, setLevel] = useState('')
  const [learningDepth, setLearningDepth] = useState(2) // default 2 (Beginner)
  const [dailyMinutes, setDailyMinutes] = useState(30) // default 30 min
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  // Fetch initial profile name if logged in
  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', user.id)
            .maybeSingle()

          if (profile?.name) {
            setName(profile.name)
          }
        }
      } catch (err) {
        console.error('Error fetching initial profile:', err)
      } finally {
        setIsInitializing(false)
      }
    }
    loadProfile()
  }, [supabase])

  // Submit onboarding details to API route
  async function triggerGeneration() {
    setStep(7) // Generating step
    setErrorMsg(null)

    try {
      const response = await fetch('/api/ai/generate-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          goalText,
          subject,
          level,
          learningDepth,
          dailyMinutes,
          learningStyleDetail,
        }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        setErrorMsg(result.error || 'Failed to generate roadmap. Please try again.')
        setStep(6) // Go back to last step for retry
      } else {
        setStep(8) // Success step
      }
    } catch (err) {
      console.error('Error in onboarding submission:', err)
      setErrorMsg('An unexpected connection issue occurred. Please try again.')
      setStep(6)
    }
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-bg">
        <div className="animate-pulse flex items-center space-x-2">
          <Logo className="h-6 w-6" />
          <span className="font-heading text-lg font-bold">Initializing Cognara...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-bg">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-gradient-to-r from-primary/10 to-accent/15 opacity-60 blur-[130px] pointer-events-none animate-learning-pulse" />

      <div className="relative z-10 w-full max-w-lg p-4 animate-page-enter">
        <div className="rounded-[10px] border border-border bg-surface p-8 shadow-lg">
          {errorMsg && (
            <div className="mb-6 rounded-md bg-error/10 p-3 text-sm text-error border border-error/20">
              {errorMsg}
            </div>
          )}

          {step === 1 && (
            <StepName
              name={name}
              onChange={setName}
              onNext={() => setStep(2)}
            />
          )}

          {step === 2 && (
            <StepGoal
              goalText={goalText}
              subject={subject}
              onGoalChange={setGoalText}
              onSubjectChange={setSubject}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}

          {step === 3 && (
            <StepLearningStyle
              onChange={setLearningStyleDetail}
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
            />
          )}

          {step === 4 && (
            <StepLevel
              level={level}
              onChange={setLevel}
              onBack={() => setStep(3)}
              onNext={() => setStep(5)}
            />
          )}

          {step === 5 && (
            <StepDepth
              depth={learningDepth}
              onChange={setLearningDepth}
              onBack={() => setStep(4)}
              onNext={() => setStep(6)}
            />
          )}

          {step === 6 && (
            <StepTime
              dailyMinutes={dailyMinutes}
              onChange={setDailyMinutes}
              onBack={() => setStep(5)}
              onNext={triggerGeneration}
            />
          )}

          {step === 7 && <GeneratingPath />}

          {step === 8 && (
            <div className="flex flex-col items-center justify-center text-center space-y-6 animate-page-enter">
              <div className="relative flex items-center justify-center w-16 h-16 rounded-full border border-success/30 bg-success/10 text-success shadow-[0_0_24px_rgba(52,211,153,0.15)]">
                <CheckCircle2 className="h-9 w-9" strokeWidth={1.5} />
              </div>

              <div className="space-y-2">
                <h2 className="font-heading text-2xl font-bold text-text-1">Your Path is Ready!</h2>
                <p className="text-sm text-text-2 max-w-sm mx-auto">
                  Cognara has structured your dynamic milestones and generated your custom dashboard. Let&apos;s start building your expertise.
                </p>
              </div>

              <Button
                onClick={() => {
                  router.push('/dashboard')
                  router.refresh()
                }}
                variant="default"
                className="w-full h-11 shadow-[0_0_16px_rgba(91,142,255,0.2)]"
              >
                Enter My Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
