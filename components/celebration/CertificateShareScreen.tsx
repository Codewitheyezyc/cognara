'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Download, Link as LinkIcon, Check, X, Star, Share2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import Image from 'next/image'

// Custom SVGs for platforms to look highly professional
const LinkedInIcon = () => (
  <svg className="w-5 h-5 mr-3 fill-current" viewBox="0 0 24 24">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
)

const TwitterXIcon = () => (
  <svg className="w-5 h-5 mr-3 fill-current" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

const WhatsAppIcon = () => (
  <svg className="w-5 h-5 mr-3 fill-current" viewBox="0 0 24 24">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 .057zm12.031-2.03c1.8-.001 3.548-.485 5.071-1.402l.363-.215c2.95 1.747 4.09 1.637 5.42 1.345l.288-.316c-.22-1.396-.754-3.535-1.25-4.32l-.183-.288c1.02-1.62 1.558-3.498 1.559-5.431.002-5.553-4.502-10.07-10.066-10.07-2.694 0-5.227 1.05-7.13 2.956-1.903 1.905-2.95 4.437-2.95 7.13 0 2.01.536 3.97 1.55 5.674l.216.36c-.452 2.65-.922 4.12-1.087 4.707l-.27.288 4.7-.93.385.23c1.47.87 3.14 1.33 4.83 1.33zm5.83-7.9c-.32-.16-1.87-.92-2.16-1.03-.29-.1-.5-.16-.7.16-.2.32-.78 1.03-.96 1.23-.17.2-.35.23-.67.07-2.73-1.36-3.88-2.3-5.23-4.63-.35-.61.35-.57.99-1.84.11-.22.05-.42-.02-.58-.08-.16-.7-1.69-.96-2.33-.26-.62-.52-.53-.7-.54-.18-.01-.39-.01-.6-.01-.2 0-.53.07-.8.38-.28.31-1.08 1.05-1.08 2.57 0 1.52 1.1 3 1.25 3.2.15.22 2.17 3.31 5.25 4.64.73.32 1.3.51 1.74.65.74.23 1.41.2 1.94.12.59-.09 1.87-.77 2.13-1.5.26-.73.26-1.36.19-1.5-.08-.13-.29-.22-.61-.38z"/>
  </svg>
)

interface CertificateShareScreenProps {
  certificateId: string
  pngUrl: string
  pdfUrl: string
  userName: string
  goalName: string
  phaseName: string
  phaseNumber: number
  lessonsCount: number
  quizzesCount: number
  cxpEarned: number
  isGoalCompletion?: boolean
  nextPhaseNumber: number | null
  onContinue: () => void
}

export function CertificateShareScreen({
  certificateId,
  pngUrl,
  pdfUrl,
  userName,
  goalName,
  phaseName,
  phaseNumber,
  lessonsCount,
  quizzesCount,
  cxpEarned,
  isGoalCompletion = false,
  nextPhaseNumber,
  onContinue
}: CertificateShareScreenProps) {
  const supabase = createClient()
  const { toast } = useToast()

  // Component States
  const [isZoomed, setIsZoomed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isNativeShareAvailable, setIsNativeShareAvailable] = useState(false)
  const [isSharingNative, setIsSharingNative] = useState(false)

  // Testimonial States
  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [testimonialText, setTestimonialText] = useState('')
  const [submittingTestimonial, setSubmittingTestimonial] = useState(false)
  const [testimonialSubmitted, setTestimonialSubmitted] = useState(false)

  // Detect Web Share API availability
  useEffect(() => {
    if (typeof window !== 'undefined' && 'share' in navigator) {
      setIsNativeShareAvailable(true)
    }
  }, [])

  // Log share events to Supabase
  const logShareEvent = async (platform: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('cognara_share_events').insert({
        user_id: user.id,
        certificate_id: certificateId,
        share_platform: platform
      })
    } catch (err) {
      console.error('Failed to log share event:', err)
    }
  }

  // Pre-fill text helpers
  const getGoalHashtag = () => {
    const formatted = goalName
      .replace(/[^a-zA-Z0-9 ]/g, '') // remove special characters
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')
    return `#${formatted}`
  }

  const linkedinText = `I just completed the ${phaseName} phase of my ${goalName} learning journey on Cognara.

${lessonsCount} lessons completed.
${quizzesCount} quizzes passed.
Real, structured knowledge — not just content.

If you have a goal and need a clear path to get there, Cognara builds it for you.

cognaralearn.com #Learning ${getGoalHashtag()}`

  const twitterText = `Phase ${phaseNumber} of my ${goalName} journey — complete ✅

${lessonsCount} lessons. ${quizzesCount} quizzes. ${cxpEarned} CXP earned.

@CognaraLearn is the first thing that actually gave me a structured path and kept me on it.

cognaralearn.com`

  const whatsappText = `I just completed Phase ${phaseNumber} of my ${goalName} roadmap on Cognara 🎉

If you have been trying to learn something but keep losing the thread — Cognara builds your path and keeps you accountable.

Check it out: cognaralearn.com`

  // Share handlers
  const handleNativeShare = async () => {
    if (!('share' in navigator)) return
    setIsSharingNative(true)
    try {
      // Fetch PNG file blob to attach it
      const response = await fetch(pngUrl)
      const blob = await response.blob()
      const file = new File([blob], `Cognara_Certificate_Phase_${phaseNumber}.png`, { type: 'image/png' })

      await navigator.share({
        title: 'My Cognara Certificate',
        text: `I just completed Phase ${phaseNumber} (${phaseName}) of my ${goalName} journey on Cognara!`,
        url: `https://www.cognaralearn.com/verify/${certificateId}`,
        files: [file]
      })

      logShareEvent('native')
      toast('Shared successfully!')
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Native share failed:', err)
        // Fallback to text share if files not supported by target app
        try {
          await navigator.share({
            title: 'My Cognara Certificate',
            text: `I just completed Phase ${phaseNumber} (${phaseName}) of my ${goalName} journey on Cognara!`,
            url: `https://www.cognaralearn.com/verify/${certificateId}`
          })
          logShareEvent('native')
        } catch (subErr) {
          console.error('Text-only native share failed:', subErr)
        }
      }
    } finally {
      setIsSharingNative(false)
    }
  }

  const handleShareLinkedIn = () => {
    logShareEvent('linkedin')
    // Open LinkedIn feed share intent
    const url = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(linkedinText)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    toast('Copied message template! Paste it into LinkedIn.')
  }

  const handleShareTwitter = () => {
    logShareEvent('twitter')
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleShareWhatsApp = () => {
    logShareEvent('whatsapp')
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleCopyLink = () => {
    logShareEvent('link_copied')
    const verifyUrl = `www.cognaralearn.com/verify/${certificateId}`
    navigator.clipboard.writeText(verifyUrl)
    setCopied(true)
    toast('Verification link copied to clipboard!')
    setTimeout(() => setCopied(false), 3000)
  }

  const triggerDownload = async (url: string, filename: string, type: 'png' | 'pdf') => {
    try {
      logShareEvent(`${type}_download`)
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
      toast(`Certificate downloaded successfully!`)
    } catch (err) {
      console.error('Download failed:', err)
      // Fallback: Open in new tab
      window.open(url, '_blank')
    }
  }

  const handleDownloadPNG = () => {
    const safeName = userName.replace(/\s+/g, '_')
    const safePhase = phaseName.replace(/\s+/g, '_')
    triggerDownload(pngUrl, `Cognara_Certificate_${safePhase}_${safeName}.png`, 'png')
  }

  const handleDownloadPDF = () => {
    const safeName = userName.replace(/\s+/g, '_')
    const safePhase = phaseName.replace(/\s+/g, '_')
    triggerDownload(pdfUrl, `Cognara_Certificate_${safePhase}_${safeName}.pdf`, 'pdf')
  }

  // Testimonial submission
  const handleSubmitTestimonial = async (e: React.FormEvent) => {
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
      
      logShareEvent('testimonial_submitted')
      setTestimonialSubmitted(true)
      toast('Thank you for sharing your story!')
    } catch (err) {
      console.error('Failed to submit testimonial:', err)
      toast('Failed to submit testimonial. Please try again.')
    } finally {
      setSubmittingTestimonial(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0C14] text-[#F0F4FF] overflow-y-auto select-none">
      <div className="max-w-2xl mx-auto px-6 py-12 flex flex-col items-center space-y-8 pb-32">
        
        {/* TOP SECTION */}
        <div className="text-center space-y-2.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8B95B3]">
            Your certificate is ready
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            You earned this.<br />Share it with the world.
          </h2>
        </div>

        {/* CERTIFICATE PREVIEW CONTAINER */}
        <div className="w-full flex flex-col items-center">
          <div 
            onClick={() => setIsZoomed(true)}
            className="w-full cursor-zoom-in relative rounded-xl overflow-hidden border border-[#1E2540] shadow-[0_12px_40px_rgba(0,0,0,0.4)] group transition-all duration-300 hover:border-[#5B8EFF]/40"
          >
            {/* Aspect ratio holder for 1200x850 certificate */}
            <div className="w-full relative aspect-[1200/850]">
              <Image 
                src={pngUrl} 
                alt="Cognara Certificate"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 650px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <span className="bg-[#111520]/90 border border-[#1E2540] text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">
                  🔎 Tap to View Fullscreen
                </span>
              </div>
            </div>
          </div>
          
          {/* Certificate metadata */}
          <div className="text-center mt-3.5 space-y-1">
            <p className="text-[10px] text-[#8B95B3] font-mono">
              Certificate ID: <span className="font-bold text-white">{certificateId}</span>
            </p>
            <p className="text-[10px] text-[#8B95B3]">
              Tap to verify:{' '}
              <span className="font-semibold text-[#5B8EFF] underline decoration-[#5B8EFF]/40">
                cognaralearn.com/verify/{certificateId}
              </span>
            </p>
          </div>
        </div>

        {/* SHARE BUTTONS SECTION */}
        <div className="w-full space-y-6">
          <div className="text-center">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8B95B3]">
              Share your achievement
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {/* Native Share Sheet (If Available) */}
            {isNativeShareAvailable && (
              <Button
                onClick={handleNativeShare}
                disabled={isSharingNative}
                className="w-full h-13 bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] hover:from-[#4A7AEE] hover:to-[#9067FA] text-white font-extrabold text-[14px] rounded-xl shadow-[0_4px_14px_rgba(91,142,255,0.2)]"
              >
                <Share2 className="h-5 w-5 mr-3 shrink-0" />
                {isSharingNative ? 'Preparing Share...' : 'Share Certificate'}
              </Button>
            )}

            {/* LinkedIn Button */}
            <button
              onClick={handleShareLinkedIn}
              className="w-full h-13 bg-[#0A66C2] hover:bg-[#0855A1] text-white font-bold text-[14px] rounded-xl flex items-center justify-center transition duration-150 active:scale-[0.99] cursor-pointer shadow-sm"
            >
              <LinkedInIcon />
              Share on LinkedIn
            </button>

            {/* Twitter/X Button */}
            <button
              onClick={handleShareTwitter}
              className="w-full h-13 bg-black hover:bg-neutral-900 text-white font-bold text-[14px] rounded-xl flex items-center justify-center border border-[#1E2540] transition duration-150 active:scale-[0.99] cursor-pointer shadow-sm"
            >
              <TwitterXIcon />
              Share on Twitter/X
            </button>

            {/* WhatsApp Button */}
            <button
              onClick={handleShareWhatsApp}
              className="w-full h-13 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-[14px] rounded-xl flex items-center justify-center transition duration-150 active:scale-[0.99] cursor-pointer shadow-sm"
            >
              <WhatsAppIcon />
              Share on WhatsApp
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5">
              {/* Download PNG */}
              <Button
                onClick={handleDownloadPNG}
                className="h-13 bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] hover:from-[#4A7AEE] hover:to-[#9067FA] text-white font-extrabold text-[13px] rounded-xl shadow-[0_2px_10px_rgba(91,142,255,0.15)]"
              >
                <Download className="h-4.5 w-4.5 mr-2 shrink-0" />
                Download (Image)
              </Button>

              {/* Download PDF */}
              <Button
                onClick={handleDownloadPDF}
                variant="ghost"
                className="h-13 border border-[#5B8EFF]/40 hover:border-[#5B8EFF] bg-transparent hover:bg-[#5B8EFF]/5 text-[#5B8EFF] font-bold text-[13px] rounded-xl"
              >
                <Download className="h-4.5 w-4.5 mr-2 shrink-0" />
                Download (PDF)
              </Button>
            </div>

            {/* Copy Verification Link */}
            <Button
              onClick={handleCopyLink}
              variant="ghost"
              className="w-full h-13 bg-[#111520]/50 hover:bg-[#1E2540]/60 border border-[#1E2540] text-[#8B95B3] hover:text-[#F0F4FF] font-bold text-[13px] rounded-xl"
            >
              {copied ? (
                <>
                  <Check className="h-4.5 w-4.5 mr-2 text-emerald-400 shrink-0" />
                  Link copied ✓
                </>
              ) : (
                <>
                  <LinkIcon className="h-4.5 w-4.5 mr-2 shrink-0" />
                  Copy certificate link
                </>
              )}
            </Button>
          </div>
        </div>

        {/* BOTTOM SECTION: TESTIMONIAL NUDGE */}
        <div className="w-full bg-[#111520] border border-[#1E2540] rounded-2xl p-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#5B8EFF]/10 border border-[#5B8EFF]/20 flex items-center justify-center text-xl shrink-0">
              ✨
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#A78BFA]">
                Spark
              </span>
              <p className="text-xs sm:text-sm text-[#C8D0E8] leading-relaxed font-semibold">
                &ldquo;Your story could inspire someone who is exactly where you were on Day 1. Would you share it?&rdquo;
              </p>
            </div>
          </div>

          {!testimonialSubmitted ? (
            <form onSubmit={handleSubmitTestimonial} className="space-y-4">
              {/* Star Rating */}
              <div className="flex items-center gap-1.5 pl-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-2xl transition-transform hover:scale-110 cursor-pointer focus:outline-none"
                  >
                    <Star
                      className={`h-6.5 w-6.5 shrink-0 ${
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
                  onChange={(e) => setTestimonialText(e.target.value.slice(0, 280))}
                  placeholder="What did you achieve in this phase?"
                  rows={3}
                  className="w-full bg-[#0A0C14] border border-[#1E2540] focus:border-[#5B8EFF]/50 rounded-xl p-3.5 text-xs sm:text-sm text-white placeholder-[#8B95B3] focus:outline-none transition resize-none"
                />
                <div className="flex justify-end">
                  <span className="text-[10px] font-mono text-[#8B95B3] font-semibold">
                    {testimonialText.length}/280 characters
                  </span>
                </div>
              </div>

              {/* Submit / Skip */}
              <div className="flex flex-col gap-2.5 pt-1">
                <Button
                  type="submit"
                  disabled={submittingTestimonial || !testimonialText.trim()}
                  className="w-full h-11 bg-[#5B8EFF] hover:bg-[#4A7AEE] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  {submittingTestimonial ? 'Submitting...' : 'Share my story'}
                </Button>
                
                <button
                  type="button"
                  onClick={() => setTestimonialSubmitted(true)}
                  className="text-[11px] text-[#8B95B3] hover:text-[#F0F4FF] font-bold uppercase tracking-wider block text-center py-2"
                >
                  Skip for now
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-[#5B8EFF]/5 border border-[#5B8EFF]/15 rounded-xl p-4 text-center">
              <span className="text-[11px] font-mono font-bold text-[#5B8EFF] block">
                Story Saved!
              </span>
              <p className="text-xs text-[#8B95B3] mt-1 font-semibold">
                Your testimonial has been submitted for verification. Thank you for motivating other learners!
              </p>
            </div>
          )}
        </div>

        {/* FINAL PROGRESS BUTTON */}
        <div className="w-full pt-4">
          <Button
            onClick={onContinue}
            className="w-full h-13 bg-gradient-to-r from-[#3D6AFF] to-[#7C5CFA] hover:from-[#2d5aef] hover:to-[#6b47ef] text-white font-black text-[14px] rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.99]"
          >
            {isGoalCompletion ? 'Start my next goal' : `Continue to Phase ${nextPhaseNumber || ''}`}
            <ArrowRight className="h-4.5 w-4.5 shrink-0" />
          </Button>
        </div>

      </div>

      {/* FULL SCREEN MODAL VIEW */}
      {isZoomed && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col select-none">
          {/* Top Actions */}
          <div className="flex items-center justify-between p-5 relative z-10">
            <span className="text-xs font-mono font-bold text-[#8B95B3]">
              Zoom View
            </span>
            <button
              onClick={() => setIsZoomed(false)}
              className="p-2.5 bg-[#111520] border border-[#1E2540] hover:bg-[#1E2540] text-[#8B95B3] hover:text-white rounded-lg transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Certificate Zoom Container */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            <div className="relative w-full max-w-4xl aspect-[1200/850] rounded-lg overflow-hidden border border-[#1E2540] shadow-2xl">
              <Image
                src={pngUrl}
                alt="Zoomed Cognara Certificate"
                fill
                className="object-contain"
              />
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="p-6 flex items-center justify-between gap-4 border-t border-[#1E2540] bg-[#0A0C14]">
            <Button
              onClick={handleDownloadPNG}
              className="flex-1 h-12 bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] text-white font-bold text-xs uppercase tracking-wider rounded-xl"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PNG
            </Button>
            
            {isNativeShareAvailable && (
              <Button
                onClick={handleNativeShare}
                className="flex-1 h-12 bg-[#111520] hover:bg-[#1E2540] text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-[#1E2540]"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
