# COGNARA — Comprehensive Update Prompt
## 6 separate tasks — apply one at a time in the order listed

---

# ═══════════════════════════════════════════════════════
# TASK 1 — PRO PLAN, FEATURE LIMITS, STREAK RESTORE
# ═══════════════════════════════════════════════════════

```
Re-enable the Pro plan system and add rate limiting to all
API-heavy features. Apply everything in the steps below.

---

## STEP 1A — RE-ENABLE PRO PLAN GATING

Re-enable subscription checks across the app.
The subscription_tier column already exists in profiles.
The is_pro() logic already exists in lib/subscription.ts.

Apply these access rules:

FREE PLAN:
- Phase 1: fully unlocked — all lessons and quizzes accessible
- Phase 2 onwards: phases visible, expandable, lessons listed
  but content LOCKED behind Pro
- Lessons in locked phases: titles and descriptions visible
  but cannot be opened — clicking shows LessonPreviewModal
  with upgrade prompt
- Confused button: LOCKED — shows lock icon, clicking shows upgrade prompt
- Depth level: Beginner only — other levels show lock icon
- AI Insights card on dashboard: LOCKED
- Practice environments (Monaco, StackBlitz, Writing Workspace): LOCKED
- Progress analytics page: LOCKED
- Downloads: available for Phase 1 lessons only

PRO PLAN:
- All phases and lessons: fully unlocked
- Confused button: available with rate limits (see Step 1B)
- All 5 depth levels: available
- AI Insights: available (3 per day limit)
- All practice environments: available
- Full progress analytics: available
- Downloads: available for all lessons
- Streak restore: available (see Step 1C)

LOCKING UI RULES:
- Locked lessons in Phase 2+ show a 🔒 icon and "Pro" badge
- Locked phase cards still expand when clicked
- Inside expanded locked phase — all lesson titles are visible
- Clicking any locked lesson opens LessonPreviewModal
- LessonPreviewModal shows lesson title, what it covers, upgrade buttons
- At bottom of every locked phase card show:
  "Unlock all [X] lessons · From ₦5,000/month"
  with [Upgrade to Pro] button

---

## STEP 1B — RATE LIMITS ON API-TRIGGERING FEATURES

Add these limits to prevent API abuse.
Store counts in Supabase in a new table:

```sql
CREATE TABLE feature_usage (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  feature_key  TEXT NOT NULL,
  usage_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  count        INT NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feature_key, usage_date)
);

ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_usage" ON feature_usage
  USING (auth.uid() = user_id);
```

Create lib/rateLimit.ts:

```ts
import { createServerClient } from '@/lib/supabase/server'

interface RateLimitConfig {
  featureKey: string
  dailyLimit: number
  userId: string
}

export async function checkRateLimit({
  featureKey,
  dailyLimit,
  userId
}: RateLimitConfig): Promise<{ allowed: boolean; remaining: number; count: number }> {
  const supabase = createServerClient()
  const today = new Date().toISOString().split('T')[0]

  // Get or create usage record for today
  const { data: usage } = await supabase
    .from('feature_usage')
    .select('count')
    .eq('user_id', userId)
    .eq('feature_key', featureKey)
    .eq('usage_date', today)
    .single()

  const currentCount = usage?.count || 0

  if (currentCount >= dailyLimit) {
    return { allowed: false, remaining: 0, count: currentCount }
  }

  // Increment count
  await supabase
    .from('feature_usage')
    .upsert({
      user_id: userId,
      feature_key: featureKey,
      usage_date: today,
      count: currentCount + 1,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,feature_key,usage_date' })

  return {
    allowed: true,
    remaining: dailyLimit - (currentCount + 1),
    count: currentCount + 1
  }
}
```

RATE LIMITS TABLE — apply to these features:

| Feature | Free Limit | Pro Limit | Reset |
|---|---|---|---|
| Confused button (per lesson) | LOCKED | 3 per section, 10 per lesson | Per session |
| Confused button (per day) | LOCKED | 15 per day total | Daily |
| AI Insight generation | 0 | 3 per day | Daily |
| Lesson regeneration | 0 | 2 per lesson | Per lesson |
| Writing exercise AI review | 0 | 5 per day | Daily |
| Roadmap generation | 1 ever | 3 per month | Monthly |

CONFUSED BUTTON SPECIFIC LIMITS:
- After 3 clicks on the same section: hide the button for that section
  Show message: "You've seen 3 explanations for this section.
  Try re-reading it or move to the next part."
- After 10 clicks across the whole lesson: disable for the rest of session
- After 15 clicks in a day: disable until tomorrow
  Show message: "You've used your daily explanation limit.
  Come back tomorrow for more."
- Add 8-second cooldown between each click (prevents rapid clicking)
- Show remaining count near the button: "2 left today"

Add rate limit check to /api/ai/simplify-section/route.ts:
```ts
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
```

Add rate limit check to /api/ai/generate-insight/route.ts:
```ts
const limit = await checkRateLimit({
  featureKey: 'ai_insight',
  dailyLimit: isPro ? 3 : 0,
  userId: user.id
})
```

---

## STEP 1C — STREAK RESTORE FEATURE (PRO ONLY)

Allow Pro users to restore a lost streak once per month
using "Streak Shields" — a protection system.

HOW IT WORKS:
- Pro users get 2 Streak Shields per month automatically
- A Streak Shield protects against ONE missed day
- If they miss a day their streak is NOT reset if they have a shield
  The shield is consumed automatically
- They can also manually restore a recently broken streak
  (within 24 hours of breaking it) using a shield

DATABASE:
```sql
ALTER TABLE streaks ADD COLUMN shields_available INT DEFAULT 0;
ALTER TABLE streaks ADD COLUMN shields_used_this_month INT DEFAULT 0;
ALTER TABLE streaks ADD COLUMN last_shield_grant_date DATE;
ALTER TABLE streaks ADD COLUMN streak_broken_at TIMESTAMPTZ;
```

SHIELD GRANT LOGIC:
On the 1st of every month, grant 2 shields to all Pro users:
```sql
-- Run via Vercel cron on 1st of each month
UPDATE streaks s
SET 
  shields_available = 2,
  shields_used_this_month = 0,
  last_shield_grant_date = CURRENT_DATE
FROM profiles p
WHERE s.user_id = p.id
AND p.subscription_tier IN ('pro_monthly', 'pro_yearly')
AND (s.last_shield_grant_date IS NULL 
  OR s.last_shield_grant_date < DATE_TRUNC('month', CURRENT_DATE));
```

AUTO-SHIELD on missed day:
When streak update detects a missed day and user has shields:
```ts
if (daysMissed === 1 && streakData.shields_available > 0) {
  // Auto-consume shield — streak preserved
  await supabase.from('streaks').update({
    shields_available: streakData.shields_available - 1,
    shields_used_this_month: streakData.shields_used_this_month + 1
  }).eq('user_id', userId)

  // Show notification to user
  return { streakPreserved: true, shieldUsed: true }
}
```

MANUAL RESTORE:
If streak broke more than 1 day ago — no restore available.
If streak broke within 24 hours and user has shields:
Show button on dashboard: "Restore your streak 🛡️ (1 shield)"
Clicking consumes 1 shield and restores the streak.

UI — STREAK SHIELD DISPLAY:
On the dashboard streak card show:
```
🔥 12 day streak
🛡️ 2 shields remaining this month
```

If user has no shields and streak broke within 24 hours:
```
💔 Your streak ended after 12 days
[Restore streak — Upgrade to Pro]  ← for free users
[Restore streak 🛡️]  ← for pro users with shields
[Get more shields]  ← links to settings
```

If streak restore is not available (broke more than 24 hrs ago):
Remove this feature entirely for that user — do not show
the option to restore if the window has passed.
Simply show: "Start a new streak today 🔥"

NOTE: If after implementing this the streak restore feels
gimmicky or adds too much complexity, remove it completely.
The shields system should only stay if it works cleanly
without bugs. Do not launch it broken.

---

# ═══════════════════════════════════════════════════════
# TASK 2 — UPDATE CERTIFICATES TO USE COGNARA LOGO
# ═══════════════════════════════════════════════════════

```
Update the phase completion certificate and grand certificate
to use the official Cognara logo PNG files.

The logo files are located in the /public folder:
- /public/cognara-logo-transparent-640x160.png (full logo — white text)
- /public/cognara-icon-transparent-512x512.png (mark only — large)

UPDATE PhaseCertificate component in
components/certificate/PhaseCertificate.tsx:

Replace any text-based "Cognara" header with the actual logo image.

In the @react-pdf/renderer certificate:

```tsx
import { Image } from '@react-pdf/renderer'

// At the top of the certificate where the logo appears:
<Image
  src="/cognara-logo-transparent-640x160.png"
  style={{
    width: 200,
    height: 50,
    marginBottom: 20,
    alignSelf: 'center'
  }}
/>
```

For the grand certificate use a larger version:
```tsx
<Image
  src="/cognara-icon-transparent-512x512.png"
  style={{
    width: 80,
    height: 80,
    marginBottom: 16,
    alignSelf: 'center'
  }}
/>
```

Also update the certificate footer:
Replace "Cognara AI Learning Platform" text with:
```tsx
<Image
  src="/cognara-logo-transparent-640x160.png"
  style={{ width: 120, height: 30 }}
/>
```

Make sure the certificate background remains dark (#0A0C14)
so the white-text transparent logo is visible correctly.

Confirm both phase certificate and grand certificate
show the logo correctly when downloaded as PDF.
```

---

# ═══════════════════════════════════════════════════════
# TASK 3 — CERTIFICATE COMPLETION REQUIREMENTS
# ═══════════════════════════════════════════════════════

```
Update the certificate system with strict completion requirements.

PHASE CERTIFICATE REQUIREMENTS:
A user can only download a phase certificate when ALL of
the following are true for that phase:

1. Every lesson in the phase has status = 'completed'
   in the lesson_progress table
2. Every lesson in the phase has a corresponding quiz_attempt
   with passed = true
3. The average quiz score across all lessons in the phase
   is at least 60%

If any lesson is incomplete or any quiz is not passed:
- Show a checklist of what is still needed:
  "To earn this certificate complete the following:
   ✅ Lesson 1 — Completed · Quiz passed (87%)
   ✅ Lesson 2 — Completed · Quiz passed (73%)
   ❌ Lesson 3 — Not completed
   ❌ Lesson 4 — Completed · Quiz not passed yet"

GRAND CERTIFICATE REQUIREMENTS:
The grand certificate is awarded only when:
1. ALL phases in the roadmap are completed
2. ALL lessons across ALL phases are completed
3. ALL quizzes across ALL phases are passed
4. Overall average quiz score across all lessons is at least 65%

Create a helper function:

```ts
// lib/certificates/checkEligibility.ts

export async function checkPhaseCertificateEligibility(
  userId: string,
  phaseId: string
): Promise<{
  eligible: boolean
  completedLessons: number
  totalLessons: number
  passedQuizzes: number
  totalQuizzes: number
  averageScore: number
  missingItems: string[]
}> {
  const supabase = createServerClient()

  // Get all lessons in phase
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title')
    .eq('phase_id', phaseId)

  if (!lessons || lessons.length === 0) {
    return { eligible: false, completedLessons: 0, totalLessons: 0,
             passedQuizzes: 0, totalQuizzes: 0, averageScore: 0, missingItems: [] }
  }

  const lessonIds = lessons.map(l => l.id)

  // Check lesson completion
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('lesson_id, status')
    .eq('user_id', userId)
    .in('lesson_id', lessonIds)

  // Check quiz passes
  const { data: quizAttempts } = await supabase
    .from('quiz_attempts')
    .select('quiz_id, passed, score, quizzes(lesson_id)')
    .eq('user_id', userId)
    .eq('passed', true)

  const completedLessonIds = new Set(
    progress?.filter(p => p.status === 'completed').map(p => p.lesson_id) || []
  )

  const passedLessonIds = new Set(
    quizAttempts?.map((a: any) => a.quizzes?.lesson_id).filter(Boolean) || []
  )

  const missingItems: string[] = []
  lessons.forEach(lesson => {
    if (!completedLessonIds.has(lesson.id)) {
      missingItems.push(`Complete lesson: ${lesson.title}`)
    }
    if (!passedLessonIds.has(lesson.id)) {
      missingItems.push(`Pass quiz for: ${lesson.title}`)
    }
  })

  const scores = quizAttempts?.map((a: any) => a.score) || []
  const averageScore = scores.length > 0
    ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length
    : 0

  const eligible = missingItems.length === 0 && averageScore >= 60

  return {
    eligible,
    completedLessons: completedLessonIds.size,
    totalLessons: lessons.length,
    passedQuizzes: passedLessonIds.size,
    totalQuizzes: lessons.length,
    averageScore: Math.round(averageScore),
    missingItems
  }
}

export async function checkGrandCertificateEligibility(
  userId: string,
  roadmapId: string
): Promise<{ eligible: boolean; completionPercentage: number; missingPhases: string[] }> {
  const supabase = createServerClient()

  const { data: phases } = await supabase
    .from('roadmap_phases')
    .select('id, title')
    .eq('roadmap_id', roadmapId)

  if (!phases) return { eligible: false, completionPercentage: 0, missingPhases: [] }

  const results = await Promise.all(
    phases.map(phase => checkPhaseCertificateEligibility(userId, phase.id))
  )

  const missingPhases = phases
    .filter((_, i) => !results[i].eligible)
    .map(p => p.title)

  const completedPhases = results.filter(r => r.eligible).length
  const completionPercentage = Math.round((completedPhases / phases.length) * 100)

  return {
    eligible: missingPhases.length === 0,
    completionPercentage,
    missingPhases
  }
}
```

CERTIFICATE BUTTON STATES:

When phase is NOT yet eligible:
```tsx
<button disabled style={{ opacity: 0.4, cursor: 'not-allowed' }}>
  🔒 Complete all lessons and quizzes to unlock certificate
</button>
// Show progress: "4 of 6 lessons complete · 3 of 6 quizzes passed"
```

When phase IS eligible:
```tsx
<button onClick={() => downloadCertificate(phaseId)}>
  🎓 Download Phase Certificate
</button>
```

Grand certificate on roadmap completion page:
Only show when checkGrandCertificateEligibility returns eligible: true
```tsx
{grandEligible && (
  <div style={{
    background: 'linear-gradient(135deg, rgba(91,142,255,0.1), rgba(167,139,250,0.1))',
    border: '1px solid var(--color-primary)',
    borderRadius: '16px',
    padding: '28px',
    textAlign: 'center'
  }}>
    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏆</div>
    <h2>You completed everything!</h2>
    <p>You have earned the Cognara Grand Certificate</p>
    <button onClick={() => downloadGrandCertificate(roadmapId)}>
      Download Grand Certificate
    </button>
  </div>
)}
```
```

---

# ═══════════════════════════════════════════════════════
# TASK 4 — MARKETING PAGE CLEANUP + FEATURE TAB FIX
# ═══════════════════════════════════════════════════════

```
Clean up the marketing page and fix the feature tab overlay bug.

---

## MARKETING PAGE CLEANUP

Remove or condense these sections if they exist and
make the page feel cluttered:

REMOVE if present:
- Any duplicate CTA sections (keep only 2 max — hero + final)
- Any section that repeats information already in another section
- Excessive statistics that are not yet real
  (fake user counts like "50,000 learners" — remove entirely
  until you have real numbers)
- Any placeholder testimonials that look obviously fake
  (remove entirely — an empty testimonials section is better
  than fake ones)
- Any "Trusted by companies" logos section if it has
  fake or placeholder logos

KEEP:
- Hero section (headline, subheadline, CTA buttons)
- How it works (3 steps max)
- Features section
- Why Cognara section (the 6-card section we built)
- FAQ section
- Final CTA banner
- Footer

CONDENSE:
- How it works: maximum 3 steps, each one sentence description
- Features: maximum 6 features, no more
- Each section should have generous whitespace above and below
  Padding: minimum 80px top and bottom per section

The goal: someone lands on the page and can understand
Cognara in 30 seconds of scrolling. Remove anything that
slows that understanding down.

---

## FEATURE TAB BUG FIX

The Feature Showcase tab section has a bug where a purple
or violet message/badge is overlaying or appearing behind
the main heading of the tab content. Fix this now.

The issue is likely one of these:

CAUSE A — Z-index conflict:
The "AI GENERATED" or "GENERATED" badge (violet, position absolute)
has a z-index that is placing it over the tab content heading.

Fix:
```css
.feature-tab-badge {
  position: relative;  /* change from absolute to relative */
  z-index: 1;
}

.feature-tab-heading {
  position: relative;
  z-index: 2;
}
```

CAUSE B — Overlapping absolutely positioned element:
A badge or label element inside the tab preview card
is positioned absolute and overlapping the heading.

Fix: Add overflow: hidden to the tab content container
or adjust the top/left positioning of the badge so it
sits below the heading, not over it.

CAUSE C — Tab content container height issue:
The tab content area is not tall enough so content
from one tab bleeds into the heading area.

Fix: Set explicit minHeight on tab content container:
```css
.tab-content-panel {
  min-height: 400px;
  overflow: hidden;
  position: relative;
}
```

Inspect the Feature Showcase section and identify
which cause applies. Fix it so the tab content is
clean with no overlapping elements. Each tab should
show its content clearly with the heading fully visible
and no purple overlay or badge obstructing it.

After fixing verify all tabs (at least 3 if present)
show correctly on both mobile and desktop.
```

---

# ═══════════════════════════════════════════════════════
# TASK 5 — LAUNCH COST ADVICE NOTE (READ ONLY — NO CODE)
# ═══════════════════════════════════════════════════════

NOTE FOR THE DEVELOPER (Isaac):

$100 in Anthropic credits is a smart launch investment.
At Haiku pricing your $100 will cover approximately:

- 3,700 full lesson generations
- OR 5,000+ quiz generations
- OR a mix covering roughly 300-500 active users
  going through their first few lessons

This is more than enough to get through your initial
launch and first wave of real users. Monitor your usage
in the Anthropic console daily for the first two weeks
after launch so you can project when you will need
to top up.

Vercel and Supabase free plans are fully sufficient
for launch. Do not upgrade either until you hit these
limits:
- Supabase: upgrade when database approaches 400MB
  or when you have 200+ concurrent active users
- Vercel: upgrade when you hit build minute limits
  (unlikely until you have thousands of daily deployments)

Stay on free tiers for both until Cognara revenue
covers the upgrade cost comfortably.

---

# ═══════════════════════════════════════════════════════
# SUMMARY — ORDER TO APPLY THESE TASKS
# ═══════════════════════════════════════════════════════

Apply in this exact order. Confirm each before the next.

1. Task 4 first — Marketing page fix (visual, no database)
2. Task 1A — Re-enable Pro gating (subscription checks)
3. Task 1B — Rate limits (feature_usage table + checkRateLimit)
4. Task 1C — Streak shields (test carefully, remove if buggy)
5. Task 3 — Certificate eligibility requirements
6. Task 2 — Logo on certificates

Test after each task before moving to the next.
```
