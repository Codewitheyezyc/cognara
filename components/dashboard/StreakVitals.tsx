'use client'

import React, { useState } from 'react'
import { Flame, Shield, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { useRouter } from 'next/navigation'
import { SoundEffects } from '@/lib/sound'

interface StreakVitalsProps {
  initialStreak: {
    current_streak: number
    longest_streak: number
    last_activity_at: string | null
    shields_available: number
    shields_used_this_month: number
  }
  isPro: boolean
}

export default function StreakVitals({ initialStreak, isPro }: StreakVitalsProps) {
  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()
  
  const [streak, setStreak] = useState(initialStreak)
  const [loading, setLoading] = useState(false)

  // Calculate status
  const todayStr = new Date().toISOString().split('T')[0]
  const today = new Date(todayStr)
  today.setUTCHours(0, 0, 0, 0)

  const lastActivity = streak?.last_activity_at
  const lastDate = lastActivity ? new Date(lastActivity) : null
  if (lastDate) {
    lastDate.setUTCHours(0, 0, 0, 0)
  }

  const diffTime = lastDate ? today.getTime() - lastDate.getTime() : null
  const diffDays = diffTime !== null ? Math.floor(diffTime / (1000 * 60 * 60 * 24)) : null

  // Streak is broken if they missed yesterday (diffDays >= 2)
  const isBroken = diffDays !== null && diffDays >= 2
  const isRestoreAvailable = diffDays === 2

  const handleRestore = async () => {
    if (loading) return
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      if (!isPro) {
        // Fetch user profile to verify they have at least 300 CXP
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('xp')
          .eq('id', user.id)
          .maybeSingle()

        const currentXp = profileRow?.xp || 0
        if (currentXp < 300) {
          toast(`Need 300 CXP to restore streak. (You have ${currentXp} CXP)`)
          router.push('/dashboard/settings')
          return
        }

        // Spend 300 CXP
        const { data: success, error: spendError } = await supabase.rpc('spend_user_cxp', {
          user_id_input: user.id,
          amount_input: 300,
          source_input: 'streak_repair',
          description_input: 'Restored broken streak'
        })

        if (spendError || !success) {
          throw spendError || new Error('Failed to spend CXP')
        }
      } else {
        if (streak.shields_available <= 0) {
          toast('No shields available this month.')
          router.push('/dashboard/settings')
          return
        }
      }

      // Set last activity to yesterday so they preserve their current streak count
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      const updateData: any = {
        last_activity_at: yesterdayStr,
      }
      if (isPro) {
        updateData.shields_available = streak.shields_available - 1
        updateData.shields_used_this_month = streak.shields_used_this_month + 1
      }

      const { error } = await supabase
        .from('streaks')
        .update(updateData)
        .eq('user_id', user.id)

      if (error) throw error

      setStreak(prev => {
        const nextData = {
          ...prev,
          last_activity_at: yesterdayStr,
        }
        if (isPro) {
          nextData.shields_available = prev.shields_available - 1
          nextData.shields_used_this_month = prev.shields_used_this_month + 1
        }
        return nextData
      })

      SoundEffects.play('success')
      window.dispatchEvent(new Event('cognara_xp_gained'))

      toast(isPro ? 'Streak restored successfully! 🛡️' : 'Streak restored with 300 CXP! 🔥')
      router.refresh()
    } catch (err: any) {
      console.error(err)
      toast(err.message || 'Failed to restore streak', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center space-x-3 w-full min-w-0">
      <div className={`w-10 h-10 rounded-md flex items-center justify-center border transition-colors ${
        isBroken 
          ? 'bg-error/10 text-error border-error/15' 
          : 'bg-accent-warm/10 text-accent-warm border-accent-warm/15'
      }`}>
        <Flame className={`h-5 w-5 ${!isBroken ? 'fill-current animate-pulse-subtle' : ''}`} />
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-1.5">
          <span className={`text-lg font-bold font-mono leading-none ${isBroken ? 'text-error' : 'text-text-1'}`}>
            {isBroken ? '0d' : `${streak.current_streak}d`}
          </span>
          {isPro && !isBroken && streak.shields_available > 0 && (
            <span className="text-[10px] text-text-3 font-semibold flex items-center gap-0.5" title="Streak Shields Available">
              🛡️{streak.shields_available}
            </span>
          )}
        </div>
        
        <span className="text-[10px] text-text-2 truncate mt-0.5">
          {isBroken ? 'Streak broken' : 'Active Streak'}
        </span>

        {isBroken && isRestoreAvailable && (
          <button
            onClick={handleRestore}
            disabled={loading}
            className={`mt-1.5 text-[9px] font-bold py-0.5 px-1.5 rounded border transition-all w-fit cursor-pointer ${
              !isPro
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20'
                : streak.shields_available > 0
                ? 'bg-accent-warm/10 border-accent-warm/20 text-accent-warm hover:bg-accent-warm/20'
                : 'bg-surface-alt border-border text-text-3 cursor-not-allowed'
            }`}
          >
            {!isPro ? 'Restore (300 CXP) 🔥' : streak.shields_available > 0 ? 'Restore 🛡️' : 'No shields'}
          </button>
        )}
      </div>
    </div>
  )
}
