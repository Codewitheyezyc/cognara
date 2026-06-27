'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { TwitterIcon, LinkedinIcon, FacebookIcon } from '@/components/ui/SocialIcons'
import { X } from 'lucide-react'

export function LandingFooter() {
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false)
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
              <a href="#faq" className="hover:text-text-1 transition">FAQ</a>
            </li>
            <li>
              <button 
                onClick={() => setIsDownloadModalOpen(true)} 
                className="hover:text-text-1 transition cursor-pointer text-left focus:outline-none"
              >
                Download app
              </button>
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

      {isDownloadModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setIsDownloadModalOpen(false)}
        >
          <div 
            className="bg-surface border border-border rounded-3xl max-w-md w-full p-6 shadow-2xl relative flex items-start gap-5 animate-modal text-left"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setIsDownloadModalOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-surface-alt hover:bg-border flex items-center justify-center text-text-2 hover:text-text-1 transition cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shrink-0">
              <Logo className="h-12 w-12 text-primary" />
            </div>

            <div className="space-y-2 flex-grow min-w-0">
              <h3 className="font-heading text-lg font-black text-text-1">Coming Soon! 📱</h3>
              <p className="text-xs text-text-2 leading-relaxed">
                We are currently hard at work building the native Cognara mobile app. Stay tuned for cognitive adaptive learning right on your phone!
              </p>
              <p className="text-[10px] text-text-3 font-semibold uppercase tracking-wider pt-2 select-none">
                CreedTech Learning Labs
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-modal {
          animation: modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </footer>
  )
}
export default LandingFooter
