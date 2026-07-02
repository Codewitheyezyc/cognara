import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const PRACTICAL_STREAK_THRESHOLD = 5
const PRACTICAL_STREAK_BONUS_CXP = 100
const PRACTICAL_STREAK_BADGE = '🔧 Practice Makes Perfect'
const PRACTICAL_STREAK_BADGE_DESC = '5 practical exercises completed in a row'

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch the last 5 completed practicals for this user (ordered most-recent first)
    const { data: recentPracticals, error: fetchErr } = await adminSupabase
      .from('cognara_practical_completions')
      .select('id, status, completed_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(PRACTICAL_STREAK_THRESHOLD)

    if (fetchErr || !recentPracticals) {
      console.error('[PracticalMilestones] Error fetching practicals:', fetchErr)
      return NextResponse.json({ checked: false })
    }

    // Check if the last 5 are ALL completed (not skipped)
    if (recentPracticals.length < PRACTICAL_STREAK_THRESHOLD) {
      return NextResponse.json({ checked: true, streakBonus: false })
    }

    const allCompleted = recentPracticals.every(p => p.status === 'completed')

    if (!allCompleted) {
      return NextResponse.json({ checked: true, streakBonus: false })
    }

    // Make sure we haven't already awarded this specific streak bonus
    // (detect by checking if a 'practical_streak' event was awarded after the oldest of these 5)
    const oldestCompletion = recentPracticals[PRACTICAL_STREAK_THRESHOLD - 1].completed_at

    const { data: existingBonus } = await adminSupabase
      .from('cognara_cxp_events')
      .select('id')
      .eq('user_id', user.id)
      .eq('source', 'practical_streak')
      .gte('created_at', oldestCompletion || new Date(0).toISOString())
      .maybeSingle()

    if (existingBonus) {
      // Already awarded for this streak window
      return NextResponse.json({ checked: true, streakBonus: false, alreadyAwarded: true })
    }

    // Award +100 CXP bonus via RPC
    const { error: cxpErr } = await adminSupabase.rpc('award_user_cxp', {
      user_id_input: user.id,
      amount_input: PRACTICAL_STREAK_BONUS_CXP,
      source_input: 'practical_streak',
      description_input: PRACTICAL_STREAK_BADGE_DESC,
    })

    if (cxpErr) {
      console.error('[PracticalMilestones] Failed to award streak CXP:', cxpErr)
    } else {
      console.log(`[PracticalMilestones] Awarded ${PRACTICAL_STREAK_BONUS_CXP} CXP streak bonus to user ${user.id}`)
    }

    return NextResponse.json({
      checked: true,
      streakBonus: true,
      bonusCxp: PRACTICAL_STREAK_BONUS_CXP,
      badge: PRACTICAL_STREAK_BADGE,
      badgeDesc: PRACTICAL_STREAK_BADGE_DESC,
    })
  } catch (err: any) {
    console.error('[PracticalMilestones] Fatal error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
