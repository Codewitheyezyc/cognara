'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/ui/Logo'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  async function onSubmit(data: ForgotPasswordFormValues) {
    setIsLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      })

      if (error) {
        setErrorMsg(error.message)
      } else {
        setSuccessMsg('If this email exists, a reset link has been sent')
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
        <h2 className="mt-4 font-heading text-xl font-semibold text-text-1">Reset your password</h2>
        <p className="text-sm text-text-2 mt-1">
          Enter your email address and we will send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        {errorMsg && (
          <div className="rounded-md bg-error/10 p-3 text-sm text-error border border-error/20">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="rounded-md bg-success/10 p-3 text-sm text-success border border-success/20">
            {successMsg}
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="email" className="text-xs font-medium text-text-2 uppercase tracking-wider">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            disabled={isLoading || !!successMsg}
            className="h-10 border-border bg-surface-alt text-text-1 placeholder-text-3 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-error mt-0.5">{errors.email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading || !!successMsg}
          variant="default"
          className="w-full mt-6 shadow-[0_0_16px_rgba(91,142,255,0.2)] transition duration-150"
        >
          {isLoading ? 'Sending reset link...' : 'Send reset link'}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-text-2">
        Remember your password?{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  )
}
