import { SupabaseClient } from '@supabase/supabase-js'

export interface BlogEligibilityResult {
  eligible: boolean
  author_type: 'admin' | 'community'
  reason?: 'unauthorized' | 'pro_required' | 'phase_not_completed'
  message?: string
  allowed_domains?: string[]
  completed_phases?: any[]
}

/**
 * Checks if a user is eligible to write a post on the Cognara blog
 */
export async function canUserWriteBlog(
  userId: string,
  supabase: SupabaseClient
): Promise<BlogEligibilityResult> {
  // Fetch profile
  const { data: user, error: userErr } = await supabase
    .from('profiles')
    .select('id, subscription_tier, subscription_status')
    .eq('id', userId)
    .maybeSingle()

  if (userErr || !user) {
    return {
      eligible: false,
      author_type: 'community',
      reason: 'unauthorized',
      message: 'User profile not found.'
    }
  }

  // Admin bypass check (using env variables or check role string if exists)
  const isAdmin =
    user.id === process.env.NEXT_PUBLIC_ADMIN_USER_ID ||
    user.id === process.env.ADMIN_USER_ID

  if (isAdmin) {
    return {
      eligible: true,
      author_type: 'admin',
      allowed_domains: ['Technology', 'Business', 'Marketing', 'General']
    }
  }

  // Must be Pro (subscription_tier !== 'free')
  const isPro =
    user.subscription_tier === 'pro' ||
    user.subscription_status === 'pro' ||
    user.subscription_tier === 'premium' ||
    user.subscription_tier !== 'free'

  if (!isPro) {
    return {
      eligible: false,
      author_type: 'community',
      reason: 'pro_required',
      message: 'Blog writing is available to Pro subscribers who have completed at least one learning phase.'
    }
  }

  // Must have completed at least one phase
  const { data: certificates, error: certsErr } = await supabase
    .from('cognara_certificates')
    .select('goal_name, phase_number, phase_name')
    .eq('user_id', userId)

  if (certsErr || !certificates || certificates.length < 1) {
    return {
      eligible: false,
      author_type: 'community',
      reason: 'phase_not_completed',
      message: 'Complete your first learning phase to unlock blog writing.'
    }
  }

  // Get completed domains for topic locking
  const { data: goals } = await supabase
    .from('learning_goals')
    .select('goal_text, subject')
    .eq('user_id', userId)

  const allowedDomainsSet = new Set<string>()
  certificates.forEach(c => {
    const g = goals?.find(goal => goal.goal_text === c.goal_name)
    const subject = g?.subject || 'General'
    
    // Normalization helper to map specific subjects to broad domain categories
    const s = subject.toLowerCase()
    let normalized = 'General'
    if (s.includes('web') || s.includes('tech') || s.includes('develop') || s.includes('cod') || s.includes('program') || s.includes('software') || s.includes('ui') || s.includes('ux') || s.includes('design') || s.includes('data')) {
      normalized = 'Technology'
    } else if (s.includes('business') || s.includes('entrepreneur') || s.includes('finance') || s.includes('econom') || s.includes('manage') || s.includes('strat')) {
      normalized = 'Business'
    } else if (s.includes('market') || s.includes('social') || s.includes('ad') || s.includes('sale') || s.includes('growth')) {
      normalized = 'Marketing'
    }
    
    allowedDomainsSet.add(normalized)
  })

  const allowedDomains = allowedDomainsSet.size > 0 ? Array.from(allowedDomainsSet) : ['General']

  return {
    eligible: true,
    author_type: 'community',
    allowed_domains: allowedDomains,
    completed_phases: certificates
  }
}
