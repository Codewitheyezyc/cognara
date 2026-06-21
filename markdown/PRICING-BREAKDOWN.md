# Cognara Subscription Pricing & API Cost Breakdown

This document provides a comprehensive financial, operational, and architectural analysis of the monthly subscription pricing options for **Cognara**. It covers the local Naira tiers (**₦1,000, ₦2,500, ₦2,999**), the USD pricing/API cost brackets (**$5, $20, $100**), the cost structure of the AI models, and details on how a subscribed user triggers API calls in the application.

---

## 1. Technical Cost Context (Claude AI Token Pricing)

Cognara uses two primary LLM models from Anthropic: **Claude 3.5 Sonnet** (for high-fidelity lesson content, quizzes, and coaching insights) and **Claude 3.5 Haiku** (for roadmaps, section simplifications, and coding/writing exercise reviews).

Based on the application's configuration (`logApiUsage.ts`), the raw API token pricing is:

| Model | Input Cost (per 1M tokens) | Output Cost (per 1M tokens) | Used For |
| :--- | :--- | :--- | :--- |
| **Claude 3.5 Sonnet** | $3.00 (~ ₦4,500) | $15.00 (~ ₦22,500) | Lesson Generation, Quiz Generation, Coach Insights |
| **Claude 3.5 Haiku** | $0.25 (~ ₦375) | $1.25 (~ ₦1,875) | Roadmap Generation, Section Simplification, Exercise Review |

*Exchange Rate Assumption: **₦1,500 = $1 USD** (standard bank/card settlement rate).*

---

## 2. Average Cost per API Operation

To calculate the cost of a user studying on the platform, we estimate the average token sizes for each user action based on system prompts and JSON payload requirements:

### A. Roadmap Generation (`POST /api/ai/generate-roadmap`)
* **Model:** Claude 3.5 Haiku
* **Estimated Tokens:** Input: ~1,500 tokens | Output: ~1,500 tokens (JSON tree)
* **Cost calculation:** $(1,500 \times \$0.25 / 1\text{M}) + (1,500 \times \$1.25 / 1\text{M}) = \$0.00225$
* **Cost in Naira:** **~ ₦3.38 per roadmap**

### B. Lesson Generation (`POST /api/ai/generate-lesson`)
* **Model:** Claude 3.5 Sonnet (Required for high-quality pedagogical content, formatting, code samples, and analogies)
* **Estimated Tokens:** Input: ~4,000 tokens (large system prompt + learning profile context) | Output: ~2,500 tokens (rich JSON content)
* **Cost calculation:** $(4,000 \times \$3.00 / 1\text{M}) + (2,500 \times \$15.00 / 1\text{M}) = \$0.0495$
* **Cost in Naira:** **~ ₦74.25 per lesson**
* **Optimization:** *Generated once and cached in the database. Subsequent views cost ₦0.*

### C. Quiz Generation (`POST /api/ai/generate-quiz`)
* **Model:** Claude 3.5 Sonnet (Ensures highly accurate questions aligned directly to the lesson)
* **Estimated Tokens:** Input: ~3,500 tokens (lesson text + system prompt) | Output: ~1,000 tokens (5 structured questions)
* **Cost calculation:** $(3,500 \times \$3.00 / 1\text{M}) + (1,000 \times \$15.00 / 1\text{M}) = \$0.0255$
* **Cost in Naira:** **~ ₦38.25 per quiz**
* **Optimization:** *Generated once and cached. Retries and reviews cost ₦0.*

### D. Simplify Section ("Confused" Button) (`POST /api/ai/simplify-section`)
* **Model:** Claude 3.5 Haiku (Fast, low-latency, conversational re-explanation)
* **Estimated Tokens:** Input: ~500 tokens | Output: ~150 tokens
* **Cost calculation:** $(500 \times \$0.25 / 1\text{M}) + (150 \times \$1.25 / 1\text{M}) = \$0.0003125$
* **Cost in Naira:** **~ ₦0.47 per simplification click**

### E. Review Exercise (`POST /api/ai/review-exercise`)
* **Model:** Claude 3.5 Haiku
* **Estimated Tokens:** Input: ~1,000 tokens | Output: ~300 tokens (score, strengths, improvements, suggestions)
* **Cost calculation:** $(1,000 \times \$0.25 / 1\text{M}) + (300 \times \$1.25 / 1\text{M}) = \$0.000625$
* **Cost in Naira:** **~ ₦0.94 per grading request**

### F. Performance Coach Insights (`POST /api/ai/generate-insight`)
* **Model:** Claude 3.5 Sonnet
* **Estimated Tokens:** Input: ~3,000 tokens (streak, profile, 5 recent quiz scores) | Output: ~500 tokens (coaching text)
* **Cost calculation:** $(3,000 \times \$3.00 / 1\text{M}) + (500 \times \$15.00 / 1\text{M}) = \$0.0165$
* **Cost in Naira:** **~ ₦24.75 per insight run**

---

## 3. Monthly User Consumption Scenarios

Students interact with the application at different rates. Below is a breakdown of what a user's activity costs you (the platform owner) in raw API charges over a 30-day billing cycle:

### Profile 1: The Casual Student (Low Activity)
* *Behavior:* Studies 5 lessons, takes 5 quizzes, requests 10 section simplifications, gets 3 exercises graded, runs 5 insights.
* **Monthly API Cost:** **₦697.15** ($0.46)

### Profile 2: The Active Student (Medium/High Activity)
* *Behavior:* Studies 15 lessons (1 every 2 days), takes 15 quizzes, requests 30 section simplifications, gets 10 exercises graded, runs 20 insights.
* **Monthly API Cost:** **₦2,209.38** ($1.47)

### Profile 3: The Super-User (Max Permitted Usage)
* *Behavior:* Studies 30 lessons (1 every day), takes 30 quizzes, requests 100 simplifications, gets 30 exercises graded, runs 30 insights.
* **Monthly API Cost:** **₦4,199.46** ($2.80)

---

## 4. Subscription Price Breakdowns (Naira Tiers)

When analyzing your net earnings, we must deduct Paystack's transaction processing fees.
* Paystack Fee Structure for Nigeria: **1.5% + ₦100** per transaction (the flat ₦100 fee is automatically waived for transactions under ₦2,500).

### Option A: ₦1,000 / month (The Student Budget Plan)
* **Paystack Processing Fee:** 1.5% of ₦1,000 = **₦15.00** (flat ₦100 fee is waived).
* **Net Revenue Payout:** **₦985.00** (~ $0.66)
* **Profitability Analysis:**
  * Casual Student: **Gaining side (+₦287.85 / user)**
  * Active Student: **Losing side (-₦1,224.38 / user)**
  * Super-User: **Losing side (-₦3,214.46 / user)**
* **Verdict:** **Not Recommended.** While highly appealing to students, a flat ₦1,000 rate will quickly push you into a net-negative cash flow. Because students preparing for critical exams (like WAEC or JAMB) are likely to be highly active, your average cost per user will quickly exceed ₦1,000. You would be subsidizing their usage out of pocket.

---

### Option B: ₦2,500 / month (The Sustainable Middle Ground)
* **Paystack Processing Fee:** 1.5% of ₦2,500 (₦37.50) + ₦100 = **₦137.50**.
* **Net Revenue Payout:** **₦2,362.50** (~ $1.58)
* **Profitability Analysis:**
  * Casual Student: **Gaining side (+₦1,665.35 / user)**
  * Active Student: **Gaining side (+₦153.12 / user)**
  * Super-User: **Losing side (-₦1,836.96 / user)**
* **Verdict:** **Viable & Balanced.** This rate covers the cost of an active student who works on the platform every other day. Casual users will subsidize highly active users. This price is still accessible to many tertiary students in Nigeria (cost of a basic fast-food meal) and keeps the business safe under normal usage distributions.

---

### Option C: ₦2,999 / month (The Premium / Safety-Buffered Plan)
* **Paystack Processing Fee:** 1.5% of ₦2,999 (₦45.00) + ₦100 = **₦145.00**.
* **Net Revenue Payout:** **₦2,854.00** (~ $1.90)
* **Profitability Analysis:**
  * Casual Student: **Gaining side (+₦2,156.85 / user)**
  * Active Student: **Gaining side (+₦644.62 / user)**
  * Super-User: **Losing side (-₦1,345.46 / user)**
* **Verdict:** **Highly Recommended.** This plan provides a healthy cushion. If the Naira devalues further against the US Dollar (increasing your API costs in Naira terms) or if a large portion of your user base becomes extremely active, this tier keeps you profitable. It offers a solid margin to support free-tier users, hosting bills, database storage, and developer overhead.

---

## 5. Subscription Price Breakdowns (USD Tiers & High-Cost Projections)

If you decide to charge in USD or need to project your margins against heavy usage scenarios where users hit **$5, $20, or $100 in monthly API costs**, the calculations are as follows:

* *Note: International processing fees (Stripe/Paystack International) are typically **3.9% + $0.30**.*

### Tier 1: $5.00 / month (~ ₦7,500)
* **Net Payout (after Stripe fees):** $5.00 - ($0.195 + $0.30) = **$4.50** (~ ₦6,750)
* **Margin Analysis against API Costs:**
  * **If user consumes $5.00 in API costs:** **Losing side (-$0.50 / user)**.
  * **If user consumes $20.00 in API costs:** **Losing side (-$15.50 / user)**.
  * **If user consumes $100.00 in API costs:** **Losing side (-$95.50 / user)**.
  * **If user is an average Cognara user ($1.47 cost):** **Gaining side (+$3.03 / user)**.
* **Verdict:** Great for international students. A $5 subscription easily covers standard active usage ($1.47), but fails if a user hits the absolute maximum rate limits (which cost ~$4.20) or if a developer/student uses scripts to scrape the API.

---

### Tier 2: $20.00 / month (~ ₦30,000)
* **Net Payout (after Stripe fees):** $20.00 - ($0.78 + $0.30) = **$18.92** (~ ₦28,380)
* **Margin Analysis against API Costs:**
  * **If user consumes $5.00 in API costs:** **Gaining side (+$13.92 / user)**.
  * **If user consumes $20.00 in API costs:** **Losing side (-$1.08 / user)**.
  * **If user consumes $100.00 in API costs:** **Losing side (-$81.08 / user)**.
* **Verdict:** Highly profitable for corporate, professional, or school-wide accounts. Easily covers extreme power-users.

---

### Tier 3: $100.00 / month (~ ₦150,000)
* **Net Payout (after Stripe fees):** $100.00 - ($3.90 + $0.30) = **$95.80** (~ ₦143,700)
* **Margin Analysis against API Costs:**
  * **If user consumes $5.00 in API costs:** **Gaining side (+$90.80 / user)**.
  * **If user consumes $20.00 in API costs:** **Gaining side (+$75.80 / user)**.
  * **If user consumes $100.00 in API costs:** **Losing side (-$4.20 / user)**.
* **Verdict:** Enterprise-grade. Only viable for organizations, universities, or team licenses.

---

## 6. How a Subscribed User Triggers API Calls in Cognara

When a subscribed user interacts with the application, their behavior triggers specific backend routes that communicate with the database and the Anthropic API. Below is the step-by-step technical breakdown of how these calls occur and how caching protects your pocket:

### Step 1: Onboarding and Goal Setup
* **User Action:** The student fills out their learning goal (e.g., "I want to learn Frontend Web Development"), selects their daily study minutes, and clicks "Generate Roadmap".
* **API Triggered:** `POST /api/ai/generate-roadmap`
* **Behind the Scenes:** The server calls Claude Haiku. It parses the request and returns a structured roadmap (JSON) containing phases and lesson stubs.
* **Database Action:** The roadmap, phases, and lesson stubs are inserted into the database. The actual content of the lessons is set to `null` to save token costs initially.

### Step 2: Studying a Lesson
* **User Action:** The student clicks on a lesson title in their roadmap.
* **API Triggered:** `POST /api/ai/generate-lesson`
* **Behind the Scenes:**
  1. The server checks the database to see if `lessons.content` is already generated.
  2. **If Cached (Subsequent visits):** The server loads the content directly from PostgreSQL. **No API call is made and no tokens are consumed (₦0 cost).**
  3. **If Not Cached (First visit):** The server calls Claude Sonnet using the detailed system prompts and student preferences, writes the generated content to the database, and returns it.
* **Subscriber vs Free:** Free users are blocked from opening lessons in Phase 2 and Phase 3 (they only have Phase 1 unlocked). Subscribed users can open any lesson. Subscribers can also force-regenerate a lesson up to **2 times** if they want the AI to explain it differently.

### Step 3: Taking a Quiz
* **User Action:** The student clicks the "Take Quiz" button at the end of a lesson.
* **API Triggered:** `POST /api/ai/generate-quiz`
* **Behind the Scenes:** Like lessons, the server checks if the quiz has already been generated in the `quizzes` table. 
  * If it exists, it loads instantly (**₦0 cost**). 
  * If it is the first time, it calls Claude Sonnet to generate 5 questions matching the lesson content, caches it, and serves it.

### Step 4: Simplifying Difficult Content
* **User Action:** The student highlights a paragraph in a lesson they don't understand and clicks the "Confused? Simplify" button.
* **API Triggered:** `POST /api/ai/simplify-section`
* **Behind the Scenes:**
  * Free users: Blocked (daily limit = 0).
  * Subscribed users: Allowed up to **15 requests per day**. The server calls Claude Haiku to generate a short, friendly explanation under 100 words with a fresh analogy.

### Step 5: Submitting Homework/Exercises
* **User Action:** The student types an answer in the practice box inside a lesson and clicks "Grade My Answer".
* **API Triggered:** `POST /api/ai/review-exercise`
* **Behind the Scenes:**
  * Free users: Blocked (daily limit = 0).
  * Subscribed users: Allowed up to **5 submissions per day**. The server calls Claude Haiku to grade their code or writing, scoring it from 0-100 and suggesting improvements.

### Step 6: Checking Progress and Insights
* **User Action:** The student opens their dashboard or progress analytics.
* **API Triggered:** `POST /api/ai/generate-insight`
* **Behind the Scenes:**
  * Free users: The rate limit is set to 0, which triggers a `forceMock` flag. The system bypasses Claude entirely and returns a context-aware mockup text from the database/client (e.g. "Welcome to Cognara, complete your first quiz to see metrics"). **No API tokens are consumed (₦0 cost).**
  * Subscribed users: Allowed **3 real Claude Sonnet insights per day**. If they exceed 3, the system gracefully falls back to serving a mock insight instead of throwing an error or breaking the user interface.

---

## 7. Strategic Recommendations for Student Pricing

To reach students affordably (₦1,000 to ₦2,000 range) without losing money on API costs, implement these software adjustments:

1. **Leverage Claude 3.5 Haiku for Lessons (Best Cost Saver):**
   * Currently, lessons are generated using **Sonnet** (₦74.25 per lesson). If you change the model in `lib/ai/lesson.ts` to **Haiku**, the cost drops to **~ ₦5.60 per lesson**! 
   * This simple change lowers the monthly cost of an active student from **₦2,209 to ₦360**, making the ₦1,000 subscription highly profitable!
2. **Pre-Generate Common Roadmap courses:**
   * Pre-generate lessons and quizzes for common high-demand subjects (like WAEC Prep, JAMB Prep, HTML/CSS Basics, Python Basics) and store them in the database.
   * When students study these pre-made paths, they load instantly from the database cache. Since no AI calls are made, their active cost is **₦0**, rendering their subscription pure profit.
3. **Offer Multi-Month "Term/Semester" Packages:**
   * Instead of a ₦1,000 monthly plan, offer a **3-Month Term Plan for ₦3,500** or an **Annual Plan for ₦10,000**. 
   * Upfront payments improve cash flow, and average user activity naturally declines over a multi-month period, boosting overall margins.

---

## 8. Case Study: 1,000 Users at ₦2,999/Month & $100 API Credit Lifespan

If you charge **₦2,999 / month** and have **1,000 active subscribers**, here is what your business model looks like and how long a **$100 credit pool** will last:

### A. Monthly Revenue & Paystack Deductions
* **Gross Income:** $1,000 \text{ users} \times ₦2,999 = ₦2,999,000$ (~₦3 Million)
* **Paystack Fees:** $1,000 \times ₦145 = ₦145,000$ (₦145 fee per user)
* **Net Monthly Payout:** **₦2,854,000**
* **In US Dollars (₦1,500 = $1):** **$1,902.67 USD** of net monthly revenue.

---

### B. How Long Will $100 in API Credits Last?
The lifespan of a $100 credit pool depends entirely on the activity profile of your 1,000 users:

#### Scenario 1: Casual Users (Studies ~5 lessons / month)
* **Monthly cost for 1,000 users:** $1,000 \times \$0.46 = \$460.00$
* **Daily burn rate:** $\$460.00 / 30 \text{ days} = \$15.33 / \text{day}$
* **$100 Lifespan:** $\$100 / \$15.33 = $ **6.5 Days** (less than a week)

#### Scenario 2: Active Users (Studies 15 lessons / month — e.g. every other day)
* **Monthly cost for 1,000 users:** $1,000 \times \$1.47 = \$1,470.00$
* **Daily burn rate:** $\$1,470.00 / 30 \text{ days} = \$49.00 / \text{day}$
* **$100 Lifespan:** $\$100 / \$49.00 = $ **2.04 Days** (approx. 49 hours)

#### Scenario 3: Super-Users (Studies 30 lessons / month — e.g. daily)
* **Monthly cost for 1,000 users:** $1,000 \times \$2.80 = \$2,800.00$
* **Daily burn rate:** $\$2,800.00 / 30 \text{ days} = \$93.33 / \text{day}$
* **$100 Lifespan:** $\$100 / \$93.33 = $ **1.07 Days** (approx. 26 hours)

#### Scenario 4: Realistic Mixed Usage (10% Active, 40% Casual, 50% Inactive/Reviewing Cached Content)
* *In a real-world scenario, about half of your subscribers will be inactive or studying previously generated, cached lessons (which cost you $0 in API calls).*
* **Monthly cost for 1,000 users:** $(100 \times \$1.47) + (400 \times \$0.46) + (500 \times \$0) = \$331.00$
* **Daily burn rate:** $\$331.00 / 30 = \$11.03 / \text{day}$
* **$100 Lifespan:** $\$100 / \$11.03 = $ **9.06 Days**

---

### C. Strategic Takeaway
A **$100 credit pool is way too small** for 1,000 active users and will last between **1 to 9 days** max. 

However, because your 1,000 users are paying you ₦2,999/month, you have **$1,902.67 USD in net revenue** every month. This means you have plenty of cash flow to purchase a larger API credit pool. 

To run smoothly with 1,000 users:
1. **Set up auto-charge/auto-renewal** on Anthropic Console when your balance drops below $100.
2. Expect to spend between **$330 and $1,470 monthly on API credits** (out of your $1,902 gross earnings). Your net profit after API costs will be between **$432 and $1,572 USD** per month.
3. To maximize profits further, transition lessons to **Claude 3.5 Haiku** (which reduces the active student monthly cost from $1.47 to **$0.24**), extending your $100 credit pool lifespan for 1,000 users to **12.5 days** even if every single user is highly active!

