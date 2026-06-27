'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { 
  User, Settings, BarChart2, Map, HelpCircle, 
  Megaphone, LogOut, Sun, Moon, Sparkles, Gift 
} from 'lucide-react'

interface ProfileDropdownProps {
  profile: any
  email: string
  recentBadgeEmoji?: string
  onSignOut: () => Promise<void>
}

export function ProfileDropdown({ profile, email, recentBadgeEmoji, onSignOut }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  
  const dropdownRef = useRef<HTMLDivElement>(null)

  const name = profile?.name || 'Learner'
  const avatarUrl = profile?.avatar_url
  const initialsUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
  const isAdmin = profile?.id === process.env.NEXT_PUBLIC_ADMIN_USER_ID

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Sync theme selection state
  useEffect(() => {
    const savedTheme = localStorage.getItem('cognara-theme')
    if (savedTheme === 'light') {
      setTheme('light')
    } else {
      setTheme('dark')
    }
  }, [])

  const handleThemeChange = (t: 'dark' | 'light') => {
    setTheme(t)
    localStorage.setItem('cognara-theme', t)
    document.documentElement.setAttribute('data-theme', t)
    if (t === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 focus:outline-none hover:opacity-90 transition duration-150 cursor-pointer"
        style={{ background: 'transparent', border: 'none', padding: 0 }}
      >
        <img
          src={avatarUrl || initialsUrl}
          alt={name}
          className="w-7 h-7 rounded-full object-cover border border-border shadow-xs"
        />
        {/* Name next to avatar on desktop */}
        <span className="hidden md:inline text-xs font-semibold text-text-1">
          {name}{recentBadgeEmoji ? ` ${recentBadgeEmoji}` : ''}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 rounded-[12px] p-2 animate-page-enter"
          style={{
            background: 'var(--color-surface-alt)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
            minWidth: '250px',
            zIndex: 50,
          }}
        >
          {/* Section 1: User details (Non-clickable header) */}
          <div className="flex items-center gap-3 p-3 select-none">
            <img
              src={avatarUrl || initialsUrl}
              alt={name}
              className="w-10 h-10 rounded-full object-cover border border-border"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-text-1 truncate">
                {name}{recentBadgeEmoji ? ` ${recentBadgeEmoji}` : ''}
              </span>
              <span className="text-[11px] text-text-2 truncate">{email}</span>
            </div>
          </div>

          <div className="h-px bg-border my-1" />

          {/* Section 2: Main Links */}
          <div className="space-y-0.5">
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-md transition duration-100 mb-1"
                style={{ color: 'var(--color-accent-warm)', backgroundColor: 'rgba(245, 158, 11, 0.08)' }}
              >
                <Settings className="h-4 w-4" style={{ color: 'var(--color-accent-warm)' }} strokeWidth={2} />
                <span>⚙️ Admin Panel</span>
              </Link>
            )}

            <Link
              href="/dashboard/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-text-1 hover:bg-surface rounded-md transition duration-100"
            >
              <User className="h-4 w-4 text-text-2" strokeWidth={2} />
              <span>Profile</span>
            </Link>

            <Link
              href="/dashboard/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-text-1 hover:bg-surface rounded-md transition duration-100"
            >
              <Settings className="h-4 w-4 text-text-2" strokeWidth={2} />
              <span>Settings</span>
            </Link>

            <Link
              href="/dashboard/refer"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-text-1 hover:bg-surface rounded-md transition duration-100"
            >
              <Gift className="h-4 w-4 text-text-2" strokeWidth={2} />
              <span>Invite Friends</span>
            </Link>


            <Link
              href="/dashboard/progress"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-text-1 hover:bg-surface rounded-md transition duration-100"
            >
              <BarChart2 className="h-4 w-4 text-text-2" strokeWidth={2} />
              <span>My Progress</span>
            </Link>

            <Link
              href="/dashboard/path"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-text-1 hover:bg-surface rounded-md transition duration-100"
            >
              <Map className="h-4 w-4 text-text-2" strokeWidth={2} />
              <span>My Learning Paths</span>
            </Link>
          </div>

          <div className="h-px bg-border my-1" />

          {/* Section 3: Theme Toggle */}
          <div className="flex items-center justify-between px-3 py-1.5 select-none">
            <span className="text-[11px] font-bold text-text-2 uppercase">Theme</span>
            <div className="flex gap-1 bg-surface p-0.5 rounded-md border border-border/80">
              <button
                onClick={() => handleThemeChange('dark')}
                className={`p-1 rounded-sm cursor-pointer transition-colors duration-100 ${
                  theme === 'dark' ? 'bg-surface-alt text-primary' : 'text-text-3 hover:text-text-1'
                }`}
                title="Dark theme"
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleThemeChange('light')}
                className={`p-1 rounded-sm cursor-pointer transition-colors duration-100 ${
                  theme === 'light' ? 'bg-surface-alt text-primary' : 'text-text-3 hover:text-text-1'
                }`}
                title="Light theme"
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="h-px bg-border my-1" />

          {/* Section 4: Secondary Links */}
          <div className="space-y-0.5">
            <a
              href="mailto:support@cognaralearn.com"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-text-1 hover:bg-surface rounded-md transition duration-100"
            >
              <HelpCircle className="h-4 w-4 text-text-2" strokeWidth={2} />
              <span>Help & Support</span>
            </a>

            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-text-1 hover:bg-surface rounded-md transition duration-100"
            >
              <Megaphone className="h-4 w-4 text-text-2" strokeWidth={2} />
              <span>What's New</span>
            </Link>
          </div>

          <div className="h-px bg-border my-1" />

          {/* Section 5: Log Out */}
          <button
            onClick={async () => {
              setIsOpen(false)
              await onSignOut()
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-error hover:bg-error/5 rounded-md transition duration-100 cursor-pointer"
            style={{ border: 'none', background: 'transparent' }}
          >
            <LogOut className="h-4 w-4 text-error" strokeWidth={2} />
            <span>Log Out</span>
          </button>
        </div>
      )}
    </div>
  )
}
