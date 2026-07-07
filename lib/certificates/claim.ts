import { createClient } from '@/lib/supabase/server'

export interface ClaimResult {
  canClaim: boolean
  reason: 'pro_required' | null
  message: string | null
  isFreePhase?: boolean
}

export async function canClaimCertificate(
  userId: string,
  phaseNumber: number,
  isGoalCompletion: boolean
): Promise<ClaimResult> {
  const supabase = await createClient()

  const { data: user } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_tier')
    .eq('id', userId)
    .maybeSingle()

  const isPro = user?.subscription_status === 'pro' || user?.subscription_tier === 'pro'

  // Goal completion certificate — Pro only always
  if (isGoalCompletion) {
    return {
      canClaim: isPro,
      reason: isPro ? null : 'pro_required',
      message: isPro ? null : 'Goal completion certificates are available on Pro. Upgrade to claim this certificate.'
    }
  }

  // Phase 1 certificate — FREE for everyone
  if (phaseNumber === 1) {
    return {
      canClaim: true,
      reason: null,
      message: null,
      isFreePhase: true
    }
  }

  // Phase 2 and beyond — Pro only
  if (phaseNumber > 1) {
    return {
      canClaim: isPro,
      reason: isPro ? null : 'pro_required',
      message: isPro ? null : `Phase ${phaseNumber} certificates are available on Pro. Upgrade to claim all your certificates.`
    }
  }

  return {
    canClaim: false,
    reason: 'pro_required',
    message: 'Unknown phase certificate.'
  }
}
