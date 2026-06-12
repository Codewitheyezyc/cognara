'use client'

const CALLOUT_CONFIG = {
  info:      { icon: '💡', label: 'Note',      bg: 'rgba(91,142,255,0.08)',  border: '#5B8EFF', color: '#5B8EFF' },
  tip:       { icon: '✅', label: 'Tip',       bg: 'rgba(52,211,153,0.08)',  border: '#34D399', color: '#34D399' },
  warning:   { icon: '⚠️', label: 'Warning',   bg: 'rgba(245,158,11,0.08)', border: '#F59E0B', color: '#F59E0B' },
  important: { icon: '🔴', label: 'Important', bg: 'rgba(248,113,113,0.08)', border: '#F87171', color: '#F87171' },
  pro_tip:   { icon: '⚡', label: 'Pro Tip',   bg: 'rgba(167,139,250,0.08)', border: '#A78BFA', color: '#A78BFA' },
}

export function Callout({ type, body }: { type: keyof typeof CALLOUT_CONFIG, body: string }) {
  const config = CALLOUT_CONFIG[type] || CALLOUT_CONFIG.info
  return (
    <div style={{
      background: config.bg,
      border: `1px solid ${config.border}`,
      borderLeft: `4px solid ${config.border}`,
      borderRadius: '8px',
      padding: '16px 20px',
      marginBlock: '20px',
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start'
    }}>
      <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>{config.icon}</span>
      <div>
        <div style={{ color: config.color, fontWeight: 600, fontSize: '13px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {config.label}
        </div>
        <div style={{ color: 'var(--color-text-1)', fontSize: '15px', lineHeight: '1.65' }}>
          {body}
        </div>
      </div>
    </div>
  )
}
