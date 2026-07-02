import Anthropic from '@anthropic-ai/sdk'
import { anthropic } from './client'

// ── Domain Practical Types Config (Step 2) ────────────────────────────────────

export interface PracticalExercise {
  title: string
  instruction: string
  tool_required: string
  estimated_time: string
  example_output: string
  tips: [string, string]
  domain_type: string
}

interface DomainPracticalConfig {
  type: string
  instruction: string
}

const practicalTypes: Record<string, DomainPracticalConfig> = {
  Technology: {
    type: 'Build exercise',
    instruction: `Generate a small hands-on coding exercise that directly applies the lesson concept.
The user completes it in their own code editor in 10 to 20 minutes.
Include: what to build, what tools to use, what the output should look like.
Never require submission — this is self-practice.`,
  },

  Business: {
    type: 'Application exercise',
    instruction: `Generate a practical business exercise applying the lesson concept to a real or hypothetical business scenario.
The user writes or plans their answer.
Make it actionable and relevant to someone building or running a business.`,
  },

  Marketing: {
    type: 'Creation exercise',
    instruction: `Generate a practical marketing exercise where the user creates something real — a post, a caption, a content calendar entry, or an ad concept.
Specify the platform and format clearly.
Give a brief like a real client would.`,
  },

  Design: {
    type: 'Design exercise',
    instruction: `Generate a practical design exercise the user can complete in Canva, Figma, or on paper.
Give a specific design brief with: purpose, audience, and one constraint that directly applies the lesson concept.`,
  },

  Medicine: {
    type: 'Case study exercise',
    instruction: `Generate a scenario-based exercise applying the medical concept from this lesson.
Always include a disclaimer: "This is for learning purposes only. Always consult a qualified professional for real medical decisions."`,
  },

  Language: {
    type: 'Practice exercise',
    instruction: `Generate a language practice exercise using the grammar rule, vocabulary, or expression from this lesson.
Make it feel like real communication — not a textbook drill.`,
  },

  Finance: {
    type: 'Calculation exercise',
    instruction: `Generate a practical financial exercise where the user applies the concept from this lesson to a real or hypothetical financial scenario.
Include numbers the user can work with. Give context as if they are advising a small business or personal finance client.
Always include: "This is for learning purposes only. Consult a qualified financial advisor for personal decisions."`,
  },

  Academic: {
    type: 'Problem-solving exercise',
    instruction: `Generate a practical academic exercise that applies the concept from this lesson.
Use a real-world scenario that makes the concept feel meaningful — not a dry textbook problem.
Include clear steps and indicate what a correct answer looks like.`,
  },
}

const defaultPracticalConfig: DomainPracticalConfig = {
  type: 'Application exercise',
  instruction: `Generate a practical exercise that directly applies the main concept from this lesson to a real world situation.
Completable without special tools in 15 minutes.
Clearly connected to the lesson content.`,
}

// ── Practical Exercise Generator (Step 3) ─────────────────────────────────────

interface PracticalGenerationMetadata {
  topic: string
  domain: string
  subject: string
  userLevel: string | number
  userBackground?: string
  keyTakeaways?: string[]
}

const PRACTICAL_SYSTEM_PROMPT = `You are generating concise, actionable practical exercises for the Cognara learning platform.
You always return valid JSON only — no markdown, no preamble, no explanation outside the JSON object.
Exercises must be immediately actionable, domain-appropriate, and directly tied to the lesson content.`

/**
 * Generates a practical exercise for a lesson using Claude Haiku.
 * Returns null gracefully on failure so lesson generation is never blocked.
 */
export async function generatePracticalExercise(
  metadata: PracticalGenerationMetadata
): Promise<PracticalExercise | null> {
  const domainConfig = practicalTypes[metadata.domain] || defaultPracticalConfig

  const keyTakeawaysText = metadata.keyTakeaways && metadata.keyTakeaways.length > 0
    ? metadata.keyTakeaways.slice(0, 5).join('\n- ')
    : 'Core concepts from this lesson'

  const userPrompt = `LESSON TOPIC: ${metadata.topic}
DOMAIN: ${metadata.domain}
SUBJECT: ${metadata.subject}
USER LEVEL: ${metadata.userLevel}
USER BACKGROUND: ${metadata.userBackground || 'Learner'}

KEY CONCEPTS COVERED IN THIS LESSON:
- ${keyTakeawaysText}

EXERCISE TYPE: ${domainConfig.type}

GENERATION INSTRUCTIONS:
${domainConfig.instruction}

REQUIREMENTS:
- Directly applies what was taught in THIS specific lesson
- Completable in 10 to 20 minutes
- Does NOT require submitting anything to Cognara
- Feels like real practice — not another quiz
- Appropriate for ${metadata.userLevel} level
- Include the tool or method the user should use
- Include what a good result looks like for self-assessment
- Include exactly 2 practical tips

Return ONLY valid JSON in this exact format with no preamble and no markdown backticks:
{
  "title": "Short exercise title",
  "instruction": "Clear step by step instruction",
  "tool_required": "Tool name or None",
  "estimated_time": "X minutes",
  "example_output": "What a good result looks like",
  "tips": ["Tip 1", "Tip 2"],
  "domain_type": "${(metadata.domain || 'general').toLowerCase()}"
}`

  // Dev mode — no API key
  if (!anthropic) {
    console.warn('[PracticalGenerator] No Anthropic API key — returning mock practical exercise.')
    return {
      title: `Apply: ${metadata.topic}`,
      instruction: `Take what you learned about ${metadata.topic} and apply it to a real situation in your own life or work. Spend 15 minutes working through it step by step.`,
      tool_required: 'None',
      estimated_time: '15 minutes',
      example_output: `A clear written plan or output that directly demonstrates your understanding of ${metadata.topic}.`,
      tips: [
        'Focus on applying the main concept — not perfecting every detail.',
        'Write down your reasoning as you go — it reinforces the lesson.',
      ],
      domain_type: (metadata.domain || 'general').toLowerCase(),
    }
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      temperature: 0.4,
      system: PRACTICAL_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const textContent =
      response.content[0].type === 'text' ? response.content[0].text.trim() : ''

    // Strip any markdown fences Claude might add
    const clean = textContent.replace(/```json/g, '').replace(/```/g, '').trim()

    const jsonMatch = clean.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[PracticalGenerator] No JSON object found in Claude response.')
      return null
    }

    const parsed = JSON.parse(jsonMatch[0]) as PracticalExercise

    // Basic validation
    if (!parsed.title || !parsed.instruction || !Array.isArray(parsed.tips)) {
      console.error('[PracticalGenerator] Parsed JSON is missing required fields.')
      return null
    }

    console.log(`[PracticalGenerator] Generated practical for "${metadata.topic}" (${metadata.domain})`)
    return parsed
  } catch (err: any) {
    // Never throw — lesson generation must not be blocked by a practical failure
    console.error('[PracticalGenerator] Failed to generate practical exercise:', err?.message || err)
    return null
  }
}
