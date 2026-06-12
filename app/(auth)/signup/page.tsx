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

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

type SignupFormValues = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: SignupFormValues) {
    setIsLoading(true)
    setErrorMsg(null)

    // TODO: WHEN GOING LIVE (PROD LAUNCH CHECKLIST):
    // 1. Connect custom SMTP provider (e.g. Resend) in Supabase Dashboard.
    // 2. Re-enable email confirmation (Authentication -> Email -> Enable email confirmations).
    // 3. Add the email verification screen / success message screen back to the signup flow.
    // 4. Update sender to a professional domain (e.g. hello@cognara.com or noreply@cognara.com).

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
        // Direct redirect to onboarding (no email verification barrier in dev)
        router.push('/onboarding')
        router.refresh()
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
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
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            disabled={isLoading}
            className="h-10 border-border bg-surface-alt text-text-1 placeholder-text-3 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-error mt-0.5">{errors.password.message}</p>
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
