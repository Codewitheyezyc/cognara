import { Resend } from 'resend'
import { DailyNudgeEmail } from '@/emails/DailyNudgeEmail'
import React from 'react'

let resendClient: Resend | null = null

function getResendClient() {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY || 'mock_resend_api_key'
    resendClient = new Resend(apiKey)
  }
  return resendClient
}

export async function sendDailyNudge(params: {
  to: string
  userName: string
  nextLessonTitle: string
  nextLessonId: string
  streakDays: number
  subject: string
}) {
  const resend = getResendClient()
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
