'use client'

import React, { useState } from 'react'
import { Send, Loader2, CheckCircle, Mail, Globe, MapPin } from 'lucide-react'
import { LinkedinIcon, TwitterIcon, InstagramIcon } from '@/components/ui/SocialIcons'

export function ContactSection() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.name.trim() || !form.email.trim() || !form.subject || !form.message.trim()) {
      setError('Please fill in all fields')
      return
    }

    if (form.message.trim().length < 20) {
      setError('Please write a longer message (at least 20 characters)')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setSent(true)
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
      }
    } catch (err) {
      console.error('[Contact Form Error]', err)
      setError('Failed to send. Please email us directly at hello@cognaralearn.com')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="contact" className="w-full bg-surface border-y border-border/40 py-20 md:py-28 relative z-10 scroll-mt-24">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-20 items-start">
        
        {/* Left Column — Contact Info */}
        <div className="md:col-span-5 space-y-6 md:space-y-8">
          <div className="space-y-3">
            <span className="text-xs font-mono uppercase text-primary font-bold tracking-wider">
              Contact Us
            </span>
            <h2 className="font-heading text-3xl font-extrabold text-text-1">
              Get in touch
            </h2>
            <p className="text-sm text-text-2 leading-relaxed">
              Have a question before signing up? Want to learn more about team plans? We would love to hear from you. We usually respond within 24 hours.
            </p>
          </div>

          {/* Contact Details */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3.5 text-sm text-text-2">
              <span className="p-2.5 rounded-lg bg-primary/10 text-primary">
                <Mail className="h-4.5 w-4.5" />
              </span>
              <span>hello@cognaralearn.com</span>
            </div>

            <div className="flex items-center gap-3.5 text-sm text-text-2">
              <span className="p-2.5 rounded-lg bg-primary/10 text-primary">
                <Globe className="h-4.5 w-4.5" />
              </span>
              <span>cognaralearn.com</span>
            </div>

            <div className="flex items-center gap-3.5 text-sm text-text-2">
              <span className="p-2.5 rounded-lg bg-primary/10 text-primary">
                <MapPin className="h-4.5 w-4.5" />
              </span>
              <span>Nigeria</span>
            </div>
          </div>

          {/* Social Links */}
          <div className="pt-6 border-t border-border/30">
            <p className="text-xs text-text-3 font-semibold uppercase tracking-wider mb-3">
              Follow Us
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg border border-border/60 text-text-3 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                aria-label="Twitter"
              >
                <TwitterIcon className="h-4 w-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg border border-border/60 text-text-3 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                aria-label="LinkedIn"
              >
                <LinkedinIcon className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg border border-border/60 text-text-3 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                aria-label="Instagram"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Right Column — Contact Form Container */}
        <div className="md:col-span-7 bg-bg border border-border/60 rounded-xl p-6 md:p-8 shadow-xl">
          {sent ? (
            <div className="text-center py-12 space-y-4 animate-page-enter">
              <div className="flex justify-center">
                <CheckCircle className="h-14 w-14 text-success" />
              </div>
              <h3 className="font-heading text-lg font-bold text-text-1">
                Message sent!
              </h3>
              <p className="text-sm text-text-2 max-w-sm mx-auto leading-relaxed">
                We have received your message and will get back to you within 24 hours. Check your inbox for a confirmation.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-xs font-semibold text-text-2">
                  Full name *
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Isaac Chibueze"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-text-1 placeholder-text-3 focus:border-primary outline-none transition-colors"
                  required
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-text-2">
                  Email address *
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-text-1 placeholder-text-3 focus:border-primary outline-none transition-colors"
                  required
                />
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label htmlFor="subject" className="text-xs font-semibold text-text-2">
                  Subject *
                </label>
                <div className="relative">
                  <select
                    id="subject"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-text-1 focus:border-primary outline-none transition-colors appearance-none cursor-pointer"
                    required
                  >
                    <option value="" disabled>Select a subject</option>
                    <option value="I have a question about Cognara">I have a question about Cognara</option>
                    <option value="I want to report a bug">I want to report a bug</option>
                    <option value="I am interested in a team plan">I am interested in a team plan</option>
                    <option value="I want to partner with Cognara">I want to partner with Cognara</option>
                    <option value="Other">Other</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-3">
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label htmlFor="message" className="text-xs font-semibold text-text-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  placeholder="Tell us how we can help you..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={4}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-text-1 placeholder-text-3 focus:border-primary outline-none transition-colors resize-y min-h-[100px]"
                  required
                />
                <div className="flex justify-between items-center text-[10px] text-text-3 px-1">
                  <span>Minimum 20 characters</span>
                  <span>
                    {form.message.length} character{form.message.length !== 1 ? 's' : ''}
                    {form.message.length < 20 && form.message.length > 0 && ' (need ' + (20 - form.message.length) + ' more)'}
                  </span>
                </div>
              </div>

              {/* Error Box */}
              {error && (
                <div className="p-3 bg-error/10 border border-error/20 text-error text-xs rounded-lg animate-page-enter">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </div>

      </div>
    </section>
  )
}
