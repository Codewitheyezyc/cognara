'use client'

import React, { useEffect } from 'react'
import {
  Brain, Map, Target, Sliders, Flame, WifiOff
} from 'lucide-react'

interface WhyCardProps {
  icon: React.ReactNode
  headline: string
  body: string
  index: number
}

function WhyCard({ icon, headline, body, index }: WhyCardProps) {
  const delayMs = index * 80 // Card 1: 0ms, Card 2: 80ms, Card 3: 160ms, Card 4: 240ms, Card 5: 320ms, Card 6: 400ms
  
  return (
    <div
      className="why-card"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        transitionDelay: `${delayMs}ms`
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'translateY(-4px)'
        el.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)'
        el.style.borderColor = 'rgba(91,142,255,0.3)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = 'none'
        el.style.borderColor = 'var(--color-border)'
      }}
    >
      {/* Icon container */}
      <div style={{
        width: '44px',
        height: '44px',
        borderRadius: '12px',
        background: 'rgba(91,142,255,0.1)',
        border: '1px solid rgba(91,142,255,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-primary)',
        flexShrink: 0
      }}>
        {icon}
      </div>

      {/* Text */}
      <div>
        <h3 style={{
          color: 'var(--color-text-1)',
          fontSize: '17px',
          fontWeight: 700,
          fontFamily: 'Sora, sans-serif',
          margin: '0 0 10px',
          lineHeight: 1.3
        }}>
          {headline}
        </h3>
        <p style={{
          color: 'var(--color-text-2)',
          fontSize: '14px',
          lineHeight: 1.75,
          margin: 0
        }}>
          {body}
        </p>
      </div>
    </div>
  )
}

const cards = [
  {
    icon: <Brain size={20} />,
    headline: 'It remembers everything about you',
    body: 'Generic AI tools forget you the moment you close the tab. Cognara remembers your goal, your progress, every lesson you completed, every quiz you passed, and every topic you struggled with. Every time you return it picks up exactly where you left off — because your learning journey never resets.'
  },
  {
    icon: <Map size={20} />,
    headline: 'A real path — not just a list',
    body: 'There is a difference between knowing what to study and knowing what to study first, second, and third. Cognara builds a structured roadmap with phases in the right order, lessons that build on each other, and a clear sense of where you are going. Not a dump of information — a genuine journey from where you are to where you want to be.'
  },
  {
    icon: <Target size={20} />,
    headline: 'It tests you — not just teaches you',
    body: 'Reading about something is not the same as knowing it. After every lesson Cognara gives you a quiz, saves your score, and identifies the exact topics where you are weak. If you struggle with something the system notices and brings you back to it before moving forward. You do not just feel like you learned — you can prove it.'
  },
  {
    icon: <Sliders size={20} />,
    headline: 'Lessons written at your exact level',
    body: 'A 45-year-old professional learning to code needs a completely different explanation than a 16-year-old student. Cognara adapts every lesson to your chosen depth level — from the simplest possible language all the way to expert-level depth. The same topic. Completely different lessons. Written specifically for where your mind is right now.'
  },
  {
    icon: <Flame size={20} />,
    headline: 'Built to keep you coming back',
    body: 'The biggest reason people quit learning is not lack of motivation on day one — it is lack of a reason to show up on day eleven. Cognara tracks your daily streak, celebrates your milestones, and brings Spark — your personal learning companion — to cheer you on at every step. The system is designed around one goal: making sure you finish.'
  },
  {
    icon: <WifiOff size={20} />,
    headline: 'Keeps working even without internet',
    body: 'Download any lesson before you go offline and it stays on your device — fully readable with zero connection. Whether you are on a long trip, in an area with poor network, or simply want to read without distractions, your lessons are always available. Your learning does not stop because your network did.'
  }
]

export function WhyCognara() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll('.why-card').forEach(card => {
      observer.observe(card)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="why-cognara"
      style={{
        padding: '96px 20px',
        background: 'var(--color-bg)'
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Part A — Contrast statement */}
        <div style={{
          textAlign: 'center',
          maxWidth: '680px',
          margin: '0 auto 64px',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(91,142,255,0.1)',
            color: 'var(--color-primary)',
            padding: '6px 16px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '20px'
          }}>
            THE COGNARA DIFFERENCE
          </div>

          <h2 style={{
            color: 'var(--color-text-1)',
            fontSize: 'clamp(28px, 5vw, 42px)',
            fontWeight: 700,
            fontFamily: 'Sora, sans-serif',
            lineHeight: 1.2,
            margin: '0 0 16px',
            letterSpacing: '-0.02em'
          }}>
            This is not just another AI tool.
          </h2>

          <p style={{
            color: 'var(--color-text-2)',
            fontSize: '17px',
            lineHeight: 1.7,
            margin: 0
          }}>
            Anyone can paste a topic into an AI chatbot and get a list
            of things to study. But getting a list is not the same as
            actually learning. Cognara is the system built around the
            part everyone skips — showing up every day, staying on
            track, and finishing what you started.
          </p>

          {/* Divider with icon */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            justifyContent: 'center',
            marginTop: '32px'
          }}>
            <div style={{
              height: '1px',
              width: '60px',
              background: 'var(--color-border)'
            }} />
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(91,142,255,0.1)',
              border: '1px solid var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px'
            }}>
              ⚡
            </div>
            <div style={{
              height: '1px',
              width: '60px',
              background: 'var(--color-border)'
            }} />
          </div>
        </div>

        {/* Part B — Cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {cards.map((card, index) => (
            <WhyCard
              key={index}
              index={index}
              icon={card.icon}
              headline={card.headline}
              body={card.body}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{
          textAlign: 'center',
          marginTop: '56px'
        }}>
          <p style={{
            color: 'var(--color-text-2)',
            fontSize: '16px',
            marginBottom: '20px'
          }}>
            Ready to learn the way you always wished you could?
          </p>
          <a
            href="/signup"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--color-primary)',
              color: '#FFFFFF',
              borderRadius: '12px',
              padding: '14px 32px',
              fontSize: '15px',
              fontWeight: 600,
              textDecoration: 'none',
              fontFamily: 'Sora, sans-serif',
              boxShadow: '0 4px 24px rgba(91,142,255,0.35)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
          >
            Start learning free
          </a>
        </div>

      </div>
    </section>
  )
}
