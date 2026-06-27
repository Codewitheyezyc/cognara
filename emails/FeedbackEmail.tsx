import {
  Html, Head, Body, Container, Section,
  Text, Button, Hr, Preview, Img
} from '@react-email/components'
import * as React from 'react'

interface FeedbackEmailProps {
  userName: string
  appUrl: string
}

export function FeedbackEmail({ userName, appUrl }: FeedbackEmailProps) {
  const firstName = userName?.split(' ')[0] || 'there'

  return (
    <Html>
      <Head />
      <Preview>We built this for you. Now tell us what you really think.</Preview>
      <Body style={{
        backgroundColor: '#0A0C14',
        fontFamily: 'Inter, sans-serif',
        margin: 0,
        padding: '40px 20px'
      }}>
        <Container style={{
          maxWidth: '540px',
          margin: '0 auto',
          backgroundColor: '#111520',
          borderRadius: '16px',
          border: '1px solid #1E2540',
          overflow: 'hidden'
        }}>

          {/* Header */}
          <Section style={{ padding: '32px 36px 0', textAlign: 'center' }}>
            <Img
              src="https://www.cognaralearn.com/logo.png"
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

          {/* Main Body */}
          <Section style={{ padding: '28px 36px' }}>
            <Text style={{
              color: '#F0F4FF',
              fontSize: '22px',
              fontWeight: '700',
              margin: '0 0 6px',
              lineHeight: '1.3'
            }}>
              Hey {firstName} 👋
            </Text>

            <Text style={{
              color: '#8B95B3',
              fontSize: '15px',
              lineHeight: '1.75',
              margin: '0 0 20px'
            }}>
              I'm Isaac, the founder of <strong style={{ color: '#F0F4FF' }}>Cognara</strong> — and I wanted to reach out to you personally, not as a marketing email, but as a real conversation.
            </Text>

            <Text style={{
              color: '#8B95B3',
              fontSize: '15px',
              lineHeight: '1.75',
              margin: '0 0 20px'
            }}>
              You signed up for Cognara, and that means a lot. You are one of our very first users, which makes your opinion more valuable to me than almost anyone else's.
            </Text>

            <Text style={{
              color: '#8B95B3',
              fontSize: '15px',
              lineHeight: '1.75',
              margin: '0 0 6px'
            }}>
              So I'm going to be straight with you:
            </Text>

            <Text style={{
              color: '#F0F4FF',
              fontSize: '16px',
              fontWeight: '700',
              margin: '0 0 20px'
            }}>
              I want to know what you honestly think.
            </Text>

            <Text style={{
              color: '#8B95B3',
              fontSize: '15px',
              lineHeight: '1.75',
              margin: '0 0 24px'
            }}>
              Not what sounds polite — the real stuff. What's working for you? What's confusing? What made you open the app, and what made you close it? Your feedback right now will shape everything we build next.
            </Text>

            {/* Questions Card */}
            <div style={{
              backgroundColor: '#171C2E',
              border: '1px solid #1E2540',
              borderLeft: '3px solid #5B8EFF',
              borderRadius: '10px',
              padding: '20px 24px',
              marginBottom: '24px'
            }}>
              <Text style={{
                color: '#4A5272',
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
                margin: '0 0 14px'
              }}>
                Quick Questions
              </Text>
              {[
                'What made you sign up for Cognara?',
                'What feature do you use the most (or wish you used more)?',
                'Is there anything that frustrated or confused you?',
                'If Cognara Pro unlocks unlimited roadmaps, advanced quizzes, speed runs, and certificates — would you consider subscribing? If not, what\'s holding you back?'
              ].map((q, i) => (
                <Text key={i} style={{
                  color: '#C8D0E8',
                  fontSize: '14px',
                  lineHeight: '1.65',
                  margin: '0 0 10px'
                }}>
                  <span style={{ color: '#5B8EFF', fontWeight: 700 }}>{i + 1}.</span> {q}
                </Text>
              ))}
            </div>

            <Text style={{
              color: '#8B95B3',
              fontSize: '15px',
              lineHeight: '1.75',
              margin: '0 0 28px'
            }}>
              Just hit reply to this email and type your thoughts. I personally read every reply.
            </Text>

            {/* What's New Section */}
            <Text style={{
              color: '#F0F4FF',
              fontSize: '15px',
              fontWeight: '600',
              margin: '0 0 16px'
            }}>
              If you haven't explored Cognara in a while, here's what's new:
            </Text>

            {[
              { emoji: '🗺️', label: 'Interactive Visual Skill Tree', desc: 'your learning path, visualised like an RPG map' },
              { emoji: '🏆', label: 'Daily & Weekly Quests', desc: 'bite-sized goals that reward you with XP' },
              { emoji: '⚡', label: 'Speed Run Mode', desc: 'a 60-second rapid-fire quiz to test your recall' },
              { emoji: '❤️', label: 'Hearts & Lives Quiz System', desc: 'stakes-based quizzes that make you actually think' },
              { emoji: '🧠', label: 'Cognitive XP & Ranking', desc: 'level up your profile as you master content' },
              { emoji: '⚡', label: 'Spark, your AI Coach', desc: 'an interactive mascot that guides you through lessons' },
            ].map((item, i) => (
              <Text key={i} style={{
                color: '#8B95B3',
                fontSize: '14px',
                lineHeight: '1.65',
                margin: '0 0 8px'
              }}>
                {item.emoji} <strong style={{ color: '#F0F4FF' }}>{item.label}</strong> — {item.desc}
              </Text>
            ))}

            <Text style={{
              color: '#8B95B3',
              fontSize: '15px',
              lineHeight: '1.75',
              margin: '24px 0 28px'
            }}>
              We built all of this for go-getters like you. But nothing we build matters if it's not solving the right problems for you.
            </Text>

            {/* CTA Button */}
            <Button
              href={`${appUrl}/dashboard`}
              style={{
                backgroundColor: '#5B8EFF',
                color: '#FFFFFF',
                borderRadius: '10px',
                padding: '13px 28px',
                fontSize: '15px',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'block',
                textAlign: 'center' as const,
                marginBottom: '24px'
              }}
            >
              Open Cognara →
            </Button>

            <Text style={{
              color: '#8B95B3',
              fontSize: '15px',
              lineHeight: '1.75',
              margin: '0'
            }}>
              Hit reply and let me know what you think. I'm listening.
            </Text>
          </Section>

          <Hr style={{ borderColor: '#1E2540', margin: '0 36px' }} />

          {/* Signature */}
          <Section style={{ padding: '20px 36px' }}>
            <Text style={{
              color: '#C8D0E8',
              fontSize: '14px',
              lineHeight: '1.65',
              margin: '0 0 4px'
            }}>
              — <strong>Isaac Peter</strong>
            </Text>
            <Text style={{ color: '#4A5272', fontSize: '13px', margin: '0' }}>
              Founder, Cognara · <a href={appUrl} style={{ color: '#5B8EFF' }}>cognaralearn.com</a>
            </Text>
          </Section>

          <Hr style={{ borderColor: '#1E2540', margin: '0 36px' }} />

          {/* Footer */}
          <Section style={{ padding: '16px 36px' }}>
            <Text style={{
              color: '#4A5272',
              fontSize: '12px',
              textAlign: 'center' as const,
              margin: 0,
              lineHeight: '1.65'
            }}>
              You're receiving this because you signed up to Cognara.<br />
              If you'd like to unsubscribe, reply with "unsubscribe" and we'll remove you immediately.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

export default FeedbackEmail
