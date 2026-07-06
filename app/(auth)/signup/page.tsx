import { Metadata } from 'next'
import { SignupPageClient } from '@/components/auth/SignupPageClient'

export const metadata: Metadata = {
  title: "Start free — Cognara",
  description: "Create your free account. Tell us your goal and we will build your learning path in under 60 seconds."
}

export default function SignupPage() {
  return <SignupPageClient />
}
