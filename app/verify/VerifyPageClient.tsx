'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Download, Link as LinkIcon, Check, X, Share2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { Logo } from '@/components/ui/Logo'

interface VerifyPageClientProps {
  certificateId: string
  pngUrl: string
  pdfUrl: string
  firstName: string
  lastNameInitial: string
  goalName: string
  phaseName: string
  topicsCovered: string[]
  issuedAt: string
  learnersCount: number
}

export function VerifyPageClient({
  certificateId,
  pngUrl,
  pdfUrl,
  firstName,
  lastNameInitial,
  goalName,
  phaseName,
  topicsCovered,
  issuedAt,
  learnersCount
}: VerifyPageClientProps) {
  const { toast } = useToast()

  // Interactive States
  const [isZoomed, setIsZoomed] = useState(false)
  const [copied, setCopied] = useState(false)

  // Track visit on mount
  useEffect(() => {
    async function trackVisit() {
      try {
        await fetch('/api/verify/visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            certificateId,
            referrer: typeof document !== 'undefined' ? document.referrer : '',
            action: 'visit'
          })
        })
      } catch (err) {
        console.error('Failed to log page visit:', err)
      }
    }
    trackVisit()
  }, [certificateId])

  // Track conversion when clicking the CTA
  const handleCtaClick = async () => {
    try {
      await fetch('/api/verify/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificateId,
          action: 'convert'
        })
      })
    } catch (err) {
      console.error('Failed to log conversion event:', err)
    }
  }

  // Format date helper
  const formattedDate = new Date(issuedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  // Download handlers
  const handleDownloadPNG = async () => {
    try {
      const response = await fetch(pngUrl)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `Cognara_Certificate_${phaseName.replace(/\s+/g, '_')}_${firstName}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
      toast('Certificate downloaded successfully!')
    } catch (err) {
      console.error('PNG download failed:', err)
      window.open(pngUrl, '_blank')
    }
  }

  const handleCopyLink = () => {
    const verifyUrl = `www.cognaralearn.com/verify/${certificateId}`
    navigator.clipboard.writeText(verifyUrl)
    setCopied(true)
    toast('Link copied!')
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="min-h-screen bg-bg text-text-1 overflow-x-hidden flex flex-col relative select-none">
      
      {/* Background glow highlights */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-primary/10 to-accent/15 blur-[120px] opacity-50" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-accent/10 to-primary/15 blur-[100px] opacity-40" />
      </div>

      <div className="relative z-10 max-w-2xl w-full mx-auto px-6 py-12 flex flex-col items-center space-y-10 pb-32">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center space-x-2 cursor-pointer hover:opacity-90 transition-opacity">
          <Logo className="h-6 w-6" />
          <span className="font-heading text-xl font-bold tracking-tight text-text-1">Cognara</span>
        </Link>

        {/* VERIFICATION BADGE */}
        <div className="text-center space-y-3">
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            {/* Pulsing Outer Ring */}
            <div className="absolute inset-0 rounded-full bg-emerald-500/10 border border-emerald-500/30 animate-ping" />
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 z-10 text-xl font-bold">
              ✓
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-text-1 tracking-tight">
            Certificate Verified
          </h2>
          <p className="text-xs sm:text-sm text-text-2 max-w-md mx-auto leading-relaxed font-semibold">
            This certificate is real. We gave it to them for finishing their learning phase.
          </p>
        </div>

        {/* DETAILS CARD */}
        <div className="w-full bg-surface border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col justify-between">
          {/* Card Header */}
          <div className="flex items-center justify-between px-6 py-4.5 border-b border-border bg-surface-alt/20">
            <div className="flex items-center space-x-1.5">
              <Logo className="h-4.5 w-4.5" />
              <span className="font-heading text-sm font-bold text-text-1">Cognara</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Verified
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6 space-y-5.5 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 border-b border-border/40 pb-5">
              <div>
                <span className="text-[9px] font-mono font-bold text-text-2 uppercase tracking-wider block">
                  Issued To
                </span>
                <span className="text-sm font-extrabold text-text-1 mt-0.5 block">
                  {firstName} {lastNameInitial}.
                </span>
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold text-text-2 uppercase tracking-wider block">
                  Learning Goal
                </span>
                <span className="text-sm font-extrabold text-text-1 mt-0.5 block">
                  {goalName}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 border-b border-border/40 pb-5">
              <div>
                <span className="text-[9px] font-mono font-bold text-text-2 uppercase tracking-wider block">
                  Phase Completed
                </span>
                <span className="text-sm font-extrabold text-text-1 mt-0.5 block">
                  {phaseName}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold text-text-2 uppercase tracking-wider block">
                  Date of Completion
                </span>
                <span className="text-sm font-extrabold text-text-1 mt-0.5 block font-semibold">
                  {formattedDate}
                </span>
              </div>
            </div>

            <div className="border-b border-border/40 pb-5">
              <span className="text-[9px] font-mono font-bold text-text-2 uppercase tracking-wider block">
                Topics Covered
              </span>
              <p className="text-xs text-text-2 leading-relaxed mt-1 font-semibold">
                {topicsCovered.join(' · ')}
              </p>
            </div>

            <div>
              <span className="text-[9px] font-mono font-bold text-text-2 uppercase tracking-wider block">
                Certificate ID
              </span>
              <span className="text-xs font-mono font-bold text-text-1 mt-0.5 block tracking-wide select-all">
                {certificateId}
              </span>
            </div>
          </div>

          {/* Card Footer */}
          <div className="px-6 py-4 border-t border-border/40 bg-surface-alt/10">
            <p className="text-[10px] text-text-2 text-center font-medium leading-relaxed">
              This certificate is real. It shows that this learner completed all the lessons listed above.
            </p>
          </div>
        </div>

        {/* CERTIFICATE IMAGE PREVIEW */}
        <div className="w-full flex flex-col items-center space-y-4">
          <div 
            onClick={() => setIsZoomed(true)}
            className="w-full cursor-zoom-in relative rounded-xl overflow-hidden border border-border shadow-[0_12px_40px_rgba(0,0,0,0.4)] group transition-all duration-300 hover:border-[#5B8EFF]/30"
          >
            <div className="w-full relative aspect-[1200/850]">
              <Image 
                src={pngUrl} 
                alt="Cognara Certificate"
                fill
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <span className="bg-surface/90 border border-border text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">
                  🔎 Tap to View Fullscreen
                </span>
              </div>
            </div>
          </div>

          {/* Download & Copy Links */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
            <Button
              onClick={handleDownloadPNG}
              className="flex-1 h-12 bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] text-text-1 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-[0_2px_10px_rgba(91,142,255,0.15)]"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Certificate
            </Button>
            <Button
              onClick={handleCopyLink}
              variant="ghost"
              className="flex-1 h-12 bg-surface/50 hover:bg-surface-alt border border-border text-text-2 hover:text-text-1 font-bold text-xs uppercase tracking-wider rounded-xl"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-emerald-400" />
                  Link copied ✓
                </>
              ) : (
                <>
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Copy verify link
                </>
              )}
            </Button>
          </div>
        </div>

        {/* CONVERSION SECTION */}
        <div className="w-full pt-8 border-t border-border/60 space-y-8 flex flex-col items-center">
          <div className="text-center space-y-2 max-w-md">
            <h3 className="text-xl sm:text-2xl font-extrabold text-text-1 tracking-tight leading-tight">
              {firstName} earned this with Cognara.
            </h3>
            <p className="text-xs sm:text-sm text-text-2 leading-relaxed font-semibold">
              We build your personal path. We teach you at your level and help you daily.
            </p>
          </div>

          {/* Feature points */}
          <div className="space-y-4 max-w-sm w-full font-bold text-xs sm:text-sm text-text-2">
            <div className="flex items-center gap-3.5 bg-surface border border-border px-4 py-3.5 rounded-xl shadow-sm">
              <span className="text-lg">🗺️</span>
              <span>Your learning path built in under 60 seconds</span>
            </div>
            <div className="flex items-center gap-3.5 bg-surface border border-border px-4 py-3.5 rounded-xl shadow-sm">
              <span className="text-lg">🧠</span>
              <span>Lessons built for your level</span>
            </div>
            <div className="flex items-center gap-3.5 bg-surface border border-border px-4 py-3.5 rounded-xl shadow-sm">
              <span className="text-lg">🔥</span>
              <span>Daily tracking that keeps you going</span>
            </div>
          </div>

          {/* Primary Signup CTA */}
          <div className="w-full max-w-md text-center space-y-3.5">
            <Link href={`/signup?ref=certificate&cert=${certificateId}`} onClick={handleCtaClick} className="w-full">
              <Button
                className="w-full h-13 bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white font-black text-[14px] rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.99]"
              >
                Start your own journey — it&apos;s free
              </Button>
            </Link>
            <span className="text-[10px] text-text-2 font-bold uppercase tracking-wider block">
              Join {learnersCount} learners already on their path
            </span>
          </div>
        </div>

      </div>

      {/* FULL SCREEN MODAL */}
      {isZoomed && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col select-none animate-fade-in-celebrate">
          <div className="flex items-center justify-between p-5 relative z-10">
            <span className="text-xs font-mono font-bold text-text-2">
              Zoom View
            </span>
            <button
              onClick={() => setIsZoomed(false)}
              className="p-2.5 bg-surface border border-border hover:bg-[#1E2540] text-text-2 hover:text-text-1 rounded-lg transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            <div className="relative w-full max-w-4xl aspect-[1200/850] rounded-lg overflow-hidden border border-border shadow-2xl">
              <Image
                src={pngUrl}
                alt="Zoomed Cognara Certificate"
                fill
                className="object-contain"
              />
            </div>
          </div>

          <div className="p-6 flex items-center justify-between gap-4 border-t border-border bg-bg">
            <Button
              onClick={handleDownloadPNG}
              className="flex-1 h-12 bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] text-text-1 font-bold text-xs uppercase tracking-wider rounded-xl"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PNG
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
