# COGNARA — Admin Dashboard
## Owner-only dashboard to monitor app usage and users

---

```
Build a complete admin dashboard for Cognara.
This is only accessible to the app owner.
Regular users must never be able to access this.

---

## SECURITY FIRST

Add to .env.local:
```env
ADMIN_USER_ID=your-supabase-user-id-here
```

To find your user ID:
Supabase Dashboard → Authentication → Users
→ Find your account → Copy the UUID

Create middleware protection for all /admin routes:

In middleware.ts add:
```ts
if (req.nextUrl.pathname.startsWith('/admin')) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== process.env.ADMIN_USER_ID) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
}
```

This means if anyone who is not you tries to visit /admin
they are silently redirected to their own dashboard.
They never know the admin page exists.

---

## ADMIN DASHBOARD LAYOUT

Create app/admin/layout.tsx:

Simple layout with:
- Sidebar with admin navigation links
- Top bar showing "Admin Panel" + your name
- Different color scheme from user dashboard
  Use a slightly warmer dark surface to visually
  distinguish it from the user-facing app

Admin sidebar links:
- Overview (home)
- Users
- Learning Activity
- Content Quality
- System Status

---

## PAGE 1 — ADMIN OVERVIEW (/admin)

The main dashboard. Shows the most important numbers
at a glance. Refresh automatically every 60 seconds.

Create app/admin/page.tsx:

STATS CARDS ROW 1 — Business metrics:
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Total Users  │ │ New (7 days) │ │ Active Users │ │ Pro Users    │
│     247      │ │     +18      │ │     89       │ │     34       │
│              │ │  ↑ vs last   │ │ last 7 days  │ │  14% of all  │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

STATS CARDS ROW 2 — Learning metrics:
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│Lessons Today │ │ Quizzes Today│ │  Avg Score   │ │ Avg Streak   │
│     143      │ │     67       │ │    71%       │ │   4.2 days   │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

CHART 1 — New users over last 30 days (line chart using Recharts)
X axis: dates
Y axis: number of new signups
Shows growth trend clearly

CHART 2 — Top 10 subjects being learned (horizontal bar chart)
Shows which subjects are most popular:
```
Web Development     ████████████ 43 users
Digital Marketing   ████████ 28 users
Tailoring           ██████ 21 users
Public Speaking     █████ 17 users
...
```

RECENT ACTIVITY FEED:
Last 10 actions across all users (newest first):
```
2 mins ago   — New user signed up: blessing@gmail.com
5 mins ago   — Quiz completed: 94% score (Web Dev)
12 mins ago  — Phase completed: Tailoring Phase 1
18 mins ago  — New Pro subscriber
23 mins ago  — New user signed up: isaac@gmail.com
```

Fetch this data with Supabase queries:
- New users: SELECT from profiles ORDER BY created_at DESC
- Quiz scores: SELECT from quiz_attempts ORDER BY attempted_at DESC
- Phase completions: detect when lesson_progress shows all complete
- Pro subscribers: SELECT from profiles WHERE subscription_tier != 'free'

---

## PAGE 2 — USER MANAGEMENT (/admin/users)

Full list of all registered users with search and filters.

Create app/admin/users/page.tsx:

SEARCH BAR: Search by name or email in real time

FILTER BUTTONS:
[All] [Free] [Pro] [Active this week] [Inactive 7+ days]

USER TABLE:
```
Name          Email              Joined      Plan   Subject          Last Active  Actions
────────────────────────────────────────────────────────────────────────────────────────
Isaac CH      isaac@gmail.com    Jun 1       Pro    Web Dev          Today        [View] [...]
Blessing N    blessing@...       Jun 3       Free   Public Speaking  Jun 12       [View] [...]
Chibueze A    chibu@...          Jun 5       Free   Tailoring        Jun 8        [View] [...]
```

Columns:
- Avatar + Name
- Email
- Join date
- Plan badge (Free grey / Pro blue)
- Current learning subject
- Last active date (shows "Today", "Yesterday", "3 days ago", or date)
- Actions dropdown

ACTIONS DROPDOWN per user:
- View full profile
- Upgrade to Pro manually (for testing or gifting)
- Downgrade to Free
- Send them an email
- Delete account (with confirmation modal)
- "Logged in as" — see what they see (future feature)

USER DETAIL PAGE (/admin/users/[userId]):

Clicking "View" opens a detailed page for that user:

```
ISAAC CHIBUEZE
isaac@gmail.com · Joined June 1 2026 · Pro Monthly

LEARNING JOURNEY
Subject: Web Development
Current phase: Phase 3 of 5
Lessons completed: 18 of 34
Average quiz score: 84%
Current streak: 🔥 12 days
Record streak: 🏆 19 days

RECENT LESSONS
Jun 14 — CSS Flexbox Layout (Quiz: 90%)
Jun 13 — CSS Box Model (Quiz: 75%)
Jun 12 — HTML Forms (Quiz: 100% ⭐)

BADGES EARNED
🌱 First Steps · ⭐ Perfect Score · 🔥 Week Warrior

SUBSCRIPTION
Plan: Pro Monthly
Status: Active
Start date: June 1 2026
Next renewal: July 1 2026
```

---

## PAGE 3 — LEARNING ACTIVITY (/admin/activity)

Deeper analytics on how the app is being used.

Create app/admin/activity/page.tsx:

DATE RANGE SELECTOR:
[Today] [Last 7 days] [Last 30 days] [All time]

METRICS:

Lessons generated: total count in date range
Quizzes taken: total count
Average quiz score: across all attempts
Lessons that were regenerated: (signals quality issues)
Most confusing lessons: lessons where "Confused?" was clicked most

SUBJECT POPULARITY TABLE:
```
Subject              Users   Lessons   Avg Score   Completions
─────────────────────────────────────────────────────────────
Web Development        43      312       79%           8
Digital Marketing      28      187       72%           3
Tailoring              21      156       81%          12
Public Speaking        17      134       68%           2
```

QUIZ PERFORMANCE:
Lowest scoring lessons across the platform:
(These are lessons where most users are failing the quiz —
signals the lesson content needs improvement)

```
Lesson: CSS Grid Layout
Average score: 52% — 23 attempts
Action: [Review lesson content]

Lesson: JavaScript Closures  
Average score: 48% — 31 attempts
Action: [Review lesson content]
```

This is gold for you as the owner. You can see exactly
which lessons are too hard or poorly explained and fix them.

DAILY ACTIVE USERS CHART:
Line chart showing how many unique users opened the app
each day over the last 30 days.

---

## PAGE 4 — CONTENT QUALITY (/admin/content)

Monitor the quality of AI-generated content.

Create app/admin/content/page.tsx:

RECENTLY GENERATED LESSONS:
List of the last 20 lessons generated with:
- Lesson title
- Subject
- User who triggered it
- Generation time
- Whether it passed subject validation
- [Preview] button to read the full lesson

FAILED VALIDATIONS:
Lessons where the quiz or lesson content failed
subject validation and was regenerated:

```
Jun 14 12:34  Public Speaking — Stage Fright
              QUIZ FAILED VALIDATION — tech content detected
              Auto-regenerated ✓

Jun 13 09:12  Tailoring — Fabric Types  
              QUIZ FAILED VALIDATION — tech content detected
              Auto-regenerated ✓
```

This lets you monitor how often the AI is generating
wrong content and whether the validation system is catching it.

BULK ACTIONS:
[Clear all lesson cache] — forces all lessons to regenerate
[Clear all quiz cache] — forces all quizzes to regenerate

These are the admin-only buttons that replace the
individual regenerate button you removed from user view.

---

## PAGE 5 — SYSTEM STATUS (/admin/system)

Quick health check of all connected services.

Create app/admin/system/page.tsx:

```
SERVICE STATUS

Supabase Database        ● Online   Response: 45ms
Anthropic API            ● Online   Last used: 2 mins ago
Vercel Deployment        ● Online   Last deploy: Jun 14
Resend Email             ● Online   Emails sent today: 47

ENVIRONMENT CHECK
ANTHROPIC_API_KEY        ✓ Set
SUPABASE_URL             ✓ Set
PAYSTACK_SECRET_KEY      ✓ Set
RESEND_API_KEY           ✓ Set
ADMIN_USER_ID            ✓ Set

API USAGE TODAY
Claude API calls: 143
Estimated cost:  ₦847 (~$0.56)
Monthly so far:  ₦12,340 (~$8.20)
```

The API cost tracker is especially useful — you can see
exactly how much you are spending on Claude every day
and project your monthly costs as users grow.

SYSTEM HEALTH CHECK:
Button that pings all services and returns their status live.

---

## ADMIN NAVIGATION — NOT IN USER SIDEBAR

The admin panel must be completely separate from the
user-facing dashboard. Do not add an admin link to the
user sidebar.

Instead add a small hidden link only visible to you:

In the navbar dropdown (the avatar menu) add a check:

```tsx
{isAdmin && (
  <a href="/admin" style={{
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    color: 'var(--color-accent)',
    fontSize: '14px',
    textDecoration: 'none'
  }}>
    ⚙️ Admin Panel
  </a>
)}
```

Where isAdmin is:
```ts
const isAdmin = user?.id === process.env.NEXT_PUBLIC_ADMIN_USER_ID
```

Note: Use NEXT_PUBLIC_ prefix here since this check
happens client-side in the navbar component.
The actual route protection uses the server-side
ADMIN_USER_ID check in middleware.

---

## DATABASE QUERIES FOR ADMIN DATA

Most admin data comes from existing tables.
No new tables needed except one:

```sql
-- Track API usage for cost monitoring
CREATE TABLE api_usage_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES profiles(id),
  api_type     TEXT NOT NULL,  -- 'lesson' | 'quiz' | 'insight' | 'simplify'
  tokens_used  INT,
  cost_usd     DECIMAL(10,6),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE api_usage_log ENABLE ROW LEVEL SECURITY;
-- Only admin can read this table
CREATE POLICY "admin_only" ON api_usage_log
  USING (auth.uid() = 'YOUR_ADMIN_USER_ID_HERE'::uuid);
```

Update all AI routes to log usage after each call:
```ts
// After every successful Claude API call:
await supabase.from('api_usage_log').insert({
  user_id: userId,
  api_type: 'lesson', // or quiz, insight, simplify
  tokens_used: response.usage.input_tokens + response.usage.output_tokens,
  cost_usd: calculateCost(response.usage)
})
```

---

## ADMIN DESIGN SYSTEM

Use the same Cognara design tokens but with one difference:

Admin surfaces use a slightly warmer tint to distinguish
from user-facing pages:

```css
/* Admin only — add to admin layout */
--admin-surface: #13110E;
--admin-surface-alt: #1A1714;
--admin-accent: #F59E0B; /* amber — admin color */
```

Admin page headings use amber instead of blue to visually
signal "you are in admin mode" at a glance.

---

## SUMMARY OF ALL FILES TO CREATE

1. Middleware update — protect all /admin routes
2. app/admin/layout.tsx — admin shell with sidebar
3. app/admin/page.tsx — overview with stats and charts
4. app/admin/users/page.tsx — user list with search and filters
5. app/admin/users/[userId]/page.tsx — individual user detail
6. app/admin/activity/page.tsx — learning analytics
7. app/admin/content/page.tsx — content quality monitor
8. app/admin/system/page.tsx — service status and API costs
9. api_usage_log table in Supabase
10. Update all AI routes to log usage
11. Add admin link to navbar dropdown (only visible to you)
12. Add ADMIN_USER_ID and NEXT_PUBLIC_ADMIN_USER_ID to .env.local

Build in this order:
Overview page first → Users page → Activity → Content → System

Test by logging in as your account and visiting /admin.
Then log out, create a test account, log in as test user,
try visiting /admin — verify you get redirected to /dashboard.

Confirm when complete.
```
