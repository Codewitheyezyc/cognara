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
  // Step 1 — Get user profile
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    return {
      eligible: false,
      reason: 'unauthorized',
      message: 'User profile not found.'
    };
  }

  console.log('canUserWriteBlog — user:', {
    id: user.id,
    subscription_status: user.subscription_status,
    role: user.role
  });

  // Step 2 — Admin bypass all restrictions
  const isAdmin =
    user.role === 'admin' ||
    user.id === process.env.NEXT_PUBLIC_ADMIN_USER_ID ||
    user.id === process.env.ADMIN_USER_ID;

  if (isAdmin) {
    return {
      eligible: true,
      author_type: 'admin',
      domain_restricted: false,
      allowed_domains: ['Technology', 'Business', 'Marketing', 'General']
    };
  }

  // Step 3 — Check Pro status
  // Accept multiple possible values for pro status
  const isPro =
    user.subscription_status === 'pro' ||
    user.subscription_status === 'active' ||
    user.subscription_status === 'pro_monthly' ||
    user.subscription_status === 'pro_yearly' ||
    user.subscription_tier === 'pro';

  console.log('canUserWriteBlog — isPro:', isPro);

  // Step 4 — Find phase completions
  // Try every possible table name
  let completedPhaseCount = 0;
  let completionsList: any[] = [];

  // Try table 1
  try {
    const { data: c1_data } = await supabase
      .from('cognara_phase_completions')
      .select('phase_number, domain, phase_name')
      .eq('user_id', userId);
    
    if (c1_data && c1_data.length > 0) {
      completedPhaseCount = c1_data.length;
      completionsList = c1_data;
    }
    console.log('cognara_phase_completions count:', c1_data?.length);
  } catch (e) {
    console.log('cognara_phase_completions: not found');
  }

  // Try table 2
  if (completedPhaseCount === 0) {
    try {
      const { data: phases } = await supabase
        .from('roadmap_phases')
        .select('id, phase_number, title')
        .eq('user_id', userId)
        .eq('is_completed', true);
      
      if (phases && phases.length > 0) {
        completedPhaseCount = phases.length;
        completionsList = phases.map(p => ({
          phase_number: p.phase_number,
          domain: p.title || 'General',
          phase_name: p.title || 'General'
        }));
      }
      console.log('roadmap_phases completed:', phases?.length);
    } catch (e) {
      console.log('roadmap_phases: not found');
    }
  }

  // Try table 3
  if (completedPhaseCount === 0) {
    try {
      const { data: progress } = await supabase
        .from('lesson_progress')
        .select('phase_number')
        .eq('user_id', userId)
        .eq('completed', true);
      
      if (progress && progress.length > 0) {
        completedPhaseCount = progress.length;
        completionsList = progress.map(p => ({
          phase_number: p.phase_number || 1,
          domain: 'General',
          phase_name: 'General'
        }));
      }
      console.log('lesson_progress completed:', progress?.length);
    } catch (e) {
      console.log('lesson_progress: not found');
    }
  }

  console.log('Total completed phases found:', completedPhaseCount);

  // Step 5 — PRO USER LOGIC
  if (isPro) {
    // Pro user must have completed at least one phase
    if (completedPhaseCount < 1) {
      return {
        eligible: false,
        reason: 'phase_not_completed',
        message: 'Complete your first learning phase to unlock blog writing.'
      };
    }

    // Pro user with phase completed — full access
    const allowedDomains = resolveAllowedDomains(completionsList);
    return {
      eligible: true,
      author_type: 'community',
      domain_restricted: true,
      allowed_domains: allowedDomains,
      completed_phases: completionsList
    };
  }

  // Step 6 — FREE USER LOGIC
  else {
    // Free user must have completed Phase 1 specifically
    let phaseOneCompleted = false;
    let phaseOneCompletionDetail = completionsList.find(c => c.phase_number === 1);

    if (phaseOneCompletionDetail) {
      phaseOneCompleted = true;
    } else {
      try {
        const { data: phaseOne } = await supabase
          .from('cognara_phase_completions')
          .select('phase_number, domain, phase_name')
          .eq('user_id', userId)
          .eq('phase_number', 1)
          .single();
        
        if (phaseOne) {
          phaseOneCompleted = true;
          phaseOneCompletionDetail = phaseOne;
          completionsList.push(phaseOne);
        }
      } catch (e) {
        // Try alternative table
        try {
          const { data: phaseOne } = await supabase
            .from('roadmap_phases')
            .select('id, phase_number, title')
            .eq('user_id', userId)
            .eq('phase_number', 1)
            .eq('is_completed', true)
            .single();
          
          if (phaseOne) {
            phaseOneCompleted = true;
            phaseOneCompletionDetail = {
              phase_number: 1,
              domain: phaseOne.title || 'General',
              phase_name: phaseOne.title || 'General'
            };
            completionsList.push(phaseOneCompletionDetail);
          }
        } catch (e2) {
          console.log('Phase 1 check failed:', e2);
        }
      }
    }

    console.log('Phase 1 completed:', phaseOneCompleted);

    if (!phaseOneCompleted) {
      return {
        eligible: false,
        reason: 'phase_not_completed',
        message: 'Complete Phase 1 to unlock your one free blog post.'
      };
    }

    // Check if free user already used their one post
    if (user.free_blog_post_used) {
      return {
        eligible: false,
        reason: 'free_blog_used',
        message: 'You have already written your free blog post. Upgrade to Pro to write more posts.'
      };
    }

    // Free user eligible for one post
    const allowedDomains = resolveAllowedDomains([phaseOneCompletionDetail]);
    return {
      eligible: true,
      author_type: 'community',
      is_free_user: true,
      free_posts_remaining: 1,
      domain_restricted: true,
      allowed_domains: allowedDomains,
      completed_phases: [phaseOneCompletionDetail]
    };
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
