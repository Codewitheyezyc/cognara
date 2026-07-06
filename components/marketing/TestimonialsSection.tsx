'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function TestimonialsSection() {
  const supabase = createClient()
  const [testimonials, setTestimonials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTestimonials() {
      try {
        const { data, error } = await supabase
          .from('cognara_testimonials')
          .select('*')
          .eq('is_approved', true)
          .order('created_at', { ascending: false })
        if (!error && data) {
          setTestimonials(data)
        }
      } catch (err) {
        console.error('Error fetching testimonials:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchTestimonials()
  }, [supabase])

  if (loading || testimonials.length === 0) {
    return null // Hide this section entirely until testimonials exist
  }

  return (
    <section className="py-16 md:py-24 max-w-5xl mx-auto px-4 border-t border-border/40 scroll-mt-24">
      {/* Headline */}
      <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-text-1 tracking-tight text-center">
        Real people. Real goals. Real progress.
      </h2>

      {/* Testimonials Container: Single column on mobile, Grid on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-12">
        {testimonials.map((t) => (
          <div
            key={t.id}
            className="w-full bg-surface border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:border-primary/20 transition-all duration-200"
          >
            {/* Top Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 overflow-hidden">
                <span className="font-heading text-sm sm:text-base font-bold text-text-1 shrink-0">
                  {t.first_name} {t.last_initial}.
                </span>
                <span 
                  title={t.learning_goal}
                  className="text-[10px] text-text-3 font-mono font-bold uppercase tracking-widest bg-surface-alt/80 px-2 py-0.5 rounded-full border border-border/40 truncate max-w-[140px] inline-block"
                >
                  {t.learning_goal}
                </span>
              </div>
              <p className="text-text-2 text-xs sm:text-sm leading-relaxed font-semibold italic">
                &ldquo;{t.testimonial_text}&rdquo;
              </p>
            </div>

            {/* Bottom rating & badge */}
            <div className="border-t border-border/40 pt-3 mt-4 space-y-1">
              {t.star_rating && (
                <div className="text-amber-500 text-xs sm:text-sm tracking-tight select-none">
                  {'★'.repeat(t.star_rating)}
                  {'☆'.repeat(5 - t.star_rating)}
                </div>
              )}
              <span className="text-[10px] text-text-3 font-bold uppercase tracking-wider block">
                Verified Cognara learner
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
