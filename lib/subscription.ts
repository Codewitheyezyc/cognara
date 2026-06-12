import { createClient } from '@/lib/supabase/server'

export type SubscriptionTier = 'free' | 'pro_monthly' | 'pro_yearly'

export interface SubscriptionStatus {
  tier: SubscriptionTier
  isPro: boolean
  isActive: boolean
  endDate: string | null
}

export async function getUserSubscription(): Promise<SubscriptionStatus> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { tier: 'free', isPro: false, isActive: false, endDate: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_status, subscription_end_date')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) return { tier: 'free', isPro: false, isActive: false, endDate: null }

  const isPro =
    (profile.subscription_tier === 'pro_monthly' || profile.subscription_tier === 'pro_yearly') &&
    profile.subscription_status === 'active' &&
    (!profile.subscription_end_date || new Date(profile.subscription_end_date) > new Date())

  return {
    tier: (profile.subscription_tier as SubscriptionTier) || 'free',
    isPro,
    isActive: profile.subscription_status === 'active',
    endDate: profile.subscription_end_date
  }
}

// Check if a specific lesson is accessible to a user
export function isLessonAccessible(
  phaseNumber: number,
  lessonOrderIndex: number,
  isPro: boolean
): boolean {
  if (isPro) return true
  if (phaseNumber === 1) return true           // Phase 1 always free
  if (phaseNumber === 2 && lessonOrderIndex <= 2) return true  // First 2 of Phase 2 free
  return false
}

// Check if a feature is accessible
export function isFeatureAccessible(
  feature: 'analytics' | 'practice' | 'insights' | 'depth_switch' | 'multiple_goals',
  isPro: boolean
): boolean {
  if (isPro) return true
  return false  // All features require Pro
}
