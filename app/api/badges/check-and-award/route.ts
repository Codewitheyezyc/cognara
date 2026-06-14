import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const BADGES = {
  phase_1: { emoji: '🌱', label: 'First Steps', description: 'Completed Phase 1' },
  phase_2: { emoji: '🔥', label: 'Building Momentum', description: 'Completed Phase 2' },
  phase_3: { emoji: '⚡', label: 'Halfway There', description: 'Completed Phase 3' },
  phase_4: { emoji: '🎯', label: 'Advanced Learner', description: 'Completed Phase 4' },
  phase_5: { emoji: '🏆', label: 'Graduate', description: 'Completed full roadmap' },
  streak_7: { emoji: '🔥', label: 'Week Warrior', description: '7 day streak' },
  streak_30: { emoji: '💎', label: 'Consistent', description: '30 day streak' },
  perfect_quiz: { emoji: '⭐', label: 'Perfect Score', description: '100% on a quiz' },
  speed_learner: { emoji: '⚡', label: 'Speed Learner', description: '3 lessons in one day' }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { quizScore, lessonId, currentStreak } = body

    const awardedBadges: any[] = []

    // Helper to award a badge (safe against duplicate database unique constraint)
    const awardBadge = async (badgeKey: string, label: string, emoji: string, subject: string) => {
      // First check if badge is already earned
      const { data: existing } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user.id)
        .eq('badge_key', badgeKey)
        .eq('subject', subject)
        .maybeSingle()

      if (existing) return

      const { data, error } = await supabase
        .from('user_badges')
        .insert({
          user_id: user.id,
          badge_key: badgeKey,
          badge_label: label,
          badge_emoji: emoji,
          subject: subject
        })
        .select('*')
        .maybeSingle()

      if (!error && data) {
        awardedBadges.push(data)
      }
    }

    // --- RULE 1: Perfect Quiz Score (100%) ---
    if (quizScore === 100) {
      let subject = 'General'
      if (lessonId) {
        const { data: lessonData } = await supabase
          .from('lessons')
          .select('roadmap_id')
          .eq('id', lessonId)
          .maybeSingle()
        if (lessonData?.roadmap_id) {
          const { data: roadmapData } = await supabase
            .from('roadmaps')
            .select('goal_id')
            .eq('id', lessonData.roadmap_id)
            .maybeSingle()
          if (roadmapData?.goal_id) {
            const { data: goalData } = await supabase
              .from('learning_goals')
              .select('subject')
              .eq('id', roadmapData.goal_id)
              .maybeSingle()
            if (goalData?.subject) {
              subject = goalData.subject
            }
          }
        }
      }
      await awardBadge('perfect_quiz', BADGES.perfect_quiz.label, BADGES.perfect_quiz.emoji, subject)
    }

    // --- RULE 2: Streak Badges (7 or 30) ---
    const streakToCheck = currentStreak !== undefined 
      ? currentStreak 
      : await (async () => {
          const { data } = await supabase.from('streaks').select('current_streak').eq('user_id', user.id).maybeSingle()
          return data?.current_streak || 0
        })()

    if (streakToCheck >= 7) {
      await awardBadge('streak_7', BADGES.streak_7.label, BADGES.streak_7.emoji, 'General')
    }
    if (streakToCheck >= 30) {
      await awardBadge('streak_30', BADGES.streak_30.label, BADGES.streak_30.emoji, 'General')
    }

    // --- RULE 3: Speed Learner (3 lessons in one day) ---
    const todayStr = new Date().toISOString().split('T')[0]
    const { count: lessonsCompletedToday } = await supabase
      .from('lesson_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('completed_at', `${todayStr}T00:00:00.000Z`)
      .lte('completed_at', `${todayStr}T23:59:59.999Z`)

    if (lessonsCompletedToday && lessonsCompletedToday >= 3) {
      await awardBadge('speed_learner', BADGES.speed_learner.label, BADGES.speed_learner.emoji, 'General')
    }

    // --- RULE 4: Phase Completion Badges (phase_1 to phase_5) ---
    if (lessonId) {
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('phase_id, roadmap_id')
        .eq('id', lessonId)
        .maybeSingle()

      if (lessonData?.phase_id) {
        const { data: phaseData } = await supabase
          .from('roadmap_phases')
          .select('phase_number, title')
          .eq('id', lessonData.phase_id)
          .maybeSingle()

        if (phaseData) {
          const phaseNum = phaseData.phase_number
          
          const { data: phaseLessons } = await supabase
            .from('lessons')
            .select('id')
            .eq('phase_id', lessonData.phase_id)

          if (phaseLessons && phaseLessons.length > 0) {
            const lessonIds = phaseLessons.map(l => l.id)
            
            const { data: completedProgress } = await supabase
              .from('lesson_progress')
              .select('lesson_id')
              .eq('user_id', user.id)
              .eq('status', 'completed')
              .in('lesson_id', lessonIds)

            const completedCount = completedProgress?.length || 0
            if (completedCount === phaseLessons.length) {
              let subject = 'General'
              if (lessonData.roadmap_id) {
                const { data: roadmapData } = await supabase
                  .from('roadmaps')
                  .select('goal_id')
                  .eq('id', lessonData.roadmap_id)
                  .maybeSingle()
                if (roadmapData?.goal_id) {
                  const { data: goalData } = await supabase
                    .from('learning_goals')
                    .select('subject')
                    .eq('id', roadmapData.goal_id)
                    .maybeSingle()
                  if (goalData?.subject) {
                    subject = goalData.subject
                  }
                }
              }

              const phaseKey = `phase_${phaseNum}` as keyof typeof BADGES
              if (BADGES[phaseKey]) {
                await awardBadge(phaseKey, BADGES[phaseKey].label, BADGES[phaseKey].emoji, subject)
              }

              // Check if ALL lessons in the entire roadmap are completed
              if (lessonData.roadmap_id) {
                const { data: allRoadmapLessons } = await supabase
                  .from('lessons')
                  .select('id')
                  .eq('roadmap_id', lessonData.roadmap_id)

                if (allRoadmapLessons && allRoadmapLessons.length > 0) {
                  const allRoadmapIds = allRoadmapLessons.map(l => l.id)
                  const { data: allCompletedProgress } = await supabase
                    .from('lesson_progress')
                    .select('lesson_id')
                    .eq('user_id', user.id)
                    .eq('status', 'completed')
                    .in('lesson_id', allRoadmapIds)

                  if (allCompletedProgress?.length === allRoadmapLessons.length) {
                    await awardBadge('phase_5', BADGES.phase_5.label, BADGES.phase_5.emoji, subject)
                  }
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, newBadges: awardedBadges })
  } catch (err) {
    console.error('[API Check Badges Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
