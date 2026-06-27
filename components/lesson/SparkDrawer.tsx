'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Loader2 } from 'lucide-react'
import { Spark } from '@/components/mascot/Spark'

interface SparkMessage {
  role: 'spark' | 'user'
  content: string
}

interface SparkDrawerProps {
  isOpen: boolean
  onClose: () => void
  lessonId: string
  lessonTitle: string
  lessonContent: string
  userName: string | null
  subject: string
}

export function SparkDrawer({
  isOpen,
  onClose,
  lessonId,
  lessonTitle,
  lessonContent,
  userName,
  subject,
}: SparkDrawerProps) {
  const firstName = userName?.split(' ')[0] || null
  const buildGreeting = () =>
    firstName
      ? `Hi ${firstName} — what would you like to know about "${lessonTitle}"?`
      : `What would you like to know about "${lessonTitle}"?`

  const [messages, setMessages] = useState<SparkMessage[]>([
    { role: 'spark', content: buildGreeting() },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [visible, setVisible] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Animate in/out
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => setVisible(true), 10)
      return () => clearTimeout(t)
    } else {
      setVisible(false)
    }
  }, [isOpen])

  // Reset greeting when lesson changes
  useEffect(() => {
    setMessages([{ role: 'spark', content: buildGreeting() }])
    setInput('')
  }, [lessonId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen && visible) {
      const t = setTimeout(() => inputRef.current?.focus(), 200)
      return () => clearTimeout(t)
    }
  }, [isOpen, visible])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const userMsg: SparkMessage = { role: 'user', content: trimmed }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const history = messages.map(m => ({
        role: m.role === 'spark' ? 'assistant' : 'user',
        content: m.content,
      }))

      const res = await fetch('/api/ai/spark-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          lessonTitle,
          lessonContent,
          message: trimmed,
          history,
          subject,
        }),
      })

      let data: any = {}
      try { data = await res.json() } catch { /* non-JSON */ }

      if (res.ok && data.response) {
        setMessages(prev => [...prev, { role: 'spark', content: data.response }])
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'spark', content: "I'm having a bit of trouble right now — give me a second and try again." },
        ])
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'spark', content: "Connection issue — please check your internet and try again." },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen && !visible) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={onClose}
      />

      {/* Drawer sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex flex-col"
        style={{
          height: '72vh',
          maxHeight: '600px',
          background: 'linear-gradient(180deg, #0f1322 0%, #0A0C14 100%)',
          borderTop: '1px solid rgba(91,142,255,0.22)',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -8px 48px rgba(0,0,0,0.55)',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#1E2540]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#171D38] shrink-0">
          <div className="flex items-center gap-2.5">
            <Spark emotion="idle" size={30} />
            <div>
              <p className="text-[13px] font-bold text-[#F0F4FF] leading-tight">Ask Spark</p>
              <p className="text-[10px] text-[#5B8EFF] font-medium truncate max-w-[200px]">{lessonTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#141A30] hover:bg-[#1E2540] flex items-center justify-center text-[#8B95B3] hover:text-[#F0F4FF] transition-colors"
            aria-label="Close Spark"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 min-h-0">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'spark' && (
                <div className="shrink-0 mt-0.5">
                  <Spark emotion="idle" size={22} />
                </div>
              )}
              <div
                className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                  msg.role === 'spark'
                    ? 'bg-[#0F1525] border border-[#1E2A4A] text-[#C8D0E8] rounded-tl-sm'
                    : 'bg-gradient-to-br from-[#5B8EFF] to-[#7B6EFF] text-white rounded-tr-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 justify-start">
              <div className="shrink-0 mt-0.5">
                <Spark emotion="thinking" size={22} />
              </div>
              <div className="bg-[#0F1525] border border-[#1E2A4A] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5B8EFF] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#5B8EFF] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#5B8EFF] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 px-4 py-3 border-t border-[#171D38]">
          <div className="flex items-center gap-2 bg-[#0F1525] border border-[#1E2A4A] rounded-xl px-3.5 py-2.5 focus-within:border-[#5B8EFF]/50 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about this lesson..."
              disabled={isLoading}
              className="flex-1 bg-transparent text-[#F0F4FF] placeholder-[#3A4262] text-[13px] outline-none border-none disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#5B8EFF] to-[#A78BFA] flex items-center justify-center text-white disabled:opacity-35 transition-opacity hover:opacity-90"
              aria-label="Send"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-[#2E3750] text-center mt-1.5">
            Spark knows your current lesson — ask anything
          </p>
        </div>
      </div>
    </>
  )
}
