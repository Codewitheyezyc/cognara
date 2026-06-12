# DESIGN.md — Cognara
## AI Learning Operating System

> "Your mind. Your path. Your era."

---

## Brand Identity

**Product:** Cognara — an AI-powered learning OS that generates personalized roadmaps, lessons, and quizzes dynamically. Every learner gets a unique journey.

**Audience:** Self-driven learners aged 18–40 who want structured, intelligent, accelerated learning without the noise of generic platforms.

**Brand personality:** Intelligent. Focused. Personal. Like having the world's best mentor who knows exactly where you are and where you're going.

**The promise:** You don't browse Cognara. Cognara builds itself around you.

---

## Design Token System

### Color Palette

```
--color-bg:           #0A0C14   // Deep space black — primary background
--color-surface:      #111520   // Slightly lifted — cards, panels
--color-surface-alt:  #171C2E   // Elevated surfaces — modals, sidebars
--color-border:       #1E2540   // Subtle borders
--color-primary:      #5B8EFF   // Cognara Blue — the learning signal
--color-primary-glow: #3D6AFF20 // Ambient glow behind key elements
--color-accent:       #A78BFA   // Violet — AI-generated content indicator
--color-accent-warm:  #F59E0B   // Amber — streaks, achievements, alerts
--color-text-1:       #F0F4FF   // Primary text — near white with blue tint
--color-text-2:       #8B95B3   // Secondary text — muted
--color-text-3:       #4A5272   // Disabled / placeholder
--color-success:      #34D399   // Correct answers, completions
--color-error:        #F87171   // Wrong answers, errors
```

**Design rationale:** Deep space palette grounds the platform in focus and seriousness. The Cognara Blue (#5B8EFF) is the primary learning signal — it appears on CTAs, progress, and active states. Violet (#A78BFA) is reserved for AI-generated content exclusively, training users to visually distinguish human-structured vs AI-generated content. Amber is celebratory — streaks, milestones only.

---

### Typography

```
Display:  "Sora" (Google Fonts) — geometric, modern, slightly futuristic
          Used for headings, lesson titles, dashboard headers
          Weights: 400, 600, 700

Body:     "Inter" — clean, neutral, highly legible at all sizes
          Used for all body text, descriptions, UI labels
          Weights: 400, 500

Mono:     "JetBrains Mono" — for code examples, quiz code blocks
          Weights: 400, 500
```

**Type Scale:**
```
--text-xs:   11px / 1.5
--text-sm:   13px / 1.6
--text-base: 15px / 1.65
--text-lg:   18px / 1.5
--text-xl:   22px / 1.4
--text-2xl:  28px / 1.3
--text-3xl:  36px / 1.2
--text-4xl:  48px / 1.1
--text-hero: 64px / 1.05

Letter-spacing:
  Headings: -0.02em
  Body:      0em
  Eyebrows: +0.12em uppercase
```

---

### Spacing & Layout

```
Base unit: 4px
--space-1: 4px    --space-2: 8px    --space-3: 12px
--space-4: 16px   --space-5: 20px   --space-6: 24px
--space-8: 32px   --space-10: 40px  --space-12: 48px
--space-16: 64px  --space-20: 80px  --space-24: 96px

Border radius:
  --radius-sm:  6px   (inputs, badges)
  --radius-md:  10px  (cards)
  --radius-lg:  16px  (panels, modals)
  --radius-xl:  24px  (hero sections)
  --radius-full: 9999px (pills, avatars)

Max content width:  1280px
Dashboard sidebar:  260px
Main content:       flex-1 (fills remaining)
```

---

### Shadows & Elevation

```
--shadow-sm:  0 1px 3px rgba(0,0,0,0.4)
--shadow-md:  0 4px 16px rgba(0,0,0,0.5)
--shadow-lg:  0 8px 32px rgba(0,0,0,0.6)
--shadow-glow-blue:   0 0 24px rgba(91,142,255,0.2)
--shadow-glow-violet: 0 0 20px rgba(167,139,250,0.15)
```

---

## Signature Element: The Learning Pulse

The **Learning Pulse** is the single visual device that makes Cognara unmistakable.

On the user's dashboard, behind the active lesson card, there is a **slow-breathing ambient gradient** — a radial glow that pulses at 4-second intervals between the primary blue and violet tones. It communicates: *the system is alive and thinking about you.*

Every AI-generated piece of content (lesson, quiz, roadmap phase) has a subtle **violet left-border** + a micro **"AI" badge** — a 6px label reading "GENERATED" in violet mono text. This teaches users to trust the content while understanding its nature.

---

## Page-by-Page Design

---

### 1. Marketing / Landing Page (`/`)

**Layout concept:**
```
┌─────────────────────────────────────────────┐
│  Logo          Nav Links          Sign Up    │  ← sticky, glass nav
├─────────────────────────────────────────────┤
│                                             │
│     HERO: Full-width, dark space bg         │
│     Animated node-graph faintly in BG       │
│                                             │
│  [eyebrow]  THE FUTURE OF SELF-LEARNING     │
│                                             │
│  Master Anything.                           │
│  At the Speed of AI.                        │
│                                             │
│  [sub] Cognara builds your personal         │
│  learning path, generates every lesson,     │
│  and adapts to how your mind works.         │
│                                             │
│  [Start Learning Free] [Watch Demo]         │
│                                             │
├─────────────────────────────────────────────┤
│  How it works  (3 animated steps)           │
├─────────────────────────────────────────────┤
│  Feature grid  (6 cards)                    │
├─────────────────────────────────────────────┤
│  Testimonials                               │
├─────────────────────────────────────────────┤
│  CTA banner + Footer                        │
└─────────────────────────────────────────────┘
```

Background hero effect: SVG-based animated constellation/node network using `requestAnimationFrame` — subtle, slow-moving connections between points. Represents the learning graph being built for the user.

---

### 2. Onboarding (`/onboarding`)

Multi-step flow. Full-screen, one question at a time. Similar to Typeform but darker and premium.

```
Step 1: "What's your name?"
Step 2: "What do you want to master?" (free text + popular suggestions as chips)
Step 3: "How much time per day?" (visual selector: 15min / 30min / 1hr / 2hr+)
Step 4: "What's your experience level?" (Beginner / Some knowledge / Intermediate)
Step 5: Cognara builds your roadmap → loading screen with AI activity indicator
Step 6: "Your path is ready" → CTA to dashboard
```

Progress bar at top: thin blue line, updates per step.

---

### 3. Dashboard (`/dashboard`)

```
┌──────────┬──────────────────────────────────┐
│          │  Good morning, Isaac             │
│ SIDEBAR  │  Continue your path ─────────── │
│          │  [Lesson card - active]          │
│ Home     │                                  │
│ My Path  │  Your Roadmap (phase view)       │
│ Lessons  │  ┌──────┐ ┌──────┐ ┌──────┐    │
│ Quizzes  │  │ Ph 1 │▶│ Ph 2 │ │ Ph 3 │    │
│ Progress │  └──────┘ └──────┘ └──────┘    │
│ Settings │                                  │
│          │  Stats row                       │
│ [Avatar] │  Streak │ Score │ Completed     │
└──────────┴──────────────────────────────────┘
```

Sidebar: dark surface, active item has blue left-border + blue text.

---

### 4. Lesson View (`/dashboard/lesson/[id]`)

```
┌──────────────────────────────────────────────┐
│ ← Back to Path    Variables in JS    [Phase] │
├──────────────────────────────────────────────┤
│                                              │
│  [AI badge: GENERATED]                       │
│                                              │
│  ◆ What is a Variable?                      │
│  Body text explanation...                    │
│                                              │
│  ◈ Example                                  │
│  ┌──────────────────────────┐               │
│  │  const name = "Isaac";   │  [copy]       │
│  └──────────────────────────┘               │
│                                              │
│  ◈ Real-World Use Case                      │
│  ...                                         │
│                                              │
│  ◈ Practice Exercise                        │
│  ...                                         │
│                                              │
│  [Mark Complete]   [Take Quiz →]            │
└──────────────────────────────────────────────┘
```

Reading width capped at 720px. Section dividers use a thin `--color-border` rule. Code blocks use JetBrains Mono on `--color-surface-alt` with the Cognara Blue syntax accent.

---

### 5. Quiz View (`/dashboard/quiz/[id]`)

Full-screen focus mode. One question visible at a time.

Question types: Multiple choice, fill-in-the-blank, code output prediction.

After submission: Instant feedback card — green (correct) or red (wrong) + AI explanation of the correct answer.

---

### 6. Progress (`/dashboard/progress`)

- Streak calendar (GitHub-style heatmap in blue tones)
- Score over time (line chart)
- Weak areas (horizontal bar chart)
- AI insight card: "You've struggled with closures. Want a review lesson?"

---

## Component Library

### Buttons
```
Primary:   bg-primary, text-white, hover → glow shadow
Secondary: bg-transparent, border-border, text-text-1
Ghost:     no border, text-text-2, hover → surface
Danger:    bg-error/10, text-error
```

### Cards
```
Default:   bg-surface, border border-border, radius-md, p-6
Elevated:  bg-surface-alt, shadow-md
AI Card:   left-border 2px solid --color-accent (violet)
```

### Badges
```
AI:        bg-accent/10, text-accent, text-xs, mono font, uppercase
Phase:     bg-primary/10, text-primary
Complete:  bg-success/10, text-success
```

### Progress Bar
```
Track:     bg-border, h-1.5, radius-full
Fill:      bg-primary, animated width transition
```

---

## Animation Guidelines

```
Transition default: 150ms ease
Hover lift:         translateY(-2px) + shadow-md
Page enter:         opacity 0→1 + translateY(8px→0), 200ms
Skeleton loading:   shimmer from surface → surface-alt
Pulse (AI):         4s ease-in-out infinite, opacity 0.6→1→0.6
```

Respect `prefers-reduced-motion` — all animations disabled when set.

---

## Responsive Breakpoints

```
Mobile:   < 768px  → sidebar collapses to bottom nav
Tablet:   768–1024px → sidebar icon-only mode
Desktop:  > 1024px → full sidebar
```

---

## Iconography

Use **Lucide React** exclusively. Stroke width: 1.5. Size: 18px default, 20px for sidebar, 16px for inline.

Key icons:
- `Zap` — AI generation
- `Map` — roadmap/path
- `BookOpen` — lessons
- `CheckCircle2` — completions
- `Flame` — streaks
- `BrainCircuit` — AI insights
- `BarChart2` — progress
