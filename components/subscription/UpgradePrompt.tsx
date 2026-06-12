'use client'
import { Zap, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface UpgradePromptProps {
  context?: string  // e.g. "Continue your JavaScript journey"
}

export function UpgradePrompt({ context }: UpgradePromptProps) {
  const router = useRouter()

  const proFeatures = [
    'All phases and lessons unlocked',
    'Live code editor and project builder',
    'AI writing workspace with feedback',
    'Progress analytics and insights',
    'All 5 depth levels',
    'Unlimited learning goals'
  ]

  return (
    <div style={{
      border: '1px solid var(--color-primary)',
      borderRadius: '16px',
      overflow: 'hidden',
      marginBlock: '32px',
      background: 'var(--color-surface)'
    }}>
      {/* Header */}
      <div style={{
        padding: '24px',
        background: 'linear-gradient(135deg, rgba(91,142,255,0.12), rgba(167,139,250,0.08))',
        borderBottom: '1px solid var(--color-border)',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--color-primary)',
          color: '#FFFFFF',
          padding: '6px 14px',
          borderRadius: '999px',
          fontSize: '12px',
          fontWeight: 600,
          marginBottom: '16px'
        }}>
          <Zap size={13} />
          Upgrade to Pro
        </div>

        <h3 style={{
          color: 'var(--color-text-1)',
          fontSize: '22px',
          fontWeight: 700,
          fontFamily: 'Sora, sans-serif',
          margin: '0 0 8px'
        }}>
          {context || 'Keep your learning momentum going'}
        </h3>

        <p style={{
          color: 'var(--color-text-2)',
          fontSize: '14px',
          margin: 0
        }}>
          You have reached the free plan limit.
          Unlock everything and keep going.
        </p>
      </div>

      {/* Features list */}
      <div style={{ padding: '20px 24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginBottom: '24px'
        }}>
          {proFeatures.map((feature, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: 'var(--color-text-1)'
            }}>
              <Check size={14} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
              {feature}
            </div>
          ))}
        </div>

        {/* Pricing buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* Monthly */}
          <button
            onClick={() => router.push('/upgrade?plan=monthly')}
            style={{
              padding: '14px',
              background: 'transparent',
              border: '2px solid var(--color-primary)',
              borderRadius: '10px',
              cursor: 'pointer',
              textAlign: 'center'
            }}
          >
            <div style={{
              color: 'var(--color-primary)',
              fontWeight: 700,
              fontSize: '20px',
              fontFamily: 'Sora, sans-serif'
            }}>
              $9
            </div>
            <div style={{ color: 'var(--color-text-2)', fontSize: '12px' }}>
              per month
            </div>
            <div style={{
              color: 'var(--color-primary)',
              fontSize: '12px',
              fontWeight: 600,
              marginTop: '6px'
            }}>
              Monthly Plan
            </div>
          </button>

          {/* Yearly — highlighted */}
          <button
            onClick={() => router.push('/upgrade?plan=yearly')}
            style={{
              padding: '14px',
              background: 'var(--color-primary)',
              border: '2px solid var(--color-primary)',
              borderRadius: '10px',
              cursor: 'pointer',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            {/* Best value badge */}
            <div style={{
              position: 'absolute',
              top: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--color-accent-warm)',
              color: '#FFFFFF',
              fontSize: '10px',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '999px',
              whiteSpace: 'nowrap'
            }}>
              BEST VALUE
            </div>
            <div style={{
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '20px',
              fontFamily: 'Sora, sans-serif'
            }}>
              $79
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
              per year
            </div>
            <div style={{
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 600,
              marginTop: '6px'
            }}>
              Save $29 yearly
            </div>
          </button>
        </div>

        <p style={{
          textAlign: 'center',
          color: 'var(--color-text-3)',
          fontSize: '12px',
          marginTop: '14px',
          marginBottom: 0
        }}>
          Cancel anytime. No hidden fees. Instant access after payment.
        </p>
      </div>
    </div>
  )
}
