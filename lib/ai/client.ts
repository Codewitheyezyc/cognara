import Anthropic from '@anthropic-ai/sdk'

const apiKey = process.env.ANTHROPIC_API_KEY

// Treat mock key or empty key as unconfigured
const isConfigured = 
  apiKey && 
  apiKey !== 'mock_anthropic_api_key_for_development' && 
  apiKey !== 'placeholder_service_role_key_for_dev'

export const anthropic = isConfigured
  ? new Anthropic({ apiKey })
  : null

/**
 * Helper to call Anthropic Claude and return structured JSON.
 *
 * Behaviour:
 * - If API key is NOT configured (dev/missing): use mockFallback, marking result _isMock=true.
 * - If API key IS configured but Claude fails: throw a descriptive error so the API route
 *   can surface the exact failure reason to the client. This prevents bad content from
 *   being cached in the DB and helps diagnose API key / credit issues.
 */
export async function callClaudeJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  mockFallback: () => Promise<T>
): Promise<T> {
  // No API key — fall back to mock (dev mode)
  if (!anthropic) {
    console.warn('⚠️  ANTHROPIC_API_KEY not configured. Using mock fallback.')
    const result = await mockFallback()
    return { ...result as object, _isMock: true } as T
  }

  // API key present — call Claude
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      temperature: 0.2,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    })

    const textContent = response.content[0].type === 'text'
      ? response.content[0].text
      : ''

    // Extract JSON block in case Claude wraps it in ```json ... ```
    const jsonMatch = textContent.match(/\{[\s\S]*\}/)
    const jsonString = jsonMatch ? jsonMatch[0] : textContent

    return JSON.parse(jsonString) as T

  } catch (error: any) {
    // Extract meaningful reason from Anthropic's error structure
    const status = error?.status ?? error?.statusCode ?? 'unknown'
    const msg = error?.error?.message ?? error?.message ?? String(error)

    // Map to user-friendly diagnosis
    let diagnosis = msg
    if (status === 401 || msg?.toLowerCase().includes('api key') || msg?.toLowerCase().includes('authentication')) {
      diagnosis = `Invalid or expired API key (HTTP ${status}). Go to console.anthropic.com → API Keys and create a fresh key, then update ANTHROPIC_API_KEY in Vercel environment variables.`
    } else if (status === 429 || msg?.toLowerCase().includes('rate')) {
      diagnosis = `Rate limit or credit exhaustion (HTTP ${status}). Check your Anthropic account billing at console.anthropic.com.`
    } else if (status === 404 || msg?.toLowerCase().includes('model')) {
      diagnosis = `Model not found (HTTP ${status}): ${msg}`
    }

    console.error(`[Claude] Failed — HTTP ${status}: ${msg}`)
    throw new Error(diagnosis)
  }
}
