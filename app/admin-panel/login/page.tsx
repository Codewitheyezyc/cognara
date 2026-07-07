'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Shield, Lock, Mail, Loader2, ArrowRight } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success) {
        // Redirect to dashboard
        router.push('/admin-panel/dashboard')
      } else {
        setError(data.error || 'Invalid credentials. Please try again.')
      }
    } catch (err) {
      setError('Something went wrong. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0D13] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-[#A78BFA]/10 blur-[150px] pointer-events-none" />

      <div className="w-full max-w-md animate-page-enter relative z-10">
        <div className="bg-[#121620]/80 border border-border/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 border border-primary/20 rounded-2xl mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-black font-heading tracking-tight text-text-1">
              Cognara <span className="bg-gradient-to-r from-primary to-[#A78BFA] bg-clip-text text-transparent">Admin</span>
            </h1>
            <p className="text-xs text-text-3 font-semibold uppercase tracking-wider mt-1.5">
              Secure Administrative Access
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleAdminLogin} className="space-y-5">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/25 p-4 rounded-2xl text-xs font-bold text-rose-400 animate-pulse">
                ⚠️ {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-2 uppercase tracking-wider block">
                Admin Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-text-3">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0B0D13]/60 border border-border/80 rounded-2xl pl-10 pr-4 py-3 text-sm text-text-1 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-medium placeholder-text-3"
                  placeholder="admin@cognaralearn.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-2 uppercase tracking-wider block">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-text-3">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0B0D13]/60 border border-border/80 rounded-2xl pl-10 pr-4 py-3 text-sm text-text-1 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-medium placeholder-text-3"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full h-12 bg-gradient-to-r from-primary to-[#A78BFA] hover:from-primary/95 hover:to-[#A78BFA]/95 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(91,142,255,0.2)] transition-all duration-200 flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Footer Security Note */}
          <p className="text-[10px] text-text-3 font-semibold text-center leading-relaxed mt-8 uppercase tracking-wider">
            🔒 Restricted Area. Authorized Access Only.
          </p>
        </div>
      </div>
    </div>
  )
}
