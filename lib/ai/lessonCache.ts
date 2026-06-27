import { SupabaseClient } from '@supabase/supabase-js'
import { GeneratedLesson } from '@/types/ai'

const TECHNOLOGY_KEYWORDS = [
  'javascript', 'python', 'react', 'next.js', 'node', 'typescript',
  'web development', 'frontend', 'backend', 'fullstack', 'programming',
  'coding', 'software development', 'database query', 'sql', 'css', 'html',
  'swift', 'kotlin', 'java', 'c++', 'rust', 'go', 'php', 'ruby', 'r programming',
  'shell scripting', 'bash scripting', 'command line scripting', 'figma',
  'ui/ux', 'design', 'git', 'github', 'version control'
]

const BUSINESS_KEYWORDS = [
  'business', 'marketing', 'finance', 'accounting', 'economics', 'sales',
  'startup', 'strategy', 'ecommerce', 'leadership', 'management', 'entrepreneurship',
  'commerce', 'ican', 'business plan'
]

const MEDICINE_KEYWORDS = [
  'anatomy', 'biology', 'medicine', 'nursing', 'physiology', 'first aid',
  'health', 'cardiovascular', 'pharmacology', 'medical', 'clinical'
]

const LANGUAGE_KEYWORDS = [
  'english', 'french', 'spanish', 'yoruba', 'igbo', 'hausa', 'german',
  'arabic', 'literature', 'language', 'linguistics', 'grammar'
]

const ACADEMIC_KEYWORDS = [
  'mathematics', 'math', 'physics', 'chemistry', 'geography', 'government',
  'history', 'civic education', 'basic science', 'basic technology',
  'social studies', 'religious studies', 'crs', 'irs', 'waec', 'jamb'
]

/**
 * Maps a subject to a high-level domain category as specified in Document 05
 */
export function getDomainFromSubject(subject: string): string {
  const lower = subject.toLowerCase()

  if (TECHNOLOGY_KEYWORDS.some(kw => lower.includes(kw))) {
    return 'Technology'
  }
  if (BUSINESS_KEYWORDS.some(kw => lower.includes(kw))) {
    return 'Business'
  }
  if (MEDICINE_KEYWORDS.some(kw => lower.includes(kw))) {
    return 'Medicine'
  }
  if (LANGUAGE_KEYWORDS.some(kw => lower.includes(kw))) {
    return 'Language'
  }
  if (ACADEMIC_KEYWORDS.some(kw => lower.includes(kw))) {
    return 'Academic'
  }

  return 'General'
}

interface CacheLookupParams {
  domain: string
  subject: string
  module: string
  topic: string
  depthLevel: number
}

/**
 * Queries the Supabase lesson cache table to check for an existing lesson
 */
export async function checkLessonCache(
  supabase: SupabaseClient,
  params: CacheLookupParams
): Promise<GeneratedLesson | null> {
  try {
    const { data, error } = await supabase
      .from('cognara_lesson_cache')
      .select('content, quality_score')
      .eq('domain', params.domain)
      .eq('subject', params.subject)
      .eq('module', params.module)
      .eq('topic', params.topic)
      .eq('depth_level', params.depthLevel)
      .maybeSingle()

    if (error) {
      console.error('[LessonCache] Error querying cache:', error)
      return null
    }

    if (data && data.content) {
      // Ensure the content is structured and not a mock/fallback lesson
      const lesson = data.content as any
      if (lesson && typeof lesson === 'object' && lesson._isMock !== true) {
        console.log(`[LessonCache] CACHE HIT for topic "${params.topic}" depth ${params.depthLevel} (Quality: ${data.quality_score})`)
        return lesson as GeneratedLesson
      }
    }

    return null
  } catch (err) {
    console.error('[LessonCache] Exception checking cache:', err)
    return null
  }
}

interface CacheWriteParams extends CacheLookupParams {
  content: GeneratedLesson
}

/**
 * Writes newly generated lesson content into the cache table
 */
export async function writeLessonCache(
  supabase: SupabaseClient,
  params: CacheWriteParams
): Promise<boolean> {
  try {
    // Only cache if it is a real Claude output (not mock fallback)
    if (params.content && (params.content as any)._isMock === true) {
      console.warn(`[LessonCache] Attempted to cache mock content for topic "${params.topic}" - skipped.`)
      return false
    }

    const { error } = await supabase
      .from('cognara_lesson_cache')
      .upsert(
        {
          domain: params.domain,
          subject: params.subject,
          module: params.module,
          topic: params.topic,
          depth_level: params.depthLevel,
          content: params.content,
          quality_score: 100,
          flag_count: 0,
          last_reviewed_at: new Date().toISOString(),
          version: 1
        },
        {
          onConflict: 'domain,subject,module,topic,depth_level'
        }
      )

    if (error) {
      console.error('[LessonCache] Failed to write cache:', error)
      return false
    }

    console.log(`[LessonCache] CACHE WRITE SUCCESS for topic "${params.topic}" depth ${params.depthLevel}`)
    return true
  } catch (err) {
    console.error('[LessonCache] Exception writing cache:', err)
    return false
  }
}
