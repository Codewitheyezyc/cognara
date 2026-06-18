import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — Cognara',
  description: 'Learn how Cognara collects, uses, and protects your personal data.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-bg text-text-1">
      {/* Header */}
      <header className="border-b border-border bg-surface sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-heading text-xl font-bold text-text-1 hover:text-primary transition-colors duration-150">
            ← Cognara
          </Link>
          <span className="text-xs text-text-3 uppercase tracking-widest font-medium">Privacy Policy</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="mb-14 space-y-4">
          <div className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
            Legal
          </div>
          <h1 className="font-heading text-4xl font-bold text-text-1">Privacy Policy</h1>
          <p className="text-text-2 text-sm">
            Last updated: <strong className="text-text-1">June 18, 2025</strong>
          </p>
          <p className="text-text-2 leading-relaxed max-w-2xl">
            At Cognara, your privacy is a priority. This policy explains what information we collect, how we use it, and the choices you have about your data. Please read it carefully.
          </p>
        </div>

        <div className="space-y-12">
          <Section title="1. Who We Are">
            <p>
              Cognara (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is an AI-powered personalized learning platform available at{' '}
              <a href="https://www.cognaralearn.com" className="text-primary hover:underline">www.cognaralearn.com</a>.
              We help learners build knowledge through dynamic roadmaps, AI-generated lessons, and quizzes tailored to their goals.
            </p>
            <p>
              If you have any questions about this policy, contact us at: <a href="mailto:privacy@cognaralearn.com" className="text-primary hover:underline">privacy@cognaralearn.com</a>
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <p>We collect the following categories of information to provide and improve our services:</p>
            <SubHeading>2.1 Information you provide directly</SubHeading>
            <ul>
              <li><strong>Account Information:</strong> Your name and email address when you sign up via email or Google OAuth.</li>
              <li><strong>Profile Information:</strong> Any optional information you add to your profile, including social media handles.</li>
              <li><strong>Learning Preferences:</strong> Your selected learning goals, subjects, and depth levels during onboarding.</li>
            </ul>
            <SubHeading>2.2 Information collected automatically</SubHeading>
            <ul>
              <li><strong>Usage Data:</strong> Pages visited, lessons completed, quiz scores, and learning streaks.</li>
              <li><strong>Device & Browser Data:</strong> Browser type, operating system, and approximate location based on IP address.</li>
              <li><strong>Log Data:</strong> Server logs, error reports, and performance metrics.</li>
            </ul>
            <SubHeading>2.3 Information from third parties</SubHeading>
            <ul>
              <li><strong>Google OAuth:</strong> If you sign in with Google, we receive your name, email, and profile picture from Google as permitted by your Google account settings.</li>
              <li><strong>Payment Processors:</strong> If you subscribe to a Pro plan, payment is handled securely by Paystack. We do not store your card details.</li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Information">
            <p>We use your information to:</p>
            <ul>
              <li>Create and manage your Cognara account.</li>
              <li>Personalize your learning roadmaps, lessons, and quizzes using AI.</li>
              <li>Track your learning progress, streaks, and achievements.</li>
              <li>Send you optional email learning nudges and account notifications.</li>
              <li>Issue certificates of completion tied to your profile.</li>
              <li>Provide customer support and respond to your inquiries.</li>
              <li>Improve, maintain, and secure our platform.</li>
              <li>Process Pro subscription payments.</li>
            </ul>
            <p>We do <strong>not</strong> sell your personal data to third parties.</p>
          </Section>

          <Section title="4. Data Retention">
            <p>
              We retain your account data for as long as your account is active. If you delete your account, we will delete your personal data within <strong>30 days</strong>, except where required by law or legitimate business interests (e.g. financial records).
            </p>
            <p>
              Learning progress data (roadmaps, completed lessons, quiz scores) is deleted immediately when you delete your account.
            </p>
          </Section>

          <Section title="5. Cookies & Tracking">
            <p>
              Cognara uses session-based authentication cookies managed by Supabase to keep you signed in. We do not use advertising cookies or third-party tracking pixels.
            </p>
            <p>
              You can control cookie behavior in your browser settings, but disabling session cookies will prevent you from accessing your account.
            </p>
          </Section>

          <Section title="6. Third-Party Services">
            <p>We use trusted third-party services to operate Cognara:</p>
            <ul>
              <li><strong>Supabase</strong> — Authentication and database (EU region)</li>
              <li><strong>Vercel</strong> — Hosting and edge computing</li>
              <li><strong>Anthropic (Claude AI)</strong> — AI-generated lesson and quiz content</li>
              <li><strong>Resend</strong> — Transactional email delivery</li>
              <li><strong>Paystack</strong> — Subscription payment processing</li>
            </ul>
            <p>Each provider has their own privacy policies. We encourage you to review them.</p>
          </Section>

          <Section title="7. Your Rights">
            <p>Depending on your location, you may have the following rights:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Correction:</strong> Request corrections to inaccurate or incomplete data.</li>
              <li><strong>Deletion:</strong> Request deletion of your account and personal data.</li>
              <li><strong>Portability:</strong> Request your data in a portable format.</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing emails at any time via the link in each email.</li>
            </ul>
            <p>
              To exercise any of these rights, email us at <a href="mailto:privacy@cognaralearn.com" className="text-primary hover:underline">privacy@cognaralearn.com</a>.
            </p>
          </Section>

          <Section title="8. Data Security">
            <p>
              We take the security of your data seriously. We implement industry-standard security measures including encrypted connections (HTTPS/TLS), row-level security policies in our database, and restricted access controls.
            </p>
            <p>
              However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security, but we will promptly notify you of any breach that materially affects your data.
            </p>
          </Section>

          <Section title="9. Children's Privacy">
            <p>
              Cognara is not directed to children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us personal data, please contact us immediately and we will delete it.
            </p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. When we do, we will update the &quot;Last updated&quot; date at the top of this page. We encourage you to review this policy periodically.
            </p>
          </Section>

          <Section title="11. Contact Us">
            <p>
              If you have any questions, concerns, or requests related to this Privacy Policy, please contact us at:
            </p>
            <div className="mt-3 p-4 rounded-lg bg-surface border border-border">
              <p className="text-text-1 font-semibold">Cognara Support</p>
              <p>Email: <a href="mailto:privacy@cognaralearn.com" className="text-primary hover:underline">privacy@cognaralearn.com</a></p>
              <p>Website: <a href="https://www.cognaralearn.com" className="text-primary hover:underline">www.cognaralearn.com</a></p>
            </div>
          </Section>
        </div>

        {/* Footer Links */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row gap-3 justify-between items-center text-sm text-text-3">
          <p>© {new Date().getFullYear()} Cognara. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="/" className="hover:text-primary transition-colors">Back to Home</Link>
          </div>
        </div>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold text-text-1 border-l-2 border-primary pl-4">
        {title}
      </h2>
      <div className="text-text-2 leading-relaxed space-y-3 pl-4 [&_a]:text-primary [&_a:hover]:underline [&_strong]:text-text-1 [&_ul]:space-y-2 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </section>
  )
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-semibold text-text-1 mt-4">{children}</p>
  )
}
