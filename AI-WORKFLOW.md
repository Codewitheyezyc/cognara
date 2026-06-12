# AI-WORKFLOW.md — Cognara
## AI Learning Operating System

All AI features run through the Anthropic Claude API (claude-sonnet-4-6).
Every prompt is structured, constrained, and returns JSON for database storage.

---

## Core Principle

**The AI does not chat. It generates structured learning artifacts.**

Every Claude call returns JSON. No prose explanations, no preambles.
The UI renders the JSON beautifully. The AI is the engine, not the interface.

---

## 1. Roadmap Generation

### Trigger
User completes onboarding → submits goal → `POST /api/ai/generate-roadmap`

### System Prompt

```
You are Cognara's curriculum architect. Your job is to create a precise, phased learning roadmap for a student based on their goal.

Return ONLY valid JSON. No markdown, no explanations, no preamble.

The JSON must follow this exact structure:
{
  "title": "string - roadmap title",
  "description": "string - 1-2 sentence overview",
  "estimated_weeks": number,
  "phases": [
    {
      "phase_number": number,
      "title": "string - phase title",
      "description": "string - what this phase covers",
      "duration_weeks": number,
      "lessons": [
        {
          "order_index": number,
          "title": "string - specific lesson title",
          "description": "string - 1 sentence of what student will learn"
        }
      ]
    }
  ]
}

Rules:
- Create 3 to 6 phases depending on complexity
- Each phase should have 4 to 8 lessons
- Lessons must be specific (not "Introduction to JavaScript" but "Variables and Data Types in JavaScript")
- Sequence must be logical — foundational concepts before advanced
- Respect the student's daily time commitment when estimating durations
- Match depth to their stated experience level
```

### User Message

```
Student Goal: {goalText}
Subject: {subject}
Experience Level: {level}
Daily Study Time: {dailyMinutes} minutes
```

### Post-processing

```ts
// lib/ai/roadmap.ts
const parsed = JSON.parse(responseText)
// Save roadmap → save phases → save lesson stubs (content=null)
// Return roadmapId to client
```

---

## 2. Lesson Generation

### Trigger
User opens a lesson for the first time → `POST /api/ai/generate-lesson`
If `lessons.content` is null → generate and cache. If populated → serve from DB.

### System Prompt

```
You are Cognara's master teacher. Generate a complete, engaging lesson on the given topic.

Return ONLY valid JSON. No markdown, no preamble.

Structure:
{
  "title": "string",
  "estimated_minutes": number,
  "sections": [
    {
      "type": "explanation" | "example" | "code" | "analogy" | "exercise" | "use_case",
      "heading": "string",
      "body": "string - the content (use \\n for line breaks)",
      "code_language": "string - only present when type is 'code'",
      "code_snippet": "string - only present when type is 'code'"
    }
  ],
  "key_takeaways": ["string", "string", "string"],
  "next_lesson_preview": "string - one sentence teaser"
}

Rules:
- Always start with an 'explanation' section
- Include at least one 'code' section for technical subjects
- Include at least one 'analogy' section to make abstract concepts concrete
- Include one 'exercise' section with a practical task
- Include one 'use_case' section showing real-world application
- Write for the student's experience level
- Be specific, clear, and energetic — not dry or academic
- key_takeaways must be 3 concise bullet-ready strings
```

### User Message

```
Lesson Topic: {lessonTitle}
Phase Context: {phaseTitle}
Subject: {subject}
Student Level: {level}
```

### Lazy Generation Strategy

```ts
// In GET /dashboard/lesson/[id]
const lesson = await getLesson(lessonId)

if (!lesson.content) {
  // Show skeleton UI immediately
  // Trigger generation in background
  const content = await generateLesson(lesson)
  await saveLesson(lessonId, content)
  return content
}

return lesson.content
```

This avoids pre-generating thousands of lessons. Each lesson is generated once on first open, then cached in the DB forever.

---

## 3. Quiz Generation

### Trigger
User clicks "Take Quiz" after completing a lesson → `POST /api/ai/generate-quiz`

### System Prompt

```
You are Cognara's assessment designer. Create a quiz to test understanding of the lesson content provided.

Return ONLY valid JSON. No markdown, no preamble.

Structure:
{
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice" | "fill_blank" | "true_false",
      "question": "string",
      "options": ["string", "string", "string", "string"],  // only for multiple_choice
      "correct_answer": "string",
      "explanation": "string - why this is correct, shown after submission"
    }
  ]
}

Rules:
- Generate exactly 5 questions
- Use at least 2 multiple_choice questions
- Use at least 1 fill_blank question
- Vary difficulty: 2 easy, 2 medium, 1 hard
- Questions must directly test the lesson content — not trivia
- Correct answers for fill_blank must be a single word or short phrase
- Explanations must be educational — teach, don't just confirm
- For multiple_choice: exactly 4 options, only 1 correct
```

### User Message

```
Lesson Title: {lessonTitle}
Subject: {subject}
Student Level: {level}
Lesson Summary: {keyTakeaways joined as bullet list}
```

### Scoring

```ts
// After quiz submission
const score = questions.reduce((total, q, i) => {
  const userAnswer = answers[i].toLowerCase().trim()
  const correctAnswer = q.correct_answer.toLowerCase().trim()
  return userAnswer === correctAnswer ? total + 20 : total  // 5 questions × 20 = 100
}, 0)

const passed = score >= 60

// Save to quiz_attempts
// Update streak if passed
// Trigger insight regeneration if score < 60
```

---

## 4. Personalized AI Insights

### Trigger
- After each quiz attempt
- When user visits `/dashboard/progress`
- Scheduled: once per day (via Supabase cron or Vercel cron)

### System Prompt

```
You are Cognara's personal learning coach. Analyze the student's performance data and generate one short, honest, motivating insight.

Return ONLY valid JSON. No markdown, no preamble.

Structure:
{
  "insight": "string - 2 to 3 sentences, personal and specific",
  "weak_areas": ["string", "string"],   // up to 3 topics the student struggled with
  "strong_areas": ["string"],           // up to 2 topics student excelled at
  "recommendation": "string - one specific action to take today",
  "recommended_lesson_title": "string | null"  // title of a lesson to review, or null
}

Rules:
- Be honest about weaknesses — do not sugarcoat
- Be specific — reference actual topics, not generic encouragement
- Keep insight conversational, like a mentor not a robot
- Recommendation must be one clear, actionable sentence
- If no clear weakness, focus on what to tackle next
```

### User Message

```
Student Name: {name}
Learning Goal: {goalText}
Lessons Completed: {completedCount} of {totalCount}
Recent Quiz Scores (last 5): {scores}
Lowest scoring topics: {weakTopics}
Current Streak: {streak} days
```

---

## 5. Content Adaptation (Future Phase)

When a student repeatedly scores below 60% on quizzes in a topic:

### Trigger
3+ failed attempts on quizzes in the same phase

### Action
```
POST /api/ai/generate-remedial-lesson
```

This generates a shorter, simpler version of the failed lesson with:
- A different teaching approach (more analogies, simpler language)
- Smaller concept scope
- A shorter quiz (3 questions instead of 5)

This makes Cognara truly adaptive — not just generating content, but regenerating it differently when the student struggles.

---

## Rate Limiting & Cost Control

### Per-user limits (V1)
```
Roadmap generation:     1 active roadmap per user (new goal replaces old)
Lesson generation:      Generated once, cached forever — no re-generation
Quiz generation:        1 quiz per lesson (generated once, cached)
Insight generation:     Max 3 per day per user
Remedial lessons:       Max 2 per phase
```

### Server-side enforcement
```ts
// lib/ai/rateLimit.ts
const key = `insight:${userId}:${today}`
const count = await redis.incr(key)  // or use Supabase table
if (count > 3) throw new Error('Daily insight limit reached')
```

### Token estimates per call (approximate)
```
Roadmap:  ~1,500 input + ~1,200 output = ~2,700 tokens
Lesson:   ~800 input + ~1,500 output  = ~2,300 tokens
Quiz:     ~1,000 input + ~800 output  = ~1,800 tokens
Insight:  ~600 input + ~400 output    = ~1,000 tokens
```

---

## Error Handling

All AI routes follow this pattern:

```ts
try {
  const response = await anthropic.messages.create({ ... })
  const text = response.content[0].text
  const parsed = JSON.parse(text)
  return NextResponse.json({ data: parsed })
} catch (err) {
  if (err instanceof SyntaxError) {
    // Claude returned malformed JSON — retry once with stricter prompt
    return retryWithStricterPrompt(...)
  }
  console.error('[AI Error]', err)
  return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
}
```

The UI handles AI errors gracefully:
- Lesson fails → show retry button with friendly message
- Quiz fails → show "Generate quiz" button
- Insight fails → silently skip, don't surface error to user

---

## Prompts File Structure

```ts
// lib/ai/prompts.ts

export const ROADMAP_SYSTEM_PROMPT = `...`
export const LESSON_SYSTEM_PROMPT = `...`
export const QUIZ_SYSTEM_PROMPT = `...`
export const INSIGHT_SYSTEM_PROMPT = `...`

export function buildRoadmapUserMessage(params: RoadmapParams): string { ... }
export function buildLessonUserMessage(params: LessonParams): string { ... }
export function buildQuizUserMessage(params: QuizParams): string { ... }
export function buildInsightUserMessage(params: InsightParams): string { ... }
```

All prompts live in one file. Easy to tune, version, and test without touching route logic.

---

## AI Content Types Reference

```ts
// types/ai.ts

export type LessonSectionType =
  | 'explanation'
  | 'example'
  | 'code'
  | 'analogy'
  | 'exercise'
  | 'use_case'

export interface LessonSection {
  type: LessonSectionType
  heading: string
  body: string
  code_language?: string
  code_snippet?: string
}

export interface GeneratedLesson {
  title: string
  estimated_minutes: number
  sections: LessonSection[]
  key_takeaways: string[]
  next_lesson_preview: string
}

export type QuestionType = 'multiple_choice' | 'fill_blank' | 'true_false'

export interface QuizQuestion {
  id: string
  type: QuestionType
  question: string
  options?: string[]
  correct_answer: string
  explanation: string
}

export interface GeneratedQuiz {
  questions: QuizQuestion[]
}

export interface GeneratedInsight {
  insight: string
  weak_areas: string[]
  strong_areas: string[]
  recommendation: string
  recommended_lesson_title: string | null
}
```
