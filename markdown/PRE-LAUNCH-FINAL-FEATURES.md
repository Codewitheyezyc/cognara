# COGNARA — Pre-Launch Final Features
## Audit existing features + implement missing ones

---

```
We are preparing for launch. This prompt does four things:
1. Audit and fix Learning Portfolio if not working correctly
2. Audit and fix Next Goal Prompt if not working correctly
3. Build Daily Email Nudge from scratch
4. Build Contact Form on marketing page

Apply each part in order. Confirm each before moving to the next.

---

# ════════════════════════════════════════════
# PART 1 — AUDIT: LEARNING PORTFOLIO
# ════════════════════════════════════════════

Check if the Learning Portfolio exists at /dashboard/portfolio.

Run this audit:

AUDIT CHECKLIST:
□ Does /dashboard/portfolio route exist?
□ Does it show all completed roadmaps for the user?
□ Does it show total lessons completed count?
□ Does it show average quiz score across all lessons?
□ Does it show current streak and record streak?
□ Does it show earned badges?
□ Does it have a Share button?
□ Is it linked from the dashboard sidebar?
□ Does it work correctly with real data from Supabase?

IF ALL ITEMS EXIST AND WORK:
Report "Learning Portfolio is live and working" and skip to Part 2.

IF ANY ITEMS ARE MISSING OR BROKEN:
Build or fix the portfolio page completely using this spec:

---

PORTFOLIO PAGE SPEC (/dashboard/portfolio):

HEADER SECTION:
```tsx
// User's name, avatar, join date
// "Isaac's Learning Portfolio"
// "Member since June 2026"
```

STATS ROW (4 cards):
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Skills      │ │ Lessons     │ │ Avg Score   │ │ Record      │
│ Learned     │ │ Completed   │ │             │ │ Streak      │
│     3       │ │    127      │ │    84%      │ │  🏆 47 days │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

Fetch data with these Supabase queries:

```ts
// Skills learned = completed roadmaps
const { count: skillsCount } = await supabase
  .from('roadmaps')
  .select('*', { count: 'exact' })
  .eq('user_id', userId)

// Lessons completed
const { count: lessonsCount } = await supabase
  .from('lesson_progress')
  .select('*', { count: 'exact' })
  .eq('user_id', userId)
  .eq('status', 'completed')

// Average quiz score
const { data: attempts } = await supabase
  .from('quiz_attempts')
  .select('score')
  .eq('user_id', userId)

const avgScore = attempts && attempts.length > 0
  ? Math.round(attempts.reduce((a, b) => a + b.score, 0) / attempts.length)
  : 0

// Record streak
const { data: streak } = await supabase
  .from('streaks')
  .select('longest_streak, current_streak')
  .eq('user_id', userId)
  .single()
```

LEARNING PATHS SECTION:
Show each roadmap as a card:

```
┌─────────────────────────────────────────────────┐
│  🎯 Web Development                             │
│  Started: June 1 2026                           │
│                                                 │
│  Progress: ████████████░░░░ 72%                 │
│  18 of 25 lessons · Avg score: 84%              │
│                                                 │
│  Phases:                                        │
│  ✅ Phase 1 — HTML Foundations                  │
│  ✅ Phase 2 — CSS Mastery                       │
│  🔄 Phase 3 — JavaScript (in progress)          │
│  🔒 Phase 4 — React                             │
│                                                 │
│  [🎓 Download Phase 2 Certificate]              │
└─────────────────────────────────────────────────┘
```

BADGES SECTION:
Show all earned badges in a grid:
```
🌱 First Steps    ⭐ Perfect Score    🔥 Week Warrior
[locked]          [locked]            [locked]
```

SHARE SECTION:
```tsx
<div style={{
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '14px',
  padding: '24px',
  textAlign: 'center',
  marginTop: '32px'
}}>
  <h3 style={{
    color: 'var(--color-text-1)',
    fontFamily: 'Sora, sans-serif',
    marginBottom: '8px'
  }}>
    Share your learning journey
  </h3>
  <p style={{
    color: 'var(--color-text-2)',
    fontSize: '14px',
    marginBottom: '20px'
  }}>
    Show the world what you are building
  </p>
  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
    <button
      onClick={copyPortfolioLink}
      style={{
        background: 'var(--color-primary)',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 20px',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}
    >
      <Copy size={14} /> Copy Portfolio Link
    </button>
    <button
      onClick={shareOnTwitter}
      style={{
        background: 'transparent',
        color: 'var(--color-text-1)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '10px 20px',
        fontSize: '14px',
        cursor: 'pointer'
      }}
    >
      Share on Twitter
    </button>
  </div>
</div>
```

The portfolio share link generates a URL like:
cognaralearn.com/portfolio/[userId]

Create app/portfolio/[userId]/page.tsx as a PUBLIC page
(no login required) showing a read-only view of the user's
portfolio so they can share it with employers or on social media.

The public portfolio shows:
- Name and avatar (no email)
- Skills being learned
- Completion percentages
- Earned badges
- Certificates earned
- "Join Cognara" CTA button at the bottom

Add Portfolio to dashboard sidebar:
{ icon: <BarChart size={18} />, label: 'Portfolio', href: '/dashboard/portfolio' }

---

# ════════════════════════════════════════════
# PART 2 — AUDIT: NEXT GOAL PROMPT
# ════════════════════════════════════════════

Check if the Next Goal Prompt exists and works.

AUDIT CHECKLIST:
□ When a user completes the final phase of their roadmap
  does a celebration screen appear?
□ Does it show a "What will you master next?" section?
□ Does it suggest 3 related learning goals?
□ Does clicking a suggestion start a new onboarding flow?
□ Is the suggestion generated by Claude based on what was learned?

IF ALL ITEMS EXIST AND WORK:
Report "Next Goal Prompt is live and working" and skip to Part 3.

IF ANY ITEMS ARE MISSING OR BROKEN:
Build it using this spec:

---

NEXT GOAL PROMPT SPEC:

TRIGGER:
When the user completes the last quiz in the last phase
of their roadmap (all lessons done, all quizzes passed)
show the completion screen with next goal suggestions.

AI ROUTE for suggestions:
Create app/api/ai/suggest-next-goals/route.ts:

```ts
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { completedSubject } = await req.json()

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system: `You are Cognara's learning advisor. Suggest 3 skills that
naturally complement what the student just learned. Return ONLY valid JSON.
No markdown. No preamble.
{
  "suggestions": [
    {
      "title": "string - skill name",
      "reason": "string - one sentence why this complements what they learned",
      "emoji": "string - one relevant emoji"
    }
  ]
}`,
    messages: [{
      role: 'user',
      content: `The student just completed: ${completedSubject}
Suggest 3 skills that would naturally build on this knowledge.
Make them specific and exciting, not generic.`
    }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
  return NextResponse.json({ suggestions: parsed.suggestions })
}
```

COMPLETION SCREEN COMPONENT:
Create components/roadmap/RoadmapCompleteScreen.tsx:

```tsx
'use client'
import { useState, useEffect } from 'react'
import { Spark } from '@/components/mascot/Spark'
import { ArrowRight, Plus, Trophy } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface NextGoalSuggestion {
  title: string
  reason: string
  emoji: string
}

interface RoadmapCompleteScreenProps {
  completedSubject: string
  totalLessons: number
  averageScore: number
  onStartNewGoal: (goalTitle: string) => void
}

export function RoadmapCompleteScreen({
  completedSubject,
  totalLessons,
  averageScore,
  onStartNewGoal
}: RoadmapCompleteScreenProps) {
  const router = useRouter()
  const [suggestions, setSuggestions] = useState<NextGoalSuggestion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSuggestions()
  }, [])

  const fetchSuggestions = async () => {
    try {
      const res = await fetch('/api/ai/suggest-next-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completedSubject })
      })
      const data = await res.json()
      setSuggestions(data.suggestions || [])
    } catch (err) {
      console.error('Failed to fetch suggestions', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      maxWidth: '560px',
      margin: '0 auto',
      padding: '40px 20px',
      textAlign: 'center'
    }}>
      {/* Spark celebrating */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <Spark emotion="celebrate" size={100} />
      </div>

      {/* Trophy badge */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(245,158,11,0.1)',
        color: 'var(--color-accent-warm)',
        padding: '6px 16px',
        borderRadius: '999px',
        fontSize: '13px',
        fontWeight: 700,
        marginBottom: '16px'
      }}>
        <Trophy size={14} />
        Roadmap Complete
      </div>

      <h1 style={{
        color: 'var(--color-text-1)',
        fontSize: '28px',
        fontWeight: 700,
        fontFamily: 'Sora, sans-serif',
        margin: '0 0 12px',
        lineHeight: 1.2
      }}>
        You mastered {completedSubject}
      </h1>

      <p style={{
        color: 'var(--color-text-2)',
        fontSize: '15px',
        lineHeight: 1.65,
        margin: '0 0 32px'
      }}>
        {totalLessons} lessons completed · {averageScore}% average score.
        Most people never finish what they start. You did.
      </p>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '40px'
      }}>
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <div style={{
            fontSize: '28px',
            fontWeight: 800,
            color: 'var(--color-primary)',
            fontFamily: 'Sora, sans-serif'
          }}>
            {totalLessons}
          </div>
          <div style={{ color: 'var(--color-text-3)', fontSize: '12px' }}>
            Lessons completed
          </div>
        </div>
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <div style={{
            fontSize: '28px',
            fontWeight: 800,
            color: 'var(--color-success)',
            fontFamily: 'Sora, sans-serif'
          }}>
            {averageScore}%
          </div>
          <div style={{ color: 'var(--color-text-3)', fontSize: '12px' }}>
            Average quiz score
          </div>
        </div>
      </div>

      {/* Next goal section */}
      <div style={{ textAlign: 'left', marginBottom: '32px' }}>
        <h2 style={{
          color: 'var(--color-text-1)',
          fontSize: '18px',
          fontWeight: 700,
          fontFamily: 'Sora, sans-serif',
          marginBottom: '6px'
        }}>
          What will you master next?
        </h2>
        <p style={{
          color: 'var(--color-text-2)',
          fontSize: '14px',
          marginBottom: '16px'
        }}>
          Based on what you just learned, these skills
          would complement your new ability perfectly.
        </p>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{
                height: '72px',
                background: 'var(--color-surface)',
                borderRadius: '12px',
                animation: 'shimmer 1.5s infinite'
              }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => onStartNewGoal(suggestion.title)}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  padding: '16px 18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  textAlign: 'left',
                  transition: 'border-color 0.15s ease'
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    'var(--color-primary)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    'var(--color-border)'
                }}
              >
                <span style={{ fontSize: '24px', flexShrink: 0 }}>
                  {suggestion.emoji}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    color: 'var(--color-text-1)',
                    fontWeight: 600,
                    fontSize: '15px',
                    marginBottom: '3px'
                  }}>
                    {suggestion.title}
                  </div>
                  <div style={{
                    color: 'var(--color-text-3)',
                    fontSize: '13px',
                    lineHeight: 1.4
                  }}>
                    {suggestion.reason}
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  style={{ color: 'var(--color-text-3)', flexShrink: 0 }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Custom goal option */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <button
          onClick={() => router.push('/onboarding')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: '10px',
            padding: '12px',
            color: 'var(--color-text-2)',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          <Plus size={14} />
          Choose a different goal
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-3)',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          Go back to dashboard
        </button>
      </div>
    </div>
  )
}
```

WIRING THE TRIGGER:
In the quiz results flow, after a quiz is submitted
check if this was the last quiz in the last phase:

```ts
// After quiz_attempt is saved
const isLastPhase = await checkIfLastPhase(userId, lessonId)
const isLastLesson = await checkIfLastLesson(userId, phaseId, lessonId)
const allPassed = await checkAllQuizzesPassed(userId, roadmapId)

if (isLastPhase && isLastLesson && allPassed) {
  // Redirect to completion screen
  router.push(`/dashboard/complete?roadmapId=${roadmapId}`)
}
```

Create app/dashboard/complete/page.tsx that renders
the RoadmapCompleteScreen component with real data.

When user clicks a suggested goal:
Navigate to /onboarding with the goal pre-filled:
router.push(`/onboarding?goal=${encodeURIComponent(suggestion.title)}`)

In the onboarding page read the goal query param
and pre-fill the goal input field with it.

---

# ════════════════════════════════════════════
# PART 3 — BUILD: DAILY EMAIL NUDGE
# ════════════════════════════════════════════

This does not exist yet. Build it completely.

WHAT IT DOES:
Every day at the time the user set as their preferred
study time, Cognara sends them a personalised email
showing their next lesson, current streak, and a
direct link to continue learning.

Only sent if:
- User has reminder_enabled = true in profiles
- User has reminder_time set in profiles
- User has NOT already completed a lesson today
- User has an active learning goal

---

INSTALL:
```bash
npm install resend @react-email/components
```

---

EMAIL TEMPLATE:
Create emails/DailyNudgeEmail.tsx:

```tsx
import {
  Html, Head, Body, Container, Section,
  Text, Button, Hr, Preview, Img
} from '@react-email/components'

interface DailyNudgeEmailProps {
  userName: string
  nextLessonTitle: string
  nextLessonId: string
  streakDays: number
  subject: string
  appUrl: string
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function DailyNudgeEmail({
  userName,
  nextLessonTitle,
  nextLessonId,
  streakDays,
  subject,
  appUrl
}: DailyNudgeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {streakDays > 0
          ? `🔥 ${streakDays} day streak — keep it going, ${userName}`
          : `Your next lesson is ready, ${userName}`
        }
      </Preview>
      <Body style={{
        backgroundColor: '#0A0C14',
        fontFamily: 'Inter, -apple-system, sans-serif',
        margin: '0',
        padding: '40px 20px'
      }}>
        <Container style={{
          maxWidth: '520px',
          margin: '0 auto',
          backgroundColor: '#111520',
          borderRadius: '16px',
          border: '1px solid #1E2540',
          overflow: 'hidden'
        }}>

          {/* Header */}
          <Section style={{ padding: '28px 32px 0', textAlign: 'center' }}>
            <Text style={{
              color: '#5B8EFF',
              fontSize: '24px',
              fontWeight: '700',
              margin: '0',
              letterSpacing: '-0.5px'
            }}>
              ⚡ Cognara
            </Text>
          </Section>

          {/* Streak badge */}
          {streakDays > 0 && (
            <Section style={{ padding: '16px 32px 0', textAlign: 'center' }}>
              <Text style={{
                display: 'inline-block',
                backgroundColor: 'rgba(245,158,11,0.12)',
                color: '#F59E0B',
                padding: '6px 16px',
                borderRadius: '999px',
                fontSize: '13px',
                fontWeight: '600',
                margin: '0'
              }}>
                🔥 {streakDays} day streak — do not break it!
              </Text>
            </Section>
          )}

          {/* Main content */}
          <Section style={{ padding: '24px 32px' }}>
            <Text style={{
              color: '#F0F4FF',
              fontSize: '20px',
              fontWeight: '600',
              margin: '0 0 8px',
              lineHeight: '1.3'
            }}>
              {getGreeting()}, {userName} 👋
            </Text>

            <Text style={{
              color: '#8B95B3',
              fontSize: '15px',
              lineHeight: '1.65',
              margin: '0 0 24px'
            }}>
              Your next lesson in{' '}
              <span style={{ color: '#F0F4FF', fontWeight: '600' }}>
                {subject}
              </span>{' '}
              is ready and waiting for you.
            </Text>

            {/* Lesson card */}
            <div style={{
              backgroundColor: '#171C2E',
              border: '1px solid #1E2540',
              borderLeft: '3px solid #5B8EFF',
              borderRadius: '10px',
              padding: '16px 20px',
              marginBottom: '24px'
            }}>
              <Text style={{
                color: '#4A5272',
                fontSize: '10px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                margin: '0 0 6px'
              }}>
                NEXT LESSON
              </Text>
              <Text style={{
                color: '#F0F4FF',
                fontSize: '16px',
                fontWeight: '600',
                margin: '0',
                lineHeight: '1.4'
              }}>
                {nextLessonTitle}
              </Text>
            </div>

            <Button
              href={`${appUrl}/dashboard/lesson/${nextLessonId}`}
              style={{
                backgroundColor: '#5B8EFF',
                color: '#FFFFFF',
                borderRadius: '10px',
                padding: '13px 28px',
                fontSize: '15px',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'block',
                textAlign: 'center'
              }}
            >
              Continue Learning →
            </Button>
          </Section>

          <Hr style={{ borderColor: '#1E2540', margin: '0 32px' }} />

          {/* Footer */}
          <Section style={{ padding: '16px 32px 24px' }}>
            <Text style={{
              color: '#4A5272',
              fontSize: '12px',
              textAlign: 'center',
              margin: '0',
              lineHeight: '1.6'
            }}>
              You are receiving this because you enabled daily reminders.
              <br />
              <a
                href={`${appUrl}/dashboard/settings`}
                style={{ color: '#5B8EFF', textDecoration: 'none' }}
              >
                Update reminder settings
              </a>
              {' · '}
              <a
                href={`${appUrl}/dashboard/settings`}
                style={{ color: '#5B8EFF', textDecoration: 'none' }}
              >
                Unsubscribe
              </a>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}
```

---

SEND FUNCTION:
Create lib/email/sendDailyNudge.ts:

```ts
import { Resend } from 'resend'
import { DailyNudgeEmail } from '@/emails/DailyNudgeEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendDailyNudge(params: {
  to: string
  userName: string
  nextLessonTitle: string
  nextLessonId: string
  streakDays: number
  subject: string
}) {
  try {
    await resend.emails.send({
      from: 'Cognara <hello@cognaralearn.com>',
      to: params.to,
      subject: params.streakDays > 0
        ? `🔥 ${params.streakDays} day streak — keep going, ${params.userName}`
        : `Your next lesson is waiting, ${params.userName}`,
      react: DailyNudgeEmail({
        ...params,
        appUrl: process.env.NEXT_PUBLIC_APP_URL!
      })
    })
    return { success: true }
  } catch (err) {
    console.error('[Daily Nudge] Failed to send to:', params.to, err)
    return { success: false }
  }
}
```

---

CRON JOB:
Create app/api/cron/daily-nudge/route.ts:

```ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { sendDailyNudge } from '@/lib/email/sendDailyNudge'

export async function GET(req: Request) {
  // Security: only Vercel Cron can call this
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()

  // Get current hour in 24h format
  const currentHour = new Date().getHours()
  const hourString = currentHour.toString().padStart(2, '0')

  // Fetch users whose reminder time matches current hour
  const { data: profiles } = await supabase
    .from('profiles')
    .select(`
      id,
      name,
      email,
      reminder_time,
      learning_goals!inner (
        id,
        subject,
        is_active
      ),
      streaks (
        current_streak
      )
    `)
    .eq('reminder_enabled', true)
    .eq('learning_goals.is_active', true)
    .like('reminder_time', `${hourString}:%`)

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No users to notify this hour' })
  }

  let sentCount = 0
  let skippedCount = 0
  const errors: string[] = []

  for (const profile of profiles) {
    try {
      // Check if user already studied today
      const today = new Date().toISOString().split('T')[0]
      const { data: todayProgress } = await supabase
        .from('lesson_progress')
        .select('id')
        .eq('user_id', profile.id)
        .gte('completed_at', `${today}T00:00:00`)
        .limit(1)

      if (todayProgress && todayProgress.length > 0) {
        skippedCount++
        continue // Already studied today — skip
      }

      // Find next incomplete lesson
      const { data: nextLesson } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          lesson_progress!left (status)
        `)
        .eq('roadmap_id', profile.learning_goals[0].id)
        .not('lesson_progress.status', 'eq', 'completed')
        .order('order_index', { ascending: true })
        .limit(1)
        .single()

      if (!nextLesson) {
        skippedCount++
        continue // No next lesson found
      }

      const result = await sendDailyNudge({
        to: profile.email,
        userName: profile.name,
        nextLessonTitle: nextLesson.title,
        nextLessonId: nextLesson.id,
        streakDays: profile.streaks?.[0]?.current_streak || 0,
        subject: profile.learning_goals[0].subject
      })

      if (result.success) sentCount++
      else errors.push(profile.email)

    } catch (err) {
      console.error('[Cron] Error for user:', profile.email, err)
      errors.push(profile.email)
    }
  }

  console.log(`[Daily Nudge Cron] Sent: ${sentCount}, Skipped: ${skippedCount}, Errors: ${errors.length}`)

  return NextResponse.json({
    sent: sentCount,
    skipped: skippedCount,
    errors: errors.length
  })
}
```

---

VERCEL CRON CONFIGURATION:
Create or update vercel.json in project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-nudge",
      "schedule": "0 * * * *"
    }
  ]
}
```

This runs every hour at minute 0.
The route checks which users have their reminder_time
set to the current hour and sends only to them.

---

ENVIRONMENT VARIABLES TO ADD:
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
CRON_SECRET=generate_a_long_random_string_here
```

To generate CRON_SECRET run in terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

---

SETTINGS PAGE — REMINDER TOGGLE:
Verify the settings page has a working reminder section.
If not, add it:

```tsx
{/* Notification Settings Section */}
<div style={{
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '16px'
}}>
  <h3 style={{
    color: 'var(--color-text-1)',
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '20px'
  }}>
    Daily Reminder
  </h3>

  {/* Enable/Disable toggle */}
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px'
  }}>
    <div>
      <div style={{ color: 'var(--color-text-1)', fontSize: '14px', fontWeight: 500 }}>
        Daily study reminder
      </div>
      <div style={{ color: 'var(--color-text-3)', fontSize: '12px', marginTop: '2px' }}>
        We will email you when it is time to study
      </div>
    </div>
    <input
      type="checkbox"
      checked={reminderEnabled}
      onChange={e => setReminderEnabled(e.target.checked)}
    />
  </div>

  {/* Time picker — only shown when enabled */}
  {reminderEnabled && (
    <div>
      <label style={{
        color: 'var(--color-text-2)',
        fontSize: '13px',
        display: 'block',
        marginBottom: '8px'
      }}>
        What time should we remind you?
      </label>
      <input
        type="time"
        value={reminderTime}
        onChange={e => setReminderTime(e.target.value)}
        style={{
          background: 'var(--color-surface-alt)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '8px 12px',
          color: 'var(--color-text-1)',
          fontSize: '14px'
        }}
      />
    </div>
  )}

  <button
    onClick={saveReminderSettings}
    style={{
      marginTop: '16px',
      background: 'var(--color-primary)',
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '8px',
      padding: '9px 18px',
      fontSize: '13px',
      fontWeight: 600,
      cursor: 'pointer'
    }}
  >
    Save reminder settings
  </button>
</div>
```

Save to Supabase:
```ts
await supabase
  .from('profiles')
  .update({
    reminder_enabled: reminderEnabled,
    reminder_time: reminderTime  // format: "08:00"
  })
  .eq('id', userId)
```

---

TESTING THE CRON:
To test without waiting for the hourly cron:

1. Set your reminder_time in Supabase to the current hour
   Example: if it is 14:23 set reminder_time to "14:00"
2. Make sure you have NOT completed a lesson today
3. Call the cron endpoint manually:
   curl -H "Authorization: Bearer YOUR_CRON_SECRET"
   https://your-app.vercel.app/api/cron/daily-nudge
4. Check your email inbox within 30 seconds
5. Verify the email shows correct lesson title and streak

---

# ════════════════════════════════════════════
# PART 4 — BUILD: CONTACT FORM ON MARKETING PAGE
# ════════════════════════════════════════════

Add a contact section to the marketing page so visitors
can reach out before they even sign up.

PLACEMENT:
Add between the FAQ section and the footer.

CONTACT SECTION SPEC:

```tsx
// Section layout — two columns on desktop, one on mobile

LEFT COLUMN — Contact info:
  Heading: "Get in touch"
  Subheading: "Have a question before signing up?
               We usually respond within 24 hours."

  Contact details:
  📧 hello@cognaralearn.com
  🌍 cognaralearn.com
  📍 Nigeria

  Social links row:
  [Twitter] [LinkedIn] [Instagram]

RIGHT COLUMN — Contact form:
  Fields:
  - Full name (required)
  - Email address (required)
  - Subject dropdown:
      "I have a question about Cognara"
      "I want to report a bug"
      "I am interested in a team plan"
      "I want to partner with Cognara"
      "Other"
  - Message (textarea, required, min 20 characters)
  - [Send Message] button
```

FORM SUBMISSION ROUTE:
Create app/api/contact/route.ts:

```ts
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { name, email, subject, message } = await req.json()

  // Basic validation
  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  if (message.length < 20) {
    return NextResponse.json({
      error: 'Message too short. Please provide more detail.'
    }, { status: 400 })
  }

  try {
    // Send notification to you (the owner)
    await resend.emails.send({
      from: 'Cognara Contact <hello@cognaralearn.com>',
      to: 'hello@cognaralearn.com',  // your email
      subject: `[Cognara Contact] ${subject} — from ${name}`,
      html: `
        <h2>New contact form submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p style="background: #f4f4f4; padding: 16px; border-radius: 8px;">
          ${message.replace(/\n/g, '<br>')}
        </p>
        <p><a href="mailto:${email}">Reply to ${name}</a></p>
      `
    })

    // Send confirmation to the visitor
    await resend.emails.send({
      from: 'Cognara <hello@cognaralearn.com>',
      to: email,
      subject: `We received your message, ${name.split(' ')[0]}`,
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 520px;
                    margin: 0 auto; padding: 40px 20px;
                    background: #0A0C14; color: #F0F4FF;">
          <h2 style="color: #5B8EFF;">⚡ Cognara</h2>
          <h3 style="color: #F0F4FF;">
            Thanks for reaching out, ${name.split(' ')[0]}!
          </h3>
          <p style="color: #8B95B3; line-height: 1.65;">
            We have received your message and will get back to you
            within 24 hours.
          </p>
          <p style="color: #8B95B3; line-height: 1.65;">
            While you wait, feel free to explore Cognara and
            start your first learning journey for free.
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/signup"
             style="display: inline-block; background: #5B8EFF;
                    color: white; padding: 12px 24px;
                    border-radius: 10px; text-decoration: none;
                    font-weight: 600; margin-top: 16px;">
            Try Cognara Free →
          </a>
          <p style="color: #4A5272; font-size: 12px; margin-top: 32px;">
            Cognara · cognaralearn.com
          </p>
        </div>
      `
    })

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('[Contact Form] Error:', err)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
```

CONTACT FORM COMPONENT:
Create components/marketing/ContactSection.tsx:

```tsx
'use client'
import { useState } from 'react'
import { Send, Loader2, CheckCircle, Mail, Globe, MapPin } from 'lucide-react'

export function ContactSection() {
  const [form, setForm] = useState({
    name: '', email: '', subject: '', message: ''
  })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    if (!form.name || !form.email || !form.subject || !form.message) {
      setError('Please fill in all fields')
      return
    }
    if (form.message.length < 20) {
      setError('Please write a longer message (at least 20 characters)')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (data.success) {
        setSent(true)
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
      }
    } catch (err) {
      setError('Failed to send. Please email us directly at hello@cognaralearn.com')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section style={{
      padding: '96px 20px',
      background: 'var(--color-surface)'
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 1.4fr',
        gap: '64px',
        alignItems: 'start'
      }}>

        {/* Left — Info */}
        <div>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-primary)',
            marginBottom: '16px'
          }}>
            CONTACT US
          </div>
          <h2 style={{
            color: 'var(--color-text-1)',
            fontSize: '32px',
            fontWeight: 700,
            fontFamily: 'Sora, sans-serif',
            margin: '0 0 16px',
            lineHeight: 1.2
          }}>
            Get in touch
          </h2>
          <p style={{
            color: 'var(--color-text-2)',
            fontSize: '15px',
            lineHeight: 1.7,
            margin: '0 0 32px'
          }}>
            Have a question before signing up? Want to learn more
            about team plans? We would love to hear from you.
            We usually respond within 24 hours.
          </p>

          {/* Contact details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { icon: <Mail size={16} />, label: 'hello@cognaralearn.com' },
              { icon: <Globe size={16} />, label: 'cognaralearn.com' },
              { icon: <MapPin size={16} />, label: 'Nigeria' }
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: 'var(--color-text-2)',
                fontSize: '14px'
              }}>
                <span style={{ color: 'var(--color-primary)' }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* Right — Form */}
        <div style={{
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '32px'
        }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <CheckCircle
                size={48}
                style={{ color: 'var(--color-success)', marginBottom: '16px' }}
              />
              <h3 style={{
                color: 'var(--color-text-1)',
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: '8px'
              }}>
                Message sent!
              </h3>
              <p style={{ color: 'var(--color-text-2)', fontSize: '14px' }}>
                We will get back to you within 24 hours.
                Check your inbox for a confirmation.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Name */}
              <div>
                <label style={{
                  color: 'var(--color-text-2)',
                  fontSize: '13px',
                  fontWeight: 500,
                  display: 'block',
                  marginBottom: '6px'
                }}>
                  Full name *
                </label>
                <input
                  type="text"
                  placeholder="Isaac Chibueze"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: 'var(--color-text-1)',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Email */}
              <div>
                <label style={{
                  color: 'var(--color-text-2)',
                  fontSize: '13px',
                  fontWeight: 500,
                  display: 'block',
                  marginBottom: '6px'
                }}>
                  Email address *
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: 'var(--color-text-1)',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Subject */}
              <div>
                <label style={{
                  color: 'var(--color-text-2)',
                  fontSize: '13px',
                  fontWeight: 500,
                  display: 'block',
                  marginBottom: '6px'
                }}>
                  Subject *
                </label>
                <select
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: form.subject
                      ? 'var(--color-text-1)'
                      : 'var(--color-text-3)',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
                >
                  <option value="" disabled>Select a subject</option>
                  <option value="I have a question about Cognara">
                    I have a question about Cognara
                  </option>
                  <option value="I want to report a bug">
                    I want to report a bug
                  </option>
                  <option value="I am interested in a team plan">
                    I am interested in a team plan
                  </option>
                  <option value="I want to partner with Cognara">
                    I want to partner with Cognara
                  </option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label style={{
                  color: 'var(--color-text-2)',
                  fontSize: '13px',
                  fontWeight: 500,
                  display: 'block',
                  marginBottom: '6px'
                }}>
                  Message *
                </label>
                <textarea
                  placeholder="Tell us how we can help you..."
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  rows={5}
                  style={{
                    width: '100%',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: 'var(--color-text-1)',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{
                  color: 'var(--color-text-3)',
                  fontSize: '11px',
                  marginTop: '4px',
                  textAlign: 'right'
                }}>
                  {form.message.length} characters
                  {form.message.length < 20 && form.message.length > 0
                    ? ' (minimum 20)'
                    : ''
                  }
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div style={{
                  background: 'rgba(248,113,113,0.1)',
                  border: '1px solid var(--color-error)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: 'var(--color-error)',
                  fontSize: '13px'
                }}>
                  {error}
                </div>
              )}

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: loading
                    ? 'var(--color-border)'
                    : 'var(--color-primary)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '13px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  width: '100%'
                }}
              >
                {loading ? (
                  <>
                    <Loader2
                      size={15}
                      style={{ animation: 'spin 1s linear infinite' }}
                    />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    Send Message
                  </>
                )}
              </button>

            </div>
          )}
        </div>

      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .contact-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
      `}</style>
    </section>
  )
}
```

Add ContactSection to the marketing page (app/page.tsx
or wherever the marketing page component is):

Import and add between FAQ and Footer:
```tsx
import { ContactSection } from '@/components/marketing/ContactSection'

// In the page JSX after FAQ section:
<ContactSection />
```

---

# ════════════════════════════════════════════
# SUMMARY — ORDER TO APPLY
# ════════════════════════════════════════════

1. Part 1 — Audit portfolio → fix or confirm working
2. Part 2 — Audit next goal prompt → fix or confirm working
3. Part 3 — Build daily email nudge (install Resend first)
4. Part 4 — Build contact form

Add environment variables before Part 3:
RESEND_API_KEY=re_xxxxxxxxxxxx
CRON_SECRET=[generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"]

After all 4 parts confirm:
- Portfolio page shows real user data and share link works
- Completing a roadmap triggers the next goal screen
- Daily nudge sends correctly when cron is triggered manually
- Contact form sends email to hello@cognaralearn.com and
  confirmation to the visitor
```
