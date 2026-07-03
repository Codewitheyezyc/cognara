'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Settings, User, Mail, ShieldAlert, CreditCard, Sparkles, 
  Trash2, Download, AlertCircle, Sun, Moon, Laptop, Loader2,
  Bell, Volume2
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const [loading, setLoading] = useState(true)
  const [updatingAccount, setUpdatingAccount] = useState(false)
  const [processingPrivacy, setProcessingPrivacy] = useState(false)
  const [loadingUpgrade, setLoadingUpgrade] = useState<'monthly' | 'annual' | null>(null)

  // Account form fields
  const [newEmail, setNewEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  // Appearance fields
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark')
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal')

  // Sounds state
  const [soundsEnabled, setSoundsEnabled] = useState(true)

  // Daily reminder fields
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [reminderTime, setReminderTime] = useState('09:00')
  const [savingReminders, setSavingReminders] = useState(false)

  // Modals state
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false)
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)

  const [showDeleteDataModal, setShowDeleteDataModal] = useState(false)

  // Load user profile & preferences
  useEffect(() => {
    async function loadSettings() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          setUser(authUser)
          setNewEmail(authUser.email || '')
          
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle()
            
          if (userProfile) {
            setProfile(userProfile)
            setFontSize(userProfile.font_size || 'normal')
            setReminderEnabled(userProfile.reminder_enabled || false)
            setReminderTime(userProfile.daily_reminder_time || userProfile.reminder_time || '09:00')
          }
        }

        // Load theme from localStorage
        const savedTheme = localStorage.getItem('cognara-theme') as 'dark' | 'light' | 'system' | null
        setTheme(savedTheme || 'dark')
        
        // Load font size from localStorage
        const savedFont = localStorage.getItem('cognara-font-size') as 'normal' | 'large' | null
        setFontSize(savedFont || 'normal')

        // Load sounds preference from localStorage
        const savedSounds = localStorage.getItem('cognara-sounds')
        setSoundsEnabled(savedSounds !== 'false')
      } catch (err) {
        console.error('Error loading settings:', err)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [supabase])

  // Email Update Handler
  const handleUpdateEmail = async () => {
    if (!newEmail || newEmail === user.email) return
    setUpdatingAccount(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) throw error
      toast('Verification link sent to your new email address!')
    } catch (err: any) {
      console.error(err)
      toast(err.message || 'Failed to update email', 'error')
    } finally {
      setUpdatingAccount(false)
    }
  }

  // Password Update Handler
  const handleUpdatePassword = async () => {
    if (!newPassword) {
      toast('Please enter a new password', 'error')
      return
    }
    setUpdatingAccount(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
    } catch (err: any) {
      console.error(err)
      toast(err.message || 'Failed to update password', 'error')
    } finally {
      setUpdatingAccount(false)
    }
  }

  // Theme Update Handler
  const handleThemeChange = (t: 'dark' | 'light' | 'system') => {
    setTheme(t)
    localStorage.setItem('cognara-theme', t)
    document.documentElement.setAttribute('data-theme', t)
    
    let actualTheme: 'dark' | 'light' = 'dark'
    if (t === 'system') {
      const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      actualTheme = systemIsDark ? 'dark' : 'light'
    } else {
      actualTheme = t
    }
    
    if (actualTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    toast(`Theme changed to ${t}`)
  }

  // Font Size Update Handler
  const handleFontSizeChange = async (sz: 'normal' | 'large') => {
    setFontSize(sz)
    localStorage.setItem('cognara-font-size', sz)
    document.documentElement.setAttribute('data-font-size', sz)
    document.documentElement.style.setProperty('--text-base', sz === 'large' ? '17px' : '15px')
    
    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ font_size: sz })
          .eq('id', user.id)
      } catch (err) {
        console.error('Failed to sync font size to profile:', err)
      }
    }
    toast(`Font size set to ${sz}`)
  }

  // Toggle Sounds Handler
  const handleToggleSounds = () => {
    const nextVal = !soundsEnabled
    setSoundsEnabled(nextVal)
    localStorage.setItem('cognara-sounds', nextVal ? 'true' : 'false')
    toast(`Sound effects ${nextVal ? 'enabled' : 'disabled'}`)
  }

  // Paystack Upgrade Checkout Handler
  const handleUpgrade = async (plan: 'monthly' | 'annual') => {
    try {
      setLoadingUpgrade(plan)
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          plan,
          cancelUrl: typeof window !== 'undefined' ? window.location.href : undefined,
          redirectUrl: '/dashboard/settings'
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.authorization_url) {
        throw new Error(data.error || 'Failed to initialize payment')
      }

      // Redirect to Paystack
      window.location.href = data.authorization_url
    } catch (err: any) {
      console.error('Checkout error:', err)
      toast(err.message || 'Unable to start checkout. Please try again.', 'error')
      setLoadingUpgrade(null)
    }
  }



  // Export User Data JSON Handler
  const handleExportData = async () => {
    if (!user) return
    setProcessingPrivacy(true)
    try {
      const [
        { data: profileData },
        { data: goalsData },
        { data: roadmapsData },
        { data: progressData },
        { data: quizAttemptsData },
        { data: streaksData },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('learning_goals').select('*').eq('user_id', user.id),
        supabase.from('roadmaps').select('*').eq('user_id', user.id),
        supabase.from('lesson_progress').select('*').eq('user_id', user.id),
        supabase.from('quiz_attempts').select('*').eq('user_id', user.id),
        supabase.from('streaks').select('*').eq('user_id', user.id),
      ])

      const fullExport = {
        exported_at: new Date().toISOString(),
        profile: profileData,
        learning_goals: goalsData || [],
        roadmaps: roadmapsData || [],
        lesson_progress: progressData || [],
        quiz_attempts: quizAttemptsData || [],
        streaks: streaksData || [],
      }

      const blob = new Blob([JSON.stringify(fullExport, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cognara_data_export_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast('Data exported successfully!')
    } catch (err) {
      console.error(err)
      toast('Failed to export data', 'error')
    } finally {
      setProcessingPrivacy(false)
    }
  }

  // Clear Learning Data Handler
  const handleDeleteAllLearningData = async () => {
    if (!user) return
    setProcessingPrivacy(true)
    try {
      // Deleting learning goals will cascade delete roadmaps, phases, lessons, quizzes, attempts
      await supabase.from('learning_goals').delete().eq('user_id', user.id)
      await supabase.from('lesson_progress').delete().eq('user_id', user.id)
      await supabase.from('streaks').update({
        current_streak: 0,
        longest_streak: 0,
        last_activity_at: null
      }).eq('user_id', user.id)

      toast('All learning data cleared successfully!')
      setShowDeleteDataModal(false)
      router.push('/onboarding')
    } catch (err) {
      console.error(err)
      toast('Failed to clear learning data', 'error')
    } finally {
      setProcessingPrivacy(false)
    }
  }

  // Delete Account Handler
  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmationText !== 'DELETE') return
    setDeletingAccount(true)
    try {
      // Deleting profile cascades to all other database tables
      const { error: dbError } = await supabase.from('profiles').delete().eq('id', user.id)
      if (dbError) throw dbError

      // Log out
      await supabase.auth.signOut()
      toast('Your account has been deleted permanently.')
      router.push('/signup')
    } catch (err) {
      console.error(err)
      toast('Failed to delete account', 'error')
    }
  }

  // Save Reminder Settings Handler
  const handleSaveReminderSettings = async () => {
    if (!user) return
    setSavingReminders(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          reminder_enabled: reminderEnabled,
          reminder_time: reminderTime,
          daily_reminder_time: reminderTime,
          reminder_timezone: 'Africa/Lagos'
        })
        .eq('id', user.id)

      if (error) throw error
      toast('Reminder settings saved successfully!')
      
      setProfile((prev: any) => ({
        ...prev,
        reminder_enabled: reminderEnabled,
        reminder_time: reminderTime,
        daily_reminder_time: reminderTime,
        reminder_timezone: 'Africa/Lagos'
      }))
    } catch (err: any) {
      console.error(err)
      toast(err.message || 'Failed to save reminder settings', 'error')
    } finally {
      setSavingReminders(false)
    }
  }

  const formatTime = (timeStr: string) => {
    if (!timeStr) return ''
    const [hoursStr, minutesStr] = timeStr.split(':')
    const hours = parseInt(hoursStr, 10)
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutesStr} ${ampm}`
  }

  const handleDisableReminder = async () => {
    setSavingReminders(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          reminder_enabled: false
        })
        .eq('id', user.id)

      if (error) throw error
      setReminderEnabled(false)
      toast('Reminder notifications disabled.')
      
      setProfile((prev: any) => ({
        ...prev,
        reminder_enabled: false
      }))
    } catch (err: any) {
      console.error(err)
      toast(err.message || 'Failed to disable reminder', 'error')
    } finally {
      setSavingReminders(false)
    }
  }

  const handleEnableReminder = async () => {
    setSavingReminders(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          reminder_enabled: true,
          reminder_time: reminderTime,
          daily_reminder_time: reminderTime,
          reminder_timezone: 'Africa/Lagos'
        })
        .eq('id', user.id)

      if (error) throw error
      setReminderEnabled(true)
      toast(`Reminder set ✓ We will remind you to study at ${formatTime(reminderTime)} daily`)
      
      setProfile((prev: any) => ({
        ...prev,
        reminder_enabled: true,
        reminder_time: reminderTime,
        daily_reminder_time: reminderTime,
        reminder_timezone: 'Africa/Lagos'
      }))
    } catch (err: any) {
      console.error(err)
      toast(err.message || 'Failed to enable reminder', 'error')
    } finally {
      setSavingReminders(false)
    }
  }


  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-3xl">
        <div className="h-8 w-48 bg-surface-alt rounded-sm" />
        <div className="h-4 w-72 bg-surface-alt rounded-sm" />
        <div className="h-48 bg-surface-alt rounded-[10px]" />
      </div>
    )
  }



  return (
    <div className="space-y-8 animate-page-enter max-w-3xl pb-16">
      {/* Page Title */}
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-text-1">Settings</h1>
        <p className="text-text-2 text-sm mt-1">Configure account access, subscription options, appearance, and privacy.</p>
      </div>

      {/* 1. ACCOUNT SETTINGS */}
      <div className="rounded-[10px] border border-border bg-surface p-6 shadow-md space-y-6">
        <div className="flex items-center space-x-2 text-primary border-b border-border pb-3">
          <User className="h-5 w-5" strokeWidth={1.5} />
          <h2 className="font-heading text-xl font-bold text-text-1">Account Access</h2>
        </div>

        <div className="space-y-6">
          {/* Change Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input 
                id="email" 
                type="email" 
                value={newEmail} 
                onChange={(e) => setNewEmail(e.target.value)} 
                className="flex-1"
              />
              <Button 
                onClick={handleUpdateEmail}
                disabled={updatingAccount || newEmail === user.email}
                className="w-full sm:w-auto"
              >
                Send Verification to New Email
              </Button>
            </div>
          </div>

          <div className="border-t border-border/60 my-4" />

          {/* Change Password */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-1">Change Password</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="currPass">Current Password</Label>
                <Input 
                  id="currPass" 
                  type="password" 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newPass">New Password</Label>
                <Input 
                  id="newPass" 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleUpdatePassword} disabled={updatingAccount || !newPassword}>
                Update Password
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SUBSCRIPTION & BILLING */}
      <div className="rounded-[10px] border border-border bg-surface p-6 shadow-md space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center space-x-2 text-primary">
            <CreditCard className="h-5 w-5" strokeWidth={1.5} />
            <h2 className="font-heading text-xl font-bold text-text-1">Subscription & Billing</h2>
          </div>
          {profile?.subscription_tier === 'pro_monthly' || profile?.subscription_tier === 'pro_yearly' ? (
            <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider font-extrabold flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Pro Active
            </span>
          ) : (
            <span className="text-[10px] bg-text-3/10 text-text-3 border border-text-3/20 px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider font-extrabold">
              Free Plan
            </span>
          )}
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 bg-surface-alt/40 p-4 rounded-lg border border-border/50 text-xs">
            <div>
              <span className="text-text-2 block mb-0.5">Current Plan</span>
              <span className="font-bold text-text-1 capitalize">
                {profile?.subscription_tier === 'pro_yearly'
                  ? 'Pro Annual'
                  : (profile?.subscription_tier === 'pro_monthly' ? 'Pro Monthly' : 'Free Plan')}
              </span>
            </div>
            <div>
              <span className="text-text-2 block mb-0.5">Status</span>
              <span className="font-bold text-text-1 capitalize">
                {profile?.subscription_status || 'Inactive'}
              </span>
            </div>
          </div>

          {/* Conditional Plan Options */}
          {profile?.subscription_tier === 'pro_monthly' || profile?.subscription_tier === 'pro_yearly' ? (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col gap-2 text-xs">
              <p className="text-text-1 font-semibold flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                You are currently subscribed to the Pro Plan!
              </p>
              <p className="text-text-2 leading-relaxed">
                Your premium access is active. All premium roadmap paths, depth levels (up to Expert), coding workspaces, and analytics are unlocked. Your subscription payments are processed securely via Paystack.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-text-1 mb-1">Upgrade to Premium</h3>
                <p className="text-xs text-text-2 leading-relaxed">
                  Choose a subscription plan below to unlock all lessons, custom study paths, expert depth explanations, and unlimited interactive learning.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Monthly Plan Card */}
                <div className="border border-border/80 rounded-xl p-4 flex flex-col justify-between bg-surface-alt/25 hover:bg-surface-alt/45 transition">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-text-3 font-bold block mb-1">Monthly Plan</span>
                    <p className="text-lg font-bold text-text-1 font-mono">₦4,500<span className="text-xs text-text-3 font-normal font-sans">/mo</span></p>
                    <p className="text-[10px] text-text-3 mt-1.5 leading-relaxed">Access to all features, billed month-to-month. Cancel anytime.</p>
                  </div>
                  <Button
                    onClick={() => handleUpgrade('monthly')}
                    disabled={loadingUpgrade !== null}
                    className="mt-4 w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-bold"
                  >
                    {loadingUpgrade === 'monthly' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 text-primary mr-1.5 fill-current" />
                    )}
                    <span>{loadingUpgrade === 'monthly' ? 'Redirecting...' : 'Upgrade Monthly'}</span>
                  </Button>
                </div>

                {/* Annual Plan Card */}
                <div className="border border-primary/30 rounded-xl p-4 flex flex-col justify-between bg-primary/5 hover:bg-primary/10 transition relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-accent text-white font-bold text-[8px] px-2.5 py-0.5 rounded-bl uppercase font-mono">
                    Save 16%
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-accent font-bold block mb-1">Annual Plan</span>
                    <p className="text-lg font-bold text-text-1 font-mono">₦45,000<span className="text-xs text-text-3 font-normal font-sans">/yr</span></p>
                    <p className="text-[10px] text-text-3 mt-1.5 leading-relaxed">Save 16% compared to the monthly plan. Billed annually.</p>
                  </div>
                  <Button
                    onClick={() => handleUpgrade('annual')}
                    disabled={loadingUpgrade !== null}
                    className="mt-4 w-full bg-primary hover:bg-primary/95 text-white font-bold"
                  >
                    {loadingUpgrade === 'annual' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 text-white mr-1.5 fill-current" />
                    )}
                    <span>{loadingUpgrade === 'annual' ? 'Redirecting...' : 'Upgrade Annual'}</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. APPEARANCE SECTION */}
      <div className="rounded-[10px] border border-border bg-surface p-6 shadow-md space-y-6">
        <div className="flex items-center space-x-2 text-primary border-b border-border pb-3">
          <Settings className="h-5 w-5" strokeWidth={1.5} />
          <h2 className="font-heading text-xl font-bold text-text-1">Appearance</h2>
        </div>

        {/* Theme selection */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-text-1">App Theme</Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'dark', label: 'Dark', icon: Moon },
              { value: 'light', label: 'Light', icon: Sun },
              { value: 'system', label: 'System', icon: Laptop },
            ].map(tOpts => {
              const isSelected = theme === tOpts.value
              const Icon = tOpts.icon
              return (
                <button
                  key={tOpts.value}
                  onClick={() => handleThemeChange(tOpts.value as any)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-md border text-xs font-semibold cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-border bg-transparent hover:bg-surface-alt/50 text-text-2'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tOpts.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* SOUND EFFECTS SECTION */}
      <div className="rounded-[10px] border border-border bg-surface p-6 shadow-md space-y-6">
        <div className="flex items-center space-x-2 text-primary border-b border-border pb-3">
          <Volume2 className="h-5 w-5" strokeWidth={1.5} />
          <h2 className="font-heading text-xl font-bold text-text-1">Sound Effects</h2>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-semibold text-text-1">Enable sound effects</Label>
              <p className="text-xs text-text-3 mt-1">Play subtle chimes and celebration sounds when completing tasks</p>
            </div>
            <button
              onClick={handleToggleSounds}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                soundsEnabled ? 'bg-primary' : 'bg-surface-alt border border-border/80'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  soundsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* DAILY REMINDER SECTION */}
      <div className="rounded-[10px] border border-border bg-surface p-6 shadow-md space-y-6">
        <div className="flex items-center space-x-2 text-primary border-b border-border pb-3">
          <Bell className="h-5 w-5" strokeWidth={1.5} />
          <h2 className="font-heading text-xl font-bold text-text-1">Daily Reminder</h2>
        </div>

        <div className="space-y-4">
          {reminderEnabled ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-surface-alt/40 border border-border rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <Bell className="h-5 w-5 animate-pulse-subtle" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-1">
                      🔔 Reminder active at {formatTime(reminderTime)} daily
                    </p>
                    <p className="text-xs text-text-3 mt-0.5">We will nudge you every day in Africa/Lagos time.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <div className="flex-1 flex gap-2 items-center">
                  <Input
                    id="reminderTime"
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="h-10 text-xs font-semibold max-w-[120px]"
                  />
                  <Button
                    onClick={handleSaveReminderSettings}
                    disabled={savingReminders}
                    className="h-10 text-xs font-semibold bg-primary hover:bg-primary/95 text-text-1 rounded-xl cursor-pointer"
                  >
                    Change time
                  </Button>
                </div>
                <Button
                  onClick={handleDisableReminder}
                  disabled={savingReminders}
                  variant="outline"
                  className="h-10 text-xs font-semibold border-rose-500/20 text-rose-400 hover:bg-rose-500/10 rounded-xl cursor-pointer"
                >
                  Turn off
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-center py-6 bg-surface-alt/25 border border-dashed border-border rounded-xl">
              <p className="text-xs text-text-3 font-medium">No reminder set</p>
              <div className="flex justify-center gap-3 items-center pt-2">
                <Input
                  id="reminderTime"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="h-10 text-xs font-semibold max-w-[120px]"
                />
                <Button
                  onClick={handleEnableReminder}
                  disabled={savingReminders}
                  className="h-10 text-xs font-semibold bg-gradient-to-r from-[#5B8EFF] to-[#A78BFA] hover:from-[#4A7AEE] hover:to-[#9067FA] text-text-1 font-bold rounded-xl cursor-pointer"
                >
                  Set daily reminder
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. PRIVACY SECTION */}
      <div className="rounded-[10px] border border-border bg-surface p-6 shadow-md space-y-6">
        <div className="flex items-center space-x-2 text-primary border-b border-border pb-3">
          <Download className="h-5 w-5" strokeWidth={1.5} />
          <h2 className="font-heading text-xl font-bold text-text-1">Privacy & Data Portability</h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            variant="outline" 
            onClick={handleExportData}
            disabled={processingPrivacy}
            className="flex-1 flex items-center justify-center gap-1.5"
          >
            <Download className="h-4 w-4" />
            Export My Data (JSON)
          </Button>

          <Button 
            variant="outline" 
            onClick={() => setShowDeleteDataModal(true)}
            disabled={processingPrivacy}
            className="flex-1 flex items-center justify-center gap-1.5 border-error/20 text-error hover:bg-error/5"
          >
            <Trash2 className="h-4 w-4" />
            Delete All Learning Data
          </Button>
        </div>
      </div>

      {/* DANGER ZONE */}
      <div className="rounded-[10px] border border-error/30 bg-error/5 p-6 shadow-md space-y-4">
        <div className="flex items-center space-x-2 text-error border-b border-error/15 pb-3">
          <ShieldAlert className="h-5 w-5" />
          <h2 className="font-heading text-xl font-bold">Danger Zone</h2>
        </div>
        <p className="text-xs text-text-2 leading-relaxed">
          Deletions are final. If you delete your account, your study streaks, completed quizzes, lessons, and personalized configurations will be lost forever.
        </p>
        <div>
          <Button 
            variant="destructive" 
            onClick={() => setShowDeleteAccountModal(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            Delete Account Permanently
          </Button>
        </div>
      </div>

      {/* MODAL 1: DELETE ALL LEARNING DATA */}
      {showDeleteDataModal && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6 shadow-2xl animate-page-enter space-y-4">
            <div className="flex items-center gap-2.5 text-error">
              <AlertCircle className="h-6 w-6" />
              <h3 className="font-heading text-lg font-bold">Delete Learning Data?</h3>
            </div>
            <p className="text-xs text-text-2 leading-relaxed">
              This will permanently delete your personalized learning paths, active roadmaps, completed lessons, and quiz scores. Your account itself will remain active.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowDeleteDataModal(false)} disabled={processingPrivacy}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteAllLearningData} disabled={processingPrivacy}>
                {processingPrivacy ? 'Deleting...' : 'Yes, Delete Data'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: DELETE ACCOUNT PERMANENTLY */}
      {showDeleteAccountModal && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6 shadow-2xl animate-page-enter space-y-4">
            <div className="flex items-center gap-2.5 text-error">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="font-heading text-lg font-bold">Delete Account Permanently?</h3>
            </div>
            <p className="text-xs text-text-2 leading-relaxed">
              This will permanently delete your account, all your learning paths, lessons, and progress. This cannot be undone.
            </p>
            
            <div className="space-y-1.5">
              <Label htmlFor="delConfirm" className="text-xs text-text-2 font-semibold">
                Type <span className="font-bold text-error">DELETE</span> below to confirm:
              </Label>
              <Input
                id="delConfirm"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="DELETE"
                className="border-error/30 focus:border-error text-center font-bold"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowDeleteAccountModal(false)} disabled={deletingAccount}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteAccount} 
                disabled={deletingAccount || deleteConfirmationText !== 'DELETE'}
                className="w-full sm:w-auto"
              >
                {deletingAccount ? 'Deleting Account...' : 'Permanently Delete Account'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
