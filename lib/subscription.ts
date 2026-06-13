import { createClient } from '@/lib/supabase/server'

export type SubscriptionTier = 'free' | 'pro_monthly' | 'pro_yearly'

export interface SubscriptionStatus {
  tier: SubscriptionTier
  isPro: boolean
  isActive: boolean
  endDate: string | null
}

export async function getUserSubscription(): Promise<SubscriptionStatus> {
  // Always return Pro active in development
  return { 
    tier: 'pro_monthly', 
    isPro: true, 
    isActive: true, 
    endDate: null 
  }
}

// Check if a specific lesson is accessible to a user
export function isLessonAccessible(
  phaseNumber: number,
  lessonOrderIndex: number,
  isPro: boolean
): boolean {
  return true // Unlocked for everyone in dev
}

// Check if a feature is accessible
export function isFeatureAccessible(
  feature: 'analytics' | 'practice' | 'insights' | 'depth_switch' | 'multiple_goals',
  isPro: boolean
): boolean {
  return true // Unlocked for everyone in dev
}
