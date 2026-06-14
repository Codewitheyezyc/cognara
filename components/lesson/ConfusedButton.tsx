'use client'

import React, { useState } from 'react'

interface ConfusedButtonProps {
  sectionHeading: string
  sectionBody: string
  subject: string
  depthLevel: number
  children: React.ReactNode
}

export function ConfusedButton({
  sectionHeading,
  sectionBody,
  subject,
  depthLevel,
  children
}: ConfusedButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'resolved'>('idle')
  const [explanation, setExplanation] = useState('')

  const handleConfusedClick = async () => {
    if (status === 'loading' || status === 'resolved' || status === 'success') return

    setStatus('loading')
    try {
      const res = await fetch('/api/ai/simplify-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sectionHeading,
          sectionBody,
          subject,
          depthLevel
        })
      })

      if (!res.ok) {
        throw new Error('Failed to fetch simplified explanation')
      }

      const data = await res.json()
      setExplanation(data.explanation)
      setStatus('success')
    } catch (err) {
      console.error(err)
      setStatus('idle')
    }
  }

  const handleGotItClick = () => {
    setStatus('resolved')
  }

  return (
    <div className="space-y-3 w-full">
      <div className="flex items-center justify-between gap-4 w-full">
        <h3 className="font-heading text-lg font-semibold text-text-1">
          {sectionHeading}
        </h3>
        
        <button
          type="button"
          onClick={handleConfusedClick}
          disabled={status === 'loading' || status === 'resolved'}
          className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all duration-200 cursor-pointer flex-shrink-0 ${
            status === 'idle'
              ? 'text-text-3 border-border hover:bg-surface-alt hover:text-text-2'
              : status === 'loading'
              ? 'text-primary border-primary/30 bg-primary/10 animate-pulse-subtle'
              : status === 'success'
              ? 'text-primary border-primary/30 bg-primary/10'
              : 'text-success border-success/30 bg-success/10 font-semibold cursor-default'
          }`}
          style={{
            borderColor: status === 'resolved' ? 'rgba(52,211,153,0.3)' : undefined,
            color: status === 'resolved' ? 'var(--color-success)' : undefined
          }}
        >
          {status === 'idle' && 'Confused? 💡'}
          {status === 'loading' && 'Thinking...'}
          {status === 'success' && 'Thinking...'}
          {status === 'resolved' && '✓ Clearer now'}
        </button>
      </div>

      {children}

      {status === 'success' && (
        <div 
          className="animate-slideDown space-y-3"
          style={{
            background: 'rgba(91,142,255,0.06)',
            border: '1px solid rgba(91,142,255,0.2)',
            borderLeft: '3px solid var(--color-primary)',
            borderRadius: '10px',
            padding: '16px 20px',
          }}
        >
          <div className="flex items-center space-x-2 text-primary">
            <span className="text-sm">💡</span>
            <span className="text-xs font-semibold uppercase tracking-wider">Let me explain this differently</span>
          </div>
          
          <p className="text-text-2 text-sm leading-relaxed whitespace-pre-line">
            {explanation}
          </p>

          <button
            type="button"
            onClick={handleGotItClick}
            className="text-xs font-bold text-primary border border-primary/20 bg-primary/10 hover:bg-primary/20 transition-colors duration-150 px-3 py-1.5 rounded-[6px] cursor-pointer"
          >
            Got it! ✓
          </button>
        </div>
      )}
    </div>
  )
}
