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
  
  if (!user) {
    return { 
      tier: 'free', 
      isPro: false, 
      isActive: false, 
      endDate: null 
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_status, subscription_end_date')
    .eq('id', user.id)
    .maybeSingle()

  const tier = (profile?.subscription_tier || 'free') as SubscriptionTier
  const status = profile?.subscription_status || 'inactive'
  const endDate = profile?.subscription_end_date || null

  // A profile is Pro if the tier is monthly or yearly, status is active (or trialing/trailing), and not expired
  const isProTier = tier === 'pro_monthly' || tier === 'pro_yearly'
  const isStatusActive = status === 'active' || status === 'trialing' || status === 'trailing'
  const isExpired = endDate ? new Date(endDate) < new Date() : false
  const activeAndNotExpired = isProTier && isStatusActive && !isExpired

  // Hardcoded Admin Bypass
  const isAdmin = user.id === process.env.ADMIN_USER_ID || 
                  user.id === process.env.NEXT_PUBLIC_ADMIN_USER_ID || 
                  user.id === '4c1fbae5-c423-42e7-8394-1112fe00d42e'

  const finalIsPro = activeAndNotExpired || isAdmin

  return { 
    tier: isAdmin ? 'pro_yearly' : tier, 
    isPro: finalIsPro, 
    isActive: finalIsPro, 
    endDate 
  }
}

// Check if a specific lesson is accessible to a user
export function isLessonAccessible(
  phaseNumber: number,
  lessonOrderIndex: number,
  isPro: boolean
): boolean {
  return isPro || phaseNumber === 1
}

// Check if a feature is accessible
export function isFeatureAccessible(
  feature: 'analytics' | 'practice' | 'insights' | 'depth_switch' | 'multiple_goals',
  isPro: boolean
): boolean {
  return isPro
}
