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
    return { allowed: true, count: 0, limit: limitDaily }
  }

  const currentCount = count || 0

  if (currentCount >= limitDaily) {
    return { allowed: false, count: currentCount, limit: limitDaily }
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

  return { allowed: true, count: currentCount + 1, limit: limitDaily }
}
