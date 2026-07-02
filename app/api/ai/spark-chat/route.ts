import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/ai/client'

const SPARK_SYSTEM_PROMPT = `You are Spark, the AI learning companion inside Cognara — an AI achievement platform that helps people reach real goals through structured, personalised learning.

Your personality (follow this strictly):
- Patient: Never make the user feel stupid. There are no dumb questions.
- Encouraging: Notice progress and mention it specifically, not generically.
- Honest: Don't pretend the user is doing well when they are not. Be kind but truthful.
- Adaptive: Explain the same concept different ways if the first didn't land.
- Invested: Speak as if you genuinely care about this person reaching their goal.
- Energetic: Learning should feel alive. Bring real enthusiasm.

You must NEVER:
- Sound robotic or corporate
- Give generic praise ("Great job!" "Awesome!")
- Pretend you're a neutral AI assistant — you are Spark, a companion
- Answer questions completely outside the scope of the current lesson without gently redirecting
- Write long walls of text — keep responses concise, warm, and scannable

Format: Write in plain conversational prose. No markdown headers. You can use a numbered list or bullet if it helps clarity — but prioritise feeling like a real conversation.

Length: Aim for 2–4 short paragraphs max. If the answer is simple, keep it to 1–2 sentences.`

// Get today's date string in WAT (UTC+1 = Nigeria time)
function getTodayWAT(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { lessonId, lessonTitle, lessonContent, message, history, subject } = body

    if (!message || !lessonTitle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch profile for domain metadata AND subscription tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, experience_level, occupation, subscription_tier')
      .eq('id', user.id)
      .maybeSingle()

    const isPro = profile?.subscription_tier !== 'free'
    const dailyLimit = isPro ? 50 : 5
    const today = getTodayWAT()

    // ── STEP 3: Check daily usage limit ──────────────────────────────────────
    const { data: usageRow } = await supabase
      .from('cognara_spark_usage')
      .select('message_count')
      .eq('user_id', user.id)
      .eq('usage_date', today)
      .maybeSingle()

    const currentCount = usageRow?.message_count || 0

    if (currentCount >= dailyLimit) {
      if (!isPro) {
        return NextResponse.json({
          type: 'limit_reached',
          response: `You have used all ${dailyLimit} of your free Spark messages for today.\n\nYour limit resets at midnight tonight.\n\nUpgrade to Pro for 50 Spark messages per day.`,
          limitReached: true,
          showUpgradeButton: true,
          currentCount,
          dailyLimit,
          remaining: 0,
          isPro,
        })
      } else {
        return NextResponse.json({
          type: 'limit_reached',
          response: `You have had ${dailyLimit} Spark conversations today — that is a serious learning session.\n\nYour limit resets at midnight tonight. Come back tomorrow and keep going.`,
          limitReached: true,
          showUpgradeButton: false,
          currentCount,
          dailyLimit,
          remaining: 0,
          isPro,
        })
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const userLevel = profile?.experience_level || 'beginner'
    const userBackground = profile?.occupation || 'learner'
    const userName = profile?.name?.split(' ')[0] || 'there'

    // Domain metadata block (Document 5 standard)
    const domainMeta = `
[DOMAIN METADATA]
subject: ${subject || 'General'}
current_lesson: ${lessonTitle}
user_level: ${userLevel}
user_background: ${userBackground}
user_first_name: ${userName}
[END DOMAIN METADATA]
`

    // Lesson content context (truncated to avoid token bloat)
    const lessonContext = lessonContent
      ? `\n[CURRENT LESSON CONTENT — use this as your primary reference]\n${lessonContent.slice(0, 3000)}\n[END LESSON CONTENT]\n`
      : ''

    // Build conversation history for Claude
    const claudeMessages: { role: 'user' | 'assistant'; content: string }[] = []

    if (Array.isArray(history)) {
      for (const msg of history) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          claudeMessages.push({ role: msg.role, content: msg.content })
        }
      }
    }

    // Add the new user message
    claudeMessages.push({ role: 'user', content: message })

    if (!anthropic) {
      // Dev mode fallback — still increment usage
      await supabase.rpc('increment_spark_count', {
        user_id_input: user.id,
        date_input: today,
      })
      const mockResponses = [
        `That's a great question about ${lessonTitle}. The key thing to understand here is that concepts build on each other — once this clicks, the rest of the module will feel much more natural.`,
        `Think of it this way — imagine you're explaining this to a friend over coffee. The core idea is simpler than it looks at first glance.`,
        `You're asking exactly the right thing. This is one of those concepts that trips people up at first but becomes obvious once it settles in. Let me break it down differently.`,
      ]
      const response = mockResponses[Math.floor(Math.random() * mockResponses.length)]
      const newCount = currentCount + 1
      const remaining = dailyLimit - newCount
      return NextResponse.json({
        response,
        currentCount: newCount,
        dailyLimit,
        remaining,
        isPro,
        warning: newCount >= dailyLimit
          ? (isPro
            ? 'You have used your last Spark message for today. Limit resets at midnight.'
            : 'That was your last free Spark message today. Limit resets at midnight. Upgrade to Pro for 50 messages per day.')
          : (remaining === 1 && !isPro
            ? 'You have 1 free Spark message remaining today.'
            : null),
      })
    }

    const systemWithContext = SPARK_SYSTEM_PROMPT + '\n' + domainMeta + lessonContext

    const claudeResponse = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      temperature: 0.7,
      system: systemWithContext,
      messages: claudeMessages,
    })

    const responseText =
      claudeResponse.content[0].type === 'text'
        ? claudeResponse.content[0].text.trim()
        : "I'm thinking through that — let me try a different approach."

    // ── STEP 4: Increment usage after successful Claude response ──────────────
    await supabase.rpc('increment_spark_count', {
      user_id_input: user.id,
      date_input: today,
    })

    const newCount = currentCount + 1
    const remaining = dailyLimit - newCount

    // Build optional warning for last or near-last message
    let warning: string | null = null
    if (newCount >= dailyLimit) {
      warning = isPro
        ? 'You have used your last Spark message for today. Limit resets at midnight.'
        : 'That was your last free Spark message today. Limit resets at midnight. Upgrade to Pro for 50 messages per day.'
    } else if (remaining === 1 && !isPro) {
      warning = 'You have 1 free Spark message remaining today.'
    }
    // ─────────────────────────────────────────────────────────────────────────

    return NextResponse.json({
      response: responseText,
      currentCount: newCount,
      dailyLimit,
      remaining,
      isPro,
      warning,
    })
  } catch (err: any) {
    console.error('[spark-chat] Error:', err)
    return NextResponse.json(
      { error: 'Spark is temporarily unavailable. Please try again in a moment.' },
      { status: 500 }
    )
  }
}

