import React from 'react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-bg">
      {/* Signature Learning Pulse background element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-primary/10 to-accent/10 opacity-60 blur-[120px] pointer-events-none animate-learning-pulse" />
      
      {/* Auth content container */}
      <div className="relative z-10 w-full max-w-md p-4 animate-page-enter">
        {children}
      </div>
    </div>
  )
}
