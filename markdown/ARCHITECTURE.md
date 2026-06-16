# ARCHITECTURE.md — Cognara
## AI Learning Operating System

---

## Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Frontend       | Next.js latest (App Router)             |
| Styling        | Tailwind CSS + CSS variables        |
| UI Components  | Shadcn/ui (customized to Cognara DS)|
| State          | TanStack Query (server state)       |
| Forms          | React Hook Form + Zod               |
| Tables/Lists   | TanStack Table                      |
| Charts         | Recharts                            |
| Auth           | Supabase Auth (email/password + OAuth)|
| Database       | PostgreSQL via Supabase             |
| File Storage   | Supabase Storage                    |
| AI             | Anthropic Claude API (claude-sonnet-4-6) |
| Deployment     | Vercel                              |
| Email          | Resend                              |

---

## Folder Structure

```
cognara/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx                  # Landing page
│   │   ├── layout.tsx
│   │   └── pricing/page.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   ├── onboarding/
│   │   └── page.tsx                  # Multi-step goal setup
│   ├── dashboard/
│   │   ├── layout.tsx                # Sidebar + shell
│   │   ├── page.tsx                  # Home / overview
│   │   ├── path/page.tsx             # Full roadmap view
│   │   ├── lesson/[id]/page.tsx      # AI lesson renderer
│   │   ├── quiz/[id]/page.tsx        # Quiz mode
│   │   └── progress/page.tsx         # Analytics
│   └── api/
│       ├── ai/
│       │   ├── generate-roadmap/route.ts
│       │   ├── generate-lesson/route.ts
│       │   ├── generate-quiz/route.ts
│       │   └── generate-insight/route.ts
│       └── webhooks/
│           └── stripe/route.ts       # future monetization
│
├── components/
│   ├── ui/                           # Shadcn base components
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── DashboardShell.tsx
│   │   ├── Topbar.tsx
│   │   └── MobileNav.tsx
│   ├── onboarding/
│   │   ├── StepGoal.tsx
│   │   ├── StepTime.tsx
│   │   ├── StepLevel.tsx
│   │   └── GeneratingPath.tsx
│   ├── dashboard/
│   │   ├── ActiveLessonCard.tsx
│   │   ├── RoadmapPhaseCard.tsx
│   │   ├── StatsRow.tsx
│   │   └── AIInsightCard.tsx
│   ├── lesson/
│   │   ├── LessonContent.tsx
│   │   ├── CodeBlock.tsx
│   │   ├── AIBadge.tsx
│   │   └── LessonSkeleton.tsx
│   ├── quiz/
│   │   ├── QuestionCard.tsx
│   │   ├── AnswerFeedback.tsx
│   │   └── QuizComplete.tsx
│   └── progress/
│       ├── StreakHeatmap.tsx
│       ├── ScoreChart.tsx
│       └── WeakAreasChart.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser client
│   │   ├── server.ts                 # Server client (cookies)
│   │   └── middleware.ts
│   ├── ai/
│   │   ├── prompts.ts                # All system prompts
│   │   ├── roadmap.ts                # Roadmap generation logic
│   │   ├── lesson.ts                 # Lesson generation logic
│   │   └── quiz.ts                   # Quiz generation logic
│   ├── hooks/
│   │   ├── useRoadmap.ts
│   │   ├── useLesson.ts
│   │   ├── useProgress.ts
│   │   └── useStreak.ts
│   └── utils.ts
│
├── types/
│   ├── supabase.ts                   # Generated DB types
│   ├── ai.ts                         # AI response shapes
│   └── app.ts                        # App-level types
│
├── styles/
│   └── globals.css                   # CSS variables + Tailwind base
│
├── middleware.ts                      # Auth route protection
├── DESIGN.md
├── ARCHITECTURE.md
└── AI-WORKFLOW.md
```

---

## Database Schema

### `profiles`
```sql
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### `learning_goals`
```sql
CREATE TABLE learning_goals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_text    TEXT NOT NULL,           -- "I want to become a frontend developer"
  subject      TEXT NOT NULL,           -- "Frontend Development"
  level        TEXT NOT NULL,           -- beginner | intermediate | advanced
  daily_minutes INT NOT NULL DEFAULT 30,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### `roadmaps`
```sql
CREATE TABLE roadmaps (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id      UUID NOT NULL REFERENCES learning_goals(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id),
  title        TEXT NOT NULL,
  description  TEXT,
  ai_generated BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### `roadmap_phases`
```sql
CREATE TABLE roadmap_phases (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id   UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  phase_number INT NOT NULL,
  title        TEXT NOT NULL,           -- "Phase 1: Foundations"
  description  TEXT,
  duration_days INT,
  order_index  INT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### `lessons`
```sql
CREATE TABLE lessons (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id     UUID NOT NULL REFERENCES roadmap_phases(id) ON DELETE CASCADE,
  roadmap_id   UUID NOT NULL REFERENCES roadmaps(id),
  user_id      UUID NOT NULL REFERENCES profiles(id),
  title        TEXT NOT NULL,
  slug         TEXT,
  content      JSONB,           -- structured AI-generated content
  order_index  INT NOT NULL,
  ai_generated BOOLEAN DEFAULT TRUE,
  generated_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### `lesson_progress`
```sql
CREATE TABLE lesson_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id),
  lesson_id       UUID NOT NULL REFERENCES lessons(id),
  status          TEXT NOT NULL DEFAULT 'not_started',  -- not_started | in_progress | completed
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  time_spent_secs INT DEFAULT 0,
  UNIQUE(user_id, lesson_id)
);
```

### `quizzes`
```sql
CREATE TABLE quizzes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id    UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id),
  questions    JSONB NOT NULL,    -- array of question objects
  ai_generated BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### `quiz_attempts`
```sql
CREATE TABLE quiz_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id         UUID NOT NULL REFERENCES quizzes(id),
  user_id         UUID NOT NULL REFERENCES profiles(id),
  answers         JSONB NOT NULL,    -- user's submitted answers
  score           INT NOT NULL,       -- 0–100
  passed          BOOLEAN NOT NULL,
  time_spent_secs INT DEFAULT 0,
  attempted_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### `streaks`
```sql
CREATE TABLE streaks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) UNIQUE,
  current_streak   INT DEFAULT 0,
  longest_streak   INT DEFAULT 0,
  last_activity_at DATE,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Row Level Security (RLS)

Enable RLS on ALL tables. Standard pattern:

```sql
-- profiles: user can only read/update their own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_profile" ON profiles
  USING (auth.uid() = id);

-- All other tables follow the same pattern:
-- USING (auth.uid() = user_id)
-- Apply to: learning_goals, roadmaps, roadmap_phases,
--           lessons, lesson_progress, quizzes, quiz_attempts, streaks
```

---

## API Routes

### `POST /api/ai/generate-roadmap`
**Input:** `{ goalText, subject, level, dailyMinutes }`
**Action:** Calls Claude → returns structured roadmap JSON → saves to DB
**Returns:** `{ roadmapId, phases[] }`

### `POST /api/ai/generate-lesson`
**Input:** `{ lessonId, phaseTitle, lessonTitle, subject, userLevel }`
**Action:** Calls Claude → returns lesson content JSON → saves to DB
**Returns:** `{ content: LessonContent }`

### `POST /api/ai/generate-quiz`
**Input:** `{ lessonId, lessonContent, subject, userLevel }`
**Action:** Calls Claude → returns quiz questions JSON → saves to DB
**Returns:** `{ quizId, questions[] }`

### `POST /api/ai/generate-insight`
**Input:** `{ userId }` (reads quiz attempts + lesson progress from DB)
**Action:** Calls Claude with performance summary → returns personalized insight
**Returns:** `{ insight: string, weakAreas: string[], recommendedLesson?: string }`

---

## Authentication Flow

```
1. User signs up → Supabase Auth creates auth.users record
2. DB trigger creates profiles row automatically
3. Middleware checks session on all /dashboard/* and /onboarding routes
4. If no session → redirect to /login
5. If session but no active goal → redirect to /onboarding
6. If session + active goal → render dashboard
```

**Middleware pattern:**
```ts
// middleware.ts
const protectedRoutes = ['/dashboard', '/onboarding']
const authRoutes = ['/login', '/signup']
// Redirect unauthenticated users away from protected routes
// Redirect authenticated users away from auth routes
```

---

## Caching Strategy (TanStack Query)

```ts
// Roadmap: stale after 10 minutes (rarely changes)
useQuery({ queryKey: ['roadmap', goalId], staleTime: 10 * 60 * 1000 })

// Lesson content: stale after 5 minutes (generated once, cached)
useQuery({ queryKey: ['lesson', lessonId], staleTime: 5 * 60 * 1000 })

// Progress: stale after 30 seconds (changes frequently)
useQuery({ queryKey: ['progress', userId], staleTime: 30 * 1000 })

// Streak: stale after 60 seconds
useQuery({ queryKey: ['streak', userId], staleTime: 60 * 1000 })
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # server-only, never expose to client

# Anthropic
ANTHROPIC_API_KEY=               # server-only

# App
NEXT_PUBLIC_APP_URL=

# Email (Resend)
RESEND_API_KEY=
```

---

## Deployment Checklist (Vercel)

- [ ] All env vars set in Vercel dashboard
- [ ] `SUPABASE_SERVICE_ROLE_KEY` marked as sensitive (not exposed)
- [ ] `ANTHROPIC_API_KEY` marked as sensitive
- [ ] RLS enabled on all tables
- [ ] Supabase Auth redirect URLs updated for production domain
- [ ] Vercel Edge Functions used for AI routes (lower cold start)
- [ ] Rate limiting on AI routes (prevent abuse)
