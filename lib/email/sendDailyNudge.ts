import { Resend } from 'resend'
import { DailyNudgeEmail } from '@/emails/DailyNudgeEmail'
import React from 'react'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendDailyNudge(params: {
  to: string
  userName: string
  nextLessonTitle: string
  nextLessonId: string
  streakDays: number
  subject: string
}) {
  await resend.emails.send({
    from: 'Cognara <hello@cognara.com>',
    to: params.to,
    subject: params.streakDays > 0
      ? `🔥 ${params.streakDays} day streak — keep going, ${params.userName}`
      : `Your next lesson is waiting, ${params.userName}`,
    react: React.createElement(DailyNudgeEmail, {
      ...params,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    })
  })
}
