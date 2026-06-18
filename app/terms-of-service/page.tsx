import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service — Cognara',
  description: 'Read the Terms of Service governing your use of the Cognara AI learning platform.',
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-bg text-text-1">
      {/* Header */}
      <header className="border-b border-border bg-surface sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-heading text-xl font-bold text-text-1 hover:text-primary transition-colors duration-150">
            ← Cognara
          </Link>
          <span className="text-xs text-text-3 uppercase tracking-widest font-medium">Terms of Service</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="mb-14 space-y-4">
          <div className="inline-block px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold uppercase tracking-wider">
            Legal
          </div>
          <h1 className="font-heading text-4xl font-bold text-text-1">Terms of Service</h1>
          <p className="text-text-2 text-sm">
            Last updated: <strong className="text-text-1">June 18, 2025</strong>
          </p>
          <p className="text-text-2 leading-relaxed max-w-2xl">
            These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Cognara platform. By creating an account or using our services, you agree to these Terms. Please read them carefully.
          </p>
        </div>

        <div className="space-y-12">
          <Section title="1. Acceptance of Terms">
            <p>
              By accessing or using Cognara at <a href="https://www.cognaralearn.com" className="text-primary hover:underline">www.cognaralearn.com</a>, you confirm that you are at least 13 years old, have read and understood these Terms, and agree to be bound by them.
            </p>
            <p>
              If you are accessing Cognara on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p>
              Cognara is an AI-powered personalized learning platform that provides:
            </p>
            <ul>
              <li>Dynamically generated learning roadmaps tailored to your goals</li>
              <li>AI-generated lessons and educational content</li>
              <li>Personalized quizzes and knowledge assessments</li>
              <li>Progress tracking, streaks, and achievement badges</li>
              <li>Certificates of completion for learning milestones</li>
              <li>A public learning portfolio to showcase your achievements</li>
            </ul>
            <p>
              Content on the platform is generated using artificial intelligence. While we strive for accuracy, AI-generated content may occasionally contain errors. We encourage learners to verify critical information with authoritative sources.
            </p>
          </Section>

          <Section title="3. User Accounts">
            <SubHeading>3.1 Registration</SubHeading>
            <p>
              To use Cognara, you must create an account with a valid email address or sign in through Google OAuth. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.
            </p>
            <SubHeading>3.2 Account Security</SubHeading>
            <p>
              You must notify us immediately at <a href="mailto:support@cognaralearn.com" className="text-primary hover:underline">support@cognaralearn.com</a> if you suspect any unauthorized use of your account. We are not liable for any loss resulting from unauthorized account access caused by your failure to protect your credentials.
            </p>
            <SubHeading>3.3 Accurate Information</SubHeading>
            <p>
              You agree to provide accurate, current, and complete information when creating your account and to update it as necessary.
            </p>
          </Section>

          <Section title="4. Acceptable Use">
            <p>You agree to use Cognara only for lawful purposes and in a manner consistent with these Terms. You must <strong>not</strong>:</p>
            <ul>
              <li>Use the platform for any fraudulent, harmful, or illegal activity.</li>
              <li>Attempt to reverse-engineer, scrape, or extract our AI models or content generation systems.</li>
              <li>Interfere with or disrupt the platform&apos;s servers, networks, or security measures.</li>
              <li>Share your account credentials with others or allow multiple people to use a single account.</li>
              <li>Create multiple free accounts to circumvent plan limitations.</li>
              <li>Use automated tools, bots, or scripts to interact with the platform without our prior written consent.</li>
              <li>Upload or transmit any malicious code, viruses, or harmful content.</li>
              <li>Attempt to impersonate Cognara staff or other users.</li>
            </ul>
          </Section>

          <Section title="5. Subscription Plans & Payments">
            <SubHeading>5.1 Free Plan</SubHeading>
            <p>
              Cognara offers a free tier that gives access to a limited number of learning roadmaps and lessons. Free plan limits may change at our discretion.
            </p>
            <SubHeading>5.2 Pro Plan</SubHeading>
            <p>
              The Cognara Pro plan provides unlimited roadmaps, lessons, and advanced features for a recurring monthly or annual subscription fee. Payments are processed securely by <strong>LemonSqueezy</strong>. We do not store your payment card details.
            </p>
            <SubHeading>5.3 Billing & Cancellation</SubHeading>
            <p>
              Subscriptions automatically renew at the end of each billing period. You may cancel your subscription at any time from your account settings. Cancellation takes effect at the end of the current billing period — you will retain Pro access until then.
            </p>
            <SubHeading>5.4 Refunds</SubHeading>
            <p>
              We offer a <strong>7-day money-back guarantee</strong> for first-time Pro subscribers. After 7 days, payments are non-refundable unless required by applicable law. To request a refund, contact <a href="mailto:support@cognaralearn.com" className="text-primary hover:underline">support@cognaralearn.com</a>.
            </p>
          </Section>

          <Section title="6. Intellectual Property">
            <SubHeading>6.1 Our Content</SubHeading>
            <p>
              The Cognara platform, including its design, code, branding, AI systems, and generated content, is owned by Cognara and protected by applicable intellectual property laws. You may not copy, modify, distribute, or create derivative works from our platform or content without explicit written permission.
            </p>
            <SubHeading>6.2 Your Content</SubHeading>
            <p>
              Any notes, goals, or profile information you add to Cognara remain yours. By submitting this content, you grant Cognara a limited, worldwide, royalty-free license to store and display it as necessary to provide the service.
            </p>
            <SubHeading>6.3 AI-Generated Learning Content</SubHeading>
            <p>
              Lessons and quizzes generated on your behalf by our AI are for your personal educational use only. You may not redistribute or sell this content commercially.
            </p>
          </Section>

          <Section title="7. Certificates">
            <p>
              Cognara issues digital completion certificates to users who finish a learning roadmap. These certificates are for personal and educational portfolio use only. They do not represent a professional qualification, accreditation, or formal academic credential recognized by third-party institutions.
            </p>
          </Section>

          <Section title="8. Disclaimers">
            <p>
              The Cognara platform and all AI-generated content are provided &quot;<strong>as is</strong>&quot; and &quot;<strong>as available</strong>&quot; without warranties of any kind, either express or implied. We do not warrant that:
            </p>
            <ul>
              <li>The platform will be uninterrupted, error-free, or secure at all times.</li>
              <li>AI-generated lesson or quiz content is always accurate, complete, or up to date.</li>
              <li>Results from using the platform will meet your specific learning expectations.</li>
            </ul>
            <p>
              Use of AI-generated educational content is at your own discretion. Cognara is not a substitute for professional, medical, legal, or financial advice.
            </p>
          </Section>

          <Section title="9. Limitation of Liability">
            <p>
              To the maximum extent permitted by law, Cognara and its team will not be liable for any indirect, incidental, special, consequential, or punitive damages — including loss of data, revenue, or business — arising out of or in connection with your use of the platform, even if we have been advised of the possibility of such damages.
            </p>
            <p>
              In no event shall Cognara&apos;s total liability to you exceed the amount you paid to us in the twelve (12) months prior to the claim.
            </p>
          </Section>

          <Section title="10. Termination">
            <p>
              We reserve the right to suspend or terminate your account at our discretion if you violate these Terms, engage in fraudulent activity, or abuse our platform. We will make reasonable efforts to notify you before termination, unless immediate action is required.
            </p>
            <p>
              You may delete your account at any time from your Profile settings or by contacting us. Upon deletion, your data will be removed within 30 days in accordance with our Privacy Policy.
            </p>
          </Section>

          <Section title="11. Modifications to Terms">
            <p>
              We may update these Terms from time to time. When we do, we will update the &quot;Last updated&quot; date and, for material changes, notify you via email or an in-app notification. Continued use of Cognara after changes take effect constitutes your acceptance of the updated Terms.
            </p>
          </Section>

          <Section title="12. Governing Law">
            <p>
              These Terms are governed by and construed in accordance with applicable law. Any disputes arising from these Terms or your use of Cognara shall be resolved through good-faith negotiation first. If that fails, disputes shall be submitted to binding arbitration or the relevant courts of jurisdiction.
            </p>
          </Section>

          <Section title="13. Contact Us">
            <p>
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="mt-3 p-4 rounded-lg bg-surface border border-border">
              <p className="text-text-1 font-semibold">Cognara Support</p>
              <p>Email: <a href="mailto:support@cognaralearn.com" className="text-primary hover:underline">support@cognaralearn.com</a></p>
              <p>Website: <a href="https://www.cognaralearn.com" className="text-primary hover:underline">www.cognaralearn.com</a></p>
            </div>
          </Section>
        </div>

        {/* Footer Links */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row gap-3 justify-between items-center text-sm text-text-3">
          <p>© {new Date().getFullYear()} Cognara. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
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
      <h2 className="font-heading text-xl font-semibold text-text-1 border-l-2 border-accent pl-4">
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
