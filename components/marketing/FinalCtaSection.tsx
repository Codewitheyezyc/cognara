'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function FinalCtaSection() {
  const supabase = createClient()
  const [userCount, setUserCount] = useState<number | null>(null)

  useEffect(() => {
    async function fetchUserCount() {
      try {
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
        if (!error && count !== null) {
          setUserCount(count)
        }
      } catch (err) {
        console.error('Error fetching user count:', err)
      }
    }
    fetchUserCount()
  }, [supabase])

  const learnersCount = userCount !== null ? userCount : 41

  return (
    <section className="py-16 md:py-24 w-full max-w-5xl mx-auto px-4 scroll-mt-24 overflow-hidden">
      {/* Banner Container: Rich Indigo/Violet Gradient */}
      <div className="relative bg-gradient-to-br from-[#3D6AFF] to-[#7C5CFA] rounded-3xl p-8 md:p-16 text-center shadow-2xl overflow-hidden select-none">
        {/* Glow effects inside banner */}
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-black/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-6 flex flex-col items-center">
          {/* Headline */}
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Have a goal?<br />
            Let&apos;s build your path.
          </h2>

          {/* Subtext */}
          <p className="text-white/90 text-sm sm:text-base font-semibold max-w-md">
            Join {learnersCount} learners who stopped searching and started reaching their goals.
          </p>

          {/* Action Area */}
          <div className="pt-4 space-y-5 w-full max-w-sm">
            <Link href="/signup" className="w-full">
              <Button
                className="w-full h-13 bg-white hover:bg-neutral-100 text-[#3D6AFF] hover:text-[#2d5aef] font-extrabold text-base rounded-xl transition duration-150 cursor-pointer shadow-lg active:scale-[0.98]"
              >
                Build my free roadmap
              </Button>
            </Link>
            <span className="text-[11px] text-white/80 font-bold uppercase tracking-wider block mt-6">
              Builds your path in under 60 seconds.
            </span>
          </div>

        </div>
      </div>
    </section>
  )
}
export default FinalCtaSection
