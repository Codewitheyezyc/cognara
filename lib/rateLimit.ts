import { createClient } from '@/lib/supabase/server'

interface RateLimitConfig {
  featureKey: string
  limit?: number
  dailyLimit?: number
  userId: string
  period?: 'daily' | 'monthly'
}

export async function checkRateLimit({
  featureKey,
  limit,
  dailyLimit,
  userId,
  period = 'daily'
}: RateLimitConfig): Promise<{ allowed: boolean; remaining: number; count: number }> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const limitVal = limit !== undefined ? limit : (dailyLimit ?? 0)

  if (period === 'daily') {
    // Get or create usage record for today
    const { data: usage } = await supabase
      .from('feature_usage')
      .select('count')
      .eq('user_id', userId)
      .eq('feature_key', featureKey)
      .eq('usage_date', today)
      .maybeSingle()

    const currentCount = usage?.count || 0

    if (currentCount >= limitVal) {
      return { allowed: false, remaining: 0, count: currentCount }
    }

    // Increment count
    await supabase
      .from('feature_usage')
      .upsert({
        user_id: userId,
        feature_key: featureKey,
        usage_date: today,
        count: currentCount + 1,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,feature_key,usage_date' })

    return {
      allowed: true,
      remaining: limitVal - (currentCount + 1),
      count: currentCount + 1
    }
  } else {
    // Monthly logic: sum counts for the current month
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

    const { data: usages } = await supabase
      .from('feature_usage')
      .select('count')
      .eq('user_id', userId)
      .eq('feature_key', featureKey)
      .gte('usage_date', firstDayOfMonth)

    const totalCount = usages?.reduce((acc, curr) => acc + curr.count, 0) || 0

    if (totalCount >= limitVal) {
      return { allowed: false, remaining: 0, count: totalCount }
    }

    // Update or insert today's entry
    const { data: todayUsage } = await supabase
      .from('feature_usage')
      .select('count')
      .eq('user_id', userId)
      .eq('feature_key', featureKey)
      .eq('usage_date', today)
      .maybeSingle()

    const todayCount = todayUsage?.count || 0

    await supabase
      .from('feature_usage')
      .upsert({
        user_id: userId,
        feature_key: featureKey,
        usage_date: today,
        count: todayCount + 1,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,feature_key,usage_date' })

    return {
      allowed: true,
      remaining: limitVal - (totalCount + 1),
      count: totalCount + 1
    }
  }
}
