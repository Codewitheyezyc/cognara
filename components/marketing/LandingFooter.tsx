'use client'

import React from 'react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { TwitterIcon, LinkedinIcon, FacebookIcon } from '@/components/ui/SocialIcons'

export function LandingFooter() {
  return (
    <footer className="w-full bg-surface border-t border-border mt-16 py-12 px-6 relative z-10 select-none">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Left Column: Logo & Tagline */}
        <div className="space-y-4 text-left">
          <div className="flex items-center space-x-2">
            <Logo className="h-6 w-6" />
            <span className="font-heading text-lg font-bold text-text-1">Cognara</span>
          </div>
          <p className="text-text-2 text-xs font-semibold leading-relaxed">
            AI that adapts to how you learn.
          </p>
        </div>

        {/* Center-Left Column: Product */}
        <div className="space-y-3 text-left">
          <h4 className="text-[10px] font-bold text-text-3 uppercase tracking-wider">Product</h4>
          <ul className="space-y-2 text-xs font-semibold text-text-2">
            <li>
              <a href="#how-it-works" className="hover:text-text-1 transition">How it works</a>
            </li>
            <li>
              <a href="#pricing" className="hover:text-text-1 transition">Pricing</a>
            </li>
            <li>
              <a href="#download" className="hover:text-text-1 transition">Download app</a>
            </li>
          </ul>
        </div>

        {/* Center-Right Column: Company */}
        <div className="space-y-3 text-left">
          <h4 className="text-[10px] font-bold text-text-3 uppercase tracking-wider">Company</h4>
          <ul className="space-y-2 text-xs font-semibold text-text-2">
            <li>
              <a href="#about" className="hover:text-text-1 transition">About</a>
            </li>
            <li>
              <a href="#contact" className="hover:text-text-1 transition">Contact</a>
            </li>
            <li>
              <a href="mailto:hello@cognaralearn.com" className="hover:text-text-1 transition text-primary">
                hello@cognaralearn.com
              </a>
            </li>
          </ul>
        </div>

        {/* Right Column: Social Links */}
        <div className="space-y-3 text-left">
          <h4 className="text-[10px] font-bold text-text-3 uppercase tracking-wider">Socials</h4>
          <div className="flex items-center space-x-3.5">
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-surface-alt border border-border rounded-lg text-text-2 hover:text-text-1 hover:border-primary/20 transition shadow-sm">
              <TwitterIcon className="h-4 w-4" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-surface-alt border border-border rounded-lg text-text-2 hover:text-text-1 hover:border-primary/20 transition shadow-sm">
              <LinkedinIcon className="h-4 w-4" />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-surface-alt border border-border rounded-lg text-text-2 hover:text-text-1 hover:border-primary/20 transition shadow-sm">
              <FacebookIcon className="h-4 w-4" />
            </a>
          </div>
        </div>

      </div>

      {/* Bottom Line */}
      <div className="max-w-6xl mx-auto border-t border-border/60 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-text-3 font-bold uppercase tracking-wider">
        <div>
          &copy; 2026 Cognara by CreedTech. All rights reserved.
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/privacy-policy" className="hover:text-text-2 transition">
            Privacy Policy
          </Link>
          <span>&bull;</span>
          <Link href="/terms-of-service" className="hover:text-text-2 transition">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  )
}
export default LandingFooter
