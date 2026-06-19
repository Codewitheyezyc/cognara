'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Spark } from '@/components/mascot/Spark'
import { Award, ArrowRight, ArrowLeft, BookOpen, GraduationCap, ChevronRight, Loader2, Download } from 'lucide-react'

interface Recommendation {
  title: string
  description: string
}

export default function RoadmapCompletePage() {
  const params = useParams()
  const router = useRouter()
  const roadmapId = params.id as string
  const supabase = createClient()

  // State
  const [loadingData, setLoadingData] = useState(true)
  const [loadingRecs, setLoadingRecs] = useState(true)
  const [subject, setSubject] = useState('')
  const [roadmapTitle, setRoadmapTitle] = useState('')
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [grandEligible, setGrandEligible] = useState(false)
  const [grandEligData, setGrandEligData] = useState<any>(null)

  useEffect(() => {
    async function loadRoadmapDetails() {
      try {
        setLoadingData(true)
        // 1. Fetch user session
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        // 2. Fetch roadmap title and goal ID
        const { data: roadmap, error: roadmapErr } = await supabase
          .from('roadmaps')
          .select('title, goal_id')
          .eq('id', roadmapId)
          .maybeSingle()

        if (roadmapErr || !roadmap) {
          console.error(roadmapErr)
          setErrorMsg('Roadmap not found.')
          setLoadingData(false)
          return
        }

        setRoadmapTitle(roadmap.title)

        // 3. Fetch goal subject
        if (roadmap.goal_id) {
          const { data: goal } = await supabase
            .from('learning_goals')
            .select('subject')
            .eq('id', roadmap.goal_id)
            .maybeSingle()
          
          if (goal?.subject) {
            setSubject(goal.subject)
            
            // 4. Fetch recommendations based on the completed subject
            try {
              const res = await fetch(`/api/ai/recommend-goals?subject=${encodeURIComponent(goal.subject)}`)
              if (res.ok) {
                const data = await res.json()
                setRecommendations(data.recommendations || [])
              }
            } catch (recErr) {
              console.error('Failed to load next recommendations', recErr)
            } finally {
              setLoadingRecs(false)
            }
          } else {
            setLoadingRecs(false)
          }
        } else {
          setLoadingRecs(false)
        }

        // 5. Fetch Grand Certificate eligibility
        try {
          const res = await fetch(`/api/certificate/check-grand-eligibility?roadmapId=${roadmapId}`)
          if (res.ok) {
            const data = await res.json()
            setGrandEligible(data.eligible)
            setGrandEligData(data)
          }
        } catch (eligErr) {
          console.error('Failed to load grand certificate eligibility', eligErr)
        }

        setLoadingData(false)
      } catch (err) {
        console.error(err)
        setErrorMsg('An unexpected error occurred loading details.')
        setLoadingData(false)
        setLoadingRecs(false)
      }
    }

    if (roadmapId) {
      loadRoadmapDetails()
    }
  }, [roadmapId, supabase, router])

  if (loadingData) {
    return (
      <div className="min-h-screen bg-bg text-text-1 flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs font-semibold text-text-2 tracking-wide">Compiling achievements...</p>
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-bg text-text-1 flex flex-col items-center justify-center p-6 space-y-4 max-w-sm mx-auto text-center">
        <p className="text-sm text-error font-medium">{errorMsg}</p>
        <Link href="/dashboard" className="text-xs text-primary font-bold hover:underline">
          Return to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg text-text-1 px-4 py-12 md:py-20 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-primary/10 to-accent/15 opacity-50 blur-[130px] pointer-events-none" />

      <div className="max-w-2xl w-full text-center space-y-10 z-10 animate-page-enter">
        {/* Celebration Header */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            {/* Spark Animated Mascot */}
            <Spark emotion="celebrate" size={130} />
            <div className="absolute -top-2 -right-2 bg-amber-500 text-white rounded-full p-2.5 shadow-lg border border-amber-400/20 animate-bounce">
              <Award className="h-6 w-6" />
            </div>
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h1 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 via-primary to-accent bg-clip-text text-transparent select-none">
              Roadmap Completed!
            </h1>
            <p className="text-text-1 font-bold text-lg">
              {roadmapTitle || `Completed: ${subject}`}
            </p>
            <p className="text-text-2 text-xs md:text-sm leading-relaxed">
              You have successfully completed every single milestone, lesson, and assessment. You&apos;ve proved your dedication and built verified expertise in this field.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
          <Button
            onClick={() => router.push('/dashboard/portfolio')}
            className="h-11 flex-1 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl shadow-[0_0_16px_rgba(91,142,255,0.2)] text-xs flex items-center justify-center gap-2"
          >
            <span>View My Learning Portfolio</span>
            <GraduationCap className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => router.push('/dashboard')}
            className="h-11 flex-1 bg-surface border border-border hover:bg-surface-alt text-text-1 font-bold rounded-xl text-xs flex items-center justify-center gap-2"
          >
            <span>Back to Dashboard</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Master Certificate Download — only if eligible */}
        {grandEligible && (
          <div className="flex flex-col items-center space-y-2 pt-2 animate-bounce-subtle">
            <p className="text-[10px] text-text-3 font-mono uppercase tracking-widest text-amber-400">You&apos;ve earned it</p>
            <button
              onClick={() => window.open(`/api/certificate/generate-roadmap?roadmapId=${roadmapId}`, '_blank')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.06))',
                border: '1px solid rgba(245,158,11,0.4)',
                color: '#F59E0B',
                borderRadius: '12px',
                padding: '12px 28px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(245,158,11,0.12)',
                letterSpacing: '0.02em'
              }}
            >
              <Download size={15} />
              <span>Download Master Certificate</span>
              <Award size={15} />
            </button>
            <p className="text-[10px] text-text-3">Full course · All phases · Verified by Cognara</p>
          </div>
        )}

        {!grandEligible && grandEligData && (
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-md mx-auto space-y-3 text-center">
            <div className="text-xl">🔒</div>
            <h3 className="font-bold text-sm text-text-1">Master Certificate Locked</h3>
            <p className="text-text-2 text-xs leading-relaxed">
              To earn the Cognara Grand Certificate, you must complete all phases, finish all lessons and quizzes, and maintain a minimum of 65% overall average score.
            </p>
            {grandEligData.missingPhases && grandEligData.missingPhases.length > 0 && (
              <div className="text-left text-[11px] bg-surface-alt/50 p-3 rounded-lg border border-border space-y-1">
                <span className="font-semibold text-text-2 block uppercase tracking-wider text-[9px]">Missing Phases:</span>
                {grandEligData.missingPhases.map((phaseTitle: string, pIdx: number) => (
                  <div key={pIdx} className="text-text-3 flex items-center gap-1">
                    <span>❌</span> {phaseTitle}
                  </div>
                ))}
              </div>
            )}
            {grandEligData.totalAverageScore !== undefined && (
              <span className="text-[10px] block font-mono text-text-3 pt-1">
                Current Average Score: {grandEligData.totalAverageScore}% (65% required)
              </span>
            )}
          </div>
        )}

        <div className="h-px bg-border/50 max-w-md mx-auto" />

        {/* Claude Recommendations section */}
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="font-heading text-xl font-bold text-text-1">What will you master next?</h2>
            <p className="text-xs text-text-2">Claude analyzed your completion subject and generated these customized recommendations:</p>
          </div>

          {loadingRecs ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-surface border border-border rounded-2xl p-5 text-left space-y-4 animate-pulse">
                  <div className="h-4 bg-surface-alt rounded-sm w-3/4" />
                  <div className="space-y-2">
                    <div className="h-3 bg-surface-alt rounded-sm w-full" />
                    <div className="h-3 bg-surface-alt rounded-sm w-5/6" />
                  </div>
                  <div className="h-8 bg-surface-alt rounded-md w-1/3 pt-2" />
                </div>
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="bg-surface border border-border hover:border-primary/30 rounded-2xl p-5 text-left flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-350 hover:-translate-y-0.5 group"
                >
                  <div className="space-y-2">
                    <h3 className="font-bold text-sm text-text-1 group-hover:text-primary transition-colors">
                      {rec.title}
                    </h3>
                    <p className="text-text-2 text-[11px] leading-relaxed">
                      {rec.description}
                    </p>
                  </div>
                  <div className="pt-4">
                    <Button
                      onClick={() => router.push(`/onboarding?subject=${encodeURIComponent(rec.title)}`)}
                      variant="outline"
                      size="sm"
                      className="w-full text-[10px] font-bold h-8 flex items-center justify-center gap-1 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all rounded-lg"
                    >
                      <span>Start Learning</span>
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-surface-alt/30 border border-border rounded-2xl text-center max-w-sm mx-auto">
              <p className="text-xs text-text-2 font-medium">No next goals generated. Head back to onboarding to build another path.</p>
              <Button
                onClick={() => router.push('/onboarding')}
                className="mt-3 bg-primary text-white text-xs font-bold px-4 h-8 rounded-lg"
              >
                Go to Onboarding
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
