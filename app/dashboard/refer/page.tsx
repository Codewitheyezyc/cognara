'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Gift, Share, Users, Star, Copy, Share2, ArrowLeft, Loader2, Sparkles, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

// Count-up Hook
function useCountUp(target: number, duration: number = 800) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (target <= 0) {
      setCount(0)
      return
    }
    const startTime = performance.now()
    const end = target
    let animationFrameId: number

    const updateCount = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = progress * (2 - progress) // easeOutQuad
      setCount(Math.round(easedProgress * end))

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCount)
      }
    }

    animationFrameId = requestAnimationFrame(updateCount)
    return () => cancelAnimationFrame(animationFrameId)
  }, [target, duration])

  return count
}

export default function ReferPage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [referralsList, setReferralsList] = useState<any[]>([])
  const [referralStats, setReferralStats] = useState({
    invited: 0,
    joined: 0,
    cxpEarned: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [copyingLink, setCopyingLink] = useState(false)

  // Count-up stats
  const countInvited = useCountUp(referralStats.invited)
  const countJoined = useCountUp(referralStats.joined)
  const countCxp = useCountUp(referralStats.cxpEarned)

  useEffect(() => {
    async function loadReferralData() {
      try {
        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        setUserId(user.id)

        // 1. Fetch Profile
        const { data: profRow } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (!profRow) {
          router.push('/onboarding')
          return
        }
        setProfile(profRow)

        // 2. Fetch Referrals
        const { data: refsData, error: refsErr } = await supabase
          .from('cognara_referrals')
          .select('*')
          .eq('referrer_user_id', user.id)
          .order('created_at', { ascending: false })

        if (!refsErr && refsData) {
          setReferralsList(refsData)
          const invited = refsData.length
          const joined = refsData.filter((r: any) => r.status !== 'pending').length
          const cxpEarned = refsData.filter((r: any) => r.status === 'completed_first_lesson' && r.referrer_cxp_awarded).length * 200
          setReferralStats({ invited, joined, cxpEarned })
        }
      } catch (err) {
        console.error('Failed to load referrals:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadReferralData()
  }, [supabase, router])

  // Build the unique referral link
  const referralLink = profile?.referral_code
    ? `https://www.cognaralearn.com/signup?ref=${profile.referral_code}`
    : `https://www.cognaralearn.com/signup?ref=CGN-${userId?.substring(0, 4).toUpperCase()}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopyingLink(true)
    toast('Referral link copied to clipboard', 'success')
    setTimeout(() => setCopyingLink(false), 3000)
  }

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Cognara',
          text: `I use Cognara to learn ${profile?.main_goal || 'my goals'}. Try it free and earn bonus CXP:`,
          url: referralLink
        })
      } catch (err) {
        // User cancelled
      }
    } else {
      handleCopyLink()
    }
  }

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 text-[#A78BFA] animate-spin" />
        <span className="text-sm text-[#8B95B3]">Loading invitation details...</span>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-page-enter">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-xs text-[#8B95B3] hover:text-[#F0F4FF] transition font-bold"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      {/* Page Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex p-4 bg-[#A78BFA]/10 border border-[#A78BFA]/20 rounded-full text-[#A78BFA] animate-bounce-subtle">
          <Gift className="h-10 w-10" />
        </div>
        <h1 className="font-heading text-3xl font-black text-white tracking-tight">
          Invite friends.<br />Earn together.
        </h1>
        <p className="text-sm text-[#8B95B3] max-w-md mx-auto leading-relaxed">
          Share Cognara with someone who has a goal. When they complete their first lesson, you both get rewarded!
        </p>
      </div>

      {/* How It Works Steps */}
      <div className="bg-[#111520] border border-[#1E2540] rounded-2xl p-6 space-y-6">
        <h3 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#A78BFA] to-[#8B5CF6] uppercase tracking-widest block">
          How It Works
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#A78BFA]/10 border border-[#A78BFA]/20 flex items-center justify-center text-xs font-bold text-[#A78BFA]">
              1
            </div>
            <h4 className="text-xs font-extrabold text-white">Share your link</h4>
            <p className="text-[11px] text-[#8B95B3] leading-relaxed">
              Send your unique referral link to anyone with a goal.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#A78BFA]/10 border border-[#A78BFA]/20 flex items-center justify-center text-xs font-bold text-[#A78BFA]">
              2
            </div>
            <h4 className="text-xs font-extrabold text-white">They sign up free</h4>
            <p className="text-[11px] text-[#8B95B3] leading-relaxed">
              Your friend creates their account and builds their first roadmap path.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#A78BFA]/10 border border-[#A78BFA]/20 flex items-center justify-center text-xs font-bold text-[#A78BFA]">
              3
            </div>
            <h4 className="text-xs font-extrabold text-white">You both earn CXP</h4>
            <p className="text-[11px] text-[#8B95B3] leading-relaxed">
              When they complete their first lesson, both of you get rewarded!
            </p>
          </div>
        </div>
      </div>

      {/* Referral Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#111520] border border-[#1E2540] rounded-2xl p-5 text-center space-y-1">
          <span className="text-3xl font-black text-white font-mono block">{countInvited}</span>
          <span className="text-[10px] font-bold text-[#8B95B3] uppercase tracking-wider block">Invited</span>
        </div>
        <div className="bg-[#111520] border border-[#1E2540] rounded-2xl p-5 text-center space-y-1">
          <span className="text-3xl font-black text-[#A78BFA] font-mono block">{countJoined}</span>
          <span className="text-[10px] font-bold text-[#8B95B3] uppercase tracking-wider block">Joined</span>
        </div>
        <div className="bg-[#111520] border border-[#1E2540] rounded-2xl p-5 text-center space-y-1">
          <span className="text-3xl font-black text-amber-400 font-mono block">{countCxp}</span>
          <span className="text-[10px] font-bold text-[#8B95B3] uppercase tracking-wider block">CXP Earned</span>
        </div>
      </div>

      {/* Link and Share Controls */}
      <div className="bg-[#111520] border border-[#1E2540] rounded-2xl p-6 space-y-6">
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-[#8B95B3] uppercase tracking-widest block">Your referral link</span>
          <div className="flex items-center gap-2 p-3.5 bg-[#151926] border border-[#A78BFA]/30 rounded-xl">
            <span className="text-xs text-[#C8D0E8] font-semibold select-all truncate flex-1 font-mono">
              {referralLink}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            onClick={handleCopyLink}
            className="w-full h-12 bg-gradient-to-r from-[#A78BFA] to-[#8B5CF6] hover:from-[#9067FA] hover:to-[#7C3AED] text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <Copy className="h-4.5 w-4.5" />
            <span>{copyingLink ? '✓ Copied to clipboard' : 'Copy my referral link'}</span>
          </Button>

          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
              `Hey! I have been using Cognara to learn ${profile?.main_goal || 'my goals'} and it is the first app that actually built me a structured path and kept me on track.\n\nTry it free — you get a bonus 100 CXP when you complete your first lesson:\n${referralLink}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-12 bg-[#25D366] hover:bg-[#20BA56] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
          >
            <span className="font-semibold text-center leading-[48px]">Share on WhatsApp</span>
          </a>

          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
              `If you have a goal and keep losing the thread — @CognaraLearn builds your personalised path and keeps you accountable every day.\n\nTry it free:\n${referralLink}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-12 bg-black hover:bg-[#111111] border border-[#1E2540] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
          >
            <span className="font-semibold text-center leading-[48px]">Share on Twitter/X</span>
          </a>

          <Button
            onClick={handleShareNative}
            variant="outline"
            className="w-full h-12 border border-[#A78BFA] text-[#A78BFA] hover:bg-[#A78BFA]/10 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
          >
            <Share2 className="h-4.5 w-4.5" />
            <span>Share</span>
          </Button>
        </div>
      </div>

      {/* Referral History */}
      <div className="bg-[#111520] border border-[#1E2540] rounded-2xl p-6 space-y-4">
        <span className="text-[10px] font-bold text-[#8B95B3] uppercase tracking-widest block">Referral History</span>

        {referralsList.length === 0 ? (
          /* Empty State 1 */
          <div className="text-center py-8 px-4 bg-[#151926] border border-[#1E2540] rounded-xl space-y-1.5 animate-fadeIn">
            <p className="text-xs text-white font-semibold">No referrals yet.</p>
            <p className="text-[11px] text-[#8B95B3]">Your unique link is ready — share it with one person today.</p>
          </div>
        ) : referralsList.filter((r: any) => r.status !== 'pending').length === 0 ? (
          /* Empty State 2 */
          <div className="text-center py-8 px-4 bg-[#151926] border border-[#1E2540] rounded-xl space-y-2.5 animate-fadeIn">
            <p className="text-xs text-white font-semibold">Your link has been shared.</p>
            <p className="text-[11px] text-[#8B95B3]">When a friend signs up and completes their first lesson you will earn +200 CXP.</p>
            <Button
              onClick={handleCopyLink}
              variant="ghost"
              className="text-xs text-[#A78BFA] hover:text-[#9067FA] font-bold h-8 px-4 cursor-pointer"
            >
              Share again
            </Button>
          </div>
        ) : (
          /* Full History List */
          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
            {referralsList.map((refRow: any) => {
              const createdDate = new Date(refRow.created_at)
              const monthYear = createdDate.toLocaleString('default', { month: 'long', year: 'numeric' })

              return (
                <div key={refRow.id} className="flex items-center justify-between p-3.5 bg-[#151926] border border-[#1E2540] rounded-xl text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#1E2540] flex items-center justify-center text-text-3">
                      <User size={14} />
                    </div>
                    <span className="font-semibold text-white">Friend joined {monthYear}</span>
                  </div>

                  <div className="text-right">
                    {refRow.status === 'completed_first_lesson' ? (
                      <div className="text-[11px] font-bold text-emerald-400">
                        <div>Lesson complete ✓</div>
                        <div className="text-[10px] font-medium text-emerald-500/85 font-mono">+200 CXP earned</div>
                      </div>
                    ) : refRow.status === 'expired' ? (
                      <span className="text-[11px] font-semibold text-[#8B95B3] bg-[#1E2540] px-2 py-0.5 rounded-md">
                        Expired
                      </span>
                    ) : (
                      <div className="text-[11px] font-bold text-[#8B95B3]">
                        <div>Signed up</div>
                        <div className="text-[9px] font-medium text-[#8B95B3]/80">Waiting for first lesson</div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
