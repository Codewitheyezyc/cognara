import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createBaseClient } from '@supabase/supabase-js'

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
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { goalText } = await req.json()

    if (!goalText || goalText.trim().length < 3) {
      return NextResponse.json({
        approved: false,
        subject: '',
        category: 'rejected',
        reason: 'Please describe your learning goal in more detail.',
        ageAppropriate: false
      })
    }

    // Initialize Supabase Admin client with service role to bypass RLS for logging
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const adminSupabase = createBaseClient(supabaseUrl, supabaseServiceKey)

    // LOCAL MOCK MODE FALLBACK (For local development/mock keys)
    if (!anthropic) {
      console.warn('⚠️ ANTHROPIC_API_KEY not configured. Running local mock validator.')
      const lower = goalText.toLowerCase()
      const shouldReject = 
        lower.includes('bomb') || 
        lower.includes('hack') || 
        lower.includes('scam') || 
        lower.includes('drug') || 
        lower.includes('kill') || 
        lower.includes('murder') || 
        lower.includes('porn') || 
        lower.includes('nude') ||
        lower.includes('steal')

      if (shouldReject) {
        const result = {
          approved: false,
          subject: '',
          category: 'rejected',
          reason: 'This goal is not available on Cognara. Please enter an educational or skill-building goal.',
          ageAppropriate: false
        }

        // Log rejected goal for admin review
        await adminSupabase.from('content_safety_log').insert({
          user_id: user.id,
          goal_text: goalText,
          rejection_reason: result.reason,
          created_at: new Date().toISOString()
        })

        return NextResponse.json(result)
      } else {
        // Simple subject extraction from text
        const subjectName = goalText.replace(/I want to learn |Teach me |Learn /gi, '').trim()
        return NextResponse.json({
          approved: true,
          subject: subjectName,
          category: 'professional',
          reason: '',
          ageAppropriate: true
        })
      }
    }

    // REAL CLAUDE VALIDATION
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: `You are a content safety validator for Cognara, an educational
learning platform used by primary school children, secondary school students,
university students, and adult learners.

Your job is to determine if a submitted learning goal is appropriate for
an educational platform.

APPROVE goals that are:
- Academic subjects (mathematics, English, biology, physics, chemistry,
  history, geography, economics, languages, etc.)
- Professional skills (web development, design, marketing, writing,
  finance, business, etc.)
- Vocational skills (tailoring, cooking, carpentry, hairdressing, etc.)
- Personal development (time management, communication, leadership, etc.)
- Creative skills (music, art, photography, writing, film, etc.)
- Health and wellness education (theory and knowledge — not medical advice)
- Sports and fitness theory

REJECT goals that involve:
- Weapons, violence, or harming people
- Illegal activities of any kind
- Sexual or adult content
- Hacking, fraud, scamming, or deception
- Hate speech or discrimination
- Drug manufacturing or illegal substances
- Anything inappropriate for a child to learn

Return ONLY valid JSON. No markdown. No explanation outside JSON.
{
  "approved": true or false,
  "subject": "detected subject name if approved, empty string if rejected",
  "category": "academic | professional | vocational | personal | creative | rejected",
  "reason": "if rejected, a friendly explanation of why. if approved, empty string",
  "ageAppropriate": true or false
}`,
      messages: [{
        role: 'user',
        content: `Learning goal submitted by user: "${goalText}"`
      }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const result = JSON.parse(text.replace(/```json|```/g, '').trim())

    // Log rejected goals for admin review
    if (!result.approved) {
      await adminSupabase.from('content_safety_log').insert({
        user_id: user.id,
        goal_text: goalText,
        rejection_reason: result.reason,
        created_at: new Date().toISOString()
      })
    }

    return NextResponse.json(result)

  } catch (err: any) {
    console.error('[Goal Validation Error]', err)
    // On error, default to approved so we do not block users due to transient issues
    // The roadmap generation system prompt will catch anything inappropriate as a fallback
    return NextResponse.json({ 
      approved: true, 
      subject: '', 
      category: 'professional', 
      reason: '', 
      ageAppropriate: true 
    })
  }
}
