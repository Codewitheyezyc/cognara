import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { logApiUsage } from '@/lib/ai/logUsage'

const apiKey = process.env.ANTHROPIC_API_KEY
const isConfigured = 
  apiKey && 
  apiKey !== 'mock_anthropic_api_key_for_development' && 
  apiKey !== 'placeholder_service_role_key_for_dev'

const anthropic = isConfigured
  ? new Anthropic({ apiKey })
  : null

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { submission, instructions, criteria, lessonTitle, subject } = await req.json()

    // 1. If Anthropic is not configured, return a mock response for development
    if (!anthropic) {
      console.warn('⚠️ ANTHROPIC_API_KEY is not configured. Returning mock writing review feedback.')
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const mockFeedback = {
        score: 85,
        strengths: [
          "Demonstrated clear understanding of the core concept: " + instructions.slice(0, 30) + "...",
          "Structure aligns well with the target subject: " + subject,
          "Reflects professional tone appropriate for a lesson on " + lessonTitle
        ],
        improvements: [
          "Could refine the opening line to hook the reader faster",
          "Ensure all criteria are addressed with equal depth: " + (criteria.join(', ') || 'relevance')
        ],
        suggestion: "Rewrite the opening sentence to use active voice and highlight the primary value proposition directly.",
        encouragement: "This is a solid attempt! With a few adjustments, it will be copy-ready."
      }
      await logApiUsage(
        user.id,
        'insight',
        'claude-haiku-4-5-20251001',
        Math.floor(Math.random() * 100) + 150,
        Math.floor(Math.random() * 150) + 200
      )
      return NextResponse.json({ feedback: mockFeedback })
    }

    // 2. Call Anthropic API
    const systemPrompt = `You are Cognara's exercise reviewer. 
Evaluate the student's writing submission honestly and constructively.
Return ONLY valid JSON. No markdown. No preamble.

{
  "score": number between 0 and 100,
  "strengths": ["string", "string"],
  "improvements": ["string", "string"],
  "suggestion": "one specific actionable improvement in one sentence",
  "encouragement": "one short motivating sentence based on their score"
}

Be honest. Do not give high scores for poor work.
Be constructive. Every piece of feedback must help them improve.
Be specific. Reference their actual writing, not generic advice.`

    const userMessage = `
Lesson: ${lessonTitle}
Subject: ${subject}
Exercise task: ${instructions}
Evaluation criteria: ${criteria.join(', ')}

Student submission:
"${submission}"
`.trim()

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    })

    // Log usage
    await logApiUsage(
      user.id,
      'insight',
      'claude-haiku-4-5-20251001',
      response.usage.input_tokens,
      response.usage.output_tokens
    )

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const clean = text.replace(/```json|```/g, '').trim()
    const feedback = JSON.parse(clean)

    return NextResponse.json({ feedback })
  } catch (err) {
    console.error('[Review Exercise Error]', err)
    return NextResponse.json({ error: 'Review failed' }, { status: 500 })
  }
}
