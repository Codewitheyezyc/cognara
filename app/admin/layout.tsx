'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  LayoutDashboard, Users, BookOpen, 
  Sparkles, Cpu, LogOut, Menu, X, ArrowLeft, FileText
} from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  
  const [adminName, setAdminName] = useState('Admin')
  const [adminEmail, setAdminEmail] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Client side redirect backup matching server middleware
      const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID
      if (user.id !== adminId) {
        router.push('/dashboard')
        return
      }

      setAdminEmail(user.email || '')
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .maybeSingle()

      if (profile?.name) {
        setAdminName(profile.name)
      }
      setLoading(false)
    }

    checkAdmin()
  }, [router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Learning Activity', href: '/admin/activity', icon: BookOpen },
    { label: 'Content Quality', href: '/admin/content', icon: Sparkles },
    { label: 'Certificates', href: '/admin/certificate-preview', icon: FileText },
    { label: 'System Status', href: '/admin/system', icon: Cpu },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#13110E] flex flex-col items-center justify-center text-[#F4F3F1] font-sans">
        <div className="flex flex-col items-center space-y-4">
          <Logo className="h-12 w-12 animate-pulse text-[#F59E0B]" />
          <p className="text-sm font-semibold tracking-wide text-[#A8A29E] animate-pulse-subtle">
            Initializing Admin Panel...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div data-admin="true" className="min-h-screen bg-bg text-text-1 font-sans flex flex-col md:flex-row relative">
      {/* Dynamic Warm Dark Theme Styles Override */}
      <style dangerouslySetInnerHTML={{ __html: `
        [data-admin="true"] {
          --background: #13110E !important;
          --foreground: #F4F3F1 !important;
          --card: #1A1714 !important;
          --card-foreground: #F4F3F1 !important;
          --popover: #1A1714 !important;
          --popover-foreground: #F4F3F1 !important;
          
          --primary: #F59E0B !important;
          --primary-foreground: #13110E !important;
          --secondary: #24201C !important;
          --secondary-foreground: #A8A29E !important;
          --muted: #24201C !important;
          --muted-foreground: #A8A29E !important;
          --accent: #F59E0B !important;
          --accent-foreground: #13110E !important;
          
          --border: #2E2822 !important;
          --input: #2E2822 !important;
          --ring: #F59E0B !important;
          
          --color-bg: #13110E !important;
          --color-surface: #1A1714 !important;
          --color-surface-alt: #24201C !important;
          --color-border: #2E2822 !important;
          --color-primary: #F59E0B !important;
          --color-primary-hover: #D97706 !important;
          --color-primary-glow: rgba(245, 158, 11, 0.12) !important;
          --color-accent: #F59E0B !important;
          --color-accent-warm: #F59E0B !important;
          --color-text-1: #F4F3F1 !important;
          --color-text-2: #A8A29E !important;
          --color-text-3: #57534E !important;
          
          --input-bg: #1A1714 !important;
          --input-border: #2E2822 !important;
          --input-text: #F4F3F1 !important;
          --input-placeholder: #57534E !important;
          --input-focus-border: #F59E0B !important;
          
          --btn-primary-bg: #F59E0B !important;
          --btn-primary-text: #13110E !important;
          --btn-secondary-bg: transparent !important;
          --btn-secondary-text: #F4F3F1 !important;
          --btn-secondary-border: #2E2822 !important;
          --btn-ghost-text: #A8A29E !important;
        }
      `}} />

      {/* 1. Mobile Sidebar Toggle & Header */}
      <div className="md:hidden h-16 border-b border-border bg-surface flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <Logo className="h-5 w-5 text-primary" />
          <span className="font-heading text-base font-bold tracking-tight text-text-1">Cognara Admin</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1.5 hover:bg-surface-alt rounded-md text-text-2 hover:text-text-1 transition"
        >
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* 2. Left Sidebar (Desktop & Mobile Drawer) */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-surface border-r border-border flex flex-col justify-between
        transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col flex-1">
          {/* Logo Brand Header */}
          <div className="h-16 border-b border-border flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center space-x-2.5">
              <Logo className="h-6 w-6 text-primary" />
              <span className="font-heading text-lg font-bold tracking-tight text-text-1">Cognara Admin</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-150
                    ${isActive 
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-xs' 
                      : 'text-text-2 hover:text-text-1 hover:bg-surface-alt border border-transparent'
                    }
                  `}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-primary' : 'text-text-3'}`} strokeWidth={2.2} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer Admin User profile */}
        <div className="p-4 border-t border-border flex flex-col gap-3 shrink-0">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full py-2 bg-surface-alt hover:bg-border border border-border text-xs font-bold text-text-2 hover:text-text-1 rounded-lg transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to User App</span>
          </Link>

          <div className="flex items-center justify-between bg-surface-alt p-3 rounded-xl border border-border">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-text-1 truncate">{adminName}</span>
              <span className="text-[10px] text-text-3 truncate">{adminEmail}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 hover:bg-border text-text-3 hover:text-error rounded-md transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 3. Main Dashboard Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Header */}
        <header className="hidden md:flex h-16 bg-surface border-b border-border items-center justify-between px-8 sticky top-0 z-30 shadow-xs">
          <div>
            <h1 className="text-sm font-bold text-text-1 tracking-tight">
              {navItems.find(item => item.href !== '/admin' ? pathname.startsWith(item.href) : pathname === item.href)?.label || 'Admin Panel'}
            </h1>
          </div>
          <div className="flex items-center space-x-3 text-xs font-bold text-text-2 bg-surface-alt px-3.5 py-1.5 rounded-full border border-border">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Owner Dashboard: {adminName}</span>
          </div>
        </header>

        {/* Inner Content Area */}
        <main className="flex-grow p-4 md:p-8 overflow-y-auto max-w-[1600px] w-full mx-auto animate-page-enter">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 md:hidden animate-fade-in"
        />
      )}
    </div>
  )
}
