'use client'

import React, { useState } from 'react'
import { LandingHeader } from '@/components/marketing/LandingHeader'
import { HeroSection } from '@/components/marketing/HeroSection'
import { DashboardPreview } from '@/components/marketing/DashboardPreview'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { DepthSimulator } from '@/components/marketing/DepthSimulator'
import { RichLayouts } from '@/components/marketing/RichLayouts'
import { ProgressShowcase } from '@/components/marketing/ProgressShowcase'
import { SparkShowcase } from '@/components/marketing/SparkShowcase'
import { OfflinePwa } from '@/components/marketing/OfflinePwa'
import { WhyCognara } from '@/components/marketing/WhyCognara'
import { PricingSection } from '@/components/marketing/PricingSection'
import { FaqSection } from '@/components/marketing/FaqSection'
import { ContactSection } from '@/components/marketing/ContactSection'
import { LandingFooter } from '@/components/marketing/LandingFooter'

export default function MarketingPage() {
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

      {/* Main content container */}
      <main className="relative z-10 max-w-6xl w-full mx-auto px-6 mt-12 md:mt-20">
        <HeroSection />
        <DashboardPreview />
        <HowItWorks />
        <DepthSimulator />
        <RichLayouts />
        <ProgressShowcase />
        <SparkShowcase />
        <OfflinePwa />
        <WhyCognara />
        <PricingSection />
        <FaqSection />
      </main>

      <ContactSection />

      <LandingFooter />
    </div>
  )
}
