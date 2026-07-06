'use client'

import React, { useState } from 'react'
import { LandingHeader } from '@/components/marketing/LandingHeader'
import { HeroSection } from '@/components/marketing/HeroSection'
import { ProblemSection } from '@/components/marketing/ProblemSection'
import { TestimonialsSection } from '@/components/marketing/TestimonialsSection'
import { ComparisonSection } from '@/components/marketing/ComparisonSection'
import { FinalCtaSection } from '@/components/marketing/FinalCtaSection'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { PricingSection } from '@/components/marketing/PricingSection'
import { FaqSection } from '@/components/marketing/FaqSection'
import { ContactSection } from '@/components/marketing/ContactSection'
import { LandingFooter } from '@/components/marketing/LandingFooter'

export function MarketingPageClient() {
  // Mobile Hamburger Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Custom JS smooth scroll handler to prevent default browser hash jump & Next.js scroll restoration
  const handleScrollToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  React.useEffect(() => {
    // Check if URL has a hash when page loads
    const hash = window.location.hash
    if (hash) {
      // Small delay to ensure page is fully rendered
      setTimeout(() => {
        const id = hash.replace('#', '')
        const target = document.getElementById(id)
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' })
        }
      }, 300)
    }
  }, [])

  return (
    <div id="home" className="min-h-screen bg-bg text-text-1 flex flex-col relative transition-colors duration-200">
      {/* Background container for glows to prevent overflow from creating vertical whitespace */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/10 to-accent/15 blur-[120px] opacity-60 animate-learning-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-accent/10 to-primary/15 blur-[100px] opacity-50" />
      </div>

      <LandingHeader
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        handleScrollToSection={handleScrollToSection}
      />

      <main className="relative z-10 max-w-6xl w-full mx-auto px-6 mt-12 md:mt-20 flex-1 flex flex-col justify-center">
        <HeroSection />
        <ProblemSection />
        <HowItWorks />
        <TestimonialsSection />
        <ComparisonSection />
        <PricingSection />
        <FaqSection />
        <ContactSection />
        <FinalCtaSection />
      </main>

      <LandingFooter />
    </div>
  )
}
