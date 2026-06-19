import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { logApiUsage } from '@/lib/ai/logUsage'

import { checkRateLimit } from '@/lib/rateLimit'

const apiKey = process.env.ANTHROPIC_API_KEY

// Guard for unconfigured keys in dev mode
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

    // Check user's subscription tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_status, subscription_end_date')
      .eq('id', user.id)
      .maybeSingle()

    const tier = profile?.subscription_tier || 'free'
    const statusVal = profile?.subscription_status || 'inactive'
    const endDate = profile?.subscription_end_date || null
    const isPro = (tier === 'pro_monthly' || tier === 'pro_yearly') && 
      (statusVal === 'active' || statusVal === 'trialing' || statusVal === 'trailing') && 
      (!endDate || new Date(endDate) > new Date())

    // Rate Limit Check
    const limit = await checkRateLimit({
      featureKey: 'confused_button',
      dailyLimit: isPro ? 15 : 0,
      userId: user.id
    })

    if (!limit.allowed) {
      return NextResponse.json({
        error: 'Daily limit reached',
        message: 'You have used all your explanations for today. Come back tomorrow.'
      }, { status: 429 })
    }

    const { sectionHeading, sectionBody, subject, depthLevel } = await req.json()

    const mockExpl = `Think of "${sectionHeading}" like learning a simple daily habit. Instead of over-complicating it, focus on the first small action. By keeping it basic and taking it one step at a time, you build momentum. Don't worry—it takes time, but you are making great progress! Got this!`

    if (!anthropic) {
      console.warn('⚠️ ANTHROPIC_API_KEY is not set or is set to dev mock. Returning mock simplified explanation.')
      await logApiUsage(
        user.id,
        'simplify',
        'claude-haiku-4-5-20251001',
        Math.floor(Math.random() * 50) + 80,
        Math.floor(Math.random() * 80) + 120
      )
      return NextResponse.json({ explanation: mockExpl })
    }

    let text = ''
    try {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: `You are Cognara's friendly teacher. A student is confused
about a specific part of their lesson. Give them a much simpler,
clearer re-explanation using a fresh analogy or example.
Keep it under 100 words. Be warm and encouraging.
Do not repeat the same explanation — approach it from a
completely different angle. No markdown. Plain text only.`,
        messages: [{
          role: 'user',
          content: `Subject: ${subject}
Section: ${sectionHeading}
Original content: ${sectionBody}
Student depth level: ${depthLevel}

Give a simpler re-explanation from a fresh angle.`
        }]
      })
      
      // Log usage
      await logApiUsage(
        user.id,
        'simplify',
        'claude-haiku-4-5-20251001',
        response.usage.input_tokens,
        response.usage.output_tokens
      )

      text = response.content[0].type === 'text' ? response.content[0].text : ''
    } catch (apiErr) {
      console.warn('❌ API request failed, falling back to mock explanation:', apiErr)
      text = mockExpl
    }

    return NextResponse.json({ 
      explanation: text,
      remaining: limit.remaining,
      count: limit.count
    })

  } catch (err) {
    console.error('[API Simplify Section Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
