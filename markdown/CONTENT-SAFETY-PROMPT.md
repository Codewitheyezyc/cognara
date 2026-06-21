# COGNARA — Content Safety & Subject Validation Layer
## All user inputs must pass validation before AI generation begins

---

```
Implement a content safety and subject validation system for Cognara.
Every learning goal a user submits must be checked before any roadmap,
lesson, or quiz is generated. Read everything carefully before coding.

---

## THE CORE RULE

Cognara is a learning platform. It exists to educate.
It accepts any goal that is educational, skill-based,
academic, professional, or personal development focused.
It rejects anything harmful, negative, illegal, or
inappropriate — especially since our users include
primary school and secondary school children.

---

## PART 1 — WHAT COGNARA ACCEPTS

Cognara accepts ANY learning goal that falls into
these categories:

ACADEMIC SUBJECTS (all levels — primary, secondary, university):
- Mathematics (primary maths, WAEC maths, calculus, statistics)
- English Language (grammar, comprehension, essay writing, literature)
- Biology, Chemistry, Physics, Further Mathematics
- Agricultural Science, Geography, Government, Economics
- History, Civic Education, Social Studies, Christian/Islamic Studies
- Computer Science, Data Processing
- French, Yoruba, Igbo, Hausa, and other languages
- Fine Art, Music, Home Economics, Technical Drawing
- Any subject taught in Nigerian primary, secondary, or university curriculum

PROFESSIONAL AND CAREER SKILLS:
- Web development, mobile development, software engineering
- UI/UX design, graphic design, product design
- Digital marketing, content creation, social media management
- Copywriting, business writing, technical writing
- Data science, machine learning, artificial intelligence
- Cybersecurity (ethical and defensive only)
- Accounting, finance, investment basics, trading fundamentals
- Project management, business strategy, entrepreneurship
- Photography, videography, video editing
- Public speaking, communication skills, leadership

VOCATIONAL AND PRACTICAL SKILLS:
- Tailoring, fashion design, textile arts
- Catering, cooking, baking, food science
- Carpentry, furniture making, interior design
- Hairdressing, beauty therapy, nail technology
- Electrical work (theory and safety), plumbing basics
- Auto mechanics theory, engineering fundamentals
- Agriculture, crop science, animal husbandry

PERSONAL DEVELOPMENT:
- Time management, productivity, study skills
- Critical thinking, problem solving, decision making
- Emotional intelligence, self-discipline, goal setting
- Financial literacy, savings, budgeting for individuals
- Health and wellness (general knowledge — not medical advice)
- Sports theory, fitness planning, nutrition basics

ARTS AND CREATIVE:
- Music theory, instrument learning guides, songwriting
- Creative writing, storytelling, screenwriting
- Dance theory, choreography concepts
- Drawing, painting, illustration techniques
- Film making theory, photography composition

---

## PART 2 — WHAT COGNARA REJECTS

Cognara must NEVER generate a roadmap, lesson, or any
content for goals that fall into these categories:

HARMFUL AND DANGEROUS:
- How to make weapons, explosives, or dangerous chemicals
- How to hack systems illegally or damage networks
- How to hurt, harm, or threaten other people
- Drug manufacturing, illegal substance creation
- Anything that teaches how to commit a crime

INAPPROPRIATE FOR A LEARNING PLATFORM:
- Sexual content of any kind
- Violent or graphic content
- Content that degrades any person, group, or religion
- Gambling strategies or illegal betting
- Scamming, fraud, phishing, or deception techniques
- Pyramid schemes or fraudulent business models

HATE AND DISCRIMINATION:
- Content promoting hatred of any ethnic group
- Content promoting discrimination based on religion, gender, or race
- Cult recruitment or extremist ideologies

PRIVACY VIOLATIONS:
- How to spy on people, track someone without consent
- How to steal personal data or passwords

MEDICAL OVERREACH:
- Specific medical diagnoses or treatment plans
  (Cognara can teach biology and health science theory
   but must not diagnose illness or prescribe medicine)

---

## PART 3 — VALIDATION SYSTEM

Create two layers of validation:

LAYER 1 — Client-side keyword check (instant, before API call)
LAYER 2 — AI content check via Claude (thorough, before generation)

---

### LAYER 1 — CLIENT-SIDE KEYWORD FILTER

Create lib/contentSafety/keywordFilter.ts:

```ts
const BLOCKED_KEYWORDS = [
  // Weapons and violence
  'bomb', 'explosive', 'kill', 'murder', 'weapon', 'gun making',
  'poison', 'hurt someone', 'harm people', 'attack',

  // Illegal activities
  'hack into', 'crack password', 'steal data', 'scam people',
  'fraud', 'phishing', 'money laundering', 'drug making',
  'how to cheat', 'pyramid scheme', 'ponzi',

  // Inappropriate
  'sex', 'porn', 'nude', 'naked', 'adult content',

  // Hate
  'hate', 'racist', 'terrorism', 'extremist', 'cult',
]

const SUSPICIOUS_PATTERNS = [
  /how to (hurt|harm|kill|steal|hack|scam)/i,
  /make (a bomb|weapons|drugs|poison)/i,
  /bypass (security|firewall|password)/i,
  /illegal (money|activity|scheme)/i,
]

export interface FilterResult {
  passed: boolean
  reason?: string
}

export function clientSideFilter(goalText: string): FilterResult {
  const lower = goalText.toLowerCase()

  // Check blocked keywords
  for (const keyword of BLOCKED_KEYWORDS) {
    if (lower.includes(keyword)) {
      return {
        passed: false,
        reason: `This type of content is not available on Cognara.
                 Cognara is a learning platform focused on education,
                 skills, and personal growth.`
      }
    }
  }

  // Check suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(goalText)) {
      return {
        passed: false,
        reason: `Cognara only accepts educational and skill-building goals.
                 Please describe what you genuinely want to learn.`
      }
    }
  }

  return { passed: true }
}
```

Apply in the onboarding goal input component:

```tsx
// In the onboarding goal input onChange or onSubmit:
import { clientSideFilter } from '@/lib/contentSafety/keywordFilter'

const handleGoalSubmit = () => {
  const filterResult = clientSideFilter(goalText)

  if (!filterResult.passed) {
    setError(filterResult.reason)
    return  // Stop — do not proceed to next step
  }

  // Proceed to next onboarding step
  proceedToNextStep()
}
```

---

### LAYER 2 — AI CONTENT VALIDATION (Server-Side)

Create app/api/validate-goal/route.ts:

This runs before generate-roadmap.
It sends the user's goal to Claude for intelligent validation.

```ts
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { goalText } = await req.json()

  if (!goalText || goalText.trim().length < 3) {
    return NextResponse.json({
      approved: false,
      reason: 'Please describe your learning goal in more detail.'
    })
  }

  try {
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
      await supabase.from('content_safety_log').insert({
        user_id: user.id,
        goal_text: goalText,
        rejection_reason: result.reason,
        created_at: new Date().toISOString()
      })
    }

    return NextResponse.json(result)

  } catch (err) {
    console.error('[Goal Validation Error]', err)
    // On error default to approved — do not block users due to technical issues
    // The roadmap generation system prompt will catch anything inappropriate
    return NextResponse.json({ approved: true, subject: '', category: 'professional' })
  }
}
```

---

## PART 4 — CONTENT SAFETY LOG TABLE

```sql
CREATE TABLE content_safety_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES profiles(id),
  goal_text       TEXT NOT NULL,
  rejection_reason TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE content_safety_log ENABLE ROW LEVEL SECURITY;
-- Only admin can read this table
CREATE POLICY "admin_only_safety_log" ON content_safety_log
  FOR ALL USING (auth.uid() = 'YOUR_ADMIN_USER_ID'::uuid);
```

Add "Content Safety" tab to admin dashboard at /admin/safety:
Shows all rejected goals with the user ID and reason.
This helps you monitor abuse attempts.

---

## PART 5 — UPDATED ONBOARDING FLOW

Update the onboarding goal submission to call validate-goal
before proceeding:

```tsx
// In onboarding Step 1 (goal input) submit handler:

const handleGoalContinue = async () => {
  setError('')

  // Layer 1: instant client-side check
  const clientCheck = clientSideFilter(goalText)
  if (!clientCheck.passed) {
    setError(clientCheck.reason!)
    return
  }

  setLoading(true)

  // Layer 2: AI validation
  try {
    const res = await fetch('/api/validate-goal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalText })
    })
    const validation = await res.json()

    if (!validation.approved) {
      setError(validation.reason ||
        `This goal is not available on Cognara. Please enter an educational
         or skill-building goal.`)
      setLoading(false)
      return
    }

    // Goal approved — save detected subject and proceed
    setDetectedSubject(validation.subject)
    proceedToNextStep()

  } catch (err) {
    // Network error — proceed anyway, roadmap generation will handle it
    proceedToNextStep()
  } finally {
    setLoading(false)
  }
}
```

---

## PART 6 — UPDATED LESSON AND ROADMAP SYSTEM PROMPTS

Add content safety awareness to ALL AI system prompts.
Add this paragraph to ROADMAP_SYSTEM_PROMPT,
LESSON_SYSTEM_PROMPT, and QUIZ_SYSTEM_PROMPT:

```
CONTENT SAFETY RULE — THIS IS NON-NEGOTIABLE:
You are operating inside Cognara, an educational platform
used by primary school children as young as 8 years old,
secondary school students, university students, and adults.

You must NEVER generate content that:
- Teaches how to harm, hurt, or endanger any person
- Contains sexual or adult themes of any kind
- Promotes illegal activities, fraud, or deception
- Contains hate speech or discrimination
- Is inappropriate for a child to read

If the subject being taught could potentially have harmful
applications, teach ONLY the safe, legal, educational
version. For example:
- Chemistry: teach academic chemistry, NOT drug synthesis
- Computer science: teach programming and ethical concepts,
  NOT hacking or system cracking
- Biology: teach academic biology, NOT harm-related content

If you receive a request that violates these rules,
respond with only this JSON:
{"error": "content_rejected", "message": "This content is not available on Cognara"}
```

---

## PART 7 — SCHOOL SUBJECT DETECTION

When a user enters an academic subject goal Cognara should
automatically detect the education level and tailor content:

Create lib/contentSafety/subjectDetector.ts:

```ts
export type EducationLevel =
  | 'primary'      // Primary 1-6 (ages 6-12)
  | 'jss'          // Junior Secondary School 1-3 (ages 12-15)
  | 'sss'          // Senior Secondary School 1-3 (ages 15-18)
  | 'university'   // University level
  | 'professional' // Professional/adult skills

export interface SubjectDetection {
  isAcademicSubject: boolean
  subject: string
  suggestedLevel: EducationLevel | null
  waecRelevant: boolean    // Is this a WAEC examination subject?
  jambRelevant: boolean    // Is this a JAMB subject?
}

const WAEC_SUBJECTS = [
  'mathematics', 'english language', 'biology', 'chemistry',
  'physics', 'geography', 'economics', 'government', 'history',
  'literature', 'agricultural science', 'commerce', 'accounting',
  'further mathematics', 'civic education', 'french', 'yoruba',
  'igbo', 'hausa', 'fine arts', 'music', 'home economics',
  'technical drawing', 'computer science', 'data processing',
  'christian religious studies', 'islamic religious studies',
  'social studies', 'basic science', 'basic technology'
]

const JAMB_SUBJECTS = [
  'mathematics', 'english language', 'biology', 'chemistry',
  'physics', 'economics', 'government', 'literature in english',
  'geography', 'history', 'agricultural science', 'accounting',
  'commerce', 'further mathematics', 'french', 'arabic'
]

export function detectSubject(goalText: string): SubjectDetection {
  const lower = goalText.toLowerCase()

  const matchedWaec = WAEC_SUBJECTS.find(s => lower.includes(s))
  const matchedJamb = JAMB_SUBJECTS.find(s => lower.includes(s))

  const isAcademic = !!(matchedWaec || matchedJamb)

  // Detect level from goal text
  let suggestedLevel: EducationLevel | null = null
  if (lower.includes('primary') || lower.includes('basic')
      || lower.includes('jss') || lower.includes('junior')) {
    suggestedLevel = lower.includes('primary') ? 'primary' : 'jss'
  } else if (lower.includes('waec') || lower.includes('sss')
      || lower.includes('senior') || lower.includes('ss1')
      || lower.includes('ss2') || lower.includes('ss3')) {
    suggestedLevel = 'sss'
  } else if (lower.includes('jamb') || lower.includes('university')
      || lower.includes('degree') || lower.includes('100 level')) {
    suggestedLevel = 'university'
  }

  return {
    isAcademicSubject: isAcademic,
    subject: matchedWaec || matchedJamb || goalText,
    suggestedLevel,
    waecRelevant: !!matchedWaec,
    jambRelevant: !!matchedJamb
  }
}
```

Use in onboarding and roadmap generation:

```ts
import { detectSubject } from '@/lib/contentSafety/subjectDetector'

const detection = detectSubject(goalText)

// If WAEC subject detected, add context to roadmap prompt:
if (detection.waecRelevant) {
  additionalContext = `
This is a WAEC examination subject. Structure the roadmap to cover:
1. All WAEC syllabus topics for this subject
2. Past question practice patterns
3. Examination technique and time management
4. Common examiner expectations

Make the content appropriate for Nigerian secondary school students
preparing for the West African Senior School Certificate Examination.
`
}

// If JAMB subject detected:
if (detection.jambRelevant) {
  additionalContext = `
This student is preparing for JAMB (UTME).
Structure the roadmap around:
1. JAMB syllabus for this subject
2. Multiple choice question patterns
3. Speed and accuracy techniques
4. Past JAMB questions approach
`
}
```

---

## PART 8 — AGE-APPROPRIATE DEPTH LEVELS

Since Cognara now serves primary school children, add
an age-appropriate depth level below "Like I'm 10":

Update the depth level system:

```ts
export const DEPTH_LEVELS = [
  {
    value: 0,
    label: "Like I'm 6",
    description: "For young children — very simple, fun, visual explanations",
    ageRange: "Ages 6-9 (Primary 1-3)",
    icon: "🌱"
  },
  {
    value: 1,
    label: "Like I'm 10",
    description: "Simple words, real examples, no jargon",
    ageRange: "Ages 10-12 (Primary 4-6)",
    icon: "🌿"
  },
  {
    value: 2,
    label: "Beginner",
    description: "Clear explanations, no assumed knowledge",
    ageRange: "JSS Students / Adult beginners",
    icon: "📗"
  },
  {
    value: 3,
    label: "Intermediate",
    description: "Proper terms, explains the reasoning",
    ageRange: "SSS Students / Working adults",
    icon: "📘"
  },
  {
    value: 4,
    label: "Advanced",
    description: "Technical depth, best practices",
    ageRange: "University students / Professionals",
    icon: "📙"
  },
  {
    value: 5,
    label: "Expert",
    description: "Peer-level depth, nuance and theory",
    ageRange: "Postgraduate / Senior professionals",
    icon: "🏆"
  }
]
```

Update LESSON_SYSTEM_PROMPT to handle the two new levels:

```
Depth Level 0 (Like I'm 6 — ages 6-9):
Write like you are telling a bedtime story.
Use very short sentences. Maximum 10 words per sentence.
Use only words a 6-year-old knows.
Use pictures described in words (imagine a big red apple).
Make it fun, playful, and encouraging.
No numbers above 100 in explanations. No complex concepts.
Every new word must be explained immediately with a simple example.

Depth Level 1 (Like I'm 10 — ages 10-12):
Simple words, short sentences, fun analogies.
Use examples from school, home, and daily life.
Avoid all technical jargon.
Be encouraging and exciting about learning.
```

---

## PART 9 — REJECTION UI IN ONBOARDING

When a goal is rejected show a clear, friendly, non-shaming message.
Never say "invalid" or "wrong" — say what Cognara IS for instead.

```tsx
// Rejection message component
{error && (
  <div style={{
    background: 'rgba(248,113,113,0.08)',
    border: '1px solid rgba(248,113,113,0.3)',
    borderLeft: '3px solid var(--color-error)',
    borderRadius: '10px',
    padding: '16px 20px',
    marginTop: '12px'
  }}>
    <div style={{
      color: 'var(--color-error)',
      fontWeight: 600,
      fontSize: '14px',
      marginBottom: '6px'
    }}>
      This goal is not available on Cognara
    </div>
    <div style={{
      color: 'var(--color-text-2)',
      fontSize: '13px',
      lineHeight: '1.6',
      marginBottom: '12px'
    }}>
      {error}
    </div>
    <div style={{
      color: 'var(--color-text-3)',
      fontSize: '12px'
    }}>
      Cognara is for learning skills, academic subjects, and
      professional development. Try goals like:
      "Learn Mathematics for WAEC" · "Learn Web Development" ·
      "Improve my English" · "Learn Digital Marketing"
    </div>
  </div>
)}
```

---

## PART 10 — ADMIN SAFETY DASHBOARD

Add a Safety tab to /admin/safety:

Show:
- Total goals submitted today / this week
- Total rejections (count and percentage)
- Table of rejected goals (goal text, user, date, reason)
- Flag for repeated offenders (users who submitted 3+ rejected goals)

If a user submits 5 or more rejected goals in one day
automatically flag their account in the admin panel
for review. Do not ban automatically — just flag for
human review.

---

## SUMMARY OF ALL CHANGES

1. Create lib/contentSafety/keywordFilter.ts
2. Create lib/contentSafety/subjectDetector.ts
3. Create app/api/validate-goal/route.ts
4. Create content_safety_log table in Supabase
5. Update onboarding goal input to run both validation layers
6. Add content safety rule to ALL system prompts
   (ROADMAP, LESSON, QUIZ, INSIGHT, SIMPLIFY)
7. Add depth level 0 ("Like I'm 6") to depth system
8. Update LESSON_SYSTEM_PROMPT for levels 0 and 1
9. Add WAEC and JAMB subject detection and context injection
10. Add rejection UI to onboarding with friendly message
11. Add Safety tab to admin dashboard at /admin/safety

Build in this order:
keyword filter → subject detector → validate-goal route →
database table → onboarding update → system prompt updates →
depth level 0 → admin safety tab

Test with these scenarios:

SHOULD BE APPROVED:
"I want to learn Mathematics for WAEC"
"Teach me how to code in Python"
"I want to improve my English grammar"
"Learn digital marketing for my business"
"Understand Biology for JAMB"
"Learn tailoring from scratch"
"I want to master public speaking"

SHOULD BE REJECTED:
"How to make a bomb"
"Learn to hack someone's account"
"How to scam people online"
"Teach me to make drugs"
Any goal containing inappropriate content

Confirm each test passes correctly before closing.
```
