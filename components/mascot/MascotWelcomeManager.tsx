'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { WelcomeModal } from './WelcomeModal'
import { StreakMilestoneModal } from './StreakMilestoneModal'

interface MascotWelcomeManagerProps {
  userName: string
  hasSeenWelcome: boolean
  currentStreak: number
}

export function MascotWelcomeManager({
  userName,
  hasSeenWelcome,
  currentStreak
}: MascotWelcomeManagerProps) {
  const supabase = createClient()
  const [showWelcome, setShowWelcome] = useState(!hasSeenWelcome)
  const [showStreakMilestone, setShowStreakMilestone] = useState(false)

  useEffect(() => {
    // Check if user hits a streak milestone: 3, 7, 14, 30 days
    const milestones = [3, 7, 14, 30]
    if (milestones.includes(currentStreak)) {
      const lastShownMilestone = localStorage.getItem('shown_streak_milestone')
      if (lastShownMilestone !== String(currentStreak)) {
        // Show streak milestone notification
        setShowStreakMilestone(true)
      }
    }
  }, [currentStreak])

  const handleDismissWelcome = async () => {
    setShowWelcome(false)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Save flag in database
        await supabase
          .from('profiles')
          .update({ has_seen_welcome: true })
          .eq('id', user.id)
      }
    } catch (err) {
      console.error('Failed to update has_seen_welcome state:', err)
    }
  }

  const handleDismissStreak = () => {
    setShowStreakMilestone(false)
    // Mark streak milestone as shown in localStorage so it doesn't trigger on every page view today
    localStorage.setItem('shown_streak_milestone', String(currentStreak))
  }

  return (
    <>
      {showWelcome && (
        <WelcomeModal userName={userName} onDismiss={handleDismissWelcome} />
      )}
      {showStreakMilestone && (
        <StreakMilestoneModal streakDays={currentStreak} onDismiss={handleDismissStreak} />
      )}
    </>
  )
}
export default MascotWelcomeManager
