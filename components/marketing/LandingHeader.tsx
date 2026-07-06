'use client'

import React from 'react'
import Link from 'next/link'
import { Menu, X, Share2, PlusSquare } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Logo } from '@/components/ui/Logo'
import { createClient } from '@/lib/supabase/client'

interface LandingHeaderProps {
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  handleScrollToSection: (e: React.MouseEvent, id: string) => void
}

export function LandingHeader({
  mobileMenuOpen,
  setMobileMenuOpen,
  handleScrollToSection
}: LandingHeaderProps) {
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [hasSession, setHasSession] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  React.useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then((res: any) => {
      setHasSession(!!res.data?.session)
    })
  }, [])

  const handleNavigation = (e: React.MouseEvent, id: string) => {
    const isHomepage = window.location.pathname === '/'
    if (isHomepage) {
      handleScrollToSection(e, id)
      window.history.pushState(null, '', `#${id}`)
    }
  }

  return (
    <>
      {/* 1. Header Navigation */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
          isScrolled 
            ? 'h-20 bg-bg border-b border-border shadow-md' 
            : 'h-24 bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <Link 
            href="/" 
            onClick={(e) => handleNavigation(e, 'home')}
            className="flex items-center space-x-1.5 sm:space-x-2 text-text-1 hover:opacity-90 transition-opacity cursor-pointer z-10"
          >
            <Logo className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="font-heading text-lg sm:text-xl font-bold tracking-tight text-text-1">Cognara</span>
          </Link>

          {/* Marketing Anchor Navigation - Only shown when scrolled (below the fold) */}
          <nav className={`hidden md:flex items-center space-x-6 transition-all duration-300 ${
            isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
          }`}>
            <a 
              href="/#how-it-works" 
              onClick={(e) => handleNavigation(e, 'how-it-works')}
              className="text-[11px] text-text-2 hover:text-text-1 font-semibold uppercase tracking-wider transition-colors duration-150"
            >
              How It Works
            </a>
            <a 
              href="/#pricing" 
              onClick={(e) => handleNavigation(e, 'pricing')}
              className="text-[11px] text-text-2 hover:text-text-1 font-semibold uppercase tracking-wider transition-colors duration-150"
            >
              Pricing
            </a>
            <Link href="/blog" className="text-[11px] text-text-2 hover:text-text-1 font-semibold uppercase tracking-wider transition-colors duration-150">
              Blog
            </Link>
            {hasSession ? (
              <Link href="/dashboard" className="text-[11px] text-text-2 hover:text-text-1 font-semibold uppercase tracking-wider transition-colors duration-150">
                Dashboard
              </Link>
            ) : (
              <Link href="/login" className="text-[11px] text-text-2 hover:text-text-1 font-semibold uppercase tracking-wider transition-colors duration-150">
                Log In
              </Link>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            <ThemeToggle />

            {/* Desktop Action Area */}
            <div className="hidden md:flex items-center space-x-4">
              {hasSession ? (
                <Link
                  href="/dashboard"
                  className="h-9 px-4 inline-flex items-center justify-center rounded-md font-bold text-xs uppercase tracking-wider bg-primary hover:bg-primary-hover text-white transition-all shadow-[0_0_12px_rgba(91,142,255,0.2)]"
                >
                  Go to Dashboard →
                </Link>
              ) : !isScrolled ? (
                // Only show Log In link above the fold
                <Link 
                  href="/login" 
                  className="text-xs text-text-2 hover:text-text-1 font-bold uppercase tracking-wider transition-all"
                >
                  Log In
                </Link>
              ) : (
                // Show Start Free button when scrolled
                <Link
                  href="/signup"
                  className="h-9 px-4 inline-flex items-center justify-center rounded-md font-bold text-xs uppercase tracking-wider bg-primary hover:bg-primary-hover text-white transition-all shadow-[0_0_12px_rgba(91,142,255,0.2)]"
                >
                  Start Free
                </Link>
              )}
            </div>

            {/* Mobile Action/Menu Area */}
            <div className="md:hidden flex items-center space-x-2">
              {hasSession ? (
                <Link
                  href="/dashboard"
                  className="h-8 px-3 inline-flex items-center justify-center rounded-md font-bold text-[10px] uppercase tracking-wider bg-primary hover:bg-primary-hover text-white transition-all shadow-[0_0_12px_rgba(91,142,255,0.2)]"
                >
                  Go to Dashboard →
                </Link>
              ) : !isScrolled ? (
                // Only show Log In above the fold on mobile
                <Link 
                  href="/login" 
                  className="text-xs text-text-2 hover:text-text-1 font-bold uppercase tracking-wider px-2 py-1"
                >
                  Log In
                </Link>
              ) : (
                // Show hamburger menu trigger when scrolled
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  type="button"
                  className="p-2 rounded-md hover:bg-surface-alt transition-colors text-text-1 cursor-pointer"
                  aria-label="Toggle Menu"
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-20 z-50 bg-bg/95 backdrop-blur-lg border-b border-border/40 flex flex-col p-6 space-y-6 animate-page-enter">
          <nav className="flex flex-col space-y-4">
            <a 
              href="/#how-it-works" 
              onClick={(e) => {
                setMobileMenuOpen(false)
                handleNavigation(e, 'how-it-works')
              }}
              className="text-sm text-text-2 hover:text-text-1 font-semibold uppercase tracking-wider py-2 border-b border-border/30"
            >
              How It Works
            </a>

            <a 
              href="/#pricing" 
              onClick={(e) => {
                setMobileMenuOpen(false)
                handleNavigation(e, 'pricing')
              }}
              className="text-sm text-text-2 hover:text-text-1 font-semibold uppercase tracking-wider py-2 border-b border-border/30"
            >
              Pricing
            </a>
            <a 
              href="/#faq" 
              onClick={(e) => {
                setMobileMenuOpen(false)
                handleNavigation(e, 'faq')
              }}
              className="text-sm text-text-2 hover:text-text-1 font-semibold uppercase tracking-wider py-2 border-b border-border/30"
            >
              FAQ
            </a>
            <a 
              href="/#contact" 
              onClick={(e) => {
                setMobileMenuOpen(false)
                handleNavigation(e, 'contact')
              }}
              className="text-sm text-text-2 hover:text-text-1 font-semibold uppercase tracking-wider py-2 border-b border-border/30"
            >
              Contact
            </a>
            <Link 
              href="/blog" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm text-text-2 hover:text-text-1 font-semibold uppercase tracking-wider py-2 border-b border-border/30"
            >
              Blog
            </Link>
          </nav>
          
          <div className="flex flex-col gap-3 pt-4 border-t border-border/40">
            {hasSession ? (
              <Link 
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full h-11 bg-primary hover:bg-primary-hover text-white flex items-center justify-center rounded-lg font-bold text-xs uppercase tracking-wider"
              >
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link 
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full h-11 border border-border bg-surface hover:bg-surface-alt text-text-1 flex items-center justify-center rounded-lg font-bold text-xs uppercase tracking-wider"
                >
                  Sign In
                </Link>
                <Link 
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full h-11 bg-primary hover:bg-primary-hover text-white flex items-center justify-center rounded-lg font-bold text-xs uppercase tracking-wider"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
