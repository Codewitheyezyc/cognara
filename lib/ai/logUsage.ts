import { createClient } from '@/lib/supabase/server'

export async function logApiUsage(
  userId: string,
  apiType: 'lesson' | 'quiz' | 'insight' | 'simplify' | 'roadmap',
  model: string,
  inputTokens: number,
  outputTokens: number
) {
  try {
    const supabase = await createClient()

    // Calculate cost based on model
    let costUsd = 0
    const lowerModel = model.toLowerCase()

    if (lowerModel.includes('sonnet')) {
      // Sonnet 3.5: $3.00 / M input, $15.00 / M output
      costUsd = (inputTokens * 3.00 + outputTokens * 15.00) / 1_000_000
    } else if (lowerModel.includes('haiku')) {
      // Haiku 3.5: $0.25 / M input, $1.25 / M output
      costUsd = (inputTokens * 0.25 + outputTokens * 1.25) / 1_000_000
    } else {
      // Default to Sonnet pricing if unknown
      costUsd = (inputTokens * 3.00 + outputTokens * 15.00) / 1_000_000
    }

    const tokensUsed = inputTokens + outputTokens

    const { error } = await supabase.from('api_usage_log').insert({
      user_id: userId,
      api_type: apiType,
      tokens_used: tokensUsed,
      cost_usd: costUsd,
      created_at: new Date().toISOString()
    })

    if (error) {
      console.error('[logApiUsage] Database insertion failed:', error)
    } else {
      console.log(`[logApiUsage] Logged API usage: ${apiType} using ${model}. Tokens: ${tokensUsed}, Cost: $${costUsd.toFixed(6)}`)
    }
  } catch (err) {
    console.error('[logApiUsage] Error logging usage:', err)
  }
}
