import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Mapping of valid quest keys to their XP values for verification
const QUEST_REWARDS: Record<string, number> = {
  daily_explorer: 50,
  daily_quiz: 50,
  daily_perfect: 100,
  weekly_lessons: 200,
  weekly_quizzes: 200,
  weekly_streak: 300
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

    // 2. Parse request body
    const body = await request.json()
    const { questKey, resetDate } = body

    if (!questKey || !resetDate) {
      return NextResponse.json(
        { error: 'Missing parameters: questKey and resetDate' },
        { status: 400 }
      )
    }

    const xpReward = QUEST_REWARDS[questKey]
    if (!xpReward) {
      return NextResponse.json({ error: 'Invalid quest key' }, { status: 400 })
    }

    // 3. Insert claim entry (UNIQUE constraint user_id + quest_key + reset_date will reject duplicates)
    const { error: claimError } = await supabase
      .from('user_quests')
      .insert({
        user_id: user.id,
        quest_key: questKey,
        reset_date: resetDate,
        claimed: true
      })

    if (claimError) {
      // If it unique constraint violations code is 23505 in Postgres
      if (claimError.code === '23505') {
        return NextResponse.json({ error: 'Quest reward already claimed' }, { status: 400 })
      }
      throw claimError
    }

    // 4. Award the XP using the database RPC
    let xpData: any = null
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('add_xp', {
        user_id: user.id,
        amount: xpReward
      })
      if (!rpcError && rpcData) {
        xpData = rpcData
      } else if (rpcError) {
        throw rpcError
      }
    } catch (xpErr) {
      console.error('[Quests Claim] Error calling add_xp RPC:', xpErr)
    }

    return NextResponse.json({
      success: true,
      xp: xpData ? {
        xpGained: xpReward,
        newXp: xpData.xp,
        newLevel: xpData.level,
        leveledUp: xpData.leveled_up
      } : null
    })
  } catch (err: any) {
    console.error('[Quests Claim Error]', err)
    return NextResponse.json({ error: 'Claim failed' }, { status: 500 })
  }
}
