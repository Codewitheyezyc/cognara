'use client'

import React, { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  Users, 
  PenTool, 
  CreditCard, 
  Star, 
  BookOpen, 
  BarChart3, 
  Settings, 
  LogOut, 
  Loader2 
} from 'lucide-react'

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const isLoginPage = pathname === '/admin-panel/login'

  const handleAdminLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      const res = await fetch('/api/admin/logout', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        router.push('/admin-panel/login')
      }
    } catch (err) {
      console.error('[Admin Logout Error]', err)
    } finally {
      setIsLoggingOut(false)
    }
  }

  // If login page, don't wrap in layout/sidebar
  if (isLoginPage) {
    return <>{children}</>
  }

  const menuItems = [
    { href: '/admin-panel/dashboard', icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
    { href: '/admin-panel/users', icon: <Users size={16} />, label: 'Users' },
    { href: '/admin-panel/blog', icon: <PenTool size={16} />, label: 'Blog' },
    { href: '/admin-panel/subscriptions', icon: <CreditCard size={16} />, label: 'Subscriptions' },
    { href: '/admin-panel/testimonials', icon: <Star size={16} />, label: 'Testimonials' },
    { href: '/admin-panel/content', icon: <BookOpen size={16} />, label: 'Content' },
    { href: '/admin-panel/analytics', icon: <BarChart3 size={16} />, label: 'Analytics' },
    { href: '/admin-panel/settings', icon: <Settings size={16} />, label: 'Settings' },
  ]

  return (
    <div className="min-h-screen bg-[#0B0D13] flex font-sans">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-[#121620] border-r border-border/80 flex flex-col p-6 shrink-0 relative z-20">
        
        {/* Logo block */}
        <div className="mb-8 flex flex-col text-left">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black font-heading tracking-tight text-text-1">
              Cognara
            </span>
            <span className="text-[10px] font-mono bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Admin
            </span>
          </div>
          <span className="text-[10px] text-text-3 font-semibold uppercase tracking-wider mt-1.5">
            Decoupled Dashboard
          </span>
        </div>

        {/* Sidebar Nav links */}
        <nav className="flex-1 space-y-1.5 text-left">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition duration-150 text-xs font-bold uppercase tracking-wider cursor-pointer ${
                  isActive
                    ? 'bg-primary text-white shadow-[0_0_15px_rgba(91,142,255,0.25)]'
                    : 'text-text-2 hover:bg-surface-alt hover:text-text-1'
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer / Logout */}
        <div className="mt-auto pt-6 border-t border-border/60">
          <button
            onClick={handleAdminLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-500/10 transition duration-150 text-xs font-bold uppercase tracking-wider w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? (
              <Loader2 size={16} className="animate-spin shrink-0" />
            ) : (
              <LogOut size={16} className="shrink-0" />
            )}
            <span>{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 min-h-screen relative overflow-y-auto bg-[#0B0D13]">
        {/* Background gradient shapes */}
        <div className="absolute top-0 right-0 w-[50%] h-[50%] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] rounded-full bg-[#A78BFA]/5 blur-[150px] pointer-events-none" />
        
        <div className="p-8 relative z-10">
          {children}
        </div>
      </main>
    </div>
  )
}
