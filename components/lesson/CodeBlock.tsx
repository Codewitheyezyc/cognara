'use client'

import { useEffect, useRef, useState } from 'react'
import { Copy, Check } from 'lucide-react'
import Prism from 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'

// Supported language grammars
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-sql'

interface CodeBlockProps {
  code: string
  language: string
  caption?: string
}

export function CodeBlock({ code, language, caption }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const codeRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current)
    }
  }, [code, language])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  // Normalize language for Prism class name mapping
  const normalizedLang = (language || 'javascript').toLowerCase()

  return (
    <div style={{
      borderRadius: '10px',
      overflow: 'hidden',
      border: '1px solid var(--color-border)',
      marginBlock: '20px'
    }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        background: 'var(--color-surface-alt)',
        borderBottom: '1px solid var(--color-border)'
      }}>
        <span style={{
          fontSize: '11px',
          fontFamily: 'var(--font-mono), JetBrains Mono, monospace',
          color: 'var(--color-accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 600
        }}>
          {language}
        </span>
        <button
          onClick={copy}
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-2)',
            cursor: 'pointer',
            fontSize: '12px',
            padding: '4px 8px',
            borderRadius: '6px'
          }}
        >
          {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
          <span style={{ color: 'var(--color-text-2)' }}>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Code content */}
      <pre className={`language-${normalizedLang}`} style={{
        margin: 0,
        padding: '20px',
        background: '#0D1117',
        overflowX: 'auto',
        fontSize: '14px',
        lineHeight: '1.7',
        fontFamily: 'var(--font-mono), JetBrains Mono, monospace'
      }}>
        <code ref={codeRef} className={`language-${normalizedLang}`} style={{ color: '#E6EDF3' }}>
          {code}
        </code>
      </pre>

      {/* Caption */}
      {caption && (
        <div style={{
          padding: '10px 16px',
          background: 'var(--color-surface-alt)',
          borderTop: '1px solid var(--color-border)',
          color: 'var(--color-text-2)',
          fontSize: '13px'
        }}>
          {caption}
        </div>
      )}
    </div>
  )
}

// Keep default export for compatibility with existing imports
export default CodeBlock
