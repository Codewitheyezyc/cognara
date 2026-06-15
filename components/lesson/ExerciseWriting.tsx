'use client'
import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'

interface ExerciseWritingProps {
  instructions: string
  criteria: string[]
  lessonTitle: string
  subject: string
}

interface AIFeedback {
  score: number
  strengths: string[]
  improvements: string[]
  suggestion: string
  encouragement: string
}

export function ExerciseWriting({
  instructions,
  criteria,
  lessonTitle,
  subject
}: ExerciseWritingProps) {
  const [text, setText] = useState('')
  const [feedback, setFeedback] = useState<AIFeedback | null>(null)
  const [loading, setLoading] = useState(false)
  const [wordCount, setWordCount] = useState(0)

  const handleTextChange = (val: string) => {
    setText(val)
    setWordCount(val.trim() ? val.trim().split(/\s+/).length : 0)
  }

  const submitForReview = async () => {
    if (!text.trim() || text.trim().split(/\s+/).length < 10) return
    setLoading(true)
    setFeedback(null)

    try {
      const res = await fetch('/api/ai/review-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission: text,
          instructions,
          criteria,
          lessonTitle,
          subject
        })
      })
      const data = await res.json()
      setFeedback(data.feedback)
    } catch (err) {
      console.error('Review failed', err)
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = feedback
    ? feedback.score >= 80 ? 'var(--color-success)'
    : feedback.score >= 60 ? 'var(--color-accent-warm)'
    : 'var(--color-error)'
    : 'var(--color-text-2)'

  return (
    <div style={{
      border: '1px solid var(--color-border)',
      borderRadius: '12px',
      overflow: 'hidden',
      marginBlock: '24px'
    }}>
      {/* Instructions */}
      <div style={{
        padding: '14px 48px 14px 20px',
        background: 'var(--color-surface-alt)',
        borderBottom: '1px solid var(--color-border)'
      }}>
        <div style={{
          fontSize: '11px',
          color: 'var(--color-accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontFamily: 'JetBrains Mono, monospace',
          marginBottom: '6px'
        }}>
          Writing Exercise
        </div>
        <p style={{ color: 'var(--color-text-1)', fontSize: '14px', margin: 0 }}>
          {instructions}
        </p>
        {criteria.length > 0 && (
          <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {criteria.map((c, i) => (
              <span key={i} style={{
                background: 'var(--color-primary-glow)',
                color: 'var(--color-primary)',
                fontSize: '11px',
                padding: '3px 10px',
                borderRadius: '999px',
                fontWeight: 500
              }}>
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Text area */}
      <div style={{ padding: '16px 20px', background: 'var(--color-surface)' }}>
        <textarea
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Write your response here..."
          rows={8}
          style={{
            width: '100%',
            background: 'var(--color-surface-alt)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            padding: '14px',
            color: 'var(--color-text-1)',
            fontSize: '15px',
            lineHeight: '1.7',
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'Inter, sans-serif',
            boxSizing: 'border-box'
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '12px'
        }}>
          <span style={{ color: 'var(--color-text-3)', fontSize: '12px' }}>
            {wordCount} words {wordCount < 10 && '(write at least 10 words)'}
          </span>
          <button
            onClick={submitForReview}
            disabled={loading || wordCount < 10}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: wordCount >= 10 ? 'var(--color-primary)' : 'var(--color-border)',
              color: wordCount >= 10 ? '#FFFFFF' : 'var(--color-text-3)',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: wordCount >= 10 ? 'pointer' : 'not-allowed'
            }}
          >
            {loading
              ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Reviewing...</>
              : <><Send size={14} /> Submit for AI Review</>
            }
          </button>
        </div>
      </div>

      {/* AI Feedback */}
      {feedback && (
        <div style={{
          padding: '20px',
          background: 'var(--color-surface-alt)',
          borderTop: '1px solid var(--color-border)'
        }}>
          {/* Score */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{
              fontSize: '36px',
              fontWeight: 700,
              color: scoreColor,
              fontFamily: 'Sora, sans-serif'
            }}>
              {feedback.score}
              <span style={{ fontSize: '16px', color: 'var(--color-text-2)' }}>/100</span>
            </div>
            <p style={{
              color: 'var(--color-text-1)',
              fontSize: '14px',
              margin: 0,
              fontStyle: 'italic'
            }}>
              {feedback.encouragement}
            </p>
          </div>

          {/* Strengths */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>
              ✅ What you did well
            </div>
            {feedback.strengths.map((s, i) => (
              <div key={i} style={{
                color: 'var(--color-text-1)',
                fontSize: '14px',
                padding: '6px 0',
                borderBottom: i < feedback.strengths.length - 1 ? '1px solid var(--color-border)' : 'none'
              }}>
                {s}
              </div>
            ))}
          </div>

          {/* Improvements */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ color: 'var(--color-accent-warm)', fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>
              ⚠️ Areas to improve
            </div>
            {feedback.improvements.map((imp, i) => (
              <div key={i} style={{
                color: 'var(--color-text-1)',
                fontSize: '14px',
                padding: '6px 0',
                borderBottom: i < feedback.improvements.length - 1 ? '1px solid var(--color-border)' : 'none'
              }}>
                {imp}
              </div>
            ))}
          </div>

          {/* Suggestion */}
          <div style={{
            background: 'rgba(91,142,255,0.08)',
            border: '1px solid var(--color-primary)',
            borderRadius: '8px',
            padding: '14px 16px',
            color: 'var(--color-text-1)',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            💡 <strong>Suggestion:</strong> {feedback.suggestion}
          </div>
        </div>
      )}
    </div>
  )
}
