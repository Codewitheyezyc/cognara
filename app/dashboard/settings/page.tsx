'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Settings, User, Mail, ShieldAlert, CreditCard, Sparkles, 
  Trash2, Download, AlertCircle, Sun, Moon, Laptop, Loader2 
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  
  const [loading, setLoading] = useState(true)
  const [updatingAccount, setUpdatingAccount] = useState(false)
  const [processingPrivacy, setProcessingPrivacy] = useState(false)

  // Account form fields
  const [newEmail, setNewEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  // Appearance fields
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark')
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal')

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
          }
        }

        // Load theme from localStorage
        const savedTheme = localStorage.getItem('cognara-theme') as 'dark' | 'light' | 'system' | null
        setTheme(savedTheme || 'dark')
        
        // Load font size from localStorage
        const savedFont = localStorage.getItem('cognara-font-size') as 'normal' | 'large' | null
        setFontSize(savedFont || 'normal')
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

  // Toggle Subscription Handler
  const handleToggleSubscription = async (tier: 'free' | 'pro_monthly') => {
    if (!user) return
    try {
      const status = tier === 'pro_monthly' ? 'active' : 'inactive'
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_tier: tier,
          subscription_status: status,
          subscription_end_date: null
        })
        .eq('id', user.id)

      if (error) throw error

      setProfile((prev: any) => ({
        ...prev,
        subscription_tier: tier,
        subscription_status: status,
        subscription_end_date: null
      }))

      if (tier === 'pro_monthly') {
        await supabase.rpc('grant_monthly_shields')
      }

      toast(`Subscription changed to ${tier === 'pro_monthly' ? 'Pro Monthly' : 'Free Plan'}!`)
      
      // Force reload page to apply new tier to context/cache if any
      router.refresh()
    } catch (err: any) {
      console.error(err)
      toast(err.message || 'Failed to update subscription', 'error')
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
    } finally {
      setDeletingAccount(false)
      setShowDeleteAccountModal(false)
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

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 bg-surface-alt/40 p-4 rounded-lg border border-border/50 text-xs">
            <div>
              <span className="text-text-2 block mb-0.5">Current Plan</span>
              <span className="font-bold text-text-1 capitalize">
                {profile?.subscription_tier?.replace('_', ' ') || 'Free'}
              </span>
            </div>
            <div>
              <span className="text-text-2 block mb-0.5">Status</span>
              <span className="font-bold text-text-1 capitalize">
                {profile?.subscription_status || 'Inactive'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-text-2">Developer Controls (Simulate billing changes):</span>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline"
                onClick={() => handleToggleSubscription('free')}
                disabled={profile?.subscription_tier === 'free'}
                className="flex-1 cursor-pointer"
              >
                Switch to Free Plan
              </Button>
              <Button 
                onClick={() => handleToggleSubscription('pro_monthly')}
                disabled={profile?.subscription_tier === 'pro_monthly'}
                className="flex-1 bg-primary hover:bg-primary/95 text-white cursor-pointer"
              >
                Switch to Pro Monthly
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. APPEARANCE SECTION */}
      <div className="rounded-[10px] border border-border bg-surface p-6 shadow-md space-y-6">
        <div className="flex items-center space-x-2 text-primary border-b border-border pb-3">
          <Settings className="h-5 w-5" strokeWidth={1.5} />
          <h2 className="font-heading text-xl font-bold text-text-1">Appearance & Typography</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          {/* Font Size Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-text-1">Application Font Size</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'normal', label: 'Normal', desc: '15px base size' },
                { value: 'large', label: 'Large', desc: '17px base size' },
              ].map(fOpts => {
                const isSelected = fontSize === fOpts.value
                return (
                  <button
                    key={fOpts.value}
                    onClick={() => handleFontSizeChange(fOpts.value as any)}
                    className={`flex flex-col items-center justify-center gap-0.5 py-2 px-2 rounded-md border cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-border bg-transparent hover:bg-surface-alt/50 text-text-2'
                    }`}
                  >
                    <span className="font-semibold text-xs">{fOpts.label}</span>
                    <span className="text-[9px] opacity-75">{fOpts.desc}</span>
                  </button>
                )
              })}
            </div>
          </div>
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
      {showDeleteDataModal && (
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
        </div>
      )}

      {/* MODAL 2: DELETE ACCOUNT PERMANENTLY */}
      {showDeleteAccountModal && (
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
        </div>
      )}
    </div>
  )
}
