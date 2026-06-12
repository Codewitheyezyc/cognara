'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  User, Globe, Clock, Target, GraduationCap, Briefcase, 
  Settings2, Bell, Save, Upload, Camera, Check, AlertCircle, Loader2 
} from 'lucide-react'

// Define Zod schemas
const personalInfoSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be under 50 characters'),
  country: z.string().min(1, 'Please select a country'),
  timezone: z.string().min(1, 'Please select a timezone'),
})

const learningIdentitySchema = z.object({
  learning_style: z.string().min(1, 'Please select a learning style'),
  main_goal: z.string().min(1, 'Please select a main goal'),
  occupation: z.string().min(1, 'Please select an occupation'),
})

const learningPreferencesSchema = z.object({
  default_depth_level: z.number().min(1).max(5),
  daily_study_minutes: z.number().min(15),
  preferred_study_time: z.string().min(1, 'Please select preferred study time'),
})

const notificationsSchema = z.object({
  reminder_enabled: z.boolean(),
  reminder_time: z.string().optional(),
  weekly_summary_enabled: z.boolean(),
  achievement_notifications: z.boolean(),
})

const countries = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'IN', label: 'India' },
  { value: 'JP', label: 'Japan' },
  { value: 'BR', label: 'Brazil' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'Other', label: 'Other' },
]

const timezones = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Kolkata',
  'Asia/Tokyo',
  'Australia/Sydney',
  'UTC',
]

const learningStyles = [
  { value: 'Reading explanations first', label: 'Reading explanations first', desc: 'Prefer conceptual context and details first.' },
  { value: 'Seeing examples first', label: 'Seeing examples first', desc: 'Prefer concrete code or system design walk-throughs first.' },
  { value: 'Learning by doing (exercises first)', label: 'Learning by doing (exercises first)', desc: 'Prefer immediate practical challenges and tasks first.' },
  { value: 'Mixed approach', label: 'Mixed approach', desc: 'A balance of explanations, examples, and exercises.' },
]

const mainGoals = [
  { value: 'Career change', label: 'Career change', desc: 'Switching domains or starting a brand new path.' },
  { value: 'Skill upgrade for current job', label: 'Skill upgrade for current job', desc: 'Keeping up-to-date with current career stack.' },
  { value: 'Personal interest', label: 'Personal interest', desc: 'Exploring topics simply because they are interesting.' },
  { value: 'Academic study', label: 'Academic study', desc: 'Calibrating with school, university, or certificate tracks.' },
  { value: 'Building a business', label: 'Building a business', desc: 'Acquiring skills needed to launch a product or service.' },
]

const occupations = [
  { value: 'Student', label: 'Student' },
  { value: 'Working professional', label: 'Working professional' },
  { value: 'Freelancer', label: 'Freelancer' },
  { value: 'Business owner', label: 'Business owner' },
  { value: 'Other', label: 'Other' },
]

const studyTimes = [
  { value: 'Morning', label: 'Morning' },
  { value: 'Afternoon', label: 'Afternoon' },
  { value: 'Evening', label: 'Evening' },
  { value: 'Night', label: 'Night' },
]

const dailyMinutesOptions = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours+' },
]

const depthLevels = [
  { value: 1, label: "Like I'm 10" },
  { value: 2, label: 'Beginner' },
  { value: 3, label: 'Intermediate' },
  { value: 4, label: 'Advanced' },
  { value: 5, label: 'Expert' },
]

export default function ProfilePage() {
  const supabase = createClient()
  const { toast } = useToast()
  
  const [userId, setUserId] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('')
  
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [savingSection, setSavingSection] = useState<Record<string, boolean>>({})
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize Forms
  const personalInfoForm = useForm({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: { name: '', country: '', timezone: '' }
  })

  const learningIdentityForm = useForm({
    resolver: zodResolver(learningIdentitySchema),
    defaultValues: { learning_style: '', main_goal: '', occupation: '' }
  })

  const learningPreferencesForm = useForm({
    resolver: zodResolver(learningPreferencesSchema),
    defaultValues: { default_depth_level: 2, daily_study_minutes: 30, preferred_study_time: '' }
  })

  const notificationsForm = useForm({
    resolver: zodResolver(notificationsSchema),
    defaultValues: { 
      reminder_enabled: false, 
      reminder_time: '09:00', 
      weekly_summary_enabled: true, 
      achievement_notifications: true 
    }
  })

  // Load profile data
  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
          
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle()
            
          if (profile) {
            setAvatarUrl(profile.avatar_url || null)
            setUserName(profile.name || '')
            
            // Auto detect timezone on first load if it's empty
            const autoDetectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
            const resolvedTimezone = profile.timezone || autoDetectedTimezone || 'UTC'
            
            personalInfoForm.reset({
              name: profile.name || '',
              country: profile.country || '',
              timezone: resolvedTimezone,
            })

            learningIdentityForm.reset({
              learning_style: profile.learning_style || '',
              main_goal: profile.main_goal || '',
              occupation: profile.occupation || '',
            })

            learningPreferencesForm.reset({
              default_depth_level: profile.default_depth_level ?? 2,
              daily_study_minutes: profile.daily_study_minutes ?? 30,
              preferred_study_time: profile.preferred_study_time || '',
            })

            notificationsForm.reset({
              reminder_enabled: profile.reminder_enabled ?? false,
              reminder_time: profile.reminder_time || '09:00',
              weekly_summary_enabled: profile.weekly_summary_enabled ?? true,
              achievement_notifications: profile.achievement_notifications ?? true,
            })
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err)
        toast('Failed to load profile data', 'error')
      } finally {
        setLoadingProfile(false)
      }
    }
    fetchProfile()
  }, [supabase])

  // Profile Photo Upload Handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    // 1. Validate file type & size
    if (!file.type.startsWith('image/')) {
      toast('Please upload an image file', 'error')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast('Image file must be under 2MB', 'error')
      return
    }

    setUploadingPhoto(true)
    try {
      // 2. Upload file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(`${userId}/avatar.jpg`, file, {
          upsert: true,
          contentType: 'image/jpeg'
        })

      if (uploadError) throw uploadError

      // 3. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(`${userId}/avatar.jpg`)

      // 4. Update profile field in database
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (dbError) throw dbError

      // 5. Update state (cache-busting URL parameter)
      setAvatarUrl(`${publicUrl}?t=${Date.now()}`)
      toast('Profile photo updated successfully!')
    } catch (err) {
      console.error(err)
      toast('Failed to upload profile photo', 'error')
    } finally {
      setUploadingPhoto(false)
    }
  }

  // Section Save Handlers
  const onSavePersonalInfo = async (values: z.infer<typeof personalInfoSchema>) => {
    if (!userId) return
    setSavingSection(prev => ({ ...prev, personal: true }))
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: values.name,
          country: values.country,
          timezone: values.timezone
        })
        .eq('id', userId)

      if (error) throw error
      setUserName(values.name)
      toast('Personal information saved successfully!')
    } catch (err) {
      console.error(err)
      toast('Failed to save personal information', 'error')
    } finally {
      setSavingSection(prev => ({ ...prev, personal: false }))
    }
  }

  const onSaveLearningIdentity = async (values: z.infer<typeof learningIdentitySchema>) => {
    if (!userId) return
    setSavingSection(prev => ({ ...prev, identity: true }))
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          learning_style: values.learning_style,
          main_goal: values.main_goal,
          occupation: values.occupation
        })
        .eq('id', userId)

      if (error) throw error
      toast('Learning identity saved successfully!')
    } catch (err) {
      console.error(err)
      toast('Failed to save learning identity', 'error')
    } finally {
      setSavingSection(prev => ({ ...prev, identity: false }))
    }
  }

  const onSaveLearningPreferences = async (values: z.infer<typeof learningPreferencesSchema>) => {
    if (!userId) return
    setSavingSection(prev => ({ ...prev, preferences: true }))
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          default_depth_level: values.default_depth_level,
          daily_study_minutes: values.daily_study_minutes,
          preferred_study_time: values.preferred_study_time
        })
        .eq('id', userId)

      if (error) throw error
      toast('Learning preferences saved successfully!')
    } catch (err) {
      console.error(err)
      toast('Failed to save learning preferences', 'error')
    } finally {
      setSavingSection(prev => ({ ...prev, preferences: false }))
    }
  }

  const onSaveNotifications = async (values: z.infer<typeof notificationsSchema>) => {
    if (!userId) return
    setSavingSection(prev => ({ ...prev, notifications: true }))
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          reminder_enabled: values.reminder_enabled,
          reminder_time: values.reminder_enabled ? values.reminder_time : null,
          weekly_summary_enabled: values.weekly_summary_enabled,
          achievement_notifications: values.achievement_notifications
        })
        .eq('id', userId)

      if (error) throw error
      toast('Notification preferences saved successfully!')
    } catch (err) {
      console.error(err)
      toast('Failed to save notification preferences', 'error')
    } finally {
      setSavingSection(prev => ({ ...prev, notifications: false }))
    }
  }

  if (loadingProfile) {
    return (
      <div className="space-y-6 animate-pulse max-w-4xl">
        <div className="h-8 w-48 bg-surface-alt rounded-sm" />
        <div className="h-4 w-72 bg-surface-alt rounded-sm" />
        <div className="h-48 bg-surface-alt rounded-[10px]" />
        <div className="h-64 bg-surface-alt rounded-[10px]" />
      </div>
    )
  }

  const initialsUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName || 'Learner')}`

  return (
    <div className="space-y-8 animate-page-enter max-w-4xl pb-16">
      {/* Page Title */}
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-text-1">My Profile</h1>
        <p className="text-text-2 text-sm mt-1">Manage your personal details, learning identity, and configurations.</p>
      </div>

      {/* SECTION 1 — PERSONAL INFORMATION */}
      <div className="rounded-[10px] border border-border bg-surface p-6 shadow-md space-y-6">
        <div className="flex items-center space-x-2 text-primary border-b border-border pb-3">
          <User className="h-5 w-5" strokeWidth={1.5} />
          <h2 className="font-heading text-xl font-bold text-text-1">Personal Information</h2>
        </div>

        {/* Profile Avatar Upload Block */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-md bg-surface-alt/40 border border-border/40">
          <div className="relative group">
            <img 
              src={avatarUrl || initialsUrl} 
              alt={userName} 
              className="w-24 h-24 rounded-full object-cover border-2 border-border shadow-md"
            />
            {uploadingPhoto && (
              <div className="absolute inset-0 bg-surface/80 rounded-full flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-text-1">Profile Photo</h3>
            <p className="text-xs text-text-2">Upload a JPG or PNG file. Max size 2MB.</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handlePhotoUpload} 
              accept="image/*" 
              className="hidden" 
            />
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="flex items-center gap-1.5 w-fit"
            >
              <Upload className="h-3.5 w-3.5" />
              Choose Photo
            </Button>
          </div>
        </div>

        <form onSubmit={personalInfoForm.handleSubmit(onSavePersonalInfo)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                placeholder="Isaac Newton"
                {...personalInfoForm.register('name')} 
              />
              {personalInfoForm.formState.errors.name && (
                <p className="text-xs text-error mt-0.5">{personalInfoForm.formState.errors.name.message}</p>
              )}
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <Label htmlFor="country">Country</Label>
              <select 
                id="country" 
                {...personalInfoForm.register('country')}
                className="w-full h-[40px] px-3.5 py-2 text-text-1 placeholder-[var(--input-placeholder)] border border-[var(--input-border)] bg-[var(--input-bg)] rounded-[8px] text-[15px] outline-none focus:border-[var(--input-focus-border)] transition-all cursor-pointer"
              >
                <option value="">Select country...</option>
                {countries.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              {personalInfoForm.formState.errors.country && (
                <p className="text-xs text-error mt-0.5">{personalInfoForm.formState.errors.country.message}</p>
              )}
            </div>

            {/* Timezone */}
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="timezone">Timezone</Label>
              <div className="flex gap-2">
                <select 
                  id="timezone" 
                  {...personalInfoForm.register('timezone')}
                  className="flex-1 h-[40px] px-3.5 py-2 text-text-1 placeholder-[var(--input-placeholder)] border border-[var(--input-border)] bg-[var(--input-bg)] rounded-[8px] text-[15px] outline-none focus:border-[var(--input-focus-border)] transition-all cursor-pointer"
                >
                  <option value="">Select timezone...</option>
                  {timezones.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
              {personalInfoForm.formState.errors.timezone && (
                <p className="text-xs text-error mt-0.5">{personalInfoForm.formState.errors.timezone.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={savingSection['personal']} className="flex items-center gap-1.5">
              {savingSection['personal'] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Personal Info
            </Button>
          </div>
        </form>
      </div>

      {/* SECTION 2 — LEARNING IDENTITY */}
      <div className="rounded-[10px] border border-border bg-surface p-6 shadow-md space-y-6">
        <div className="flex items-center space-x-2 text-primary border-b border-border pb-3">
          <GraduationCap className="h-5 w-5" strokeWidth={1.5} />
          <h2 className="font-heading text-xl font-bold text-text-1">Learning Identity</h2>
        </div>

        <form onSubmit={learningIdentityForm.handleSubmit(onSaveLearningIdentity)} className="space-y-6">
          {/* Learning Style */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-text-1">How do you prefer to learn?</Label>
            <Controller
              name="learning_style"
              control={learningIdentityForm.control}
              render={({ field }) => (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {learningStyles.map(item => {
                    const isSelected = field.value === item.value
                    return (
                      <button
                        type="button"
                        key={item.value}
                        onClick={() => field.onChange(item.value)}
                        className={`w-full text-left p-4 rounded-md border transition-all duration-150 cursor-pointer flex justify-between items-start ${
                          isSelected
                            ? 'border-primary ring-1 ring-primary/45 bg-surface-alt'
                            : 'border-border bg-transparent hover:bg-surface-alt/50'
                        }`}
                      >
                        <div className="flex flex-col pr-4">
                          <span className={`font-semibold text-sm ${isSelected ? 'text-primary' : 'text-text-1'}`}>
                            {item.label}
                          </span>
                          <span className="text-xs text-text-2 mt-1 leading-relaxed">{item.desc}</span>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
                      </button>
                    )
                  })}
                </div>
              )}
            />
          </div>

          {/* Main Goal */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-text-1">What is your main goal on Cognara?</Label>
            <Controller
              name="main_goal"
              control={learningIdentityForm.control}
              render={({ field }) => (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {mainGoals.map(item => {
                    const isSelected = field.value === item.value
                    return (
                      <button
                        type="button"
                        key={item.value}
                        onClick={() => field.onChange(item.value)}
                        className={`w-full text-left p-4 rounded-md border transition-all duration-150 cursor-pointer flex justify-between items-start ${
                          isSelected
                            ? 'border-primary ring-1 ring-primary/45 bg-surface-alt'
                            : 'border-border bg-transparent hover:bg-surface-alt/50'
                        }`}
                      >
                        <div className="flex flex-col pr-4">
                          <span className={`font-semibold text-sm ${isSelected ? 'text-primary' : 'text-text-1'}`}>
                            {item.label}
                          </span>
                          <span className="text-xs text-text-2 mt-1 leading-relaxed">{item.desc}</span>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
                      </button>
                    )
                  })}
                </div>
              )}
            />
          </div>

          {/* Occupation */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-text-1">What is your occupation?</Label>
            <Controller
              name="occupation"
              control={learningIdentityForm.control}
              render={({ field }) => (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {occupations.map(item => {
                    const isSelected = field.value === item.value
                    return (
                      <button
                        type="button"
                        key={item.value}
                        onClick={() => field.onChange(item.value)}
                        className={`text-center p-3 rounded-md border transition-all duration-150 cursor-pointer font-medium text-xs ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary font-semibold'
                            : 'border-border bg-transparent hover:bg-surface-alt/50 text-text-2'
                        }`}
                      >
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              )}
            />
          </div>

          <div className="flex justify-end pt-2 border-t border-border">
            <Button type="submit" disabled={savingSection['identity']} className="flex items-center gap-1.5">
              {savingSection['identity'] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Learning Identity
            </Button>
          </div>
        </form>
      </div>

      {/* SECTION 3 — LEARNING PREFERENCES */}
      <div className="rounded-[10px] border border-border bg-surface p-6 shadow-md space-y-6">
        <div className="flex items-center space-x-2 text-primary border-b border-border pb-3">
          <Settings2 className="h-5 w-5" strokeWidth={1.5} />
          <h2 className="font-heading text-xl font-bold text-text-1">Learning Preferences</h2>
        </div>

        <form onSubmit={learningPreferencesForm.handleSubmit(onSaveLearningPreferences)} className="space-y-6">
          {/* Default Depth Level */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-text-1">Default Explanation Depth</Label>
            <Controller
              name="default_depth_level"
              control={learningPreferencesForm.control}
              render={({ field }) => (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {depthLevels.map(item => {
                    const isSelected = field.value === item.value
                    return (
                      <button
                        type="button"
                        key={item.value}
                        onClick={() => field.onChange(item.value)}
                        className={`text-center py-3 px-2 rounded-md border transition-all duration-150 cursor-pointer flex flex-col justify-center gap-1 ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-transparent hover:bg-surface-alt/50 text-text-2'
                        }`}
                      >
                        <span className="font-semibold text-xs">{item.label}</span>
                        <span className="text-[9px] font-mono opacity-80">Lvl {item.value}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            />
          </div>

          {/* Daily Study Time Goal */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-text-1">Daily Study Time Goal</Label>
            <Controller
              name="daily_study_minutes"
              control={learningPreferencesForm.control}
              render={({ field }) => (
                <div className="grid grid-cols-4 gap-2">
                  {dailyMinutesOptions.map(item => {
                    const isSelected = field.value === item.value
                    return (
                      <button
                        type="button"
                        key={item.value}
                        onClick={() => field.onChange(item.value)}
                        className={`text-center py-3 px-1 rounded-md border transition-all duration-150 cursor-pointer font-semibold text-xs ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-transparent hover:bg-surface-alt/50 text-text-2'
                        }`}
                      >
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              )}
            />
          </div>

          {/* Preferred Study Time */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-text-1">Preferred Study Time</Label>
            <Controller
              name="preferred_study_time"
              control={learningPreferencesForm.control}
              render={({ field }) => (
                <div className="grid grid-cols-4 gap-2">
                  {studyTimes.map(item => {
                    const isSelected = field.value === item.value
                    return (
                      <button
                        type="button"
                        key={item.value}
                        onClick={() => field.onChange(item.value)}
                        className={`text-center py-3 px-1 rounded-md border transition-all duration-150 cursor-pointer font-semibold text-xs ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-transparent hover:bg-surface-alt/50 text-text-2'
                        }`}
                      >
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              )}
            />
          </div>

          <div className="flex justify-end pt-2 border-t border-border">
            <Button type="submit" disabled={savingSection['preferences']} className="flex items-center gap-1.5">
              {savingSection['preferences'] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Learning Preferences
            </Button>
          </div>
        </form>
      </div>

      {/* SECTION 4 — NOTIFICATIONS */}
      <div className="rounded-[10px] border border-border bg-surface p-6 shadow-md space-y-6">
        <div className="flex items-center space-x-2 text-primary border-b border-border pb-3">
          <Bell className="h-5 w-5" strokeWidth={1.5} />
          <h2 className="font-heading text-xl font-bold text-text-1">Notifications</h2>
        </div>

        <form onSubmit={notificationsForm.handleSubmit(onSaveNotifications)} className="space-y-6">
          <div className="space-y-4">
            {/* Daily study reminder */}
            <div className="flex flex-col gap-3 p-4 rounded-md bg-surface-alt/30 border border-border/30">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-text-1">Daily Study Reminder</h3>
                  <p className="text-xs text-text-2">Get alerted when it is time to do your daily learning milestones.</p>
                </div>
                <Controller
                  name="reminder_enabled"
                  control={notificationsForm.control}
                  render={({ field }) => (
                    <button
                      type="button"
                      onClick={() => field.onChange(!field.value)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                        field.value ? 'bg-primary' : 'bg-border'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          field.value ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  )}
                />
              </div>

              {/* Conditional Time Picker */}
              {notificationsForm.watch('reminder_enabled') && (
                <div className="flex items-center gap-3 mt-2 pl-2 border-l-2 border-primary/50 animate-page-enter">
                  <Clock className="h-4 w-4 text-text-3" />
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="reminder_time" className="text-[11px] text-text-2 uppercase">Reminder Time</Label>
                    <input
                      id="reminder_time"
                      type="time"
                      {...notificationsForm.register('reminder_time')}
                      className="px-2.5 py-1 text-text-1 border border-[var(--input-border)] bg-[var(--input-bg)] rounded-[6px] text-xs outline-none focus:border-[var(--input-focus-border)]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Weekly progress summary email */}
            <div className="flex items-center justify-between p-4 rounded-md bg-surface-alt/30 border border-border/30">
              <div>
                <h3 className="text-sm font-semibold text-text-1">Weekly Progress Summary</h3>
                <p className="text-xs text-text-2">Receive a summary email of your learning metrics, streaks, and focus topics.</p>
              </div>
              <Controller
                name="weekly_summary_enabled"
                control={notificationsForm.control}
                render={({ field }) => (
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                      field.value ? 'bg-primary' : 'bg-border'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        field.value ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                )}
              />
            </div>

            {/* Achievement notifications */}
            <div className="flex items-center justify-between p-4 rounded-md bg-surface-alt/30 border border-border/30">
              <div>
                <h3 className="text-sm font-semibold text-text-1">Achievement Notifications</h3>
                <p className="text-xs text-text-2">Get alerts when you build study streaks, complete milestones, or pass quizzes.</p>
              </div>
              <Controller
                name="achievement_notifications"
                control={notificationsForm.control}
                render={({ field }) => (
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                      field.value ? 'bg-primary' : 'bg-border'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        field.value ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-border">
            <Button type="submit" disabled={savingSection['notifications']} className="flex items-center gap-1.5">
              {savingSection['notifications'] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Notifications
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
