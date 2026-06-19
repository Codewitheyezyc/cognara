import React from 'react'
import { Document, Page, Text, View, StyleSheet, Svg, Path, Defs, LinearGradient, Stop, Font, Image } from '@react-pdf/renderer'

Font.register({
  family: 'Dancing Script',
  src: 'https://fonts.gstatic.com/s/dancingscript/v29/If2cXTr6YS-zF4S-kcSWSVi_sxjsohD9F50Ruu7BMSoHTQ.ttf'
})

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#0A0C14',
    color: '#F5F0E8',
    padding: 40,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
    width: '100%',
    fontFamily: 'Helvetica'
  },

  // Outer gold border frame
  borderOuter: {
    border: '2px solid #92400E',
    borderRadius: 14,
    flex: 1,
    padding: 32,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative'
  },

  // Inner subtle gold glow border
  borderInner: {
    border: '1px solid #F59E0B',
    borderRadius: 10,
    opacity: 0.25,
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    bottom: 6
  },

  // Corner accent lines (decorative)
  cornerTL: {
    position: 'absolute',
    top: 18,
    left: 18,
    width: 30,
    height: 30,
    borderTop: '2px solid #F59E0B',
    borderLeft: '2px solid #F59E0B',
    borderRadius: 2
  },
  cornerTR: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 30,
    height: 30,
    borderTop: '2px solid #F59E0B',
    borderRight: '2px solid #F59E0B',
    borderRadius: 2
  },
  cornerBL: {
    position: 'absolute',
    bottom: 18,
    left: 18,
    width: 30,
    height: 30,
    borderBottom: '2px solid #F59E0B',
    borderLeft: '2px solid #F59E0B',
    borderRadius: 2
  },
  cornerBR: {
    position: 'absolute',
    bottom: 18,
    right: 18,
    width: 30,
    height: 30,
    borderBottom: '2px solid #F59E0B',
    borderRight: '2px solid #F59E0B',
    borderRadius: 2
  },

  // Header row
  headerRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  logoContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  logoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F59E0B',
    letterSpacing: 2
  },
  officialBadge: {
    fontSize: 8,
    letterSpacing: 2,
    color: '#92400E',
    textTransform: 'uppercase'
  },

  // Gold divider line
  divider: {
    height: 1,
    backgroundColor: '#92400E',
    opacity: 0.5,
    marginVertical: 10
  },

  // Master label badge
  masterBadgeContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 2
  },
  masterBadgeRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 5,
    border: '1px solid #92400E',
    borderRadius: 3,
    backgroundColor: '#161310'
  },
  masterBadgeText: {
    fontSize: 10,
    letterSpacing: 5,
    color: '#F59E0B',
    textTransform: 'uppercase'
  },

  // Certificate title
  certTitle: {
    fontSize: 11,
    letterSpacing: 3,
    color: '#A8956A',
    textAlign: 'center',
    marginTop: 12,
    textTransform: 'uppercase'
  },

  // Body section
  body: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16
  },
  presentedTo: {
    fontSize: 11,
    color: '#8B7D5A',
    marginBottom: 6,
    textAlign: 'center'
  },
  studentName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#F5F0E8',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.5
  },
  completedText: {
    fontSize: 11,
    color: '#8B7D5A',
    marginBottom: 6,
    textAlign: 'center'
  },
  roadmapTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 4,
    textAlign: 'center'
  },
  subjectText: {
    fontSize: 13,
    color: '#34D399',
    marginBottom: 18,
    textAlign: 'center'
  },

  // Stats row — gold styled
  statsContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 0,
    paddingVertical: 10,
    borderTop: '1px solid #92400E',
    borderBottom: '1px solid #92400E',
    width: '75%',
    alignSelf: 'center',
    marginTop: 4
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 16
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F59E0B'
  },
  statLabel: {
    fontSize: 8,
    color: '#6B5B3A',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#92400E',
    opacity: 0.5
  },

  // Footer
  footer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 24
  },
  signatureContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start'
  },
  signatureTextHandwritten: {
    fontFamily: 'Dancing Script',
    fontSize: 18,
    color: '#F59E0B',
    marginBottom: 4,
    marginLeft: 10
  },
  signatureLine: {
    borderTop: '1px solid #92400E',
    width: 200,
    paddingTop: 6
  },
  signatureText: {
    fontSize: 9,
    color: '#A8956A',
    letterSpacing: 0.5
  },
  signatureSubText: {
    fontSize: 7,
    color: '#6B5B3A',
    marginTop: 3
  },
  certId: {
    fontSize: 7,
    color: '#4A3F2A',
    fontFamily: 'Courier',
    textAlign: 'right'
  }
})

interface RoadmapCertificateProps {
  studentName: string
  roadmapTitle: string
  subject: string
  avgScore: number
  totalLessons: number
  totalPhases: number
  completionDate: string
  certId: string
}

export function RoadmapCertificate({
  studentName,
  roadmapTitle,
  subject,
  avgScore,
  totalLessons,
  totalPhases,
  completionDate,
  certId
}: RoadmapCertificateProps) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.borderOuter}>
          {/* Decorative inner glow border */}
          <View style={styles.borderInner} />

          {/* Decorative corner accents */}
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />

          {/* Header */}
          <Image
            src="/cognara-icon-transparent-512x512.png"
            style={{
              width: 80,
              height: 80,
              marginBottom: 16,
              alignSelf: 'center'
            }}
          />

          <View style={styles.divider} />

          {/* Master Badge label */}
          <View style={styles.masterBadgeContainer}>
            <View style={styles.masterBadgeRow}>
              <Svg width={11} height={11} viewBox="0 0 24 24" style={{ marginRight: 6 }}>
                <Path
                  d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M4 22h16"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M12 2a6 6 0 0 1 6 6v2c0 2.2-1.8 4-4 4h-4c-2.2 0-4-1.8-4-4V8a6 6 0 0 1 6-6z"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.masterBadgeText}>Master Certificate</Text>
            </View>
          </View>

          <Text style={styles.certTitle}>Certificate of Full Course Completion</Text>

          {/* Body */}
          <View style={styles.body}>
            <Text style={styles.presentedTo}>This prestigious award is proudly presented to</Text>
            <Text style={styles.studentName}>{studentName}</Text>
            <Text style={styles.completedText}>who has demonstrated mastery of every phase, lesson, and assessment in</Text>
            <Text style={styles.roadmapTitle}>{roadmapTitle}</Text>
            <Text style={styles.subjectText}>Subject Specialization: {subject}</Text>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{avgScore}%</Text>
                <Text style={styles.statLabel}>Avg Score</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalLessons}</Text>
                <Text style={styles.statLabel}>Lessons</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalPhases}</Text>
                <Text style={styles.statLabel}>Phases</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{completionDate}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.signatureContainer}>
              <Text style={styles.signatureTextHandwritten}>Cognara Board</Text>
              <View style={styles.signatureLine}>
                <Image
                  src="/cognara-logo-transparent-640x160.png"
                  style={{ width: 120, height: 30 }}
                />
                <Text style={styles.signatureSubText}>Verified Master Credential Issuer</Text>
              </View>
            </View>
            <Text style={styles.certId}>MASTER CERT ID: {certId}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
