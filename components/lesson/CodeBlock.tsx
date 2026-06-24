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
    <div className="rounded-xl overflow-hidden border border-border my-6 shadow-[0_4px_20px_rgba(0,0,0,0.15)] bg-[#0A0D14] transition-all group">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface-alt border-b border-border/70 select-none">
        <div className="flex items-center gap-1.5">
          {/* Decorative terminal dots */}
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-widest ml-2 bg-accent/5 px-2 py-0.5 border border-accent/10 rounded-sm">
            {language}
          </span>
        </div>
        <button
          onClick={copy}
          type="button"
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-text-3 hover:text-text-1 hover:bg-surface border border-border/80 hover:border-border rounded-lg transition-all duration-150 cursor-pointer focus:outline-none"
        >
          {copied ? (
            <>
              <Check size={11} className="text-success animate-bounce" />
              <span className="text-success font-extrabold font-mono">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={11} className="transition-transform duration-100 group-hover:scale-105" />
              <span className="font-mono">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <pre className={`language-${normalizedLang}`} style={{
        margin: 0,
        padding: '20px',
        background: '#0A0D14',
        overflowX: 'auto',
        fontSize: '13.5px',
        lineHeight: '1.8',
        fontFamily: 'var(--font-mono), JetBrains Mono, monospace'
      }}>
        <code ref={codeRef} className={`language-${normalizedLang}`} style={{ color: '#E6EDF3' }}>
          {code}
        </code>
      </pre>

      {/* Caption */}
      {caption && (
        <div className="px-4 py-2.5 bg-surface-alt/60 border-t border-border/70 text-text-2 text-[11.5px] leading-relaxed italic font-medium">
          💡 {caption}
        </div>
      )}
    </div>
  )
}

// Keep default export for compatibility with existing imports
export default CodeBlock
