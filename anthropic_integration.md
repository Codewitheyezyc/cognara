# Anthropic Claude API Integration Guide

This guide details how to integrate the official Anthropic Claude API into **Cognara** to replace the simulated mock data generators with real-time AI responses.

---

## 1. Choosing the Right Model

Anthropic offers several models suited for different balances of capability, latency, and cost. For a complex learning engine like Cognara that relies heavily on structured output (roadmaps, quizzes, and formatted lessons), **Claude Sonnet 4.6** is the highly recommended choice.

| Model Name | SDK Identifier | Speed / Latency | Strength & Suitability | Cost (per 1M input / output tokens) |
| :--- | :--- | :--- | :--- | :--- |
| **Claude Sonnet 4.6** | `claude-sonnet-4-6` | **Fast** (~20-50 tokens/sec) | **Best Overall**. Unparalleled reasoning, JSON structure formatting, visual content formatting, coding, and pedagogy. | $3.00 / $15.00 |
| **Claude 3.5 Haiku** | `claude-3-5-haiku-latest` | **Blazing Fast** (~70-100 tokens/sec) | **Extreme Speed**. Best for fast quiz evaluations or quick textual translations. Lower reasoning than Sonnet. | $0.80 / $4.00 |

### Recommendation
Use `claude-sonnet-4-6` for **roadmaps, lessons, and coach insights** to ensure maximum educational depth, high-quality code comparisons, and rich analogies.

---

## 2. Installation & Setup

### Step 1: Install the Official SDK
Install the official Anthropic SDK package:
```bash
npm install @anthropic-ai/sdk
```

### Step 2: Configure Environment Variables
Create or update your `.env.local` file in the root of the project:
```env
# Local Development Environment Variables
ANTHROPIC_API_KEY=your_actual_anthropic_api_key_here
```
> [!WARNING]
> Never commit `.env.local` to git. It is automatically ignored in your `.gitignore` to keep credentials secure.

---

## 3. Creating the Anthropic Utility Wrapper

We recommend creating an API client helper `lib/ai/client.ts` that checks if `ANTHROPIC_API_KEY` is present. If it is missing (such as during local environment setup), it can gracefully **fall back to the local simulated mocks** so that the application never breaks.

Create a new file `lib/ai/client.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk'

// Initialize the Anthropic client if the key is available
const apiKey = process.env.ANTHROPIC_API_KEY

export const anthropic = apiKey 
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
    console.warn('⚠️ ANTHROPIC_API_KEY is not set. Falling back to simulated response.')
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
```

---

## 4. Hooking It Up to an API Route

Here is how you would use the new `callClaudeJSON` utility inside the lesson generation API route (`app/api/ai/generate-lesson/route.ts`):

```typescript
import { callClaudeJSON } from '@/lib/ai/client'
import { LESSON_SYSTEM_PROMPT } from '@/lib/ai/prompts'
import { generateLesson as mockGenerateLesson } from '@/lib/ai/lesson'
import { GeneratedLesson } from '@/types/ai'

// Inside your POST /api/ai/generate-lesson handler:
const generatedLesson = await callClaudeJSON<GeneratedLesson>(
  LESSON_SYSTEM_PROMPT,
  `Generate a lesson with the following parameters:
   - Topic: ${lesson.title}
   - Phase: ${phase.title}
   - Subject: ${goal.subject}
   - Target Skill Level: ${goal.level}
   - Explanation Complexity Depth: Level ${depthLevel}`,
  // Fallback function when key is missing or request fails
  () => mockGenerateLesson(
    lesson.title, 
    phase.title, 
    goal.subject, 
    goal.level, 
    Number(depthLevel)
  )
)
```

---

## 5. Live Production Deployment Checklist

When deploying to Vercel or Supabase for live users:
1. **Add Env Variable**: Log in to your hosting provider dashboard (e.g., Vercel) and add `ANTHROPIC_API_KEY` under Environment Variables.
2. **Increase Timeout Limits**: Serverless functions have execution limits (Vercel hobby plan limits functions to 10 seconds). Generating complex lessons can take 8-15 seconds. If you run into timeouts, configure route exports to use the Edge runtime or upgrade the timeout settings:
   ```typescript
   export const maxDuration = 60 // Allow up to 60 seconds (requires Pro plan)
   ```
