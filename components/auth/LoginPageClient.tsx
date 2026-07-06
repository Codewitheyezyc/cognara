'use client'

import { useState, useEffect } from 'react'
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
import { Eye, EyeOff } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPageClient() {
  const router = useRouter()
  const supabase = createClient()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then((res: any) => {
      if (res.data?.session) {
        router.push('/dashboard')
      } else {
        setCheckingAuth(false)
      }
    })
  }, [supabase, router])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true)
    setErrorMsg(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        setErrorMsg(error.message)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true)
    setErrorMsg(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setErrorMsg(error.message)
        setIsGoogleLoading(false)
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred with Google Sign-In.')
      setIsGoogleLoading(false)
      console.error(err)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center space-y-4 text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-text-3 font-mono">Verifying authentication status...</span>
      </div>
    )
  }

  const isAnyLoading = isLoading || isGoogleLoading

  return (
    <div className="rounded-[10px] border border-border bg-surface p-8 shadow-lg">
      <div className="flex flex-col items-center space-y-2 text-center">
        <div className="flex items-center space-x-2">
          <Logo className="h-6 w-6" />
          <span className="font-heading text-2xl font-bold tracking-tight text-text-1">Cognara</span>
        </div>
        <p className="text-sm text-text-2">Simple daily plans to help you learn.</p>
        <h2 className="mt-4 font-heading text-xl font-semibold text-text-1">Sign in to your account</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        {errorMsg && (
          <div className="rounded-md bg-error/10 p-3 text-sm text-error border border-error/20">
            {errorMsg}
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
            disabled={isAnyLoading}
            className="h-10 border-border bg-surface-alt text-text-1 placeholder-text-3 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-error mt-0.5">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-medium text-text-2 uppercase tracking-wider">
              Password
            </Label>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              disabled={isAnyLoading}
              className="h-10 pr-10 border-border bg-surface-alt text-text-1 placeholder-text-3 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isAnyLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-2 transition duration-150 cursor-pointer disabled:opacity-50"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline transition duration-150">
              Forgot password?
            </Link>
          </div>
          {errors.password && (
            <p className="text-xs text-error mt-0.5">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isAnyLoading}
          variant="default"
          className="w-full mt-6 shadow-[0_0_16px_rgba(91,142,255,0.2)] transition duration-150"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/80"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-surface px-2 text-text-3">Or continue with</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center justify-center gap-2 h-10 border-border bg-surface-alt hover:bg-surface-alt/80 text-text-1 cursor-pointer transition duration-150"
        disabled={isAnyLoading}
        onClick={handleGoogleSignIn}
      >
        {isGoogleLoading ? (
          <span className="text-sm">Connecting to Google...</span>
        ) : (
          <>
            <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.46c0,-0.64 -0.06,-1.27 -0.16,-1.92z" fill="#4285F4" />
              <path d="M12,20.6c2.59,0 4.77,-0.86 6.36,-2.33l-3.3,-2.58c-0.91,0.61 -2.08,0.98 -3.06,0.98c-2.49,0 -4.6,-1.69 -5.35,-3.97l-3.41,2.64c1.69,3.35 5.16,5.63 8.76,5.63z" fill="#34A853" />
              <path d="M6.65,12.7c-0.14,-0.42 -0.22,-0.87 -0.22,-1.33c0,-0.46 0.08,-0.91 0.22,-1.33L3.24,7.4C2.45,8.98 2,10.74 2,12.6c0,1.86 0.45,3.62 1.24,5.2l3.41,-2.64c-0.14,-0.42 -0.22,-0.87 -0.22,-1.33z" fill="#FBBC05" />
              <path d="M12,4.6c1.41,0 2.68,0.49 3.68,1.44l2.76,-2.76C16.77,1.88 14.59,1 12,1c-3.6,0 -7.07,2.28 -8.76,5.63l3.41,2.64c0.75,-2.28 2.86,-3.97 5.35,-3.97z" fill="#EA4335" />
            </svg>
            Google
          </>
        )}
      </Button>

      <div className="mt-6 text-center text-sm text-text-2">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-semibold text-primary hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  )
}
