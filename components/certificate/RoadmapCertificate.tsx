import React from 'react'
import { Document, Page, Text, View, StyleSheet, Svg, Path, Defs, LinearGradient, Stop, Font, Circle, Polygon, Line } from '@react-pdf/renderer'

Font.register({
  family: 'Dancing Script',
  src: 'https://fonts.gstatic.com/s/dancingscript/v29/If2cXTr6YS-zF4S-kcSWSVi_sxjsohD9F50Ruu7BMSoHTQ.ttf'
})

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#0A0C14',
    color: '#F5F0E8',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'Helvetica'
  },
  card: {
    backgroundColor: '#100D08',
    border: '2px solid #92400E',
    borderRadius: 14,
    width: 580,
    padding: 30,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden'
  },
  borderInner: {
    border: '1px solid #F59E0B',
    borderRadius: 10,
    opacity: 0.15,
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    bottom: 6
  },
  cornerTL: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 22,
    height: 22,
    borderTop: '2px solid #F59E0B',
    borderLeft: '2px solid #F59E0B',
    borderRadius: 2
  },
  cornerTR: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 22,
    height: 22,
    borderTop: '2px solid #F59E0B',
    borderRight: '2px solid #F59E0B',
    borderRadius: 2
  },
  cornerBL: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    width: 22,
    height: 22,
    borderBottom: '2px solid #F59E0B',
    borderLeft: '2px solid #F59E0B',
    borderRadius: 2
  },
  cornerBR: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 22,
    height: 22,
    borderBottom: '2px solid #F59E0B',
    borderRight: '2px solid #F59E0B',
    borderRadius: 2
  },
  // Top branding
  brandContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 10
  },
  brandTagline: {
    fontSize: 7,
    color: '#A8956A',
    letterSpacing: 3,
    textAlign: 'center',
    marginTop: 2
  },
  divider: {
    height: 1,
    backgroundColor: '#92400E',
    opacity: 0.4,
    marginVertical: 8
  },
  masterBadgeContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 4
  },
  masterBadgeRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 3,
    border: '1px solid #92400E',
    borderRadius: 3,
    backgroundColor: '#161310'
  },
  masterBadgeText: {
    fontSize: 8,
    letterSpacing: 4,
    color: '#F59E0B',
    textTransform: 'uppercase'
  },
  certTitle: {
    fontSize: 9,
    letterSpacing: 3,
    color: '#A8956A',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 10,
    textTransform: 'uppercase'
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  presentedTo: {
    fontSize: 9,
    color: '#8B7D5A',
    marginBottom: 4,
    textAlign: 'center'
  },
  studentName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#F5F0E8',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.5
  },
  completedText: {
    fontSize: 9,
    color: '#8B7D5A',
    marginBottom: 4,
    textAlign: 'center'
  },
  roadmapTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 4,
    textAlign: 'center'
  },
  subjectText: {
    fontSize: 11,
    color: '#34D399',
    marginBottom: 10,
    textAlign: 'center'
  },
  statsContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 7,
    borderTop: '1px solid #92400E',
    borderBottom: '1px solid #92400E',
    width: '75%',
    alignSelf: 'center',
    marginTop: 2,
    marginBottom: 10
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 12
  },
  statValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#F59E0B'
  },
  statLabel: {
    fontSize: 6,
    color: '#6B5B3A',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#92400E',
    opacity: 0.4
  },
  footer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
    flexWrap: 'wrap'
  },
  signatureContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 1
  },
  signatureTextHandwritten: {
    fontFamily: 'Dancing Script',
    fontSize: 14,
    color: '#F59E0B',
    marginBottom: 3,
    marginLeft: 8
  },
  signatureLine: {
    borderTop: '1px solid #92400E',
    width: 160,
    paddingTop: 4
  },
  signatureText: {
    fontSize: 8,
    color: '#A8956A',
    letterSpacing: 0.5
  },
  signatureSubText: {
    fontSize: 6,
    color: '#6B5B3A',
    marginTop: 2
  },
  certIdContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'flex-end'
  },
  certId: {
    fontSize: 6,
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
      <Page size={[680, 460]} style={styles.page}>
        <View style={styles.card}>
          {/* Decorative inner glow border */}
          <View style={styles.borderInner} />

          {/* Decorative corner accents */}
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />

          {/* ── Top Branding ── */}
          <View style={styles.brandContainer}>
            {/* Icon + Wordmark in a row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
              {/* Diamond icon SVG only */}
              <Svg width={44} height={44} viewBox="0 0 60 60">
                <Defs>
                  <LinearGradient id="mg1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#F59E0B"/>
                    <Stop offset="50%" stopColor="#D97706"/>
                    <Stop offset="100%" stopColor="#B45309"/>
                  </LinearGradient>
                </Defs>
                {/* Ambient rings */}
                <Circle cx={30} cy={30} r={19} fill="rgba(245,158,11,0.08)"/>
                <Circle cx={30} cy={30} r={14} fill="rgba(245,158,11,0.05)"/>
                {/* Particles */}
                <Circle cx={30} cy={10} r={2} fill="#F59E0B" opacity={0.85}/>
                <Circle cx={46} cy={17} r={1.5} fill="#D97706" opacity={0.7}/>
                <Circle cx={50} cy={30} r={2} fill="#F59E0B" opacity={0.75}/>
                <Circle cx={46} cy={43} r={1.4} fill="#B45309" opacity={0.65}/>
                <Circle cx={30} cy={50} r={2} fill="#D97706" opacity={0.8}/>
                <Circle cx={10} cy={30} r={1.5} fill="#F59E0B" opacity={0.65}/>
                {/* Diamond core */}
                <Polygon points="30,12 42,30 30,48 18,30" fill="url(#mg1)"/>
                <Polygon points="30,17 37,30 30,40 25,30" fill="rgba(255,255,255,0.12)"/>
                {/* Eyes */}
                <Circle cx={27} cy={28} r={2} fill="#0A0C14"/>
                <Circle cx={33} cy={28} r={2} fill="#0A0C14"/>
                <Circle cx={27.6} cy={27.4} r={0.75} fill="#FFFFFF"/>
                <Circle cx={33.6} cy={27.4} r={0.75} fill="#FFFFFF"/>
              </Svg>
              {/* Wordmark as PDF Text — avoids SVGTextProps conflicts */}
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#F5F0E8', letterSpacing: 1, marginLeft: 8 }}>COGNARA</Text>
            </View>
            <Text style={styles.brandTagline}>LEARN · GROW · MASTER</Text>
          </View>

          <View style={styles.divider} />

          {/* Master Badge label */}
          <View style={styles.masterBadgeContainer}>
            <View style={styles.masterBadgeRow}>
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
                <Text style={styles.signatureText}>COGNARA BOARD</Text>
                <Text style={styles.signatureSubText}>Verified Master Credential Issuer</Text>
              </View>
            </View>
            <View style={styles.certIdContainer}>
              <Text style={styles.certId}>MASTER CERT ID: {certId}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
