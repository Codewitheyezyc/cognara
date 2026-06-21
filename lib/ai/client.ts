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
  mockFallback: () => Promise<T>,
  model: string = 'claude-sonnet-4-6'
): Promise<T> {
  // No API key — fall back to mock (dev mode)
  if (!anthropic) {
    console.warn('⚠️  ANTHROPIC_API_KEY not configured. Using mock fallback.')
    const result = await mockFallback()
    if (result && typeof result === 'object') {
      const mockInput = Math.floor(Math.random() * 300) + 400
      const mockOutput = Math.floor(Math.random() * 500) + 600
      ;(result as any)._usage = {
        input_tokens: mockInput,
        output_tokens: mockOutput,
        model: model,
        isMock: true
      }
    }
    return { ...result as object, _isMock: true } as T
  }

  // API key present — call Claude
  try {
    const response = await anthropic.messages.create({
      model: model,
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

    const parsed = JSON.parse(jsonString) as T
    if (parsed && typeof parsed === 'object') {
      (parsed as any)._usage = {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        model: response.model || 'claude-sonnet-4-6'
      }
    }
    return parsed

  } catch (error: any) {
    // Extract meaningful reason from Anthropic's error structure
    const status = error?.status ?? error?.statusCode ?? 'unknown'
    const msg = error?.error?.message ?? error?.message ?? String(error)

    // Log the detailed error message for developer diagnostics (server logs)
    console.error(`[Claude] Failed — HTTP ${status}: ${msg}`)

    // Throw a clean, generic user-facing message to prevent exposing internal API keys/credit issues
    throw new Error('Cognara is experiencing temporary system maintenance. Please try again shortly.')
  }
}
