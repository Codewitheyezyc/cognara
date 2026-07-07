import { SupabaseClient } from '@supabase/supabase-js'

export interface BlogEligibilityResult {
  eligible: boolean
  author_type?: 'admin' | 'community'
  reason?: 'unauthorized' | 'pro_required' | 'phase_not_completed' | 'free_blog_used'
  message?: string
  allowed_domains?: string[]
  completed_phases?: any[]
  is_free_user?: boolean
  free_posts_remaining?: number
  domain_restricted?: boolean
  allowed_phases?: number[]
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
    .select('id, subscription_tier, subscription_status, free_blog_post_used, role')
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

  // Admin check
  const isAdmin =
    user.role === 'admin' ||
    user.id === process.env.NEXT_PUBLIC_ADMIN_USER_ID ||
    user.id === process.env.ADMIN_USER_ID

  if (isAdmin) {
    return {
      eligible: true,
      author_type: 'admin',
      domain_restricted: false,
      allowed_domains: ['Technology', 'Business', 'Marketing', 'General']
    }
  }

  const isPro = user.subscription_status === 'pro' || user.subscription_tier === 'pro'

  // Fetch phase completions from the cognara_phase_completions table
  const { data: completions } = await supabase
    .from('cognara_phase_completions')
    .select('phase_number, domain, phase_name')
    .eq('user_id', userId)

  const completionsCount = completions?.length || 0

  // 1. Pro Users:
  if (isPro) {
    if (completionsCount < 1) {
      return {
        eligible: false,
        reason: 'phase_not_completed',
        message: 'Complete your first learning phase to unlock blog writing.'
      }
    }

    // Determine allowed domains based on completions
    const allowedDomains = resolveAllowedDomains(completions || [])

    return {
      eligible: true,
      author_type: 'community',
      domain_restricted: true,
      allowed_domains: allowedDomains,
      completed_phases: completions || []
    }
  }

  // 2. Free Users:
  const phaseOneCompletion = completions?.find(c => c.phase_number === 1)

  if (!phaseOneCompletion) {
    return {
      eligible: false,
      reason: 'phase_not_completed',
      message: 'Complete Phase 1 to unlock your one free blog post.'
    }
  }

  if (user.free_blog_post_used) {
    return {
      eligible: false,
      reason: 'free_blog_used',
      message: 'You have already written your free blog post. Upgrade to Pro to write more posts.'
    }
  }

  // Allowed domains for Phase 1 topics
  const allowedDomains = resolveAllowedDomains([phaseOneCompletion])

  return {
    eligible: true,
    author_type: 'community',
    is_free_user: true,
    free_posts_remaining: 1,
    domain_restricted: true,
    allowed_phases: [1],
    allowed_domains: allowedDomains,
    completed_phases: [phaseOneCompletion]
  }
}

// Helper to resolve allowed domains based on completion domains
function resolveAllowedDomains(completions: any[]): string[] {
  const allowedDomainsSet = new Set<string>()

  completions.forEach(c => {
    if (!c.domain) return
    const s = c.domain.toLowerCase()
    let normalized = 'General'

    if (
      s.includes('web') ||
      s.includes('tech') ||
      s.includes('develop') ||
      s.includes('cod') ||
      s.includes('program') ||
      s.includes('software') ||
      s.includes('ui') ||
      s.includes('ux') ||
      s.includes('design') ||
      s.includes('data')
    ) {
      normalized = 'Technology'
    } else if (
      s.includes('business') ||
      s.includes('entrepreneur') ||
      s.includes('finance') ||
      s.includes('econom') ||
      s.includes('manage') ||
      s.includes('strat')
    ) {
      normalized = 'Business'
    } else if (
      s.includes('market') ||
      s.includes('social') ||
      s.includes('ad') ||
      s.includes('sale') ||
      s.includes('growth')
    ) {
      normalized = 'Marketing'
    }

    allowedDomainsSet.add(normalized)
  })

  return allowedDomainsSet.size > 0 ? Array.from(allowedDomainsSet) : ['General']
}
