# Cognara Blueprint — Document 05
# AI Architecture
### How to Rebuild Cognara's AI Layer to Reduce Costs, Improve Quality, and Scale Sustainably

> *This document is the most technically important document in the Cognara Blueprint. It redesigns how Cognara thinks about AI — not as a content generator, but as an orchestration engine. Every engineering decision about AI in Cognara must be measured against what is written here.*

---

## The Problem We Are Solving

Cognara currently operates as an **AI generation platform.**

Every time a user needs a lesson, Cognara generates it from scratch.
Every time a user needs a quiz, Cognara generates it from scratch.
Every time a user needs a roadmap, Cognara generates it from scratch.

This approach has three serious problems:

**Problem 1 — Cost**
Every generation costs Anthropic API tokens. With 41 users, the cost is manageable. With 4,000 users, it becomes unsustainable. The current architecture does not scale.

**Problem 2 — Quality Inconsistency**
When the same topic is generated fresh every time, quality varies. Two users learning the same JavaScript concept at the same level may receive lessons of very different quality — depending on how the prompt was constructed that day.

**Problem 3 — Content Contamination**
When prompts lack structured domain metadata, the AI generates content that bleeds across topics — web development content appearing in English lessons, for example. This is a structural failure, not a content failure.

The solution is to evolve Cognara from an AI generation platform into an **AI orchestration platform.**

The difference:

| Generation Platform | Orchestration Platform |
|---|---|
| Generates everything from scratch | Generates once, reuses intelligently |
| AI does all the work every time | AI does high-value work; cache does the rest |
| Cost scales linearly with users | Cost grows much slower than user growth |
| Quality is inconsistent | Quality improves over time as content is refined |
| Prompts are generic | Prompts carry rich domain context |

This shift is the most important architectural change Cognara can make.

---

## The Three Layers of Cognara's AI System

Cognara's AI must be redesigned around three distinct layers. Each layer has a different purpose, a different cost profile, and a different quality standard.

---

### Layer 1 — The Knowledge Layer (Cached Content)

**What it is:**
The stable, reusable educational content that forms the foundation of every learning journey. This includes:
- Core lesson content for common topics at each depth level
- Standard quiz question banks for each topic
- Roadmap templates for popular learning goals
- Concept explanations for foundational subjects

**How it works:**
The first time a lesson is generated for a specific topic at a specific depth level, it is generated with the highest quality prompt, reviewed, and stored in the database. Every subsequent user who needs that lesson receives the cached version — not a newly generated one.

**Cost profile:** High cost once. Zero cost after that.

**Quality profile:** Improves over time. Cached content can be reviewed, refined, and updated. It gets better the more it is used.

**Example:**
The lesson "What is a Marketing Funnel?" at beginner depth level is generated once. The 10th user who studies Social Media Marketing at beginner level receives the same high-quality lesson as the 1st user — at zero additional API cost.

---

### Layer 2 — The Personalization Layer (Adaptive AI)

**What it is:**
The AI layer that makes Cognara feel personal. This is where AI is used to adapt, adjust, and customise the experience for each individual user.

This layer handles:
- Adjusting examples in a lesson to match the user's background and context
- Generating personalized explanations when a user fails a quiz
- Adapting the roadmap when a user falls behind or advances faster than expected
- Creating custom re-entry missions after a user has been absent
- Generating project briefs tailored to the user's current level and goal

**How it works:**
The cached lesson from Layer 1 is used as the base. The personalization layer adds or adjusts specific elements for the individual user — their background, their pace, their quiz performance, their goal context. This is significantly cheaper than generating a full lesson from scratch.

**Cost profile:** Medium cost, used selectively.

**Quality profile:** Highly relevant to the individual user.

**Example:**
A 40-year-old business owner learning Python receives the cached Python basics lesson but with examples drawn from business contexts — invoicing, data analysis, inventory — rather than generic programming examples. Only the examples are generated, not the entire lesson.

---

### Layer 3 — The Coaching Layer (Real-Time AI)

**What it is:**
The highest-value, highest-cost AI layer. This is Spark — real-time, conversational, deeply personalised mentorship.

This layer handles:
- Answering user questions in real time
- Explaining concepts in new ways when the user is stuck
- Reviewing project submissions and providing feedback
- Checking in on user progress and adjusting the plan
- Motivating users through The Wall (Days 8–21)
- Celebrating achievements in a personalised way

**How it works:**
Full Claude model. Rich context window including user's goal, roadmap progress, quiz performance history, and current lesson. This is the layer where Anthropic API spend is most justified — because it is irreplaceable, deeply personal, and directly tied to the outcome the user is paying for.

**Cost profile:** Highest cost, but only triggered by user action or critical system events.

**Quality profile:** The most human-feeling interaction in the product.

**Example:**
A user finishes a lesson on CSS Flexbox but fails the quiz three times. Spark activates, acknowledges the difficulty, and explains Flexbox using a completely different analogy — one tailored to the examples and context from that user's specific profile.

---

## The Domain Metadata Standard

This is the solution to the content contamination problem Cognara experienced in early development.

Every single AI prompt in Cognara — for lessons, quizzes, roadmaps, Spark responses, or any other generated content — must include a structured domain metadata block.

**The Standard Metadata Block:**

```
DOMAIN: [Top-level category e.g. Business, Technology, Medicine, Language]
SUBJECT: [Specific subject e.g. Social Media Marketing, Python Programming, Human Anatomy]
MODULE: [Current module e.g. Content Strategy, Data Types, The Cardiovascular System]
TOPIC: [Current topic e.g. Building a Content Calendar, Lists and Tuples, The Heart]
USER_LEVEL: [Beginner / Intermediate / Advanced]
USER_BACKGROUND: [Brief context e.g. Small business owner, Computer science student, Nurse]
DEPTH_PREFERENCE: [Conceptual / Balanced / Technical / Practical]
LEARNING_GOAL: [User's stated achievement goal]
CURRENT_PHASE: [Phase number and name in the roadmap]
```

**The Rule:**
No AI prompt in Cognara is sent without this metadata block. This is non-negotiable.

**Why this works:**
When the AI receives this context, it cannot generate content outside the scope of the topic. A lesson on "Building a Content Calendar" with Domain: Business and Subject: Social Media Marketing will never produce JavaScript code or medical terminology. The boundaries are structural, not just instructional.

---

## The Prompt Architecture

Every type of AI generation in Cognara must have a defined, standardised prompt architecture. Prompts must never be constructed ad hoc.

### Lesson Generation Prompt Structure

```
SYSTEM:
You are Cognara's lesson generation engine. Your role is to generate 
a high-quality educational lesson that is accurate, clearly structured, 
and perfectly matched to the user's level and context. 

You must stay strictly within the boundaries of the domain metadata 
provided. Do not introduce concepts, examples, or references from 
outside this domain and topic.

DOMAIN METADATA:
[Insert standard metadata block]

LESSON REQUIREMENTS:
- Length: [Target word count based on depth preference]
- Structure: Introduction → Core Concepts → Examples → Summary → Key Takeaways
- Tone: [Mentor voice — warm, direct, clear]
- Examples: Must relate to [USER_BACKGROUND] where possible
- Depth: [Based on DEPTH_PREFERENCE and USER_LEVEL]

CACHE INSTRUCTION:
This lesson is being generated for caching. It will be used by multiple 
users at this level. Ensure the content is accurate, well-structured, 
and of the highest quality. Do not include personalised references to 
a specific user.

GENERATE: The lesson for TOPIC: [topic name]
```

### Quiz Generation Prompt Structure

```
SYSTEM:
You are Cognara's quiz generation engine. Generate [N] quiz questions 
that accurately test understanding of the lesson content provided.

DOMAIN METADATA:
[Insert standard metadata block]

LESSON CONTEXT:
[Insert the lesson content or key concepts the quiz should test]

QUIZ REQUIREMENTS:
- Question types: Multiple choice (4 options), True/False, Short answer
- Difficulty: Matched to USER_LEVEL
- Coverage: Questions must span all key concepts in the lesson
- Distractors: Wrong answers must be plausible but clearly incorrect 
  on reflection
- Explanation: Each correct answer must include a one-sentence 
  explanation of why it is correct

GENERATE: [N] quiz questions for TOPIC: [topic name]
```

### Roadmap Generation Prompt Structure

```
SYSTEM:
You are Cognara's roadmap architect. Your role is to build a logical, 
well-ordered learning roadmap that takes a user from their current 
level to their stated achievement goal.

The roadmap must be realistic, structured from foundation to mastery, 
and divided into clear phases and modules. Every topic must logically 
belong to the stated domain and subject.

DOMAIN METADATA:
[Insert standard metadata block]

ROADMAP REQUIREMENTS:
- Structure: Phases → Modules → Topics
- Sequence: Foundation first, advanced concepts only after prerequisites
- Scope: Include all essential topics. Exclude tangential topics.
- Timeline: Estimate realistic completion time per phase based on 
  [USER_LEVEL] and [DEPTH_PREFERENCE]
- Format: Return structured JSON for database storage

GENERATE: Complete roadmap for LEARNING_GOAL: [user's goal]
```

### Spark (Coaching) Prompt Structure

```
SYSTEM:
You are Spark, Cognara's AI learning mentor. You are warm, patient, 
encouraging, and deeply knowledgeable. You speak like a brilliant 
friend — not a textbook, not a corporate assistant.

Your role right now is to [help the user understand a concept / 
celebrate a milestone / re-engage after absence / review their work].

You have full context of this user's learning journey.

USER CONTEXT:
- Goal: [LEARNING_GOAL]
- Current position: [CURRENT_PHASE], [MODULE], [TOPIC]
- Progress: [X]% of roadmap complete
- Recent quiz performance: [summary]
- Days since last login: [N]
- Streak status: [active / broken]

DOMAIN METADATA:
[Insert standard metadata block]

SPARK GUIDELINES:
- Stay within the domain of the user's current learning goal
- Do not answer questions outside the scope of their roadmap without 
  redirecting
- Never sound robotic or generic
- Always acknowledge where the user is in their journey before 
  answering
- If explaining a concept, use a different approach than the lesson used
- Keep responses concise — this is a conversation, not another lesson

USER MESSAGE: [What the user said or asked]
```

---

## The Caching Strategy

This is how Cognara reduces API costs as it scales.

### What Gets Cached

| Content Type | Cache Strategy | Notes |
|---|---|---|
| Core lesson content | Cache by topic + depth level | Highest priority — biggest cost saving |
| Quiz question banks | Cache by topic + difficulty | Build up a bank; randomise on delivery |
| Roadmap templates | Cache by goal + level | Personalise phases, not the full structure |
| Concept explanations | Cache by concept + level | Reusable across domains where appropriate |

### What Never Gets Cached

| Content Type | Reason |
|---|---|
| Spark responses | Always personal, always contextual |
| Personalised examples | Depends on individual user background |
| Re-entry messages | Must feel fresh and personal |
| Project briefs | Tailored to user's specific progress |
| Quiz feedback | Must reference the user's specific wrong answer |

### The Caching Decision Tree

Before any AI generation, the system must ask:

```
1. Has this content been generated before for this topic + level?
   YES → Retrieve from cache → Skip AI generation
   NO  → Continue to step 2

2. Is this content suitable for caching (not user-specific)?
   YES → Generate with cache prompt → Store in database → Deliver
   NO  → Generate with personalisation prompt → Deliver (do not cache)
```

### Cache Quality Control

Cached content is not permanent. It must be reviewed and improved over time.

- Every cached lesson receives a quality score based on user quiz performance. If users consistently fail quizzes after a lesson, the lesson needs improvement.
- Cached content is reviewed quarterly and updated where the domain knowledge has evolved.
- Users can flag a lesson as confusing — three flags on the same lesson triggers a review.

---

## Model Selection Strategy

Not every task in Cognara needs the most powerful and expensive model.

| Task | Recommended Approach | Reason |
|---|---|---|
| Roadmap generation | Full Claude model | High complexity, structural accuracy critical |
| Core lesson generation (for cache) | Full Claude model | Quality must be high — this content is reused many times |
| Personalisation layer | Full Claude model | Context-sensitivity is critical |
| Spark coaching | Full Claude model | This is the human face of Cognara — quality cannot be compromised |
| Quiz generation | Can use lighter approach | Structured output with clear rules |
| Simple summaries | Can use lighter approach | Low complexity |
| Streak/XP/progress calculations | No AI needed | Pure logic — zero API cost |
| Notification copy | Template-based | Pre-written with variable insertion |
| UI labels, buttons, navigation | No AI needed | Static content |

**The principle:** Use the full Claude model for the moments that define Cognara's quality. Use lighter or zero AI for everything else.

---

## The Progressive Generation Strategy

One of the most expensive mistakes in Cognara's current architecture is generating content the user may never reach.

**The wrong approach:**
When a user creates a goal, generate all lessons for all modules immediately.
→ High upfront cost, most content never seen by the user.

**The right approach:**
Generate content progressively, just ahead of where the user is.

```
User completes Module 1, Lesson 1
→ System generates Module 1, Lesson 2 in the background

User completes Module 1, Lesson 2
→ System generates Module 1, Lesson 3 + checks cache for Module 2, Lesson 1

User completes Module 1 entirely
→ System generates Module 2, Lesson 1 (if not cached)
→ Module 2, Lesson 2 is queued for background generation
```

This means:
- The user always has their next lesson ready (no waiting)
- Content is never generated more than 1–2 steps ahead
- If a user abandons Cognara, minimal wasted generation has occurred

---

## AI Cost Reduction Summary

Implementing this architecture will reduce Cognara's API costs significantly as the user base grows. Here is the impact by strategy:

| Strategy | Cost Impact | Implementation Priority |
|---|---|---|
| Lesson caching | Very High — eliminates repeated generation of same content | Priority 1 |
| Domain metadata standard | Medium — reduces prompt failures and regeneration | Priority 1 |
| Progressive generation | High — eliminates speculative generation | Priority 2 |
| Model tiering | Medium — reduces cost on low-complexity tasks | Priority 2 |
| Quiz question banks | High — builds reusable asset over time | Priority 3 |
| Roadmap template caching | Medium — reduces roadmap generation for common goals | Priority 3 |

---

## The AI Quality Standard

Reducing costs must never come at the expense of quality. These are the non-negotiable quality standards every piece of AI-generated content must meet before it is delivered to a user.

**For lessons:**
- Accurate — no factual errors in the domain content
- Scoped — entirely within the stated topic and domain
- Level-appropriate — genuinely matched to the user's depth level
- Actionable — the user knows what they have learned and can apply it
- Clear — no jargon that has not been explained, no ambiguous statements

**For quizzes:**
- Tests understanding, not just recall
- Covers the key concepts of the lesson
- Has exactly one correct answer (for multiple choice)
- Wrong options are plausible but clearly incorrect on reflection
- Each answer includes a clear explanation

**For Spark responses:**
- Warm and personal — never robotic
- Concise — a conversation, not a lecture
- Domain-accurate — never introduces out-of-scope information
- Contextually aware — references the user's specific situation
- Actionable — always ends with a clear next step or closing thought

---

## Engineering Implementation Notes

*These notes are for Antigravity and future engineers building on the Cognara codebase.*

### Database Tables Required for This Architecture

```sql
-- Cached lesson content
cognara_lesson_cache (
  id, domain, subject, module, topic, depth_level,
  content, quality_score, flag_count, 
  created_at, last_reviewed_at, version
)

-- Quiz question bank
cognara_quiz_bank (
  id, domain, subject, module, topic, difficulty_level,
  question_type, question_text, options, correct_answer,
  explanation, usage_count, created_at
)

-- Roadmap templates  
cognara_roadmap_templates (
  id, learning_goal_category, user_level,
  structure_json, usage_count, created_at, last_updated
)

-- User personalization context
cognara_user_context (
  user_id, learning_goal, domain, subject, user_level,
  user_background, depth_preference, motivation_type,
  quiz_performance_summary, created_at, updated_at
)
```

### Cache Check Logic (Pseudocode)

```javascript
async function getLessonContent(userId, topic, depthLevel, domain) {
  
  // Step 1: Check cache first
  const cached = await db.cognara_lesson_cache.findOne({
    topic, depth_level: depthLevel, domain
  });
  
  if (cached && cached.quality_score >= QUALITY_THRESHOLD) {
    // Return cached content with personalisation layer
    const userContext = await getUserContext(userId);
    const personalisedContent = await addPersonalisationLayer(
      cached.content, userContext
    );
    return personalisedContent;
  }
  
  // Step 2: Generate and cache if not found
  const userContext = await getUserContext(userId);
  const metadata = buildDomainMetadata(userContext, topic);
  
  const generatedContent = await callClaudeAPI(
    buildLessonPrompt(metadata, isCacheable: true)
  );
  
  // Store in cache
  await db.cognara_lesson_cache.insert({
    domain, subject: userContext.subject, 
    module: userContext.currentModule, topic,
    depth_level: depthLevel,
    content: generatedContent,
    quality_score: 100, // starts at 100, adjusted by quiz performance
    flag_count: 0
  });
  
  // Add personalisation layer before returning
  return await addPersonalisationLayer(generatedContent, userContext);
}
```

### Domain Metadata Builder (Pseudocode)

```javascript
function buildDomainMetadata(userContext, currentTopic) {
  return {
    domain: userContext.domain,
    subject: userContext.subject,
    module: userContext.currentModule,
    topic: currentTopic,
    userLevel: userContext.level,
    userBackground: userContext.background,
    depthPreference: userContext.depthPreference,
    learningGoal: userContext.goal,
    currentPhase: userContext.currentPhase
  };
}

// This metadata block is prepended to EVERY AI prompt
// No exceptions
```

---

## Summary: The New AI Architecture in One Page

```
USER REQUESTS CONTENT
        ↓
DOMAIN METADATA BUILT
(topic + level + user context)
        ↓
CACHE CHECK
        ↓
[CACHE HIT]              [CACHE MISS]
Retrieve cached    →     Generate with full Claude
lesson content           Store in cache
        ↓                       ↓
PERSONALISATION LAYER
(add user-specific examples, adjust tone)
        ↓
DELIVER TO USER
        ↓
USER ENGAGES WITH CONTENT
        ↓
QUIZ PERFORMANCE TRACKED
        ↓
QUALITY SCORE UPDATED
        ↓
NEXT CONTENT GENERATED PROGRESSIVELY
(1–2 steps ahead, in background)
        ↓
SPARK AVAILABLE AT ALL TIMES
(Layer 3 — real-time, always personal, always contextual)
```

---

## The Promise of This Architecture

When fully implemented, this architecture delivers three things simultaneously:

**Lower costs** — The same content is not generated twice. API spend goes toward coaching and personalisation — the high-value moments — not toward regenerating lessons that already exist.

**Better quality** — Cached lessons improve over time. Quiz performance data tells us which lessons are working and which need refinement. Quality compounds.

**True scalability** — Going from 41 users to 4,000 users does not require 100x the API budget. The cache absorbs the growth. The personalization layer stays lean. Only Spark scales linearly — and Spark is the part worth paying for.

This is the architecture of a company that is built to last.

---

*Document 05 of the Cognara Blueprint.*
*Next: Document 06 — User Journey (The complete experience from first visit to first achievement — redesigned)*
