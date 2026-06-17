import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#0A0B0E',
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
  logo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F59E0B'
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
  masterBadge: {
    fontSize: 10,
    letterSpacing: 5,
    color: '#F59E0B',
    textAlign: 'center',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingVertical: 5,
    border: '1px solid #92400E',
    borderRadius: 3
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
          <View style={styles.headerRow}>
            <Text style={styles.logo}>Cognara ⚡</Text>
            <Text style={styles.officialBadge}>Official Mastery Record</Text>
          </View>

          <View style={styles.divider} />

          {/* Master Badge label */}
          <View style={styles.masterBadgeContainer}>
            <Text style={styles.masterBadge}>🏆  Master Certificate</Text>
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
            <View style={styles.signatureLine}>
              <Text style={styles.signatureText}>Cognara AI Learning Platform</Text>
              <Text style={styles.signatureSubText}>Verified Master Credential Issuer</Text>
            </View>
            <Text style={styles.certId}>MASTER CERT ID: {certId}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
