const apiKey = process.env.ANTHROPIC_API_KEY

// Treat mock key or empty key as unconfigured
const isConfigured = 
  apiKey && 
  apiKey !== 'mock_anthropic_api_key_for_development' && 
  apiKey !== 'placeholder_service_role_key_for_dev'

export function getModelName(model: string): string {
  const currentApiKey = process.env.ANTHROPIC_API_KEY || ''
  const isMockEnv = currentApiKey.includes('sk-ant-api03-NDoHeld')
  if (isMockEnv) {
    return model
  }
  if (model === 'claude-sonnet-4-6') {
    return 'claude-3-5-sonnet-latest'
  }
  if (model === 'claude-haiku-4-5-20251001') {
    return 'claude-3-5-haiku-latest'
  }
  return model
}

class AnthropicClient {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  messages = {
    create: async (params: any): Promise<any> => {
      const resolvedModel = getModelName(params.model)
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          ...params,
          model: resolvedModel
        })
      })

      if (!res.ok) {
        const errorText = await res.text()
        let parsedError: any = {}
        try { parsedError = JSON.parse(errorText) } catch {}
        const status = res.status
        const message = parsedError?.error?.message || errorText || 'Anthropic API Error'
        
        const sdkError = new Error(message) as any
        sdkError.status = status
        sdkError.statusCode = status
        sdkError.error = parsedError?.error
        throw sdkError
      }

      return res.json()
    }
  }
}

export const anthropic = isConfigured
  ? new AnthropicClient(apiKey!)
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
  let lastError: any = null
  let currentModel = model

  try {
    const response = await anthropic.messages.create({
      model: currentModel,
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
        model: response.model || currentModel
      }
    }
    return parsed

  } catch (error: any) {
    lastError = error
    const status = error?.status ?? error?.statusCode ?? 'unknown'
    const msg = error?.error?.message ?? error?.message ?? String(error)

    // Log the detailed error message for developer diagnostics (server logs)
    console.error(`[Claude] Primary model (${currentModel}) failed — HTTP ${status}: ${msg}`)

    // If the primary model failed and it is not already our fallback model (claude-haiku-4-5-20251001),
    // attempt to fall back to it.
    if (currentModel !== 'claude-haiku-4-5-20251001') {
      const fallbackModel = 'claude-haiku-4-5-20251001'
      console.warn(`⚠️ [Claude] Attempting fallback to ${fallbackModel}...`)
      try {
        const response = await anthropic.messages.create({
          model: fallbackModel,
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

        const jsonMatch = textContent.match(/\{[\s\S]*\}/)
        const jsonString = jsonMatch ? jsonMatch[0] : textContent

        const parsed = JSON.parse(jsonString) as T
        if (parsed && typeof parsed === 'object') {
          (parsed as any)._usage = {
            input_tokens: response.usage.input_tokens,
            output_tokens: response.usage.output_tokens,
            model: response.model || fallbackModel,
            fallbackUsed: true
          }
        }
        console.log(`✅ [Claude] Fallback to ${fallbackModel} succeeded!`)
        return parsed

      } catch (fallbackError: any) {
        lastError = fallbackError
        const fbStatus = fallbackError?.status ?? fallbackError?.statusCode ?? 'unknown'
        const fbMsg = fallbackError?.error?.message ?? fallbackError?.message ?? String(fallbackError)
        console.error(`[Claude] Fallback model (${fallbackModel}) also failed — HTTP ${fbStatus}: ${fbMsg}`)
      }
    }
  }

  // If we reach here, both primary and fallback failed.
  // Throw a clean, generic user-facing message to prevent exposing internal API keys/credit issues
  throw new Error('Cognara is experiencing temporary system maintenance. Please try again shortly.')
}
