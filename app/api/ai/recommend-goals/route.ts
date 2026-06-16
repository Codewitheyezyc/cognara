import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaudeJSON } from '@/lib/ai/client'
import { logApiUsage } from '@/lib/ai/logUsage'

export const dynamic = 'force-dynamic'

interface Recommendation {
  title: string
  description: string
}

interface RecommendationsResponse {
  recommendations: Recommendation[]
  _usage?: {
    input_tokens: number
    output_tokens: number
    model: string
    isMock?: boolean
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url)
    const completedSubject = searchParams.get('subject')

    if (!completedSubject) {
      return NextResponse.json({ error: 'Missing completed subject parameter' }, { status: 400 })
    }

    // 3. Define prompt & fallback
    const systemPrompt = `You are Cognara's expert curriculum adviser. 
Given a subject that a student just finished learning, suggest 3 logical, high-impact next learning subjects they should master next.
Return your response in strict JSON format. 
The JSON must have a top-level key "recommendations" containing an array of objects. 
Each object must have:
- "title": A short, catchy subject title (2-5 words, e.g., "Full-Stack Node.js Development" or "Advanced UI Design patterns").
- "description": Exactly one sentence (no more, no less) explaining what they will learn and why it is a natural progression.

Do not wrap in Markdown, just return the JSON string.`

    const userPrompt = `The student has successfully mastered the subject: "${completedSubject}". Generate their 3 next-step learning goals.`

    const mockFallback = async (): Promise<RecommendationsResponse> => {
      // Return custom recommendations based on the subject
      const subjectLower = completedSubject.toLowerCase()
      if (subjectLower.includes('web') || subjectLower.includes('react') || subjectLower.includes('html') || subjectLower.includes('css')) {
        return {
          recommendations: [
            {
              title: "Full-Stack Backend Development",
              description: "Build secure, production-grade servers and database APIs using Node.js, Express, and PostgreSQL."
            },
            {
              title: "Advanced React & Next.js Frameworks",
              description: "Master React Server Components, custom hooks, state synchronization, and application caching models."
            },
            {
              title: "Mobile App Development with React Native",
              description: "Compile and publish native cross-platform mobile apps for iOS and Android using your existing web codebase."
            }
          ]
        }
      } else if (subjectLower.includes('design') || subjectLower.includes('ui') || subjectLower.includes('ux') || subjectLower.includes('product')) {
        return {
          recommendations: [
            {
              title: "UX Research & Usability Testing",
              description: "Conduct professional user interviews, heuristic audits, and user testings to back your visual designs with data."
            },
            {
              title: "Design Systems & Component Library Scaling",
              description: "Construct and organize modular Tailwind or CSS systems for massive teams and cohesive brands."
            },
            {
              title: "Interactive Prototyping & Motion Design",
              description: "Bring your layouts to life with advanced micro-interactions, spring physics, and animated transitions in Figma."
            }
          ]
        }
      } else {
        // Generic next steps
        return {
          recommendations: [
            {
              title: `Advanced ${completedSubject} Architectures`,
              description: `Deep dive into expert techniques, system-wide optimization, and advanced patterns of ${completedSubject}.`
            },
            {
              title: `Practical Projects in ${completedSubject}`,
              description: `Solidify your expertise by building 5 real-world portfolio projects focused on ${completedSubject}.`
            },
            {
              title: "Cross-Disciplinary Integration Studies",
              description: `Learn how to combine your knowledge of ${completedSubject} with modern technology and business systems.`
            }
          ]
        }
      }
    }

    // 4. Call Claude JSON
    const result = await callClaudeJSON<RecommendationsResponse>(
      systemPrompt,
      userPrompt,
      mockFallback
    )

    // 5. Log API usage
    if (result._usage) {
      await logApiUsage(
        user.id,
        'roadmap',
        result._usage.model,
        result._usage.input_tokens,
        result._usage.output_tokens
      )
    }

    // 6. Return response
    return NextResponse.json({ recommendations: result.recommendations })

  } catch (err: any) {
    console.error('[Recommend Goals API Error]', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
