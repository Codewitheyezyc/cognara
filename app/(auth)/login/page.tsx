import { Metadata } from 'next'
import { LoginPageClient } from '@/components/auth/LoginPageClient'

export const metadata: Metadata = {
  title: "Log in — Cognara",
  description: "Log in to Cognara and continue your personalised learning journey.",
  robots: {
    index: false,
    follow: false,
  }
}

export default function LoginPage() {
  return <LoginPageClient />
}
