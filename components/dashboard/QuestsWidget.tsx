'use client'

import React, { useState, useEffect } from 'react'
import { Sparkles, Trophy, Check, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { SoundEffects } from '@/lib/sound'

interface QuestItem {
  key: string
  title: string
  description: string
  progress: number
  target: number
  xpReward: number
  resetDate: string
  completed: boolean
  claimed: boolean
}

export default function QuestsWidget() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily')
  const [quests, setQuests] = useState<{ daily: QuestItem[]; weekly: QuestItem[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [claimingKey, setClaimingKey] = useState<string | null>(null)
  const [celebratingQuest, setCelebratingQuest] = useState<QuestItem | null>(null)

  // Fetch quest statuses from the API
  const fetchQuests = async () => {
    try {
      const res = await fetch('/api/quests')
      if (res.ok) {
        const data = await res.json()
        setQuests(data)

        // Check for any completed but unclaimed quest to celebrate
        const allQuests = [...(data.daily || []), ...(data.weekly || [])]
        const unclaimedCompleted = allQuests.find(q => q.completed && !q.claimed)
        if (unclaimedCompleted) {
          const sessionKey = `quest_celebrated_${unclaimedCompleted.key}_${unclaimedCompleted.resetDate}`
          const hasCelebrated = sessionStorage.getItem(sessionKey) === 'true'
          if (!hasCelebrated) {
            setCelebratingQuest(unclaimedCompleted)
            sessionStorage.setItem(sessionKey, 'true')
          }
        }
      }
    } catch (err) {
      console.error('Error fetching quests:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuests()
  }, [])

  // Claim quest reward
  const handleClaim = async (quest: QuestItem) => {
    if (claimingKey || quest.claimed || !quest.completed) return
    setClaimingKey(quest.key)

    try {
      const res = await fetch('/api/quests/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questKey: quest.key,
          resetDate: quest.resetDate
        })
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Claim failed')
      }

      // Success
      toast(`Reward Claimed! +${quest.xpReward} XP 🧠`)
      SoundEffects.play('achievement')

      // Dispatch XP gained window event to trigger header progress update & Level Up Modal
      if (data.xp) {
        window.dispatchEvent(
          new CustomEvent('cognara_xp_gained', {
            detail: {
              xpGained: data.xp.xpGained,
              newXp: data.xp.newXp,
              newLevel: data.xp.newLevel,
              leveledUp: data.xp.leveledUp
            }
          })
        )
      }

      // Refresh quests to update claimed state in UI
      await fetchQuests()
    } catch (err: any) {
      console.error('Error claiming quest:', err)
      toast(err.message || 'Unable to claim reward. Please try again.', 'error')
    } finally {
      setClaimingKey(null)
    }
  }

  // Loading skeleton state
  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-md space-y-4 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-4 w-32 bg-border rounded" />
          <div className="h-6 w-24 bg-border rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-8 bg-border rounded" />
          <div className="h-8 bg-border rounded" />
        </div>
        <div className="space-y-3 pt-2">
          <div className="h-12 bg-border rounded-lg" />
          <div className="h-12 bg-border rounded-lg" />
        </div>
      </div>
    )
  }

  const activeQuests = quests ? (activeTab === 'daily' ? quests.daily : quests.weekly) : []

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-md flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-primary">
          <Trophy className="h-4 w-4 text-primary animate-float-subtle" strokeWidth={1.75} />
          <h4 className="text-xs font-mono uppercase tracking-wider text-text-2">Cognitive Quests</h4>
        </div>
        <span className="text-[10px] font-bold text-accent px-2 py-0.5 bg-accent/10 border border-accent/15 rounded-full uppercase font-mono">
          {activeTab === 'daily' ? 'Resets Daily' : 'Resets Weekly'}
        </span>
      </div>

      {/* Tabs Selector */}
      <div className="grid grid-cols-2 p-1 bg-surface-alt border border-border/80 rounded-xl text-xs font-semibold relative select-none">
        <button
          onClick={() => setActiveTab('daily')}
          className={`py-2 text-center rounded-lg transition duration-150 cursor-pointer ${
            activeTab === 'daily'
              ? 'bg-surface border border-border text-text-1 shadow-[0_2px_8px_rgba(0,0,0,0.15)] font-bold'
              : 'text-text-3 hover:text-text-2'
          }`}
        >
          Daily Tasks
        </button>
        <button
          onClick={() => setActiveTab('weekly')}
          className={`py-2 text-center rounded-lg transition duration-150 cursor-pointer ${
            activeTab === 'weekly'
              ? 'bg-surface border border-border text-text-1 shadow-[0_2px_8px_rgba(0,0,0,0.15)] font-bold'
              : 'text-text-3 hover:text-text-2'
          }`}
        >
          Weekly Goals
        </button>
      </div>

      {/* Quests List */}
      <div className="flex flex-col gap-3">
        {activeQuests.length === 0 ? (
          <div className="text-center py-6 text-xs text-text-3 font-mono">
            No active quests available.
          </div>
        ) : (
          activeQuests.map((quest) => {
            const pct = Math.round((quest.progress / quest.target) * 100)
            const isUnclaimedCompleted = quest.completed && !quest.claimed

            return (
              <div 
                key={quest.key} 
                className={`p-3 bg-surface-alt/45 border rounded-xl flex flex-col gap-3 transition-all duration-300 ${
                  quest.claimed 
                    ? 'border-border/40 opacity-70' 
                    : isUnclaimedCompleted 
                    ? 'border-amber-500/50 bg-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-pulse-subtle' 
                    : 'border-border/80'
                }`}
              >
                {/* Details row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-xs font-bold text-text-1 leading-tight block">
                      {quest.title}
                    </span>
                    <span className="text-[10px] text-text-3 leading-relaxed block truncate">
                      {quest.description}
                    </span>
                  </div>
                  
                  {/* XP Reward Badge */}
                  <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-md border shrink-0 ${
                    quest.claimed
                      ? 'bg-border/20 border-border/30 text-text-3'
                      : 'bg-primary/10 border-primary/20 text-primary'
                  }`}>
                    +{quest.xpReward} XP
                  </span>
                </div>

                {/* Progress Bar & CTA Row */}
                <div className="flex items-center justify-between gap-4 mt-0.5">
                  {/* Progress bar */}
                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <div className="flex justify-between text-[9px] text-text-3 font-mono font-bold leading-none">
                      <span>Progress</span>
                      <span>{quest.progress}/{quest.target}</span>
                    </div>
                    <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          quest.completed ? 'bg-success' : 'bg-primary'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Claim Button */}
                  {quest.claimed ? (
                    <button
                      disabled
                      className="px-3.5 py-1.5 bg-border/20 border border-border/30 text-text-3 rounded-lg text-[9.5px] font-bold cursor-not-allowed flex items-center gap-0.5"
                    >
                      <Check size={11} className="stroke-[3px] text-success" />
                      <span>Claimed</span>
                    </button>
                  ) : quest.completed ? (
                    <button
                      onClick={() => handleClaim(quest)}
                      disabled={claimingKey !== null}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-white rounded-lg text-[9.5px] font-extrabold cursor-pointer active:translate-y-[1px] active:border-b-[1px] border-b-[3px] border-amber-800 transition-all shadow-[0_4px_10px_rgba(245,158,11,0.2)] flex items-center gap-1 shrink-0"
                    >
                      {claimingKey === quest.key ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <Sparkles size={10} className="animate-pulse" />
                      )}
                      <span>Claim</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="px-3.5 py-1.5 bg-[#2c3344] border border-[#1c212c] text-text-3/60 rounded-lg text-[9.5px] font-bold cursor-not-allowed"
                    >
                      Claim
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
      {/* Quest Celebration Modal Popup */}
      {celebratingQuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="relative max-w-sm w-full bg-[#181e2e] border-2 border-amber-500/50 rounded-2xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.3)] text-center space-y-6 animate-scaleUp overflow-hidden">
            {/* Pulsing Golden Glow ring behind */}
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent pointer-events-none" />
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />

            {/* Glowing Quest Box Graphic */}
            <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-600 border border-amber-300 rounded-2xl shadow-[0_0_24px_rgba(245,158,11,0.5)] text-white text-3xl animate-float mb-2">
              <Trophy className="h-10 w-10 text-white animate-bounce-subtle" strokeWidth={1.5} />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase text-amber-400 font-extrabold tracking-widest block animate-pulse">
                Quest Completed! 🏆
              </span>
              <h3 className="font-heading text-xl font-black text-text-1 leading-tight">
                {celebratingQuest.title}
              </h3>
              <p className="text-text-2 text-xs leading-relaxed px-2">
                {celebratingQuest.description}
              </p>
            </div>

            {/* Reward Card */}
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
              <span className="text-[9px] font-mono uppercase tracking-wider text-amber-500/80 font-bold block mb-1">XP Reward</span>
              <span className="text-2xl font-black text-amber-400 font-mono">+{celebratingQuest.xpReward} XP</span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  handleClaim(celebratingQuest)
                  setCelebratingQuest(null)
                }}
                className="w-full h-11 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-white font-extrabold text-xs rounded-xl shadow-[0_4px_16px_rgba(245,158,11,0.3)] active:translate-y-[2px] active:border-b-[2px] border-b-[4px] border-amber-800 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles size={13} className="animate-pulse" />
                <span>Claim XP Reward!</span>
              </button>

              <button
                onClick={() => setCelebratingQuest(null)}
                className="w-full h-10 bg-transparent hover:bg-surface-alt/50 border border-border text-text-2 hover:text-text-1 font-semibold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
