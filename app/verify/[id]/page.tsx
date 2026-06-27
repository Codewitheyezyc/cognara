import React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Logo } from '@/components/ui/Logo'
import { VerifyPageClient } from '../VerifyPageClient'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

interface VerifyPageProps {
  params: Promise<{ id: string }>
}

// Fetch user's first name helper
async function getFirstName(userId: string): Promise<string> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .maybeSingle()
    return data?.name?.split(' ')[0] || 'Learner'
  } catch {
    return 'Learner'
  }
}

// Generate Server-Side dynamic metadata for search engines & previews
export async function generateMetadata({ params }: VerifyPageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: cert } = await supabase
    .from('cognara_certificates')
    .select('*')
    .eq('certificate_id', id)
    .maybeSingle()

  if (!cert) {
    return {
      title: 'Certificate Not Found — Cognara',
      description: 'The specified certificate could not be verified.',
      robots: 'noindex, nofollow'
    }
  }

  const firstName = await getFirstName(cert.user_id)

  return {
    title: `${firstName}'s Cognara Certificate — ${cert.phase_name} · ${cert.goal_name}`,
    description: `${firstName} completed the ${cert.phase_name} phase of the ${cert.goal_name} roadmap on Cognara — the AI achievement platform that builds your personalised learning path and keeps you accountable.`,
    openGraph: {
      title: `${firstName} earned a Cognara certificate`,
      description: `${cert.goal_name} · ${cert.phase_name} · Completed ${new Date(cert.issued_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })}`,
      url: `https://www.cognaralearn.com/verify/${id}`,
      siteName: 'Cognara',
      images: [
        {
          url: cert.certificate_url_png,
          width: 1200,
          height: 850,
          alt: `${firstName}'s Certificate of Completion`
        }
      ],
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: `${firstName} earned a Cognara certificate`,
      description: `${cert.goal_name} · ${cert.phase_name}`,
      images: [cert.certificate_url_png]
    }
  }
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Fetch certificate from database
  const { data: cert } = await supabase
    .from('cognara_certificates')
    .select('*')
    .eq('certificate_id', id)
    .maybeSingle()

  // 2. Fetch total learners count dynamically
  let learnersCount = 41
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    if (!error && count !== null) {
      learnersCount = count
    }
  } catch (err) {
    console.error('Failed to fetch learners count on verify page:', err)
  }

  // State 2: Certificate ID not found
  if (!cert) {
    return (
      <div className="min-h-screen bg-bg text-text-1 overflow-x-hidden flex flex-col items-center justify-center p-6 select-none relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-rose-500/5 to-primary/5 blur-[120px] opacity-40" />
        </div>

        <div className="relative z-10 max-w-sm w-full text-center space-y-8 flex flex-col items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 cursor-pointer hover:opacity-90">
            <Logo className="h-6 w-6" />
            <span className="font-heading text-xl font-bold tracking-tight text-text-1">Cognara</span>
          </Link>

          {/* Error Indicator */}
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 text-2xl font-bold mx-auto">
              ✗
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-text-1">
              Certificate Not Found
            </h2>
            <p className="text-xs sm:text-sm text-text-2 leading-relaxed font-semibold">
              This certificate ID does not match any record in our system.<br /><br />
              If you believe this is an error, please contact us at{' '}
              <a href="mailto:hello@cognaralearn.com" className="text-primary hover:underline">
                hello@cognaralearn.com
              </a>{' '}
              with the certificate ID.
            </p>
          </div>

          <Link href="/" className="w-full">
            <Button
              variant="outline"
              className="w-full h-12 border border-border hover:bg-surface-alt text-text-1 font-bold rounded-xl text-xs"
            >
              Go to Cognara →
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Fetch certificate recipient's name details
  const { data: recProfile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', cert.user_id)
    .maybeSingle()

  const fullName = recProfile?.name || 'Learner'
  const nameParts = fullName.trim().split(' ')
  const firstName = nameParts[0] || 'Learner'
  const lastNameInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1][0].toUpperCase() : 'C'

  // Structured Data (JSON-LD)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalCredential",
    "name": `${cert.phase_name} — ${cert.goal_name}`,
    "description": `Certificate of completion for ${cert.phase_name} of the ${cert.goal_name} learning roadmap`,
    "credentialCategory": "Certificate",
    "recognizedBy": {
      "@type": "Organization",
      "name": "Cognara",
      "url": "https://cognaralearn.com"
    },
    "dateCreated": cert.issued_at,
    "url": `https://www.cognaralearn.com/verify/${id}`
  }

  // State 1: Certificate is authentic and verified
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <VerifyPageClient
        certificateId={id}
        pngUrl={cert.certificate_url_png}
        pdfUrl={cert.certificate_url_pdf}
        firstName={firstName}
        lastNameInitial={lastNameInitial}
        goalName={cert.goal_name}
        phaseName={cert.phase_name}
        topicsCovered={cert.topics_covered || []}
        issuedAt={cert.issued_at}
        learnersCount={learnersCount}
      />
    </>
  )
}
