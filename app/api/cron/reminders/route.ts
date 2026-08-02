import { NextResponse } from 'next/server'
import { GET as handleDailyNudge } from '../daily-nudge/route'

export const dynamic = 'force-dynamic'

// Legacy /api/cron/reminders endpoint now delegates directly to the single consolidated engine at /api/cron/daily-nudge
export async function GET(request: Request) {
  console.log('[Cron Reminders Legacy Endpoint] Delegating execution to consolidated engine /api/cron/daily-nudge...')
  return handleDailyNudge(request)
}
