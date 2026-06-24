'use client'

import React from 'react'
import { Award, Download, GraduationCap, Trophy, FileText, Eye } from 'lucide-react'

export default function CertificatePreviewPage() {
  return (
    <div className="space-y-8 animate-page-enter">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-text-1 tracking-tight">Certificate Design Preview</h1>
        <p className="text-text-2 text-sm mt-1">
          Preview both certificate types with dummy data — no learning completion required.
        </p>
      </div>

      {/* Certificate cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Phase Certificate Card */}
        <div className="bg-surface border border-border rounded-[14px] p-6 space-y-5 shadow-md">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <h2 className="font-heading text-base font-bold text-text-1">Phase Certificate</h2>
              </div>
              <p className="text-text-3 text-xs font-mono uppercase tracking-wider">Blue Theme · Per Phase</p>
            </div>
            <span className="text-[10px] font-mono bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
              EXISTING
            </span>
          </div>

          {/* Visual design preview */}
          <div
            style={{
              background: '#0A0C14',
              border: '2px solid #1E2540',
              borderRadius: '10px',
              padding: '20px',
              position: 'relative',
              overflow: 'hidden',
              minHeight: '140px'
            }}
          >
            {/* Inner glow border */}
            <div style={{
              position: 'absolute', inset: 5,
              border: '1px solid rgba(91,142,255,0.3)',
              borderRadius: '7px',
              pointerEvents: 'none'
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="18" height="18" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                  <path d="M 290 40 L 150 260 L 240 260 L 170 480 L 370 220 L 280 220 Z" fill="url(#prevLogoBlue1)" />
                  <path d="M 320 60 L 220 220 L 280 220 L 200 440 L 350 200 L 290 200 Z" fill="url(#prevLogoViolet1)" />
                  <defs>
                    <linearGradient id="prevLogoBlue1" x1="10%" y1="10%" x2="90%" y2="90%">
                      <stop offset="0%" stopColor="#5B8EFF" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                    <linearGradient id="prevLogoViolet1" x1="10%" y1="10%" x2="90%" y2="90%">
                      <stop offset="0%" stopColor="#A78BFA" />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.8" />
                    </linearGradient>
                  </defs>
                </svg>
                <span style={{ color: '#5B8EFF', fontWeight: 700, fontSize: 13, letterSpacing: 1.5 }}>COGNARA</span>
              </div>
              <span style={{ color: '#4A5272', fontSize: 9 }}>Official Achievement Record</span>
            </div>
            <p style={{ color: '#8B95B3', fontSize: 9, textAlign: 'center', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
              Certificate of Completion
            </p>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#8B95B3', fontSize: 9 }}>This is proudly presented to</p>
              <p style={{ color: '#F0F4FF', fontSize: 18, fontWeight: 700, margin: '4px 0' }}>Isaac Emmanuel</p>
              <p style={{ color: '#8B95B3', fontSize: 9, marginBottom: 4 }}>for successfully completing all milestones in</p>
              <p style={{ color: '#5B8EFF', fontSize: 12, fontWeight: 700, marginBottom: 3 }}>Phase 2: CSS Box Model &amp; Layouts</p>
              <p style={{ color: '#34D399', fontSize: 10 }}>under the subject of Web Development</p>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10,
              borderTop: '1px solid #1E2540', paddingTop: 8
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span className="font-signature text-xs text-primary leading-none" style={{ color: '#5B8EFF', fontSize: 12, marginBottom: 2 }}>Cognara Team</span>
                <div style={{ borderTop: '1px solid #1E2540', width: 90, paddingTop: 2, opacity: 0.5 }}>
                  <p style={{ color: '#8B95B3', fontSize: 6, margin: 0, lineHeight: 1 }}>Cognara Learning Platform</p>
                  <p style={{ color: '#4A5272', fontSize: 5, margin: 0 }}>Verified issuer</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, color: '#8B95B3', fontSize: 8 }}>
                <span>Score: <strong style={{ color: '#5B8EFF' }}>92%</strong></span>
                <span style={{ color: '#4A5272' }}>•</span>
                <span>Lessons: <strong style={{ color: '#5B8EFF' }}>6</strong></span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <p className="text-text-3 text-[11px] leading-relaxed">
              Earned after completing <strong className="text-text-2">all lessons + quizzes</strong> within a single phase.
              Each roadmap generates one certificate per phase.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-text-3">
              <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
              Triggered from the Phase Card on /dashboard/path
            </div>
            <div className="flex items-center gap-2 text-[11px] text-text-3">
              <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
              Also offered in the Spark celebration modal after final phase quiz
            </div>
          </div>

          <a
            href="/api/certificate/preview?type=phase"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(91,142,255,0.08)',
              border: '1px solid rgba(91,142,255,0.25)',
              color: '#5B8EFF',
              borderRadius: 10,
              padding: '10px 20px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              width: '100%',
              justifyContent: 'center',
              textDecoration: 'none'
            }}
          >
            <Eye size={14} />
            Open Phase Certificate PDF
            <Download size={14} />
          </a>
        </div>

        {/* Roadmap Master Certificate Card */}
        <div className="bg-surface border border-border rounded-[14px] p-6 space-y-5 shadow-md">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                <h2 className="font-heading text-base font-bold text-text-1">Master Certificate</h2>
              </div>
              <p className="text-text-3 text-[11px] font-mono uppercase tracking-wider">Gold Theme · Full Roadmap</p>
            </div>
            <span style={{
              fontSize: 10, fontFamily: 'monospace',
              background: 'rgba(245,158,11,0.1)',
              color: '#F59E0B',
              border: '1px solid rgba(245,158,11,0.25)',
              padding: '2px 8px',
              borderRadius: 999
            }}>
              NEW
            </span>
          </div>

          {/* Visual design preview — gold theme */}
          <div
            style={{
              background: '#0A0B0E',
              border: '2px solid #92400E',
              borderRadius: '10px',
              padding: '20px',
              position: 'relative',
              overflow: 'hidden',
              minHeight: '140px'
            }}
          >
            {/* Inner gold glow border */}
            <div style={{
              position: 'absolute', inset: 5,
              border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: '7px',
              pointerEvents: 'none'
            }} />
            {/* Corner accents */}
            {[
              { top: 10, left: 10, borderTop: '2px solid #F59E0B', borderLeft: '2px solid #F59E0B' },
              { top: 10, right: 10, borderTop: '2px solid #F59E0B', borderRight: '2px solid #F59E0B' },
              { bottom: 10, left: 10, borderBottom: '2px solid #F59E0B', borderLeft: '2px solid #F59E0B' },
              { bottom: 10, right: 10, borderBottom: '2px solid #F59E0B', borderRight: '2px solid #F59E0B' },
            ].map((s, i) => (
              <div key={i} style={{
                position: 'absolute', width: 14, height: 14, borderRadius: 1, ...s
              }} />
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="18" height="18" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                  <path d="M 290 40 L 150 260 L 240 260 L 170 480 L 370 220 L 280 220 Z" fill="url(#prevLogoBlue2)" />
                  <path d="M 320 60 L 220 220 L 280 220 L 200 440 L 350 200 L 290 200 Z" fill="url(#prevLogoViolet2)" />
                  <defs>
                    <linearGradient id="prevLogoBlue2" x1="10%" y1="10%" x2="90%" y2="90%">
                      <stop offset="0%" stopColor="#5B8EFF" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                    <linearGradient id="prevLogoViolet2" x1="10%" y1="10%" x2="90%" y2="90%">
                      <stop offset="0%" stopColor="#A78BFA" />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.8" />
                    </linearGradient>
                  </defs>
                </svg>
                <span style={{ color: '#F59E0B', fontWeight: 700, fontSize: 13, letterSpacing: 1.5 }}>COGNARA</span>
              </div>
              <span style={{ color: '#92400E', fontSize: 9 }}>Official Mastery Record</span>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <span style={{
                fontSize: 9, letterSpacing: 3, color: '#F59E0B',
                border: '1px solid #92400E', padding: '3px 10px', borderRadius: 2,
                display: 'inline-flex', alignItems: 'center', gap: 6,
                backgroundColor: '#161310'
              }}>
                <Trophy size={10} className="text-amber-500 shrink-0" />
                MASTER CERTIFICATE
              </span>
            </div>
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <p style={{ color: '#8B7D5A', fontSize: 9 }}>This prestigious award is proudly presented to</p>
              <p style={{ color: '#F5F0E8', fontSize: 18, fontWeight: 700, margin: '4px 0' }}>Isaac Emmanuel</p>
              <p style={{ color: '#F59E0B', fontSize: 12, fontWeight: 700, marginBottom: 3 }}>Web Development Foundations Path</p>
              <p style={{ color: '#34D399', fontSize: 10 }}>Subject Specialization: Web Development</p>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10,
              borderTop: '1px solid #92400E', paddingTop: 8
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span className="font-signature text-xs text-amber-500 leading-none" style={{ color: '#F59E0B', fontSize: 12, marginBottom: 2 }}>Cognara Board</span>
                <div style={{ borderTop: '1px solid #92400E', width: 90, paddingTop: 2, opacity: 0.5 }}>
                  <p style={{ color: '#A8956A', fontSize: 6, margin: 0, lineHeight: 1 }}>Cognara Learning Platform</p>
                  <p style={{ color: '#6B5B3A', fontSize: 5, margin: 0 }}>Verified Master Issuer</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, color: '#6B5B3A', fontSize: 8 }}>
                <span>Avg: <strong style={{ color: '#F59E0B' }}>88%</strong></span>
                <span>•</span>
                <span>Lessons: <strong style={{ color: '#F59E0B' }}>18</strong></span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <p className="text-text-3 text-[11px] leading-relaxed">
              Earned after completing <strong className="text-text-2">every phase, every lesson, and every quiz</strong> in an entire roadmap.
              The most prestigious credential Cognara issues.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-text-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
              Triggered from /dashboard/roadmap-complete/[id]
            </div>
            <div className="flex items-center gap-2 text-[11px] text-text-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
              Gold button: &quot;Download Master Certificate&quot; with amber glow
            </div>
          </div>

          <a
            href="/api/certificate/preview?type=roadmap"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.25)',
              color: '#F59E0B',
              borderRadius: 10,
              padding: '10px 20px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              width: '100%',
              justifyContent: 'center',
              textDecoration: 'none'
            }}
          >
            <Eye size={14} />
            Open Master Certificate PDF
            <Download size={14} />
          </a>
        </div>
      </div>

      {/* Info note */}
      <div className="p-4 bg-surface-alt/40 border border-border/50 rounded-[10px] flex items-start gap-3">
        <FileText className="h-4 w-4 text-text-3 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-text-2 text-xs font-semibold">Preview uses dummy data</p>
          <p className="text-text-3 text-[11px] leading-relaxed">
            Both PDFs above open with sample student data (Isaac Emmanuel, Web Development) so you can verify the visual design without needing to complete any lessons.
            The live certificates pull real names, scores, and completion dates from the database.
          </p>
        </div>
      </div>
    </div>
  )
}
