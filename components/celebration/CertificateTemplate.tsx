'use client'

import React from 'react'

interface CertificateTemplateProps {
  userName: string
  phaseName: string
  phaseNumber: number
  goalName: string
  topicsCovered: string[]
  completionDate: string
  certificateId: string
  isGoalCompletion: boolean
  theme: 'light' | 'dark'
}

export function CertificateTemplate({
  userName,
  phaseName,
  phaseNumber,
  goalName,
  topicsCovered,
  completionDate,
  certificateId,
  isGoalCompletion,
  theme,
}: CertificateTemplateProps) {
  const isDark = theme === 'dark'

  // Colors & styles based on theme and completion type
  const bgColor = isDark ? '#0A0C14' : '#FAFAFA'
  const containerBg = isDark ? '#111520' : '#FFFFFF'
  const textColor = isDark ? '#FFFFFF' : '#0A0C14'
  const mutedColor = isDark ? '#8B95B3' : '#64748B'
  
  // Gradient border colors (Indigo/Violet for phase, Gold/Amber for goal)
  const gradientBorder = isGoalCompletion
    ? 'linear-gradient(135deg, #F59E0B, #EAB308)'
    : 'linear-gradient(135deg, #5B8EFF, #A78BFA)'
    
  const accentColor = isGoalCompletion ? '#F59E0B' : '#5B8EFF'
  const sealColor = isGoalCompletion ? '#FBBF24' : '#5B8EFF'

  return (
    <div
      id="certificate-template"
      style={{
        width: '1200px',
        height: '850px',
        background: bgColor,
        color: textColor,
        fontFamily: "'Inter', 'Outfit', sans-serif",
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Google Fonts Pre-load */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;800&family=Inter:wght@400;500;700;900&family=Outfit:wght@400;600;800;900&family=Playfair+Display:ital,wght@0,600;0,800;1,600&display=swap');
      `}</style>

      {/* Layer 7: Subtle Background Texture (Faint radial gradient) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: isGoalCompletion
            ? 'radial-gradient(circle, rgba(245, 158, 11, 0.05) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(91, 142, 255, 0.055) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Layer 2: Outer Gradient Border */}
      <div
        style={{
          position: 'absolute',
          inset: '16px',
          padding: '3px',
          background: gradientBorder,
          borderRadius: '12px',
          zIndex: 2,
        }}
      >
        {/* Inner Container */}
        <div
          style={{
            width: '100%',
            height: '100%',
            background: containerBg,
            borderRadius: '10px',
            border: `1px solid ${isGoalCompletion ? 'rgba(245, 158, 11, 0.35)' : 'rgba(91, 142, 255, 0.35)'}`,
            position: 'relative',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '45px 70px',
            zIndex: 3,
          }}
        >
          {/* Layer 3: Corner Decorations (Subtle geometric L-shapes) */}
          {/* Top-Left */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              width: '24px',
              height: '24px',
              borderTop: `2px solid ${accentColor}`,
              borderLeft: `2px solid ${accentColor}`,
            }}
          />
          {/* Top-Right */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '24px',
              height: '24px',
              borderTop: `2px solid ${accentColor}`,
              borderRight: `2px solid ${accentColor}`,
            }}
          />
          {/* Bottom-Left */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              width: '24px',
              height: '24px',
              borderBottom: `2px solid ${accentColor}`,
              borderLeft: `2px solid ${accentColor}`,
            }}
          />
          {/* Bottom-Right */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              width: '24px',
              height: '24px',
              borderBottom: `2px solid ${accentColor}`,
              borderRight: `2px solid ${accentColor}`,
            }}
          />

          {/* Layer 4: Top Section (Logo + Divider) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="34" height="34" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 4L4 10L16 16L28 10L16 4Z" fill={accentColor} />
                <path d="M4 10V22L16 28L28 22V10L16 16L4 10Z" fill={accentColor} opacity="0.8" />
              </svg>
              <span
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '26px',
                  fontWeight: '900',
                  letterSpacing: '0.12em',
                  color: textColor,
                }}
              >
                COGNARA
              </span>
            </div>
            {/* Horizontal Divider */}
            <div
              style={{
                width: '120px',
                height: '2px',
                background: gradientBorder,
                marginTop: '15px',
              }}
            />
          </div>

          {/* Layer 5: Body Text (Centered Content) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              margin: '30px 0',
              textAlign: 'center',
            }}
          >
            {/* Line 1: Label */}
            <span
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '13px',
                fontWeight: '800',
                letterSpacing: '0.25em',
                color: accentColor,
                textTransform: 'uppercase',
              }}
            >
              {isGoalCompletion ? 'Certificate of Achievement' : 'Certificate of Completion'}
            </span>

            {/* Line 2: certifier */}
            <span
              style={{
                fontSize: '15px',
                color: mutedColor,
                marginTop: '25px',
                fontWeight: '500',
              }}
            >
              This certifies that
            </span>

            {/* Line 3: User Full Name */}
            <h2
              style={{
                fontFamily: "'Playfair Display', 'Cinzel', serif",
                fontSize: '44px',
                fontWeight: '800',
                color: textColor,
                margin: '18px 0',
                letterSpacing: '0.02em',
              }}
            >
              {userName}
            </h2>

            {/* Line 4: Action statement */}
            <span
              style={{
                fontSize: '15px',
                color: mutedColor,
                fontWeight: '500',
              }}
            >
              {isGoalCompletion ? 'has achieved mastery of' : 'has successfully completed'}
            </span>

            {/* Line 5 & 7: Subject names */}
            {isGoalCompletion ? (
              <div style={{ marginTop: '16px' }}>
                <p
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '24px',
                    fontWeight: '800',
                    color: accentColor,
                  }}
                >
                  {goalName}
                </p>
                <p
                  style={{
                    fontSize: '14px',
                    color: mutedColor,
                    marginTop: '8px',
                    fontWeight: '500',
                  }}
                >
                  completing all {phaseNumber} phases of the {goalName} Roadmap
                </p>
              </div>
            ) : (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <p
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '22px',
                    fontWeight: '800',
                    color: accentColor,
                  }}
                >
                  {phaseName}
                </p>
                <span style={{ fontSize: '13px', color: mutedColor, fontWeight: '500' }}>of the</span>
                <p
                  style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: textColor,
                  }}
                >
                  {goalName} Roadmap
                </p>
              </div>
            )}

            {/* Line 8: Topics covered label */}
            <span
              style={{
                fontSize: '12px',
                color: mutedColor,
                marginTop: '32px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: '700',
              }}
            >
              {isGoalCompletion ? 'demonstrating expert understanding of:' : 'demonstrating knowledge and understanding of:'}
            </span>

            {/* Line 9: Topics dots strip */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginTop: '12px',
                maxWidth: '900px',
                flexWrap: 'wrap',
              }}
            >
              {topicsCovered.map((topic, i) => (
                <React.Fragment key={i}>
                  <span
                    style={{
                      fontSize: '13px',
                      color: textColor,
                      fontWeight: '600',
                    }}
                  >
                    {topic}
                  </span>
                  {i < topicsCovered.length - 1 && (
                    <span style={{ color: accentColor, fontWeight: 'bold' }}>·</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Layer 6: Bottom Section (Three Columns) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              width: '100%',
            }}
          >
            {/* Left Column: Date */}
            <div style={{ width: '300px', textAlign: 'left' }}>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: '800',
                  color: mutedColor,
                  letterSpacing: '0.15em',
                  display: 'block',
                }}
              >
                DATE OF COMPLETION
              </span>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: textColor,
                  marginTop: '6px',
                  display: 'block',
                }}
              >
                {completionDate}
              </span>
            </div>

            {/* Center Column: Cognara Seal */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  border: `1.5px solid ${sealColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isDark ? '#1C2035' : '#F1F5F9',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 4L4 10L16 16L28 10L16 4Z" fill={sealColor} />
                  <path d="M4 10V22L16 28L28 22V10L16 16L4 10Z" fill={sealColor} opacity="0.8" />
                </svg>
              </div>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: '800',
                  color: accentColor,
                  letterSpacing: '0.1em',
                  marginTop: '8px',
                  textTransform: 'uppercase',
                }}
              >
                Certified by Cognara
              </span>
            </div>

            {/* Right Column: ID & Verification Link */}
            <div style={{ width: '300px', textAlign: 'right' }}>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: '800',
                  color: mutedColor,
                  letterSpacing: '0.15em',
                  display: 'block',
                }}
              >
                CERTIFICATE ID
              </span>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: textColor,
                  marginTop: '5px',
                  display: 'block',
                }}
              >
                {certificateId}
              </span>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: '600',
                  color: mutedColor,
                  marginTop: '4px',
                  display: 'block',
                }}
              >
                Verify: cognaralearn.com/verify/{certificateId}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
