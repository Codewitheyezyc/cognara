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
 * Helper to call Anthropic Claude and return structured JSON
 */
export async function callClaudeJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  mockFallback: () => Promise<T>
): Promise<T> {
  // If API key is not configured, fall back to mock data
  if (!anthropic) {
    console.warn('⚠️ ANTHROPIC_API_KEY is not set or is set to dev mock. Falling back to simulated response.')
    return mockFallback()
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      temperature: 0.2, // Low temperature for high structure compliance
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
  } catch (error) {
    console.error('❌ Anthropic API request failed:', error)
    // Fall back to mock response in case of API outages or rate limits
    return mockFallback()
  }
}
