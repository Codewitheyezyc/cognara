'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/ui/Logo'
import { Eye, EyeOff, Check, X, Mail } from 'lucide-react'

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
})

type SignupFormValues = z.infer<typeof signupSchema>

interface PasswordScore {
  score: number
  label: 'Weak' | 'Fair' | 'Good' | 'Strong'
  color: string
  checks: {
    length: boolean
    hasUppercase: boolean
    hasLowercase: boolean
    hasNumber: boolean
    hasSpecial: boolean
  }
}

function getPasswordStrength(password: string): PasswordScore {
  const checks = {
    length: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  }

  let score = 0
  if (checks.length) score++
  if (checks.hasUppercase && checks.hasLowercase) score++
  if (checks.hasNumber) score++
  if (checks.hasSpecial) score++

  let label: 'Weak' | 'Fair' | 'Good' | 'Strong' = 'Weak'
  let color = '#F87171' // Red

  switch (score) {
    case 0:
    case 1:
      label = 'Weak'
      color = '#F87171'
      break
    case 2:
      label = 'Fair'
      color = '#FB923C'
      break
    case 3:
      label = 'Good'
      color = '#F59E0B'
      break
    case 4:
      label = 'Strong'
      color = '#34D399'
      break
  }

  return { score, label, color, checks }
}

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const passwordValue = watch('password', '')
  const strength = getPasswordStrength(passwordValue)

  async function onSubmit(data: SignupFormValues) {
    setIsLoading(true)
    setErrorMsg(null)

    try {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setErrorMsg(error.message)
      } else if (signUpData?.user) {
        // If email confirmation is enabled, session will be null.
        // We show the "check your email" view.
        if (!signUpData.session) {
          setUserEmail(data.email)
          setIsSubmitted(true)
        } else {
          // If confirmations are disabled (e.g. dev settings), redirect to onboarding
          router.push('/onboarding')
          router.refresh()
        }
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="rounded-[10px] border border-border bg-surface p-8 shadow-lg max-w-md w-full animate-page-enter flex flex-col items-center text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary animate-pulse">
          <Mail size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-bold text-text-1">Verify your email</h2>
          <p className="text-sm text-text-2">
            We sent a confirmation link to <strong className="text-text-1">{userEmail}</strong>.
          </p>
          <p className="text-xs text-text-3 mt-4 leading-relaxed">
            Please check your inbox (and spam folder) and click the link to activate your account and begin your learning path.
          </p>
        </div>
        <div className="w-full pt-4 border-t border-border/50">
          <Button 
            variant="outline" 
            className="w-full hover:bg-surface-alt text-xs font-bold"
            onClick={() => {
              setIsSubmitted(false)
              setErrorMsg(null)
            }}
          >
            Back to sign up
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-[10px] border border-border bg-surface p-8 shadow-lg">
      <div className="flex flex-col items-center space-y-2 text-center">
        <div className="flex items-center space-x-2">
          <Logo className="h-6 w-6" />
          <span className="font-heading text-2xl font-bold tracking-tight text-text-1">Cognara</span>
        </div>
        <p className="text-sm text-text-2">Your mind. Your path. Your era.</p>
        <h2 className="mt-4 font-heading text-xl font-semibold text-text-1">Create an account</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        {errorMsg && (
          <div className="rounded-md bg-error/10 p-3 text-sm text-error border border-error/20">
            {errorMsg}
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="name" className="text-xs font-medium text-text-2 uppercase tracking-wider">
            Full Name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            disabled={isLoading}
            className="h-10 border-border bg-surface-alt text-text-1 placeholder-text-3 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm"
            {...register('name')}
          />
          {errors.name && (
            <p className="text-xs text-error mt-0.5">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="email" className="text-xs font-medium text-text-2 uppercase tracking-wider">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            disabled={isLoading}
            className="h-10 border-border bg-surface-alt text-text-1 placeholder-text-3 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-error mt-0.5">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="password" className="text-xs font-medium text-text-2 uppercase tracking-wider">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              disabled={isLoading}
              className="h-10 pr-10 border-border bg-surface-alt text-text-1 placeholder-text-3 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-2 transition duration-150 cursor-pointer"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-error mt-0.5">{errors.password.message}</p>
          )}

          {/* Password Strength Meter */}
          {passwordValue.length > 0 && (
            <div className="space-y-2 mt-2 bg-surface-alt/40 border border-border/40 p-3 rounded-md">
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-2">Strength:</span>
                <span style={{ color: strength.color }} className="font-bold uppercase tracking-wider text-[10px]">{strength.label}</span>
              </div>
              
              {/* Colored Segments */}
              <div className="flex gap-1 h-1.5 w-full bg-border rounded-full overflow-hidden">
                {[1, 2, 3, 4].map((seg) => (
                  <div
                    key={seg}
                    className="h-full flex-1 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: seg <= strength.score ? strength.color : 'transparent'
                    }}
                  />
                ))}
              </div>

              {/* Requirement Checklist */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-1.5 text-[10px] text-text-2">
                <div className="flex items-center gap-1">
                  {strength.checks.length ? (
                    <Check className="h-3 w-3 text-success shrink-0" />
                  ) : (
                    <X className="h-3 w-3 text-text-3 shrink-0" />
                  )}
                  <span className={strength.checks.length ? 'text-success' : 'text-text-3'}>8+ Characters</span>
                </div>
                <div className="flex items-center gap-1">
                  {strength.checks.hasUppercase && strength.checks.hasLowercase ? (
                    <Check className="h-3 w-3 text-success shrink-0" />
                  ) : (
                    <X className="h-3 w-3 text-text-3 shrink-0" />
                  )}
                  <span className={strength.checks.hasUppercase && strength.checks.hasLowercase ? 'text-success' : 'text-text-3'}>A-Z and a-z</span>
                </div>
                <div className="flex items-center gap-1">
                  {strength.checks.hasNumber ? (
                    <Check className="h-3 w-3 text-success shrink-0" />
                  ) : (
                    <X className="h-3 w-3 text-text-3 shrink-0" />
                  )}
                  <span className={strength.checks.hasNumber ? 'text-success' : 'text-text-3'}>At least one number</span>
                </div>
                <div className="flex items-center gap-1">
                  {strength.checks.hasSpecial ? (
                    <Check className="h-3 w-3 text-success shrink-0" />
                  ) : (
                    <X className="h-3 w-3 text-text-3 shrink-0" />
                  )}
                  <span className={strength.checks.hasSpecial ? 'text-success' : 'text-text-3'}>Special character</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="confirmPassword" className="text-xs font-medium text-text-2 uppercase tracking-wider">
            Confirm Password
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              disabled={isLoading}
              className="h-10 pr-10 border-border bg-surface-alt text-text-1 placeholder-text-3 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm"
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-2 transition duration-150 cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-error mt-0.5">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          variant="default"
          className="w-full mt-6 shadow-[0_0_16px_rgba(91,142,255,0.2)] transition duration-150"
        >
          {isLoading ? 'Creating account...' : 'Start Learning Free'}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-text-2">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  )
}
