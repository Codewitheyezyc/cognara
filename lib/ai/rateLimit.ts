import { SupabaseClient } from '@supabase/supabase-js'

export interface RateLimitResult {
  allowed: boolean
  count: number
  limit: number
}

/**
 * Checks and records AI route rate limit per user.
 * Limit is based on the number of requests in the last 24 hours.
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  route: 'roadmap' | 'lesson' | 'quiz' | 'insight',
  limitDaily: number
): Promise<RateLimitResult> {
  // 0. Query user profile to check subscription status / admin role
  let isPro = false
  let isAdmin = false

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_status, email')
      .eq('id', userId)
      .maybeSingle()

    isAdmin = 
      userId === process.env.ADMIN_USER_ID || 
      profile?.email === 'chydexxzy2002@gmail.com'

    isPro = 
      profile?.subscription_tier === 'pro_monthly' || 
      profile?.subscription_tier === 'pro_yearly'
  } catch (err) {
    console.error('[RateLimit Profile Error] Failed to check user profile:', err)
  }

  // Admin and Pro users get unlimited access
  if (isAdmin || isPro) {
    // Log the request for statistics but do not enforce limit
    await supabase.from('ai_request_logs').insert({ user_id: userId, route })
    return { allowed: true, count: 0, limit: 999999 }
  }

  // Raise default limits for free users during testing/launch
  let dynamicLimit = limitDaily
  if (route === 'lesson' && limitDaily < 100) dynamicLimit = 100
  if (route === 'quiz' && limitDaily < 100) dynamicLimit = 100
  if (route === 'roadmap' && limitDaily < 20) dynamicLimit = 20
  if (route === 'insight' && limitDaily < 10) dynamicLimit = 10

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // 1. Query count of requests in the last 24 hours
  const { count, error } = await supabase
    .from('ai_request_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('route', route)
    .gte('created_at', oneDayAgo)

  if (error) {
    console.error(`[RateLimit Error] Failed to fetch rate limit count for ${route}:`, error)
    // In case of query failures, we fail-safe to allowed: true so user flows do not break
    return { allowed: true, count: 0, limit: dynamicLimit }
  }

  const currentCount = count || 0

  if (currentCount >= dynamicLimit) {
    return { allowed: false, count: currentCount, limit: dynamicLimit }
  }

  // 2. Insert new request log entry
  const { error: insertError } = await supabase
    .from('ai_request_logs')
    .insert({
      user_id: userId,
      route
    })

  if (insertError) {
    console.error(`[RateLimit Error] Failed to log request for ${route}:`, insertError)
    // Fail-safe allowed: true if insertion fails
  }

  return { allowed: true, count: currentCount + 1, limit: dynamicLimit }
}
