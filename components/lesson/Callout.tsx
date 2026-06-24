'use client'

import React from 'react'
import { Lightbulb, CheckCircle2, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react'

const CALLOUT_CONFIG = {
  info:      { icon: Lightbulb, label: 'Note',      bg: 'rgba(91,142,255,0.05)',  border: 'rgba(91,142,255,0.2)', color: '#5B8EFF' },
  tip:       { icon: CheckCircle2, label: 'Tip',       bg: 'rgba(52,211,153,0.05)',  border: 'rgba(52,211,153,0.2)', color: '#34D399' },
  warning:   { icon: AlertTriangle, label: 'Warning',   bg: 'rgba(245,158,11,0.05)', border: 'rgba(245,158,11,0.2)', color: '#F59E0B' },
  important: { icon: AlertCircle, label: 'Important', bg: 'rgba(248,113,113,0.05)', border: 'rgba(248,113,113,0.2)', color: '#F87171' },
  pro_tip:   { icon: Sparkles, label: 'Pro Tip',   bg: 'rgba(167,139,250,0.05)', border: 'rgba(167,139,250,0.2)', color: '#A78BFA' },
}

export function Callout({ type, body }: { type: keyof typeof CALLOUT_CONFIG, body: string }) {
  const config = CALLOUT_CONFIG[type] || CALLOUT_CONFIG.info
  const Icon = config.icon

  return (
    <div 
      className="border rounded-xl p-4 my-6 flex gap-3.5 items-start shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition-all relative overflow-hidden"
      style={{
        background: config.bg,
        borderColor: config.border,
        borderLeft: `4px solid ${config.color}`
      }}
    >
      <div 
        className="p-1.5 rounded-lg shrink-0 mt-0.5 border"
        style={{
          color: config.color,
          borderColor: `${config.color}25`,
          background: `${config.color}08`
        }}
      >
        <Icon size={15} />
      </div>
      <div className="space-y-1 min-w-0 flex-1">
        <span 
          className="text-[10px] font-bold font-mono uppercase tracking-wider block"
          style={{ color: config.color }}
        >
          {config.label}
        </span>
        <p className="text-text-2 text-xs md:text-[13.5px] leading-relaxed font-medium">
          {body}
        </p>
      </div>
    </div>
  )
}
export default Callout
