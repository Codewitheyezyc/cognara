# COGNARA — Master Antigravity Prompt
## AI Learning Operating System

---

Use this prompt to initialize Cognara in Antigravity. Paste it as the project-level system prompt.

---

```
You are building COGNARA — an AI-powered Learning Operating System.

Stack: Next.js latest (App Router), Supabase (Auth + PostgreSQL + Storage), Anthropic Claude API, TanStack Query, React Hook Form + Zod, TanStack Table, Tailwind CSS, Shadcn/ui, Recharts, Lucide React, Vercel.

Read DESIGN.md, ARCHITECTURE.md, and AI-WORKFLOW.md before writing any code.

---

DESIGN SYSTEM SUMMARY:

Colors (CSS variables in globals.css):
  --color-bg: #0A0C14
  --color-surface: #111520
  --color-surface-alt: #171C2E
  --color-border: #1E2540
  --color-primary: #5B8EFF
  --color-primary-glow: #3D6AFF20
  --color-accent: #A78BFA
  --color-accent-warm: #F59E0B
  --color-text-1: #F0F4FF
  --color-text-2: #8B95B3
  --color-text-3: #4A5272
  --color-success: #34D399
  --color-error: #F87171

Typography:
  Display: Sora (Google Fonts) — headings
  Body: Inter — all UI text
  Mono: JetBrains Mono — code blocks

Brand name: Cognara
Tagline: "Your mind. Your path. Your era."

---

ROUTING:

/ — Landing page (marketing)
/login — Auth
/signup — Auth
/onboarding — Multi-step goal setup (protected, redirect here if no active goal)
/dashboard — Home (protected)
/dashboard/path — Full roadmap view
/dashboard/lesson/[id] — Lesson viewer
/dashboard/quiz/[id] — Quiz mode
/dashboard/progress — Progress analytics

---

DATABASE (PostgreSQL via Supabase):

Tables: profiles, learning_goals, roadmaps, roadmap_phases, lessons, lesson_progress, quizzes, quiz_attempts, streaks

RLS: Enabled on all tables. Pattern: auth.uid() = user_id

---

AI ROUTES (Next.js API routes, server-side only):

POST /api/ai/generate-roadmap
POST /api/ai/generate-lesson
POST /api/ai/generate-quiz
POST /api/ai/generate-insight

All AI calls use claude-sonnet-4-6.
All responses are JSON only — no markdown, no preamble.
All prompts and message builders live in lib/ai/prompts.ts.

---

COMPONENT CONVENTIONS:

- Lucide React for icons (stroke 1.5, size 18px default)
- All buttons use the design system: Primary / Secondary / Ghost / Danger
- AI-generated content always shows a violet left-border + "GENERATED" badge (text-xs, mono, uppercase, --color-accent)
- Cards: bg-surface, border border-border, rounded-[10px], p-6
- Loading states: skeleton shimmer using surface → surface-alt
- Error states: show retry UI, never expose raw error messages

---

CODE RULES:

- TypeScript strict mode throughout
- No any types — use proper interfaces from types/
- All Supabase calls go through lib/supabase/server.ts (server) or lib/supabase/client.ts (client)
- Never expose SUPABASE_SERVICE_ROLE_KEY or ANTHROPIC_API_KEY to the browser
- All forms: React Hook Form + Zod schema
- All server state: TanStack Query with appropriate staleTime
- Responsive: mobile-first, sidebar collapses to bottom nav on mobile

---

BUILD SEQUENCE:

Phase 1 — Foundation
  1. Project setup (Next.js, Tailwind, Shadcn, fonts, CSS variables)
  2. Supabase project + all table migrations + RLS policies
  3. Auth flow (signup, login, middleware, session handling)
  4. DB trigger: auto-create profile on signup

Phase 2 — Onboarding + Roadmap
  5. Onboarding multi-step form
  6. POST /api/ai/generate-roadmap + save to DB
  7. Roadmap display page

Phase 3 — Lessons
  8. Lesson list from roadmap phases
  9. POST /api/ai/generate-lesson (lazy — generates on first open)
  10. Lesson viewer UI (renders GeneratedLesson JSON)
  11. Mark complete → update lesson_progress

Phase 4 — Quizzes
  12. POST /api/ai/generate-quiz (generates on quiz start)
  13. Quiz UI (one question at a time, instant feedback)
  14. Score calculation + save to quiz_attempts
  15. Update streak after completion

Phase 5 — Progress & Insights
  16. Progress page (heatmap, score chart, weak areas)
  17. POST /api/ai/generate-insight
  18. Dashboard AI insight card

Phase 6 — Polish
  19. Landing page (marketing)
  20. Responsive mobile layout
  21. Loading skeletons on all async pages
  22. Rate limiting on AI routes
  23. Final Vercel deployment + env var audit

---

When I say "BUILD PHASE [N]", implement all steps in that phase completely before stopping.
When I say "BUILD STEP [N]", implement only that step.
Always read the relevant .md file section before writing code for that feature.
```
