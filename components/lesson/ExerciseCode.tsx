'use client'
import { useState } from 'react'
import Editor from '@monaco-editor/react'
import { Play, RotateCcw, CheckCircle, Lock } from 'lucide-react'

interface ExerciseCodeProps {
  language: string
  starterCode: string
  instructions: string
  expectedOutput?: string
  isLocked?: boolean
  onUpgradePrompt?: () => void
}

export function ExerciseCode({
  language,
  starterCode,
  instructions,
  expectedOutput,
  isLocked = false,
  onUpgradePrompt
}: ExerciseCodeProps) {
  const [code, setCode] = useState(starterCode)
  const [output, setOutput] = useState('')
  const [hasRun, setHasRun] = useState(false)
  const [showExpected, setShowExpected] = useState(false)

  const runCode = () => {
    setOutput('')
    setHasRun(true)

    try {
      if (language === 'javascript' || language === 'typescript') {
        // Capture console.log output
        const logs: string[] = []
        const originalLog = console.log
        console.log = (...args) => {
          logs.push(args.map(a =>
            typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
          ).join(' '))
        }

        // Run in try/catch
        try {
          // eslint-disable-next-line no-new-func
          new Function(code)()
        } catch (err: any) {
          logs.push(`Error: ${err.message}`)
        }

        console.log = originalLog
        setOutput(logs.join('\n') || '(no output)')

      } else if (language === 'html') {
        // For HTML show preview in iframe
        setOutput('__HTML__' + code)
      } else {
        setOutput('Run this code in your local environment or terminal.')
      }
    } catch (err: any) {
      setOutput(`Error: ${err.message}`)
    }
  }

  const reset = () => {
    setCode(starterCode)
    setOutput('')
    setHasRun(false)
    setShowExpected(false)
  }

  return (
    <div style={{
      border: '1px solid var(--color-border)',
      borderRadius: '12px',
      overflow: 'hidden',
      marginBlock: '24px'
    }}>
      {/* Instructions bar */}
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
          Exercise
        </div>
        <p style={{
          color: 'var(--color-text-1)',
          fontSize: '14px',
          margin: 0,
          lineHeight: '1.5'
        }}>
          {instructions}
        </p>
      </div>

      {/* Paywall overlay or Editor */}
      {isLocked ? (
        <div style={{
          padding: '48px 24px',
          background: 'rgba(91,142,255,0.02)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          borderTop: '1px solid var(--color-border)'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: 'rgba(91,142,255,0.1)',
            border: '1px solid rgba(91,142,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)'
          }}>
            <Lock size={18} />
          </div>
          <div style={{ maxWidth: '380px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono), monospace', textTransform: 'uppercase', color: 'var(--color-accent)', fontWeight: 600, letterSpacing: '0.05em' }}>Practice Environment Locked</span>
            <p style={{ color: 'var(--color-text-2)', fontSize: '13px', margin: '6px 0 0', lineHeight: '1.5' }}>
              Monaco coding workspace is locked. Upgrade to Pro to write code, test your skills, and run this exercise.
            </p>
          </div>
          <button
            onClick={() => onUpgradePrompt ? onUpgradePrompt() : window.location.href = '/dashboard/settings'}
            className="flex items-center gap-1.5 px-6 h-10 bg-primary hover:bg-primary/95 border border-primary border-b-[4px] border-b-blue-700 text-white rounded-xl text-xs font-bold active:translate-y-[2px] active:border-b-[2px] transition-all cursor-pointer shadow-md"
          >
            Upgrade to Pro
          </button>
        </div>
      ) : (
        <>
          {/* Editor and output split */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            minHeight: '280px'
          }}>
            {/* Code editor */}
            <div style={{ borderRight: '1px solid var(--color-border)' }}>
              <Editor
                height="280px"
                language={language === 'typescript' ? 'typescript' : language}
                value={code}
                onChange={(val) => setCode(val || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  padding: { top: 16 },
                  fontFamily: 'JetBrains Mono, monospace'
                }}
              />
            </div>

            {/* Output panel */}
            <div style={{
              background: '#0D1117',
              padding: '16px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '13px',
              color: output.includes('Error') ? '#F87171' : '#34D399',
              overflowY: 'auto',
              minHeight: '280px',
              whiteSpace: 'pre-wrap'
            }}>
              {!hasRun && (
                <span style={{ color: '#4A5272' }}>
                  // Output appears here after you run your code
                </span>
              )}

              {hasRun && output.startsWith('__HTML__') ? (
                <iframe
                  srcDoc={output.replace('__HTML__', '')}
                  style={{ width: '100%', height: '240px', border: 'none', background: 'white', borderRadius: '6px' }}
                  sandbox="allow-scripts"
                  title="HTML preview"
                />
              ) : (
                hasRun && <span>{output}</span>
              )}
            </div>
          </div>

          {/* Action bar */}
          <div style={{
            padding: '12px 16px',
            background: 'var(--color-surface-alt)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            {/* Run button */}
            <button
              onClick={runCode}
              className="flex items-center gap-1.5 px-4 h-9 bg-primary hover:bg-primary/95 border border-primary border-b-[4px] border-b-blue-700 text-white rounded-xl text-xs font-bold active:translate-y-[2px] active:border-b-[2px] transition-all cursor-pointer shadow-sm select-none"
            >
              <Play size={13} className="fill-current" />
              <span>Run Code</span>
            </button>

            {/* Reset button */}
            <button
              onClick={reset}
              className="flex items-center gap-1.5 px-4.5 h-9 bg-surface hover:bg-surface-alt border border-border border-b-[4px] border-b-[#1c212c] text-text-2 hover:text-text-1 rounded-xl text-xs font-bold active:translate-y-[2px] active:border-b-[2px] transition-all cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>

            {/* Show expected output */}
            {expectedOutput && hasRun && (
              <button
                onClick={() => setShowExpected(!showExpected)}
                className="flex items-center gap-1.5 px-4.5 h-9 bg-emerald-500/10 border border-emerald-500/25 border-b-[4px] border-b-emerald-500/15 text-emerald-500 rounded-xl text-xs font-bold active:translate-y-[2px] active:border-b-[2px] transition-all cursor-pointer ml-auto"
              >
                <CheckCircle size={13} />
                <span>{showExpected ? 'Hide answer' : 'Show expected output'}</span>
              </button>
            )}
          </div>

          {/* Expected output reveal */}
          {showExpected && expectedOutput && (
            <div style={{
              padding: '12px 20px',
              background: 'rgba(52,211,153,0.08)',
              borderTop: '1px solid var(--color-success)',
              color: 'var(--color-success)',
              fontSize: '13px',
              fontFamily: 'JetBrains Mono, monospace'
            }}>
              Expected: {expectedOutput}
            </div>
          )}
        </>
      )}
    </div>
  )
}
