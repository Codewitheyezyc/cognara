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
  Settings2, Bell, Save, Upload, Camera, Check, AlertCircle, Loader2,
  Award, Lock, Share2
} from 'lucide-react'
import { LinkedinIcon, TwitterIcon, InstagramIcon, FacebookIcon } from '@/components/ui/SocialIcons'

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
  default_depth_level: z.number().min(0).max(5),
  daily_study_minutes: z.number().min(15),
  preferred_study_time: z.string().min(1, 'Please select preferred study time'),
})

const notificationsSchema = z.object({
  reminder_enabled: z.boolean(),
  reminder_time: z.string().optional(),
  weekly_summary_enabled: z.boolean(),
  achievement_notifications: z.boolean(),
})

const portfolioSocialSchema = z.object({
  linkedin_url: z.string().url('Must be a valid URL').or(z.literal('')),
  twitter_url: z.string().url('Must be a valid URL').or(z.literal('')),
  instagram_url: z.string().url('Must be a valid URL').or(z.literal('')),
  facebook_url: z.string().url('Must be a valid URL').or(z.literal('')),
  portfolio_public: z.boolean(),
})

const countries = [
  { value: 'AF', label: 'Afghanistan' },
  { value: 'AL', label: 'Albania' },
  { value: 'DZ', label: 'Algeria' },
  { value: 'AD', label: 'Andorra' },
  { value: 'AO', label: 'Angola' },
  { value: 'AG', label: 'Antigua and Barbuda' },
  { value: 'AR', label: 'Argentina' },
  { value: 'AM', label: 'Armenia' },
  { value: 'AU', label: 'Australia' },
  { value: 'AT', label: 'Austria' },
  { value: 'AZ', label: 'Azerbaijan' },
  { value: 'BS', label: 'Bahamas' },
  { value: 'BH', label: 'Bahrain' },
  { value: 'BD', label: 'Bangladesh' },
  { value: 'BB', label: 'Barbados' },
  { value: 'BY', label: 'Belarus' },
  { value: 'BE', label: 'Belgium' },
  { value: 'BZ', label: 'Belize' },
  { value: 'BJ', label: 'Benin' },
  { value: 'BT', label: 'Bhutan' },
  { value: 'BO', label: 'Bolivia' },
  { value: 'BA', label: 'Bosnia and Herzegovina' },
  { value: 'BW', label: 'Botswana' },
  { value: 'BR', label: 'Brazil' },
  { value: 'BN', label: 'Brunei' },
  { value: 'BG', label: 'Bulgaria' },
  { value: 'BF', label: 'Burkina Faso' },
  { value: 'BI', label: 'Burundi' },
  { value: 'CV', label: 'Cabo Verde' },
  { value: 'KH', label: 'Cambodia' },
  { value: 'CM', label: 'Cameroon' },
  { value: 'CA', label: 'Canada' },
  { value: 'CF', label: 'Central African Republic' },
  { value: 'TD', label: 'Chad' },
  { value: 'CL', label: 'Chile' },
  { value: 'CN', label: 'China' },
  { value: 'CO', label: 'Colombia' },
  { value: 'KM', label: 'Comoros' },
  { value: 'CG', label: 'Congo (Congo-Brazzaville)' },
  { value: 'CD', label: 'Congo (Democratic Republic)' },
  { value: 'CR', label: 'Costa Rica' },
  { value: 'HR', label: 'Croatia' },
  { value: 'CU', label: 'Cuba' },
  { value: 'CY', label: 'Cyprus' },
  { value: 'CZ', label: 'Czechia (Czech Republic)' },
  { value: 'DK', label: 'Denmark' },
  { value: 'DJ', label: 'Djibouti' },
  { value: 'DM', label: 'Dominica' },
  { value: 'DO', label: 'Dominican Republic' },
  { value: 'EC', label: 'Ecuador' },
  { value: 'EG', label: 'Egypt' },
  { value: 'SV', label: 'El Salvador' },
  { value: 'GQ', label: 'Equatorial Guinea' },
  { value: 'ER', label: 'Eritrea' },
  { value: 'EE', label: 'Estonia' },
  { value: 'SZ', label: 'Eswatini' },
  { value: 'ET', label: 'Ethiopia' },
  { value: 'FJ', label: 'Fiji' },
  { value: 'FI', label: 'Finland' },
  { value: 'FR', label: 'France' },
  { value: 'GA', label: 'Gabon' },
  { value: 'GM', label: 'Gambia' },
  { value: 'GE', label: 'Georgia' },
  { value: 'DE', label: 'Germany' },
  { value: 'GH', label: 'Ghana' },
  { value: 'GR', label: 'Greece' },
  { value: 'GD', label: 'Grenada' },
  { value: 'GT', label: 'Guatemala' },
  { value: 'GN', label: 'Guinea' },
  { value: 'GW', label: 'Guinea-Bissau' },
  { value: 'GY', label: 'Guyana' },
  { value: 'HT', label: 'Haiti' },
  { value: 'HN', label: 'Honduras' },
  { value: 'HU', label: 'Hungary' },
  { value: 'IS', label: 'Iceland' },
  { value: 'IN', label: 'India' },
  { value: 'ID', label: 'Indonesia' },
  { value: 'IR', label: 'Iran' },
  { value: 'IQ', label: 'Iraq' },
  { value: 'IE', label: 'Ireland' },
  { value: 'IL', label: 'Israel' },
  { value: 'IT', label: 'Italy' },
  { value: 'JM', label: 'Jamaica' },
  { value: 'JP', label: 'Japan' },
  { value: 'JO', label: 'Jordan' },
  { value: 'KZ', label: 'Kazakhstan' },
  { value: 'KE', label: 'Kenya' },
  { value: 'KI', label: 'Kiribati' },
  { value: 'KP', label: 'Korea (North)' },
  { value: 'KR', label: 'Korea (South)' },
  { value: 'XK', label: 'Kosovo' },
  { value: 'KW', label: 'Kuwait' },
  { value: 'KG', label: 'Kyrgyzstan' },
  { value: 'LA', label: 'Laos' },
  { value: 'LV', label: 'Latvia' },
  { value: 'LB', label: 'Lebanon' },
  { value: 'LS', label: 'Lesotho' },
  { value: 'LR', label: 'Liberia' },
  { value: 'LY', label: 'Libya' },
  { value: 'LI', label: 'Liechtenstein' },
  { value: 'LT', label: 'Lithuania' },
  { value: 'LU', label: 'Luxembourg' },
  { value: 'MG', label: 'Madagascar' },
  { value: 'MW', label: 'Malawi' },
  { value: 'MY', label: 'Malaysia' },
  { value: 'MV', label: 'Maldives' },
  { value: 'ML', label: 'Mali' },
  { value: 'MT', label: 'Malta' },
  { value: 'MH', label: 'Marshall Islands' },
  { value: 'MR', label: 'Mauritania' },
  { value: 'MU', label: 'Mauritius' },
  { value: 'MX', label: 'Mexico' },
  { value: 'FM', label: 'Micronesia' },
  { value: 'MD', label: 'Moldova' },
  { value: 'MC', label: 'Monaco' },
  { value: 'MN', label: 'Mongolia' },
  { value: 'ME', label: 'Montenegro' },
  { value: 'MA', label: 'Morocco' },
  { value: 'MZ', label: 'Mozambique' },
  { value: 'MM', label: 'Myanmar' },
  { value: 'NA', label: 'Namibia' },
  { value: 'NR', label: 'Nauru' },
  { value: 'NP', label: 'Nepal' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'NI', label: 'Nicaragua' },
  { value: 'NE', label: 'Niger' },
  { value: 'NG', label: 'Nigeria' },
  { value: 'MK', label: 'North Macedonia' },
  { value: 'NO', label: 'Norway' },
  { value: 'OM', label: 'Oman' },
  { value: 'PK', label: 'Pakistan' },
  { value: 'PW', label: 'Palau' },
  { value: 'PA', label: 'Panama' },
  { value: 'PG', label: 'Papua New Guinea' },
  { value: 'PY', label: 'Paraguay' },
  { value: 'PE', label: 'Peru' },
  { value: 'PH', label: 'Philippines' },
  { value: 'PL', label: 'Poland' },
  { value: 'PT', label: 'Portugal' },
  { value: 'QA', label: 'Qatar' },
  { value: 'RO', label: 'Romania' },
  { value: 'RU', label: 'Russia' },
  { value: 'RW', label: 'Rwanda' },
  { value: 'KN', label: 'Saint Kitts and Nevis' },
  { value: 'LC', label: 'Saint Lucia' },
  { value: 'VC', label: 'Saint Vincent and the Grenadines' },
  { value: 'WS', label: 'Samoa' },
  { value: 'SM', label: 'San Marino' },
  { value: 'ST', label: 'Sao Tome and Principe' },
  { value: 'SA', label: 'Saudi Arabia' },
  { value: 'SN', label: 'Senegal' },
  { value: 'RS', label: 'Serbia' },
  { value: 'SC', label: 'Seychelles' },
  { value: 'SL', label: 'Sierra Leone' },
  { value: 'SG', label: 'Singapore' },
  { value: 'SK', label: 'Slovakia' },
  { value: 'SI', label: 'Slovenia' },
  { value: 'SB', label: 'Solomon Islands' },
  { value: 'SO', label: 'Somalia' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'SS', label: 'South Sudan' },
  { value: 'ES', label: 'Spain' },
  { value: 'LK', label: 'Sri Lanka' },
  { value: 'SD', label: 'Sudan' },
  { value: 'SR', label: 'Suriname' },
  { value: 'SE', label: 'Sweden' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'SY', label: 'Syria' },
  { value: 'TW', label: 'Taiwan' },
  { value: 'TJ', label: 'Tajikistan' },
  { value: 'TZ', label: 'Tanzania' },
  { value: 'TH', label: 'Thailand' },
  { value: 'TL', label: 'Timor-Leste' },
  { value: 'TG', label: 'Togo' },
  { value: 'TO', label: 'Tonga' },
  { value: 'TT', label: 'Trinidad and Tobago' },
  { value: 'TN', label: 'Tunisia' },
  { value: 'TR', label: 'Turkey' },
  { value: 'TM', label: 'Turkmenistan' },
  { value: 'TV', label: 'Tuvalu' },
  { value: 'UG', label: 'Uganda' },
  { value: 'UA', label: 'Ukraine' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'US', label: 'United States' },
  { value: 'UY', label: 'Uruguay' },
  { value: 'UZ', label: 'Uzbekistan' },
  { value: 'VU', label: 'Vanuatu' },
  { value: 'VE', label: 'Venezuela' },
  { value: 'VN', label: 'Vietnam' },
  { value: 'YE', label: 'Yemen' },
  { value: 'ZM', label: 'Zambia' },
  { value: 'ZW', label: 'Zimbabwe' },
  { value: 'Other', label: 'Other' }
]

const defaultTimezones = [
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Africa/Nairobi',
  'America/Argentina/Buenos_Aires',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/New_York',
  'America/Sao_Paulo',
  'Asia/Dubai',
  'Asia/Hong_Kong',
  'Asia/Jakarta',
  'Asia/Kolkata',
  'Asia/Seoul',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Europe/Berlin',
  'Europe/London',
  'Europe/Moscow',
  'Europe/Paris',
  'Pacific/Auckland',
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

const ALL_BADGES = [
  { key: 'phase_1', emoji: '🌱', label: 'First Steps', description: 'Completed Phase 1' },
  { key: 'phase_2', emoji: '🔥', label: 'Building Momentum', description: 'Completed Phase 2' },
  { key: 'phase_3', emoji: '⚡', label: 'Halfway There', description: 'Completed Phase 3' },
  { key: 'phase_4', emoji: '🎯', label: 'Advanced Learner', description: 'Completed Phase 4' },
  { key: 'phase_5', emoji: '🏆', label: 'Graduate', description: 'Completed full roadmap' },
  { key: 'streak_7', emoji: '🔥', label: 'Week Warrior', description: '7 day streak' },
  { key: 'streak_30', emoji: '💎', label: 'Consistent', description: '30 day streak' },
  { key: 'perfect_quiz', emoji: '⭐', label: 'Perfect Score', description: '100% on a quiz' },
  { key: 'speed_learner', emoji: '⚡', label: 'Speed Learner', description: '3 lessons in one day' }
]

export default function ProfilePage() {
  const supabase = createClient()
  const { toast } = useToast()
  
  const [userId, setUserId] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('')
  const [badges, setBadges] = useState<any[]>([])
  
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [savingSection, setSavingSection] = useState<Record<string, boolean>>({})
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [timezoneList, setTimezoneList] = useState<string[]>(defaultTimezones)

  useEffect(() => {
    if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
      try {
        const tzs = Intl.supportedValuesOf('timeZone')
        if (tzs && tzs.length > 0) {
          setTimezoneList(tzs)
        }
      } catch (err) {
        console.warn('Intl.supportedValuesOf is not supported or failed:', err)
      }
    }
  }, [])

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

  const portfolioSocialForm = useForm({
    resolver: zodResolver(portfolioSocialSchema),
    defaultValues: {
      linkedin_url: '',
      twitter_url: '',
      instagram_url: '',
      facebook_url: '',
      portfolio_public: true
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

            portfolioSocialForm.reset({
              linkedin_url: profile.linkedin_url || '',
              twitter_url: profile.twitter_url || '',
              instagram_url: profile.instagram_url || '',
              facebook_url: profile.facebook_url || '',
              portfolio_public: profile.portfolio_public ?? true,
            })
          }

          // Fetch badges
          const { data: badgeData } = await supabase
            .from('user_badges')
            .select('*')
            .eq('user_id', user.id)
            .order('earned_at', { ascending: false })
            
          if (badgeData) {
            setBadges(badgeData)
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

  const onSavePortfolioSocial = async (values: z.infer<typeof portfolioSocialSchema>) => {
    if (!userId) return
    setSavingSection(prev => ({ ...prev, portfolioSocial: true }))
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          linkedin_url: values.linkedin_url || null,
          twitter_url: values.twitter_url || null,
          instagram_url: values.instagram_url || null,
          facebook_url: values.facebook_url || null,
          portfolio_public: values.portfolio_public
        })
        .eq('id', userId)

      if (error) throw error
      toast('Portfolio and social links saved successfully!')
    } catch (err) {
      console.error(err)
      toast('Failed to save portfolio settings', 'error')
    } finally {
      setSavingSection(prev => ({ ...prev, portfolioSocial: false }))
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
                  {timezoneList.map(tz => (
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

      {/* SECTION 1.5 — MY BADGES */}
      <div className="rounded-[10px] border border-border bg-surface p-6 shadow-md space-y-6">
        <div className="flex items-center space-x-2 text-primary border-b border-border pb-3">
          <Award className="h-5 w-5" strokeWidth={1.5} />
          <h2 className="font-heading text-xl font-bold text-text-1">My Badges</h2>
        </div>

        {/* Badge Grid */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-1">Badges Overview</h3>
          <div className="flex flex-wrap gap-4 p-4 rounded-md bg-surface-alt/20 border border-border/40 justify-center sm:justify-start">
            {ALL_BADGES.map((item) => {
              const isEarned = badges.some((b) => b.badge_key === item.key)
              return (
                <div key={item.key} className="flex flex-col items-center gap-1.5 w-16">
                  {isEarned ? (
                    <div 
                      className="relative w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shadow-[0_0_12px_rgba(91,142,255,0.15)] transition-transform hover:scale-105 duration-200 cursor-help"
                      title={`${item.label} (Earned): ${item.description}`}
                    >
                      <span className="text-xl">{item.emoji}</span>
                    </div>
                  ) : (
                    <div 
                      className="relative w-12 h-12 rounded-full bg-surface-alt border border-border flex items-center justify-center filter grayscale opacity-35 hover:opacity-60 transition-all duration-200 cursor-help"
                      title={`${item.label} (Locked): ${item.description}`}
                    >
                      <span className="text-xl">{item.emoji}</span>
                      <div className="absolute -bottom-0.5 -right-0.5 bg-surface border border-border rounded-full p-0.5 text-text-3">
                        <Lock className="w-2.5 h-2.5" />
                      </div>
                    </div>
                  )}
                  <span className="text-[10px] font-semibold text-text-2 text-center truncate w-full" title={item.label}>
                    {item.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Earned Badges Details */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-1">Earned Details</h3>
          {badges.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {badges.map((badge) => {
                const dateString = new Date(badge.earned_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })
                const desc = ALL_BADGES.find(ab => ab.key === badge.badge_key)?.description || ''
                
                return (
                  <div 
                    key={badge.id} 
                    className="flex items-center gap-4 p-4 rounded-md border border-border/80 bg-surface-alt/30 hover:border-primary/20 transition-all duration-200"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/5 border border-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-2xl">{badge.badge_emoji}</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-text-1">{badge.badge_label}</span>
                      <span className="text-xs text-text-2 mt-0.5">{desc}</span>
                      <span className="text-[10px] text-text-3 mt-1.5 font-medium uppercase tracking-wider">
                        {badge.subject} · {dateString}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 px-4 rounded-md bg-surface-alt/10 border border-dashed border-border flex flex-col items-center justify-center">
              <Award className="h-8 w-8 text-text-3 mb-2 animate-bounce" />
              <p className="text-xs font-semibold text-text-2">No badges earned yet</p>
              <p className="text-[11px] text-text-3 mt-0.5">Complete lessons and ace quizzes to earn your first badge!</p>
            </div>
          )}
        </div>
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
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
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

      {/* SECTION 5 — PORTFOLIO & SOCIAL LINKS */}
      <div className="rounded-[10px] border border-border bg-surface p-6 shadow-md space-y-6">
        <div className="flex items-center space-x-2 text-primary border-b border-border pb-3">
          <Share2 className="h-5 w-5" strokeWidth={1.5} />
          <h2 className="font-heading text-xl font-bold text-text-1">Portfolio & Social Links</h2>
        </div>

        <form onSubmit={portfolioSocialForm.handleSubmit(onSavePortfolioSocial)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* LinkedIn */}
            <div className="space-y-1.5">
              <Label htmlFor="linkedin_url" className="flex items-center gap-1.5">
                <LinkedinIcon className="h-4 w-4 text-text-3" />
                <span>LinkedIn Profile URL</span>
              </Label>
              <Input 
                id="linkedin_url" 
                placeholder="https://linkedin.com/in/username"
                {...portfolioSocialForm.register('linkedin_url')} 
              />
              {portfolioSocialForm.formState.errors.linkedin_url && (
                <p className="text-xs text-error mt-0.5">{portfolioSocialForm.formState.errors.linkedin_url.message}</p>
              )}
            </div>

            {/* Twitter/X */}
            <div className="space-y-1.5">
              <Label htmlFor="twitter_url" className="flex items-center gap-1.5">
                <TwitterIcon className="h-4 w-4 text-text-3" />
                <span>Twitter / X Profile URL</span>
              </Label>
              <Input 
                id="twitter_url" 
                placeholder="https://x.com/username"
                {...portfolioSocialForm.register('twitter_url')} 
              />
              {portfolioSocialForm.formState.errors.twitter_url && (
                <p className="text-xs text-error mt-0.5">{portfolioSocialForm.formState.errors.twitter_url.message}</p>
              )}
            </div>

            {/* Instagram */}
            <div className="space-y-1.5">
              <Label htmlFor="instagram_url" className="flex items-center gap-1.5">
                <InstagramIcon className="h-4 w-4 text-text-3" />
                <span>Instagram Profile URL</span>
              </Label>
              <Input 
                id="instagram_url" 
                placeholder="https://instagram.com/username"
                {...portfolioSocialForm.register('instagram_url')} 
              />
              {portfolioSocialForm.formState.errors.instagram_url && (
                <p className="text-xs text-error mt-0.5">{portfolioSocialForm.formState.errors.instagram_url.message}</p>
              )}
            </div>

            {/* Facebook */}
            <div className="space-y-1.5">
              <Label htmlFor="facebook_url" className="flex items-center gap-1.5">
                <FacebookIcon className="h-4 w-4 text-text-3" />
                <span>Facebook Profile URL</span>
              </Label>
              <Input 
                id="facebook_url" 
                placeholder="https://facebook.com/username"
                {...portfolioSocialForm.register('facebook_url')} 
              />
              {portfolioSocialForm.formState.errors.facebook_url && (
                <p className="text-xs text-error mt-0.5">{portfolioSocialForm.formState.errors.facebook_url.message}</p>
              )}
            </div>
          </div>

          <div className="h-px bg-border/50" />

          {/* Visibility Toggle */}
          <div className="flex items-center justify-between p-4 rounded-md bg-surface-alt/30 border border-border/30">
            <div>
              <h3 className="text-sm font-semibold text-text-1">Public Portfolio Shareable Link</h3>
              <p className="text-xs text-text-2">Allow anyone with the link to view your verified learning progress and badges.</p>
            </div>
            <Controller
              name="portfolio_public"
              control={portfolioSocialForm.control}
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

          <div className="flex justify-end pt-2 border-t border-border">
            <Button type="submit" disabled={savingSection['portfolioSocial']} className="flex items-center gap-1.5">
              {savingSection['portfolioSocial'] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Portfolio Settings
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
