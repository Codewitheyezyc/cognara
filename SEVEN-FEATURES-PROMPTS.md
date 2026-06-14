# COGNARA — 7 Pre-Launch Features
## Paste ONE prompt at a time. Wait for confirmation before the next.
## Order: 1 → 2 → 3 → 4 → 5 → 6 → 7

---

# ═══════════════════════════════════════
# PROMPT 1 — READING PROGRESS BAR
# Paste this first. Test it. Then move to Prompt 2.
# ═══════════════════════════════════════

```
Add a reading progress bar to every lesson page in Cognara.

WHAT IT DOES:
As the user scrolls through a lesson a thin progress bar
fills from left to right showing how far through the lesson
they are. It also shows estimated time remaining.

EXACT BEHAVIOUR:
- Bar sits fixed at the very top of the screen
  (above the navbar, full width)
- Fills with --color-primary (blue) as user scrolls down
- At 0% scroll: bar is empty
- At 50% scroll: bar is half full
- At 100% scroll (bottom of page): bar is completely full
- Next to the bar (top right corner, small text):
  "X min remaining" counting down as they scroll
  When they reach the bottom it shows "✓ Read"
- Bar disappears on any other page — only visible on lesson pages

COMPONENT:
Create components/lesson/ReadingProgressBar.tsx

```tsx
'use client'
import { useState, useEffect } from 'react'

interface ReadingProgressBarProps {
  estimatedMinutes: number
}

export function ReadingProgressBar({ estimatedMinutes }: ReadingProgressBarProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      setProgress(Math.min(100, Math.round(scrollPercent)))
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const minutesRemaining = Math.ceil(estimatedMinutes * (1 - progress / 100))
  const isComplete = progress >= 98

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      height: '3px',
      background: 'var(--color-border)'
    }}>
      {/* Progress fill */}
      <div style={{
        height: '100%',
        width: `${progress}%`,
        background: isComplete
          ? 'var(--color-success)'
          : 'var(--color-primary)',
        transition: 'width 0.1s ease',
        borderRadius: '0 2px 2px 0'
      }} />

      {/* Time remaining label */}
      <div style={{
        position: 'fixed',
        top: '8px',
        right: '16px',
        fontSize: '11px',
        color: isComplete ? 'var(--color-success)' : 'var(--color-text-3)',
        fontWeight: 500,
        background: 'var(--color-surface)',
        padding: '2px 8px',
        borderRadius: '999px',
        border: '1px solid var(--color-border)'
      }}>
        {isComplete ? '✓ Read' : `${minutesRemaining} min left`}
      </div>
    </div>
  )
}
```

Add to app/dashboard/lesson/[id]/page.tsx:
```tsx
import { ReadingProgressBar } from '@/components/lesson/ReadingProgressBar'

// At the very top of the lesson page return:
<>
  <ReadingProgressBar estimatedMinutes={lesson.content.estimated_minutes} />
  {/* rest of lesson page */}
</>
```

No database changes needed.
Test: Open any lesson, scroll slowly, verify bar fills and time counts down.
Confirm when complete.
```

---

# ═══════════════════════════════════════
# PROMPT 2 — LESSON BOOKMARKS AND NOTES
# Paste after Prompt 1 is confirmed complete.
# ═══════════════════════════════════════

```
Add a bookmark and personal notes system to Cognara lessons.

WHAT IT DOES:
Users can bookmark any lesson section and add a personal note
to it. All bookmarks and notes are saved to Supabase and
viewable on a dedicated My Notes page.

DATABASE:
```sql
CREATE TABLE lesson_bookmarks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id    UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  lesson_title TEXT NOT NULL,
  section_index INT NOT NULL,
  section_heading TEXT NOT NULL,
  section_body TEXT,
  note         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE lesson_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_bookmarks" ON lesson_bookmarks
  USING (auth.uid() = user_id);
```

BOOKMARK BUTTON ON EACH SECTION:
Add a small bookmark icon button to the top right of every
lesson section in LessonContent.tsx

When NOT bookmarked: shows outline bookmark icon, grey color
When bookmarked: shows filled bookmark icon, primary blue color
Clicking toggles bookmark on/off and saves to Supabase

When bookmarking show a small input field that slides down:
"Add a note (optional)" → text input → Save button
If they click Save without a note that is fine — section is
bookmarked without a note.

```tsx
// Add to each section in LessonContent renderer:
<div style={{ position: 'relative' }}>
  <BookmarkButton
    lessonId={lessonId}
    lessonTitle={lessonTitle}
    sectionIndex={index}
    sectionHeading={section.heading}
    sectionBody={section.body?.slice(0, 200)}
    userId={userId}
  />
  {/* existing section content */}
</div>
```

Create components/lesson/BookmarkButton.tsx —
handles toggle, note input, and Supabase save/delete.

MY NOTES PAGE:
Create app/dashboard/notes/page.tsx

Shows all bookmarked sections grouped by lesson:

```
📖 Variables in JavaScript
  └── "What is a Variable?" 
      Note: "Think of it like a labeled box"
      [View lesson] [Delete bookmark]

📖 Essential Tailoring Tools
  └── "Using Fabric Scissors"
      Note: "Always cut with the grain"
      [View lesson] [Delete bookmark]
```

Add "Notes" to dashboard sidebar navigation with a
bookmark icon (Lucide: Bookmark).

No changes to existing lesson generation or AI prompts.
Confirm when complete.
```

---

# ═══════════════════════════════════════
# PROMPT 3 — "CONFUSED?" BUTTON
# Paste after Prompt 2 is confirmed complete.
# ═══════════════════════════════════════

```
Add a "Confused?" button to every explanation section in Cognara lessons.

WHAT IT DOES:
Next to every explanation, analogy, and use_case section heading
a small "Confused?" button appears. When clicked it calls Claude
and asks for a simpler re-explanation of that specific section.
The simpler explanation appears in a popup below the section.

THIS IS A UNIQUE FEATURE — no other learning platform does this.

AI ROUTE:
Create app/api/ai/simplify-section/route.ts

```ts
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sectionHeading, sectionBody, subject, depthLevel } = await req.json()

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

  const text = response.content[0].type === 'text'
    ? response.content[0].text : ''

  return NextResponse.json({ explanation: text })
}
```

CONFUSED BUTTON COMPONENT:
Create components/lesson/ConfusedButton.tsx

Shows as a small pill button: "Confused? 💡"
Color: var(--color-text-3), border: 1px solid var(--color-border)
Size: very small — font-size 11px, padding 3px 10px
Position: right side of section heading, inline

When clicked:
1. Button shows "Thinking..." with a subtle pulse animation
2. Calls /api/ai/simplify-section with section content
3. A friendly card slides down below the section:

```
┌─────────────────────────────────────────┐
│  💡 Let me explain this differently     │
│                                         │
│  [Simpler explanation text here...]     │
│                                         │
│  [Got it! ✓]                           │
└─────────────────────────────────────────┘
```

Card styling:
- background: rgba(91,142,255,0.06)
- border: 1px solid rgba(91,142,255,0.2)
- border-left: 3px solid var(--color-primary)
- border-radius: 10px
- padding: 16px 20px
- animation: slideDown 0.3s ease

"Got it! ✓" button dismisses the card and changes
the Confused button to show "✓ Clearer now" in green
for the rest of the session.

Add ConfusedButton to these section types in LessonContent.tsx:
- explanation
- analogy
- use_case

Do NOT add to: code, table, diagram, callout, exercise, summary

No database changes needed — responses are not saved,
generated fresh each time.
Confirm when complete.
```

---

# ═══════════════════════════════════════
# PROMPT 4 — LEARNING STYLE ASSESSMENT
# Paste after Prompt 3 is confirmed complete.
# ═══════════════════════════════════════

```
Add a learning style assessment to the Cognara onboarding flow.

WHAT IT DOES:
Before generating the roadmap add a quick 5-question assessment
that discovers how the user learns best. Claude uses these answers
to personalise every lesson structure for that user.

DATABASE:
```sql
ALTER TABLE profiles ADD COLUMN learning_style_detail JSONB;
-- Stores: { "prefers": "examples_first", "pace": "slow", 
--           "style": "visual", "motivation": "career",
--           "challenge": "consistency" }
```

NEW ONBOARDING STEP:
Add as Step 3 in onboarding (after goal, before depth level).
Title: "How do you learn best?"
Subtitle: "Answer 5 quick questions so Cognara can personalise
every lesson specifically for you."

Show one question at a time. Each question has 4 option cards.
User taps a card to select and automatically advances to next question.
Progress bar at top shows 1/5, 2/5 etc.

QUESTION 1:
"When you encounter a new concept, what helps most?"
A) Read a clear explanation first
B) See a real example before anything else
C) Try doing it myself immediately
D) Have it compared to something I already know

QUESTION 2:
"When you hit something confusing, you prefer to:"
A) Re-read it slowly until it clicks
B) Skip ahead and come back later
C) Look for a different explanation
D) Take a break and return fresh

QUESTION 3:
"Your ideal lesson length is:"
A) Short and focused — under 10 minutes
B) Medium — 10 to 20 minutes
C) Detailed — take as long as needed
D) Flexible — depends on the topic

QUESTION 4:
"What motivates you most to keep learning?"
A) Seeing my progress and streak
B) Getting good quiz scores
C) Finishing phases and earning badges
D) Feeling genuinely skilled at something

QUESTION 5:
"Your biggest challenge with learning in the past has been:"
A) Losing motivation after a few days
B) Not knowing where to start
C) Getting bored with repetitive content
D) Not having time to study consistently

After all 5 answers save results to profiles.learning_style_detail

UPDATE LESSON AI PROMPT:
In buildLessonUserMessage() add the learning style context:

```ts
const styleContext = profile?.learning_style_detail
  ? `
Learning style preferences:
- Learns best by: ${styleContext.prefers}
- When confused prefers: ${styleContext.confusion_style}
- Ideal lesson pace: ${styleContext.pace}
- Motivated by: ${styleContext.motivation}
- Past challenge: ${styleContext.challenge}

Adapt the lesson structure to match these preferences.
If they prefer examples first — lead with an example before
the explanation. If they like short focused content — keep
sections concise. If they are motivated by progress — add
encouraging milestone notes within the lesson.
` : ''
```

No changes to existing onboarding questions — just add
this as a new step between goal setup and depth selection.
Confirm when complete.
```

---

# ═══════════════════════════════════════
# PROMPT 5 — SKILL LEVEL BADGES
# Paste after Prompt 4 is confirmed complete.
# ═══════════════════════════════════════

```
Add a skill level badge system to Cognara user profiles.

WHAT IT DOES:
Users earn visible badges as they complete phases in their
learning roadmap. Badges appear on their profile page and
as a small indicator next to their avatar in the dashboard.

DATABASE:
```sql
CREATE TABLE user_badges (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_key    TEXT NOT NULL,
  badge_label  TEXT NOT NULL,
  badge_emoji  TEXT NOT NULL,
  subject      TEXT NOT NULL,
  earned_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_key, subject)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_badges" ON user_badges
  USING (auth.uid() = user_id);
```

BADGE DEFINITIONS:
```ts
export const BADGES = {
  phase_1: { emoji: '🌱', label: 'First Steps', description: 'Completed Phase 1' },
  phase_2: { emoji: '🔥', label: 'Building Momentum', description: 'Completed Phase 2' },
  phase_3: { emoji: '⚡', label: 'Halfway There', description: 'Completed Phase 3' },
  phase_4: { emoji: '🎯', label: 'Advanced Learner', description: 'Completed Phase 4' },
  phase_5: { emoji: '🏆', label: 'Graduate', description: 'Completed full roadmap' },
  streak_7: { emoji: '🔥', label: 'Week Warrior', description: '7 day streak' },
  streak_30: { emoji: '💎', label: 'Consistent', description: '30 day streak' },
  perfect_quiz: { emoji: '⭐', label: 'Perfect Score', description: '100% on a quiz' },
  speed_learner: { emoji: '⚡', label: 'Speed Learner', description: '3 lessons in one day' }
}
```

WHEN BADGES ARE AWARDED:
After a user completes the last lesson quiz in a phase
check if all lessons in that phase are marked complete.
If yes — award the phase badge and show a celebration.

After streak updates — check if streak hits 7 or 30.
After quiz score — check if score is 100%.
After lesson_progress updates — check if 3 lessons done today.

Award logic in a server action or API route:
app/api/badges/check-and-award/route.ts

Call this route after:
- Lesson marked complete
- Quiz submitted
- Streak updated

BADGE DISPLAY ON PROFILE PAGE:
Create a Badges section in /dashboard/profile:

```
MY BADGES

[🌱] [🔥] [⭐] [locked] [locked] [locked]

🌱 First Steps
   Completed Phase 1 · Tailoring · June 14 2026

🔥 Building Momentum  
   Completed Phase 2 · Tailoring · June 20 2026

⭐ Perfect Score
   100% on Basic Hand Stitches Quiz
```

Locked badges show as grey circles with a lock icon
so users can see what they are working toward.

BADGE INDICATOR ON AVATAR:
In the navbar dropdown next to the user's name
show their most recently earned badge emoji.

"Isaac 🌱" — subtle, not overwhelming.

BADGE CELEBRATION:
When a badge is newly earned show the MascotOverlay
with Spark celebrating:

```tsx
<MascotOverlay
  emotion="celebrate"
  messages={[
    `New badge earned! ${badge.emoji}`,
    `${badge.label}`,
    badge.description
  ]}
  ctaLabel="Keep going!"
  onDismiss={() => setShowBadge(false)}
/>
```

Confirm when complete.
```

---

# ═══════════════════════════════════════
# PROMPT 6 — PHASE COMPLETION CERTIFICATE
# Paste after Prompt 5 is confirmed complete.
# ═══════════════════════════════════════

```
Add a downloadable phase completion certificate to Cognara.

WHAT IT DOES:
When a user completes all lessons and quizzes in a phase
they can download a beautiful PDF certificate of completion.
The certificate is personalised with their name, the phase
title, subject, score average, and completion date.

INSTALL:
```bash
npm install @react-pdf/renderer
```

CERTIFICATE DESIGN:
Create components/certificate/PhaseCertificate.tsx
using @react-pdf/renderer

Certificate layout (A4 landscape):

Background: Deep dark (#0A0C14) with subtle blue gradient border
Top: Cognara logo text in Sora font, large
Center top: "CERTIFICATE OF COMPLETION" in spaced uppercase letters
Large: Student's full name in elegant large font
Below name: "has successfully completed"
Phase title: Large, bold, primary blue color
Subject: Medium, secondary text color
Stats row: "Average Score: 87% · Lessons: 8 · Completed: June 14 2026"
Bottom left: Cognara signature line "Cognara AI Learning Platform"
Bottom right: A unique certificate ID (generated from user_id + phase_id)
Subtle decorative elements: thin border lines, small geometric accents

Colors match Cognara dark theme exactly.

CERTIFICATE API ROUTE:
Create app/api/certificate/generate/route.ts

Accepts: userId, phaseId
Verifies: user actually completed all lessons in the phase
Generates: PDF using @react-pdf/renderer
Returns: PDF file download

DOWNLOAD BUTTON:
Show on the roadmap phase card after all lessons are complete:

```tsx
{phaseComplete && (
  <button
    onClick={() => downloadCertificate(phaseId)}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      background: 'rgba(52,211,153,0.1)',
      color: 'var(--color-success)',
      border: '1px solid var(--color-success)',
      borderRadius: '8px',
      padding: '7px 14px',
      fontSize: '13px',
      cursor: 'pointer',
      fontWeight: 500
    }}
  >
    <Award size={14} />
    Download Certificate
  </button>
)}
```

Also show on the lesson complete modal after the final
lesson in a phase with a special message:

```tsx
<MascotOverlay
  emotion="celebrate"
  messages={[
    `Phase complete! 🏆`,
    `You finished every lesson in ${phaseTitle}`,
    `Your certificate is ready to download.`
  ]}
  ctaLabel="Download Certificate"
  onDismiss={handleCertificateDownload}
/>
```

No additional database tables needed — verify completion
from existing lesson_progress table.
Confirm when complete.
```

---

# ═══════════════════════════════════════
# PROMPT 7 — DAILY LEARNING NUDGE EMAIL
# Paste after Prompt 6 is confirmed complete.
# This requires Resend to be connected to the project.
# If Resend is not yet connected, set it up first.
# ═══════════════════════════════════════

```
Add a daily learning reminder email system to Cognara.

WHAT IT DOES:
Every day at the time the user chose as their preferred study
time Cognara sends them a personalised email with their next
lesson, current streak, and a direct link to continue learning.

REQUIREMENTS:
- Resend must be connected (same setup used in other projects)
- User must have reminder_enabled = true in their profile
- User must have reminder_time set in their profile
- Only send to users who have NOT already studied today

INSTALL:
```bash
npm install resend
```

EMAIL TEMPLATE:
Create emails/DailyNudgeEmail.tsx using React Email

```tsx
import {
  Html, Head, Body, Container, Section,
  Text, Button, Hr, Preview
} from '@react-email/components'

interface DailyNudgeEmailProps {
  userName: string
  nextLessonTitle: string
  nextLessonId: string
  streakDays: number
  subject: string
  appUrl: string
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
          : `Your next lesson is waiting, ${userName}`
        }
      </Preview>
      <Body style={{
        backgroundColor: '#0A0C14',
        fontFamily: 'Inter, sans-serif',
        margin: 0,
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
          <Section style={{
            padding: '28px 32px 0',
            textAlign: 'center'
          }}>
            <Text style={{
              color: '#5B8EFF',
              fontSize: '22px',
              fontWeight: '700',
              margin: '0 0 4px',
              letterSpacing: '-0.02em'
            }}>
              Cognara ⚡
            </Text>
          </Section>

          {/* Streak */}
          {streakDays > 0 && (
            <Section style={{ padding: '16px 32px 0', textAlign: 'center' }}>
              <Text style={{
                display: 'inline-block',
                backgroundColor: 'rgba(245,158,11,0.1)',
                color: '#F59E0B',
                padding: '6px 16px',
                borderRadius: '999px',
                fontSize: '13px',
                fontWeight: '600',
                margin: 0
              }}>
                🔥 {streakDays} day streak — don't break it!
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
              Good {getTimeOfDay()}, {userName} 👋
            </Text>

            <Text style={{
              color: '#8B95B3',
              fontSize: '15px',
              lineHeight: '1.65',
              margin: '0 0 24px'
            }}>
              Your next lesson in <strong style={{ color: '#F0F4FF' }}>
              {subject}</strong> is ready for you.
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
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                margin: '0 0 6px'
              }}>
                NEXT LESSON
              </Text>
              <Text style={{
                color: '#F0F4FF',
                fontSize: '16px',
                fontWeight: '600',
                margin: 0,
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
          <Section style={{ padding: '16px 32px' }}>
            <Text style={{
              color: '#4A5272',
              fontSize: '12px',
              textAlign: 'center',
              margin: 0
            }}>
              You are receiving this because you enabled daily reminders.
              <br />
              <a
                href={`${appUrl}/dashboard/settings`}
                style={{ color: '#5B8EFF' }}
              >
                Update reminder settings
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
```

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
  await resend.emails.send({
    from: 'Cognara <hello@cognara.com>',
    to: params.to,
    subject: params.streakDays > 0
      ? `🔥 ${params.streakDays} day streak — keep going, ${params.userName}`
      : `Your next lesson is waiting, ${params.userName}`,
    react: DailyNudgeEmail({
      ...params,
      appUrl: process.env.NEXT_PUBLIC_APP_URL!
    })
  })
}
```

CRON JOB — VERCEL CRON:
Create app/api/cron/daily-nudge/route.ts

This runs every hour. It checks which users have their
reminder_time matching the current hour and have not
studied today, then sends them their nudge email.

```ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { sendDailyNudge } from '@/lib/email/sendDailyNudge'

export async function GET(req: Request) {
  // Verify this is called by Vercel Cron
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()
  const currentHour = new Date().getHours().toString().padStart(2, '0')

  // Get users whose reminder time matches current hour
  // and who have reminders enabled
  // and who have not completed a lesson today
  const { data: users } = await supabase
    .from('profiles')
    .select(`
      id, name, email, reminder_time,
      streaks(current_streak),
      learning_goals(subject, is_active),
      lessons(id, title, lesson_progress(status, completed_at))
    `)
    .eq('reminder_enabled', true)
    .like('reminder_time', `${currentHour}:%`)

  if (!users || users.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  let sentCount = 0

  for (const user of users) {
    try {
      // Find next incomplete lesson
      const nextLesson = findNextLesson(user)
      if (!nextLesson) continue

      // Check if user already studied today
      const studiedToday = checkStudiedToday(user)
      if (studiedToday) continue

      await sendDailyNudge({
        to: user.email,
        userName: user.name,
        nextLessonTitle: nextLesson.title,
        nextLessonId: nextLesson.id,
        streakDays: user.streaks?.[0]?.current_streak || 0,
        subject: user.learning_goals?.[0]?.subject || 'your course'
      })

      sentCount++
    } catch (err) {
      console.error(`Failed to send nudge to ${user.email}:`, err)
    }
  }

  return NextResponse.json({ sent: sentCount })
}
```

Add to vercel.json:
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

Add to .env.local:
```env
RESEND_API_KEY=your_resend_key
CRON_SECRET=generate_a_random_secret_string
```

Install React Email:
```bash
npm install resend @react-email/components
```

SETTINGS PAGE UPDATE:
The reminder toggle and time picker already exist
from the profile settings prompt. Verify they are
correctly saving to profiles.reminder_enabled and
profiles.reminder_time.

Test by temporarily setting CRON schedule to every minute,
triggering manually, and checking your email inbox.
Then set back to hourly.

Confirm when complete.
```

---

# COMPLETE — ALL 7 FEATURES DONE
# After all 7 prompts are confirmed:
# Run the Phase 7 audit prompt to verify everything
# works together correctly before launch.
```
