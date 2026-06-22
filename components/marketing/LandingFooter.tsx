'use client'

import React from 'react'
import Link from 'next/link'

export function LandingFooter() {
  return (
    <footer className="max-w-6xl w-full mx-auto px-6 pt-10 pb-10 mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-3 border-t border-border/40 relative z-10">
      <div>
        &copy; {new Date().getFullYear()} Cognara. Built for modern learning operating systems. All rights reserved.
      </div>
      <div className="flex items-center space-x-4">
        <Link href="/privacy-policy" className="hover:text-text-2 transition-colors">
          Privacy Policy
        </Link>
        <span>&bull;</span>
        <Link href="/terms-of-service" className="hover:text-text-2 transition-colors">
          Terms of Service
        </Link>
      </div>
    </footer>
  )
}
