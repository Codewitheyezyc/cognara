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
 * - If API key is NOT configured (dev/missing): silently use mockFallback, marking result _isMock=true.
 * - If API key IS configured but Claude fails: throw the error upward so the caller can decide.
 *   This prevents bad content from being cached in the DB.
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

  // API key present — call Claude and let errors propagate
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 5000,
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
}
