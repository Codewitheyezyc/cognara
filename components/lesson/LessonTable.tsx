'use client'

export function LessonTable({ headers, rows, heading }: {
  headers: string[]
  rows: string[][]
  heading: string
}) {
  return (
    <div style={{ marginBlock: '24px', overflowX: 'auto' }}>
      {heading && (
        <h4 style={{ color: 'var(--color-text-1)', marginBottom: '12px', fontSize: '16px', fontWeight: 600 }}>
          {heading}
        </h4>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{
                background: 'var(--color-surface-alt)',
                color: 'var(--color-primary)',
                padding: '10px 16px',
                textAlign: 'left',
                fontWeight: 600,
                border: '1px solid var(--color-border)',
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'var(--color-surface)' : 'var(--color-surface-alt)' }}>
              {row.map((cell, j) => (
                <td key={j} style={{
                  padding: '10px 16px',
                  color: 'var(--color-text-1)',
                  border: '1px solid var(--color-border)',
                  lineHeight: '1.5'
                }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
