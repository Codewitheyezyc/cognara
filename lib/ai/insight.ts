import { GeneratedInsight } from '@/types/ai'
import { callClaudeJSON } from './client'
import { INSIGHT_SYSTEM_PROMPT, buildInsightUserMessage, InsightParams } from './prompts'

export async function generateInsight(
  params: InsightParams & {
    profile?: {
      learning_style?: string
      main_goal?: string
      occupation?: string
      preferred_study_time?: string
      daily_study_minutes?: number
    }
  },
  forceMock: boolean = false
): Promise<GeneratedInsight> {
  const mockFallback = async () => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1200))

    const { name, goalText, completedCount, totalCount, scores, weakTopics, streak } = params

    // Case 1: No quizzes taken yet
    if (!scores || scores.length === 0) {
      return {
        insight: `Welcome to Cognara, ${name}! Your custom path for "${goalText}" has been compiled. I will start providing personalized coaching and metrics analysis here once you complete your first quiz.`,
        weak_areas: [],
        strong_areas: ['Path Onboarding'],
        recommendation: 'Complete your first lesson and take the corresponding quiz to initialize your daily streak.',
        recommended_lesson_title: 'ES6+ Modern Syntax Refresher'
      }
    }

    // Calculate average score
    const totalScoreSum = scores.reduce((a, b) => a + b, 0)
    const avgScore = Math.round(totalScoreSum / scores.length)

    // Case 2: High Performance
    if (avgScore >= 80) {
      const parsedWeak = weakTopics ? [weakTopics] : []
      return {
        insight: `Phenomenal performance, ${name}! You are maintaining a solid ${streak}-day study streak with a high average quiz score of ${avgScore}%. Your conceptual accuracy in topics shows deep understanding.`,
        weak_areas: parsedWeak,
        strong_areas: ['React Component Scopes', 'Render Reconciliation'],
        recommendation: 'Maintain your current pace and continue onto the next phase of your roadmap.',
        recommended_lesson_title: null
      }
    }

    // Case 3: Struggles / Low Scores
    const hasWeak = weakTopics && weakTopics.trim().length > 0
    const primaryWeak = hasWeak ? weakTopics : 'recent concepts'
    return {
      insight: `Hey ${name}, you're making steady progress, but I notice some friction points. Your average score is ${avgScore}%, and you have faced difficulties with ${primaryWeak}. React logic requires solid foundational scoping to fully click.`,
      weak_areas: hasWeak ? [weakTopics] : ['Variable Scopes', 'State Mutations'],
      strong_areas: ['Modular Components'],
      recommendation: `Spend 10 minutes reviewing the analogical explanations and the side-by-side code comparison tables for "${primaryWeak}" before retrying.`,
      recommended_lesson_title: hasWeak ? weakTopics : 'ES6+ Modern Syntax Refresher'
    }
  }

  if (forceMock) {
    return mockFallback()
  }

  const userPrompt = buildInsightUserMessage(params)

  return callClaudeJSON<GeneratedInsight>(
    INSIGHT_SYSTEM_PROMPT,
    userPrompt,
    mockFallback
  )
}
