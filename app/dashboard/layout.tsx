'use client'

import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Home, Map, BarChart2, Flame, Search, Bell, Bookmark, Download, Sparkles } from 'lucide-react'
import { ProfileDropdown } from '@/components/dashboard/ProfileDropdown'
import { Logo } from '@/components/ui/Logo'
import { LessonPreviewModal } from '@/components/dashboard/LessonPreviewModal'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOffline(!window.navigator.onLine)
      
      const handleOnline = () => setIsOffline(false)
      const handleOffline = () => setIsOffline(true)
      
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      
      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])
  
  const [streak, setStreak] = useState<number>(0)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [recentBadgeEmoji, setRecentBadgeEmoji] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [roadmapProgress, setRoadmapProgress] = useState<{
    title: string
    completed: number
    total: number
  } | null>(null)

  // Command palette state
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [allLessons, setAllLessons] = useState<any[]>([])
  const [filteredLessons, setFilteredLessons] = useState<any[]>([])

  // Notifications state
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  
  const notificationsRef = useRef<HTMLDivElement>(null)

  // Load user data and stats
  useEffect(() => {
    let active = true

    const loadStats = async (user: any) => {
      if (!user) {
        if (active) setIsLoading(false)
        return
      }
      
      if (active) {
        setEmail(user.email || '')
      }
      
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
        
      if (!active) return
      if (profileData) {
        setProfile(profileData)
      }

      // Fetch latest badge
      const { data: latestBadge } = await supabase
        .from('user_badges')
        .select('badge_emoji')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        
      if (!active) return
      if (latestBadge) {
        setRecentBadgeEmoji(latestBadge.badge_emoji)
      } else {
        setRecentBadgeEmoji('')
      }

      // Fetch streak
      const { data: streakData } = await supabase
        .from('streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .maybeSingle()
        
      if (!active) return
      if (streakData) {
        setStreak(streakData.current_streak || 0)
      }

      // Fetch active roadmap progress and lessons
      try {
        const { data: activeGoal } = await supabase
          .from('learning_goals')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle()

        if (!active) return
        if (activeGoal) {
          const { data: activeRoadmap } = await supabase
            .from('roadmaps')
            .select('id, title')
            .eq('goal_id', activeGoal.id)
            .maybeSingle()

          if (!active) return
          if (activeRoadmap) {
            // Count and fetch lessons
            const { data: lessonsData } = await supabase
              .from('lessons')
              .select('id, title, description')
              .eq('roadmap_id', activeRoadmap.id)
              .order('order_index', { ascending: true })

            if (!active) return
            if (lessonsData) {
              setAllLessons(lessonsData)
              
              const lessonIds = lessonsData.map((l: any) => l.id)
              let completed = 0
              if (lessonIds.length > 0) {
                const { count: completedCount } = await supabase
                  .from('lesson_progress')
                  .select('*', { count: 'exact', head: true })
                  .eq('user_id', user.id)
                  .eq('status', 'completed')
                  .in('lesson_id', lessonIds)
                completed = completedCount || 0
              }

              setRoadmapProgress({
                title: activeRoadmap.title,
                completed,
                total: lessonsData.length
              })
            }
          }
        }
      } catch (err) {
        console.error('Failed to load active path progress in layout:', err)
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }: any) => {
      if (active && user) {
        loadStats(user)
      }
    })

    // Listen for auth state change to resolve race condition
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (active && session?.user) {
        loadStats(session.user)
      } else if (active && !session?.user) {
        setIsLoading(false)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [supabase, pathname])

  // Real-time badge event listener
  useEffect(() => {
    const handleBadgeEarned = () => {
      supabase.auth.getUser().then(({ data: { user } }: any) => {
        if (user) {
          supabase
            .from('user_badges')
            .select('badge_emoji')
            .eq('user_id', user.id)
            .order('earned_at', { ascending: false })
            .limit(1)
            .maybeSingle()
            .then(({ data }: any) => {
              if (data) {
                setRecentBadgeEmoji(data.badge_emoji)
              }
            })
        }
      })
    }
    window.addEventListener('badge-earned', handleBadgeEarned)
    return () => window.removeEventListener('badge-earned', handleBadgeEarned)
  }, [supabase])

  // Filter lessons based on command palette query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLessons([])
      return
    }
    const query = searchQuery.toLowerCase()
    const filtered = allLessons.filter(l => 
      l.title.toLowerCase().includes(query) || 
      (l.description && l.description.toLowerCase().includes(query))
    )
    setFilteredLessons(filtered)
  }, [searchQuery, allLessons])

  // Keydown listener for Ctrl+K / Cmd+K and Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(open => !open)
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Load custom notifications dynamically
  useEffect(() => {
    if (profile && streak !== undefined) {
      const items = [
        {
          id: 'streak',
          title: 'Daily Streak Active! 🔥',
          body: `You have maintained a study streak of ${streak} days. Keep it up!`,
          time: 'Today',
          read: false
        },
        {
          id: 'path',
          title: 'Roadmap Compiled! 🗺️',
          body: `Your path for "${roadmapProgress?.title || 'learning goals'}" is live.`,
          time: 'Recently',
          read: true
        },
        {
          id: 'profile',
          title: 'Welcome to Cognara ✨',
          body: `Personalizing details for ${profile.name || 'your profile'}.`,
          time: 'Active',
          read: true
        }
      ]
      setNotifications(items)
    }
  }, [profile, streak, roadmapProgress?.title])

  // Click outside listener for notifications dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false)
      }
    }
    if (isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isNotificationsOpen])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navItems = [
    { label: 'Home', href: '/dashboard', icon: Home },
    { label: 'My Path', href: '/dashboard/path', icon: Map },
    { label: 'Progress', href: '/dashboard/progress', icon: BarChart2 },
    { label: 'Downloads', href: '/dashboard/downloads', icon: Download },
    { label: 'Notes', href: '/dashboard/notes', icon: Bookmark },
  ]

  const initialName = profile?.name || 'Learner'
  const isAdmin = profile?.id === process.env.NEXT_PUBLIC_ADMIN_USER_ID || profile?.id === '4c1fbae5-c423-42e7-8394-1112fe00d42e'
  const isFree = profile && profile.subscription_tier === 'free' && !isAdmin

  return (
    <div className="flex min-h-screen bg-bg text-text-1">
      {/* 1. Desktop Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-[260px] bg-surface border-r border-border min-h-screen sticky top-0 animate-page-enter">
        {/* Brand Banner */}
        <div className="h-16 flex items-center px-6 border-b border-border space-x-2">
          <Logo className="h-5 w-5" />
          <span className="font-heading text-lg font-bold tracking-tight text-text-1">Cognara</span>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-primary/10 text-primary border-l-2 border-primary'
                    : 'text-text-2 hover:bg-surface-alt hover:text-text-1'
                }`}
              >
                <Icon className="h-[20px] w-[20px]" strokeWidth={1.5} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Active Path Progress Widget */}
        {roadmapProgress && (
          <div className="px-4 mb-4">
            <div className="p-3 rounded-[8px] bg-surface-alt/60 border border-border/60 animate-page-enter">
              <span className="text-[9px] uppercase font-bold tracking-wider text-text-3">Active Path Progress</span>
              <h4 className="text-xs font-bold text-text-1 truncate mt-0.5" title={roadmapProgress.title}>
                {roadmapProgress.title}
              </h4>
              
              <div className="mt-2.5">
                <div className="flex justify-between text-[10px] font-medium text-text-2 mb-1">
                  <span>Completed</span>
                  <span className="font-semibold">{roadmapProgress.completed} / {roadmapProgress.total}</span>
                </div>
                {/* Custom Progress Bar */}
                <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${roadmapProgress.total > 0 ? (roadmapProgress.completed / roadmapProgress.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {isFree && (
          <div className="px-4 mb-4">
            <div className="p-4 rounded-[12px] bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border border-primary/20 shadow-lg space-y-3 relative overflow-hidden group">
              {/* Decorative top border line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-accent" />
              
              <div className="flex items-center gap-1.5 text-primary">
                <Sparkles className="h-4 w-4 fill-current text-primary animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold">Upgrade to Pro</span>
              </div>
              
              <p className="text-[11px] text-text-2 leading-relaxed">
                Get unlimited roadmaps, all 5 depth levels, and coding workspaces.
              </p>

              <button
                onClick={() => setIsUpgradeModalOpen(true)}
                className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-lg text-xs transition duration-150 cursor-pointer shadow-[0_0_12px_rgba(91,142,255,0.25)] hover:scale-[1.02] active:scale-[0.98]"
              >
                Get Pro Access
              </button>
            </div>
          </div>
        )}

        {/* Simplified Sidebar Footer */}
        <div className="p-4 border-t border-border flex items-center gap-3">
          {isLoading ? (
            <>
              <div className="w-8 h-8 rounded-full bg-border/40 animate-pulse shrink-0" />
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <div className="h-3 bg-border/40 rounded-sm animate-pulse w-24" />
                <div className="h-2.5 bg-border/40 rounded-sm animate-pulse w-16" />
              </div>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {initialName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-text-1 truncate">{initialName}</span>
                <span className="text-[10px] text-text-2">Active Learner</span>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* 2. Main content viewport */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Unified Topbar/Navbar for mobile and desktop */}
        <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
          {/* Logo visible on mobile only */}
          <div className="md:hidden flex items-center space-x-2">
            <Logo className="h-5 w-5" />
            <span className="font-heading text-base font-bold tracking-tight text-text-1">Cognara</span>
          </div>
          
          {/* Command Search Box for desktop */}
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="hidden md:flex items-center space-x-2 text-text-3 bg-surface-alt/75 border border-border/85 rounded-[8px] px-3 py-1.5 w-64 hover:border-border transition-all cursor-pointer focus:outline-none"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <Search className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            <span className="text-[11px] font-medium text-text-3 select-none flex-1 text-left">Ask AI or search...</span>
            <kbd className="hidden sm:inline-flex h-4 select-none items-center gap-0.5 rounded border border-border/90 bg-surface px-1.5 font-mono text-[8px] font-medium text-text-3 leading-none opacity-80 shadow-xs">
              ⌘K
            </kbd>
          </button>

          <div className="flex items-center space-x-4">
            {isFree && (
              <button
                onClick={() => setIsUpgradeModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-primary to-accent hover:from-primary/95 hover:to-accent/95 text-white font-bold rounded-full text-[10px] sm:text-xs transition duration-150 cursor-pointer shadow-[0_0_10px_rgba(91,142,255,0.2)] hover:scale-[1.03] active:scale-[0.97]"
              >
                <Sparkles className="h-3 w-3 fill-current text-white animate-pulse" />
                <span>Go Pro</span>
              </button>
            )}

            {/* Streak Emblem */}
            {isLoading ? (
              <div className="w-12 h-6 bg-border/40 rounded-full animate-pulse" />
            ) : (
              <div className="flex items-center space-x-1.5 px-3 py-1 bg-accent-warm/10 text-accent-warm border border-accent-warm/20 rounded-full text-xs font-mono">
                <Flame className="h-4 w-4 fill-current text-accent-warm animate-pulse-subtle" />
                <span className="font-bold">{streak}d</span>
              </div>
            )}

            {/* Notification Bell */}
            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-1.5 text-text-3 hover:text-text-1 hover:bg-surface-alt rounded-full transition cursor-pointer focus:outline-none"
              >
                <Bell className="h-4 w-4" strokeWidth={1.75} />
                {/* Pulse alert badge if there are unread notifications */}
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1 right-1 flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-warm opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-warm"></span>
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {isNotificationsOpen && (
                <div
                  className="absolute right-0 mt-2 rounded-[12px] p-2 animate-page-enter"
                  style={{
                    background: 'var(--color-surface-alt)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-lg)',
                    minWidth: '280px',
                    zIndex: 50,
                  }}
                >
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/60">
                    <span className="text-[10px] font-bold text-text-1 uppercase tracking-wider">Notifications</span>
                    <button 
                      onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                      className="text-[9px] font-semibold text-primary hover:underline bg-transparent border-none cursor-pointer"
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="max-h-[240px] overflow-y-auto py-1 space-y-0.5">
                    {notifications.map(item => (
                      <div 
                        key={item.id}
                        className={`p-2.5 rounded-md text-left transition duration-100 flex flex-col gap-0.5 ${
                          item.read ? 'opacity-70' : 'bg-surface/50 border-l-2 border-primary'
                        }`}
                      >
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-bold text-text-1">{item.title}</span>
                          <span className="text-[8px] text-text-3 font-mono">{item.time}</span>
                        </div>
                        <p className="text-[10px] text-text-2 leading-relaxed">{item.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            {isLoading ? (
              <div className="flex items-center space-x-2 select-none">
                <div className="w-7 h-7 rounded-full bg-border/40 animate-pulse shrink-0" />
                <div className="hidden md:block h-3 bg-border/40 rounded-sm animate-pulse w-16" />
              </div>
            ) : (
              <ProfileDropdown 
                profile={profile}
                email={email}
                recentBadgeEmoji={recentBadgeEmoji}
                onSignOut={handleSignOut}
              />
            )}
          </div>
        </header>

        {isOffline && (
          <div className="bg-amber-500 text-black px-4 py-2.5 text-xs font-semibold text-center sticky top-16 z-30 flex items-center justify-center gap-1.5 animate-fadeIn shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
            <span>You are offline. Downloaded lessons are still available. <Link href="/dashboard/downloads" className="underline font-bold hover:opacity-80">Navigate to your Downloads page.</Link></span>
          </div>
        )}

        {/* Page Inner Content */}
        <main className="flex-grow p-4 md:p-8 max-w-7xl w-full mx-auto">
          {isOffline && (pathname === '/dashboard' || pathname === '/dashboard/path' || pathname === '/dashboard/progress' || pathname === '/dashboard/notes' || pathname.startsWith('/dashboard/quiz')) ? (
            <div className="flex flex-col items-center justify-center text-center p-12 bg-surface border border-border/80 rounded-2xl max-w-xl mx-auto space-y-6 mt-8 animate-page-enter shadow-sm">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500">
                <Search className="h-10 w-10 animate-pulse" strokeWidth={1.5} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-heading text-lg font-bold text-text-1">Connection Required</h3>
                <p className="text-xs text-text-2 leading-relaxed max-w-md">
                  This page requires an active internet connection. Please reconnect to continue tracking progress, generating lessons, or taking quizzes.
                </p>
                <p className="text-[11px] text-text-3">
                  Your downloaded lessons are still fully available on your Downloads shelf.
                </p>
              </div>
              <Link href="/dashboard/downloads">
                <button className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-lg transition duration-150 cursor-pointer shadow-[0_0_12px_rgba(91,142,255,0.2)]">
                  Go to Downloads Shelf
                </button>
              </Link>
            </div>
          ) : children}
        </main>
      </div>

      {/* Command Palette Modal */}
      {isSearchOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[15vh] backdrop-blur-xs"
          onClick={() => setIsSearchOpen(false)}
        >
          <div 
            className="bg-surface border border-border rounded-lg max-w-lg w-full shadow-2xl overflow-hidden animate-page-enter"
            onClick={e => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
              <Search className="h-4 w-4 text-text-3" />
              <input
                type="text"
                placeholder="Type a lesson title, topic, or ask AI coach..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-text-1 placeholder-text-3 text-sm outline-none border-none py-1"
                autoFocus
              />
            </div>

            {/* Results Panel */}
            <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
              {searchQuery.trim() === '' ? (
                <div className="p-3 text-xs text-text-2 text-center select-none">
                  Search lessons in your path or jump to navigation.
                </div>
              ) : filteredLessons.length > 0 ? (
                filteredLessons.map(lesson => (
                  <Link
                    key={lesson.id}
                    href={`/dashboard/lesson/${lesson.id}`}
                    onClick={() => {
                      setIsSearchOpen(false)
                      setSearchQuery('')
                    }}
                    className="flex flex-col gap-0.5 p-3 rounded-md hover:bg-surface-alt transition-colors text-left"
                  >
                    <span className="text-xs font-bold text-text-1">{lesson.title}</span>
                    {lesson.description && (
                      <span className="text-[10px] text-text-2 line-clamp-1">{lesson.description}</span>
                    )}
                  </Link>
                ))
              ) : (
                <div className="p-3 text-xs text-text-2 text-center select-none">
                  No matching lessons found. Try another search term!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Mobile Navigation Bottom Bar (< 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-alt border-t border-border flex items-center justify-around z-40 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 py-1 space-y-1 transition duration-150 ${
                isActive ? 'text-primary' : 'text-text-2'
              }`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <LessonPreviewModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
      />
    </div>
  )
}
