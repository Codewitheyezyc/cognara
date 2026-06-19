'use client'

import React from 'react'
import { X, Lock, Sparkles, Check, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface LessonPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  lessonTitle?: string
  lessonDescription?: string
  phaseNumber?: number
}

export function LessonPreviewModal({
  isOpen,
  onClose,
  lessonTitle,
  lessonDescription,
  phaseNumber
}: LessonPreviewModalProps) {
  const router = useRouter()

  if (!isOpen) return null

  const handleUpgradeClick = () => {
    onClose()
    router.push('/dashboard/settings')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn">
      {/* Modal Container */}
      <div 
        className="relative bg-surface border border-border rounded-2xl max-w-lg w-full overflow-hidden shadow-[0_0_50px_rgba(91,142,255,0.15)] flex flex-col animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Border glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-accent-warm" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-surface-alt/50 border border-border text-text-3 hover:text-text-1 hover:bg-surface-alt transition-all duration-150 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Content */}
        <div className="p-6 md:p-8 space-y-6">
          
          {/* Header block with Lock Icon */}
          <div className="flex items-center space-x-3 text-primary">
            <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-xl">
              <Lock className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-accent">Pro Member Feature</span>
              <h3 className="font-heading text-xl font-bold text-text-1">Unlock Learning Content</h3>
            </div>
          </div>

          {/* Lesson Metadata Display */}
          {lessonTitle && (
            <div className="bg-surface-alt/40 border border-border/60 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded font-bold">
                  {phaseNumber ? `Phase ${phaseNumber}` : 'Locked Lesson'}
                </span>
                <span className="text-[10px] text-text-3 font-medium">Locked</span>
              </div>
              <h4 className="font-heading text-base font-bold text-text-1">{lessonTitle}</h4>
              {lessonDescription && (
                <p className="text-xs text-text-2 leading-relaxed">{lessonDescription}</p>
              )}
            </div>
          )}

          {/* Value Propositions */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-text-3 font-semibold block">Included in Pro Plan:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-text-2">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-success flex-shrink-0" />
                <span>All 5 depth levels (Expert)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-success flex-shrink-0" />
                <span>Unlimited Confused explanations</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-success flex-shrink-0" />
                <span>Monaco & StackBlitz workspaces</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-success flex-shrink-0" />
                <span>Progress & analytics graphs</span>
              </div>
            </div>
          </div>

          <div className="border-t border-border/60 pt-6" />

          {/* Pricing Summary */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-primary/5 border border-primary/10 rounded-xl p-4">
            <div className="text-center sm:text-left">
              <span className="text-xs text-text-2">Unlock all phases & features</span>
              <p className="text-xl font-bold text-text-1 font-mono mt-0.5">From ₦5,000<span className="text-xs text-text-3 font-normal font-sans">/mo</span></p>
            </div>
            <button
              onClick={handleUpgradeClick}
              className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(91,142,255,0.3)] transition-all cursor-pointer hover:scale-[1.02]"
            >
              <Zap className="h-3.5 w-3.5 fill-current" />
              <span>Upgrade to Pro</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
