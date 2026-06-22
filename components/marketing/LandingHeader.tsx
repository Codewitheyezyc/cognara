'use client'

import React from 'react'
import Link from 'next/link'
import { Menu, X, Share2, PlusSquare } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Logo } from '@/components/ui/Logo'

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
  return (
    <>
      {/* 1. Header Navigation */}
      <header className="relative z-20 max-w-7xl w-full mx-auto px-6 h-20 flex items-center justify-between border-b border-border/40 bg-bg/50 backdrop-blur-md sticky top-0">
        <a 
          href="#home" 
          onClick={(e) => handleScrollToSection(e, 'home')}
          className="flex items-center space-x-1.5 sm:space-x-2 text-primary text-text-1 hover:opacity-90 transition-opacity cursor-pointer"
        >
          <Logo className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="font-heading text-lg sm:text-xl font-bold tracking-tight text-text-1">Cognara</span>
        </a>

        {/* Marketing Anchor Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <a 
            href="#how-it-works" 
            onClick={(e) => handleScrollToSection(e, 'how-it-works')}
            className="text-[11px] text-text-2 hover:text-text-1 font-semibold uppercase tracking-wider transition-colors duration-150"
          >
            How It Works
          </a>
          <a 
            href="#features" 
            onClick={(e) => handleScrollToSection(e, 'features')}
            className="text-[11px] text-text-2 hover:text-text-1 font-semibold uppercase tracking-wider transition-colors duration-150"
          >
            Features
          </a>
          <a 
            href="#offline-pwa" 
            onClick={(e) => handleScrollToSection(e, 'offline-pwa')}
            className="text-[11px] text-text-2 hover:text-text-1 font-semibold uppercase tracking-wider transition-colors duration-150"
          >
            Offline App
          </a>
          <a 
            href="#pricing" 
            onClick={(e) => handleScrollToSection(e, 'pricing')}
            className="text-[11px] text-text-2 hover:text-text-1 font-semibold uppercase tracking-wider transition-colors duration-150"
          >
            Pricing
          </a>
          <a 
            href="#faq" 
            onClick={(e) => handleScrollToSection(e, 'faq')}
            className="text-[11px] text-text-2 hover:text-text-1 font-semibold uppercase tracking-wider transition-colors duration-150"
          >
            FAQ
          </a>
        </nav>

        <div className="flex items-center space-x-3">
          <nav className="hidden sm:flex items-center space-x-3 sm:space-x-6">
            <Link href="/login" className="text-xs text-text-2 hover:text-text-1 font-semibold uppercase tracking-wider transition-colors duration-150">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="h-8 sm:h-9 px-3 sm:px-4 inline-flex items-center justify-center rounded-md font-semibold text-[11px] sm:text-xs uppercase tracking-wider bg-primary hover:bg-primary-hover text-white transition-colors shadow-[0_0_12px_rgba(91,142,255,0.2)]"
            >
              Sign Up
            </Link>
          </nav>
          
          <ThemeToggle />

          {/* Hamburger Menu Trigger for Mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            type="button"
            className="md:hidden p-2 rounded-md hover:bg-surface-alt transition-colors text-text-1 cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-20 z-50 bg-bg/95 backdrop-blur-lg border-b border-border/40 flex flex-col p-6 space-y-6 animate-page-enter">
          <nav className="flex flex-col space-y-4">
            <a 
              href="#how-it-works" 
              onClick={(e) => {
                setMobileMenuOpen(false)
                handleScrollToSection(e, 'how-it-works')
              }}
              className="text-sm text-text-2 hover:text-text-1 font-semibold uppercase tracking-wider py-2 border-b border-border/30"
            >
              How It Works
            </a>
            <a 
              href="#features" 
              onClick={(e) => {
                setMobileMenuOpen(false)
                handleScrollToSection(e, 'features')
              }}
              className="text-sm text-text-2 hover:text-text-1 font-semibold uppercase tracking-wider py-2 border-b border-border/30"
            >
              Features
            </a>
            <a 
              href="#offline-pwa" 
              onClick={(e) => {
                setMobileMenuOpen(false)
                handleScrollToSection(e, 'offline-pwa')
              }}
              className="text-sm text-text-2 hover:text-text-1 font-semibold uppercase tracking-wider py-2 border-b border-border/30"
            >
              Offline App
            </a>
            <a 
              href="#pricing" 
              onClick={(e) => {
                setMobileMenuOpen(false)
                handleScrollToSection(e, 'pricing')
              }}
              className="text-sm text-text-2 hover:text-text-1 font-semibold uppercase tracking-wider py-2 border-b border-border/30"
            >
              Pricing
            </a>
            <a 
              href="#faq" 
              onClick={(e) => {
                setMobileMenuOpen(false)
                handleScrollToSection(e, 'faq')
              }}
              className="text-sm text-text-2 hover:text-text-1 font-semibold uppercase tracking-wider py-2 border-b border-border/30"
            >
              FAQ
            </a>
          </nav>
          
          <div className="flex flex-col gap-3 pt-4 border-t border-border/40">
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
          </div>
        </div>
      )}
    </>
  )
}
