import React from 'react'

interface LogoProps {
  className?: string
}

export function Logo({ className = 'h-6 w-6' }: LogoProps) {
  return (
    <svg 
      className={`${className} shrink-0`} 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Deep Blue Outer/Base Segment */}
      <path 
        d="M 290 40 L 150 260 L 240 260 L 170 480 L 370 220 L 280 220 Z" 
        fill="url(#logoBlue)" 
      />
      {/* Violet Overlapping Inner Segment */}
      <path 
        d="M 320 60 L 220 220 L 280 220 L 200 440 L 350 200 L 290 200 Z" 
        fill="url(#logoViolet)" 
      />
      
      <defs>
        <linearGradient id="logoBlue" x1="10%" y1="10%" x2="90%" y2="90%">
          <stop offset="0%" stopColor="var(--color-primary, #5B8EFF)" />
          <stop offset="100%" stopColor="var(--color-primary-hover, #3B82F6)" />
        </linearGradient>
        <linearGradient id="logoViolet" x1="10%" y1="10%" x2="90%" y2="90%">
          <stop offset="0%" stopColor="var(--color-accent, #A78BFA)" />
          <stop offset="100%" stopColor="var(--color-accent, #8B5CF6)" stopOpacity={0.8} />
        </linearGradient>
      </defs>
    </svg>
  )
}
