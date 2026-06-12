import { Lock } from 'lucide-react'

interface LessonLockCardProps {
  lessonTitle: string
  lessonNumber: number
  onUpgrade: () => void
}

export function LessonLockCard({ lessonTitle, lessonNumber, onUpgrade }: LessonLockCardProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '10px',
        opacity: 0.6,
        cursor: 'pointer'
      }}
      onClick={onUpgrade}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'var(--color-surface-alt)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          color: 'var(--color-text-3)',
          fontWeight: 600
        }}>
          {lessonNumber}
        </div>
        <span style={{
          color: 'var(--color-text-2)',
          fontSize: '14px'
        }}>
          {lessonTitle}
        </span>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: 'var(--color-text-3)',
        fontSize: '12px'
      }}>
        <Lock size={14} />
        Pro
      </div>
    </div>
  )
}
