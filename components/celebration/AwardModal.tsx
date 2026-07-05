'use client'

import React from 'react'
import { shareImageToSocial } from '@/lib/share'
import { useToast } from '@/components/ui/toast'

interface AwardModalProps {
  award: {
    id: string
    award_type: 'streak_badge' | 'progress_card'
    award_data: {
      badge_url?: string
      card_url?: string
      streak_days?: number
      milestone_percent?: number
      goal_name?: string
      user_name?: string
    }
  }
  onClose: () => void
}

export function AwardModal({ award, onClose }: AwardModalProps) {
  const { toast } = useToast()

  const config = {
    streak_badge: {
      emoji: (award.award_data.streak_days || 0) >= 100 
        ? '👑' 
        : (award.award_data.streak_days || 0) >= 30 
        ? '⚡' 
        : '🔥',
      headline: `${award.award_data.streak_days} Day Streak!`,
      message: (award.award_data.streak_days || 0) >= 100
        ? '100 days. This is extraordinary.'
        : (award.award_data.streak_days || 0) >= 30
        ? '30 days of showing up every day.'
        : 'One week of consistent learning.',
      imageUrl: award.award_data.badge_url || '',
      accentColor: (award.award_data.streak_days || 0) >= 100
        ? '#10B981'
        : (award.award_data.streak_days || 0) >= 30
        ? '#6366F1'
        : '#F59E0B'
    },
    progress_card: {
      emoji: '🎯',
      headline: `${award.award_data.milestone_percent}% Complete!`,
      message: `You are ${award.award_data.milestone_percent}% through your ${award.award_data.goal_name || 'learning'} journey.`,
      imageUrl: award.award_data.card_url || '',
      accentColor: '#6366F1'
    }
  }

  const current = config[award.award_type]

  if (!current || !current.imageUrl) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 animate-fade-in">
      <div className="bg-surface border border-border rounded-2xl shadow-2xl p-6 mx-4 w-full max-w-md animate-scale-up">
        {/* Emoji */}
        <div className="text-center text-5xl mb-3">
          {current.emoji}
        </div>

        {/* Headline */}
        <h2 className="text-text-1 font-bold text-2xl text-center mb-2">
          {current.headline}
        </h2>

        {/* Message */}
        <p className="text-text-2 text-center text-sm mb-4 leading-relaxed">
          {current.message}
        </p>

        {/* Award image preview */}
        <div 
          className="rounded-xl overflow-hidden mb-6 border-2 shadow-md bg-[#0F1629]"
          style={{ borderColor: current.accentColor }}
        >
          <img
            src={current.imageUrl}
            alt={current.headline}
            className="w-full h-auto"
          />
        </div>

        {/* Share buttons */}
        <div className="space-y-3">
          {/* Native share — primary */}
          <button
            onClick={() => shareImageToSocial({
              imageUrl: current.imageUrl,
              title: current.headline,
              text: `${current.headline} — ${current.message} Learn more at: cognaralearn.com`,
              platform: 'native',
              toast
            })}
            className="w-full font-bold py-3 rounded-xl text-white transition-colors cursor-pointer"
            style={{ 
              backgroundColor: current.accentColor 
            }}
          >
            Share my achievement
          </button>

          {/* WhatsApp */}
          <button
            onClick={() => shareImageToSocial({
              imageUrl: current.imageUrl,
              title: current.headline,
              text: `${current.headline} — ${current.message} Check it out: cognaralearn.com`,
              platform: 'whatsapp',
              toast
            })}
            className="w-full bg-[#25D366] hover:bg-[#25D366]/90 text-white font-bold py-3 rounded-xl transition-colors cursor-pointer"
          >
            Share on WhatsApp
          </button>

          {/* Download */}
          <button
            onClick={() => shareImageToSocial({
              imageUrl: current.imageUrl,
              title: current.headline,
              text: '',
              platform: 'download',
              toast
            })}
            className="w-full border border-border text-text-1 bg-surface-alt hover:bg-border font-bold py-3 rounded-xl transition-colors cursor-pointer"
          >
            Download image
          </button>

          {/* Continue */}
          <button
            onClick={onClose}
            className="w-full text-text-3 hover:text-text-2 text-xs font-semibold py-2 transition-colors cursor-pointer"
          >
            Continue learning
          </button>
        </div>
      </div>
    </div>
  )
}
