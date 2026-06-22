import {
  Html, Head, Body, Container, Section,
  Text, Button, Hr, Preview, Img
} from '@react-email/components'
import * as React from 'react'

interface DailyNudgeEmailProps {
  userName: string
  nextLessonTitle: string
  nextLessonId: string
  streakDays: number
  subject: string
  appUrl: string
}

export function DailyNudgeEmail({
  userName,
  nextLessonTitle,
  nextLessonId,
  streakDays,
  subject,
  appUrl
}: DailyNudgeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {streakDays > 0
          ? `🔥 ${streakDays} day streak — keep it going, ${userName}`
          : `Your next lesson is waiting, ${userName}`
        }
      </Preview>
      <Body style={{
        backgroundColor: '#0A0C14',
        fontFamily: 'Inter, sans-serif',
        margin: 0,
        padding: '40px 20px'
      }}>
        <Container style={{
          maxWidth: '520px',
          margin: '0 auto',
          backgroundColor: '#111520',
          borderRadius: '16px',
          border: '1px solid #1E2540',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <Section style={{
            padding: '28px 32px 0',
            textAlign: 'center'
          }}>
            <Img
              src={`${appUrl}/icon-192.png`}
              width="48"
              height="48"
              alt="Cognara"
              style={{ margin: '0 auto 8px', display: 'block' }}
            />
            <Text style={{
              color: '#5B8EFF',
              fontSize: '20px',
              fontWeight: '700',
              margin: '0',
              letterSpacing: '-0.02em'
            }}>
              Cognara
            </Text>
          </Section>

          {/* Streak */}
          {streakDays > 0 && (
            <Section style={{ padding: '16px 32px 0', textAlign: 'center' }}>
              <Text style={{
                display: 'inline-block',
                backgroundColor: 'rgba(245,158,11,0.1)',
                color: '#F59E0B',
                padding: '6px 16px',
                borderRadius: '999px',
                fontSize: '13px',
                fontWeight: '600',
                margin: 0
              }}>
                🔥 {streakDays} day streak — don't break it!
              </Text>
            </Section>
          )}

          {/* Main content */}
          <Section style={{ padding: '24px 32px' }}>
            <Text style={{
              color: '#F0F4FF',
              fontSize: '20px',
              fontWeight: '600',
              margin: '0 0 8px',
              lineHeight: '1.3'
            }}>
              Good {getTimeOfDay()}, {userName} 👋
            </Text>

            <Text style={{
              color: '#8B95B3',
              fontSize: '15px',
              lineHeight: '1.65',
              margin: '0 0 24px'
            }}>
              Your next lesson in <strong style={{ color: '#F0F4FF' }}>{subject}</strong> is ready for you.
            </Text>

            {/* Lesson card */}
            <div style={{
              backgroundColor: '#171C2E',
              border: '1px solid #1E2540',
              borderLeft: '3px solid #5B8EFF',
              borderRadius: '10px',
              padding: '16px 20px',
              marginBottom: '24px'
            }}>
              <Text style={{
                color: '#4A5272',
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                margin: '0 0 6px'
              }}>
                NEXT LESSON
              </Text>
              <Text style={{
                color: '#F0F4FF',
                fontSize: '16px',
                fontWeight: '600',
                margin: 0,
                lineHeight: '1.4'
              }}>
                {nextLessonTitle}
              </Text>
            </div>

            <Button
              href={`${appUrl}/dashboard/lesson/${nextLessonId}`}
              style={{
                backgroundColor: '#5B8EFF',
                color: '#FFFFFF',
                borderRadius: '10px',
                padding: '13px 28px',
                fontSize: '15px',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'block',
                textAlign: 'center'
              }}
            >
              Continue Learning →
            </Button>
          </Section>

          <Hr style={{ borderColor: '#1E2540', margin: '0 32px' }} />

          {/* Footer */}
          <Section style={{ padding: '16px 32px' }}>
            <Text style={{
              color: '#4A5272',
              fontSize: '12px',
              textAlign: 'center',
              margin: 0
            }}>
              You are receiving this because you enabled daily reminders.
              <br />
              <a
                href={`${appUrl}/dashboard/settings`}
                style={{ color: '#5B8EFF' }}
              >
                Update reminder settings
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

export default DailyNudgeEmail
