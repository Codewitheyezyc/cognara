'use client'

import React, { useEffect, useRef } from 'react'
import { BookOpen, CheckCircle, Award, Share2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

// Performant Canvas Particles Component
function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    const colors = [
      'rgba(91, 142, 255, 0.35)', // indigo
      'rgba(167, 139, 250, 0.35)', // violet
      'rgba(139, 92, 246, 0.25)', // purple
    ]

    const particles: Array<{
      x: number
      y: number
      size: number
      speedY: number
      color: string
    }> = []

    const createParticle = () => {
      return {
        x: Math.random() * width,
        y: height + Math.random() * 20,
        size: Math.random() * 4 + 2,
        speedY: -(Math.random() * 1.5 + 0.4),
        color: colors[Math.floor(Math.random() * colors.length)],
      }
    }

    // Populate initial particles spaced out vertically
    for (let i = 0; i < 40; i++) {
      particles.push({
        ...createParticle(),
        y: Math.random() * height,
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height)

      particles.forEach((p, idx) => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.fill()

        p.y += p.speedY

        // Recreate when floated offscreen
        if (p.y < -10) {
          particles[idx] = createParticle()
        }
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  )
}

interface PhaseCelebrationProps {
  phaseNumber: number
  phaseName: string
  goalName: string
  lessonsCount: number
  quizzesCount: number
  cxpEarned: number
  nextPhaseNumber: number | null
  nextPhaseName: string | null
  nextPhaseDescription: string | null
  userName: string
  referralCode: string
  onClaimCertificate: () => void
  onContinue: () => void
  domain?: string
}

function getSuggestion(domain: string, phaseName: string): string {
  const cleanDomain = (domain || '').toLowerCase()
  if (cleanDomain.includes('tech')) {
    return `How I mastered ${phaseName} on Cognara and built a practical tech project.`
  }
  if (cleanDomain.includes('business')) {
    return `Applying ${phaseName} principles to start and scale a business model.`
  }
  if (cleanDomain.includes('marketing')) {
    return `How learning ${phaseName} helped me structure a growth marketing strategy.`
  }
  return `Key lessons and insights from completing the ${phaseName} phase on Cognara.`
}

export function PhaseCelebration({
  phaseNumber,
  phaseName,
  goalName,
  lessonsCount,
  quizzesCount,
  cxpEarned,
  nextPhaseNumber,
  nextPhaseName,
  nextPhaseDescription,
  userName,
  referralCode,
  onClaimCertificate,
  onContinue,
  domain,
}: PhaseCelebrationProps) {
  const firstName = userName?.split(' ')[0] || 'Learner'
  const [copied, setCopied] = React.useState(false)
  const router = useRouter()
  const cleanDomain = domain || 'General'
  const suggestion = getSuggestion(cleanDomain, phaseName)

  const handleShareReferral = async () => {
    const link = `https://www.cognaralearn.com/signup?ref=${referralCode}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Cognara',
          text: `I just completed a phase on Cognara! Try it free and earn bonus CXP:`,
          url: link
        })
      } catch (err) {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }


  return (
    <div className="fixed inset-0 z-50 bg-bg text-text-1 flex flex-col items-center justify-center p-6 overflow-y-auto animate-fade-in-celebrate">
      {/* Self-contained CSS Animations */}
      <style>{`
        @keyframes drawRing {
          from { stroke-dashoffset: 277; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.85); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-draw-ring {
          stroke-dasharray: 277;
          stroke-dashoffset: 277;
          animation: drawRing 1.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          transform: rotate(-90deg);
          transform-origin: 50% 50%;
        }
        .animate-scale-up-delayed {
          opacity: 0;
          animation: scaleUp 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s forwards;
        }
        .animate-fade-in-celebrate {
          animation: fadeIn 0.6s ease-out forwards;
        }
        .animate-slide-up-1 {
          opacity: 0;
          animation: slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.8s forwards;
        }
        .animate-slide-up-2 {
          opacity: 0;
          animation: slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 1.2s forwards;
        }
      `}</style>

      {/* Floating Particles background */}
      <Particles />

      {/* Main Container */}
      <div className="relative z-10 max-w-lg w-full flex flex-col items-center text-center space-y-8">
        
        {/* TOP SECTION: Animated Badge */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#5B8EFF" />
                <stop offset="100%" stopColor="#A78BFA" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="url(#ringGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              className="animate-draw-ring"
            />
          </svg>
          <div className="w-24 h-24 rounded-full bg-surface border border-border flex items-center justify-center text-4xl shadow-2xl z-10 animate-scale-up-delayed">
            🏆
          </div>
        </div>

        {/* Phase Info */}
        <div className="space-y-3.5 animate-slide-up-1">
          <span className="text-[11px] font-mono font-black uppercase tracking-widest text-[#5B8EFF] bg-[#5B8EFF]/10 border border-[#5B8EFF]/20 px-3.5 py-1 rounded-full">
            Milestone Reached
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-1 leading-tight">
            Phase {phaseNumber} Complete.
          </h1>
          <div className="space-y-1">
            <p className="text-base font-bold text-[#A78BFA]">{phaseName}</p>
            <p className="text-xs text-text-2 font-mono tracking-wide">{goalName}</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-sm py-4 border-y border-border/60 animate-slide-up-1 text-center">
          <div>
            <p className="text-[10px] text-text-2 font-bold uppercase tracking-wider">Lessons</p>
            <p className="text-lg font-black text-text-1 font-mono mt-0.5">{lessonsCount}</p>
          </div>
          <div>
            <p className="text-[10px] text-text-2 font-bold uppercase tracking-wider">Quizzes</p>
            <p className="text-lg font-black text-text-1 font-mono mt-0.5">{quizzesCount}</p>
          </div>
          <div>
            <p className="text-[10px] text-text-2 font-bold uppercase tracking-wider">CXP Logged</p>
            <p className="text-lg font-black text-[#5B8EFF] font-mono mt-0.5">+{cxpEarned}</p>
          </div>
        </div>

        {/* Encouragement */}
        <p className="text-xs sm:text-sm text-text-2 leading-relaxed max-w-md animate-slide-up-1 font-medium">
          &ldquo;{firstName}, you just completed the {phaseName} phase of your {goalName} journey. That is real progress.&rdquo;
        </p>

        {/* MIDDLE SECTION: What Comes Next */}
        {nextPhaseNumber ? (
          <div className="w-full bg-surface/80 border border-border rounded-2xl p-5 text-left space-y-2.5 animate-slide-up-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-text-2 font-bold">
                Up Next
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-extrabold text-text-1">
              Phase {nextPhaseNumber} Unlocked: {nextPhaseName}
            </h4>
            <p className="text-xs text-text-2 leading-relaxed font-medium">
              {nextPhaseDescription}
            </p>
          </div>
        ) : (
          <div className="w-full bg-gradient-to-br from-[#1E2540]/40 to-[#5B8EFF]/5 border border-[#5B8EFF]/25 rounded-2xl p-5 text-left space-y-2 animate-slide-up-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#A78BFA] font-bold block">
              Final Milestone Complete
            </span>
            <h4 className="text-sm sm:text-base font-extrabold text-text-1">
              Roadmap Completed! 🎉
            </h4>
            <p className="text-xs text-text-2 leading-relaxed font-medium">
              You have completed all phases in this roadmap. You are ready to achieve your next big goal.
            </p>
          </div>
        )}

        {/* BOTTOM SECTION: Two Buttons */}
        <div className="flex flex-col gap-3 w-full pt-4 animate-slide-up-2">
          <Button
            onClick={onClaimCertificate}
            className="w-full h-13 bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] hover:from-[#4A7AEE] hover:to-[#9067FA] text-text-1 font-extrabold text-[14px] rounded-xl shadow-[0_0_24px_rgba(91,142,255,0.25)] transition duration-150 active:scale-[0.99] cursor-pointer"
          >
            Claim My Certificate
          </Button>

          {/* Spark Blog suggestion rendering */}
          <div className="bg-surface/90 border border-border/80 rounded-2xl p-4.5 text-left space-y-2.5 animate-slide-up-2 shadow-xs">
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-primary animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-text-2 font-bold">
                Spark Blog Recommendation
              </span>
            </div>
            <p className="text-xs text-text-1 font-medium leading-relaxed">
              Share your milestone! Spark recommends publishing a community post: <span className="text-[#A78BFA] font-bold">"{suggestion}"</span>
            </p>
            <button
              onClick={() => router.push(`/blog/write?title=${encodeURIComponent(suggestion)}`)}
              className="inline-flex items-center justify-center h-8 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider transition duration-150 cursor-pointer shadow-sm hover:shadow-md"
            >
              Write a Blog Post
            </button>
          </div>
          
          <Button
            onClick={onContinue}
            variant="ghost"
            className="w-full h-13 bg-surface/50 hover:bg-surface-alt border border-border text-text-2 hover:text-text-1 font-bold text-[13px] rounded-xl transition duration-150 cursor-pointer"
          >
            {nextPhaseNumber ? `Continue to Phase ${nextPhaseNumber} →` : 'Continue to Dashboard →'}
          </Button>

          {/* Referral Nudge */}
          <div className="pt-4 border-t border-border text-center space-y-1.5 mt-2">
            <p className="text-[11px] text-text-2">Enjoying Cognara?</p>
            <Button
              onClick={handleShareReferral}
              variant="outline"
              className="w-full h-10 border border-[#A78BFA] text-[#A78BFA] hover:bg-[#A78BFA]/10 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <Share2 size={13} />
              <span>{copied ? 'Link copied ✓ Share it with someone who needs a clear path.' : 'Invite a friend — you both earn CXP'}</span>
            </Button>
          </div>
        </div>


      </div>
    </div>
  )
}
