import React from 'react'
import { Document, Page, Text, View, StyleSheet, Svg, Path, Defs, LinearGradient, Stop, Font, Circle, Polygon, Line } from '@react-pdf/renderer'

Font.register({
  family: 'Dancing Script',
  src: 'https://fonts.gstatic.com/s/dancingscript/v29/If2cXTr6YS-zF4S-kcSWSVi_sxjsohD9F50Ruu7BMSoHTQ.ttf'
})

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#0A0C14',
    color: '#F0F4FF',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'Helvetica'
  },
  card: {
    backgroundColor: '#0D1020',
    border: '2px solid #1E2540',
    borderRadius: 14,
    width: 580,
    padding: 32,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden'
  },
  borderInner: {
    border: '1px solid #5B8EFF',
    borderRadius: 10,
    opacity: 0.15,
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    bottom: 6
  },
  // Top branding
  brandContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 14
  },
  brandWordmark: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F0F4FF',
    letterSpacing: 2,
    textAlign: 'center'
  },
  brandTagline: {
    fontSize: 7,
    color: '#4A5272',
    letterSpacing: 3,
    textAlign: 'center',
    marginTop: 2
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#1E2540',
    marginVertical: 10
  },
  certificateTitle: {
    fontSize: 9,
    letterSpacing: 4,
    color: '#8B95B3',
    textAlign: 'center',
    marginBottom: 12,
    textTransform: 'uppercase'
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  studentName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#F0F4FF',
    marginVertical: 6,
    textAlign: 'center'
  },
  subText: {
    fontSize: 10,
    color: '#8B95B3',
    marginVertical: 3,
    textAlign: 'center'
  },
  phaseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5B8EFF',
    marginVertical: 5,
    textAlign: 'center'
  },
  subjectText: {
    fontSize: 11,
    color: '#34D399',
    marginBottom: 12,
    textAlign: 'center'
  },
  statsRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 7,
    borderTop: '1px solid #1E2540',
    borderBottom: '1px solid #1E2540',
    width: '75%',
    alignSelf: 'center',
    marginBottom: 14
  },
  statText: {
    fontSize: 8,
    color: '#8B95B3'
  },
  footer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
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
    fontSize: 15,
    color: '#5B8EFF',
    marginBottom: 3,
    marginLeft: 8
  },
  signatureLine: {
    borderTop: '1px solid #1E2540',
    width: 160,
    paddingTop: 4
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
    color: '#4A5272',
    fontFamily: 'Courier',
    textAlign: 'right'
  }
})

interface PhaseCertificateProps {
  studentName: string
  phaseTitle: string
  subject: string
  avgScore: number
  lessonsCount: number
  completionDate: string
  certId: string
}

export function PhaseCertificate({
  studentName,
  phaseTitle,
  subject,
  avgScore,
  lessonsCount,
  completionDate,
  certId
}: PhaseCertificateProps) {
  return (
    <Document>
      <Page size={[680, 460]} style={styles.page}>
        <View style={styles.card}>
          <View style={styles.borderInner} />

          {/* ── Top Branding ── */}
          <View style={styles.brandContainer}>
            {/* Icon + Wordmark in a row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
              {/* Diamond icon SVG only */}
              <Svg width={44} height={44} viewBox="0 0 60 60">
                <Defs>
                  <LinearGradient id="cg1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#7BA7FF"/>
                    <Stop offset="50%" stopColor="#5B8EFF"/>
                    <Stop offset="100%" stopColor="#A78BFA"/>
                  </LinearGradient>
                </Defs>
                {/* Ambient rings */}
                <Circle cx={30} cy={30} r={19} fill="rgba(91,142,255,0.08)"/>
                <Circle cx={30} cy={30} r={14} fill="rgba(91,142,255,0.05)"/>
                {/* Particles */}
                <Circle cx={30} cy={10} r={2} fill="#A78BFA" opacity={0.85}/>
                <Circle cx={46} cy={17} r={1.5} fill="#5B8EFF" opacity={0.7}/>
                <Circle cx={50} cy={30} r={2} fill="#7BA7FF" opacity={0.75}/>
                <Circle cx={46} cy={43} r={1.4} fill="#A78BFA" opacity={0.65}/>
                <Circle cx={30} cy={50} r={2} fill="#5B8EFF" opacity={0.8}/>
                <Circle cx={10} cy={30} r={1.5} fill="#A78BFA" opacity={0.65}/>
                {/* Diamond */}
                <Polygon points="30,12 42,30 30,48 18,30" fill="url(#cg1)"/>
                <Polygon points="30,17 37,30 30,40 25,30" fill="rgba(255,255,255,0.12)"/>
                {/* Eyes */}
                <Circle cx={27} cy={28} r={2} fill="#0A0C14"/>
                <Circle cx={33} cy={28} r={2} fill="#0A0C14"/>
                <Circle cx={27.6} cy={27.4} r={0.75} fill="#FFFFFF"/>
                <Circle cx={33.6} cy={27.4} r={0.75} fill="#FFFFFF"/>
              </Svg>
              {/* Wordmark as PDF Text — avoids SVGTextProps conflicts */}
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#F0F4FF', letterSpacing: 1, marginLeft: 8 }}>COGNARA</Text>
            </View>
            <Text style={styles.brandTagline}>LEARN · GROW · MASTER</Text>
          </View>

          {/* Divider */}
          <View style={styles.dividerLine} />

          <Text style={styles.certificateTitle}>Certificate of Completion</Text>

          {/* Certificate Body */}
          <View style={styles.body}>
            <Text style={styles.subText}>This is proudly presented to</Text>
            <Text style={styles.studentName}>{studentName}</Text>
            <Text style={styles.subText}>for successfully completing all milestones in</Text>
            <Text style={styles.phaseTitle}>{phaseTitle}</Text>
            <Text style={styles.subjectText}>under the subject of {subject}</Text>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <Text style={styles.statText}>Average Score: {avgScore}%</Text>
              <Text style={styles.statText}>•</Text>
              <Text style={styles.statText}>Lessons Completed: {lessonsCount}</Text>
              <Text style={styles.statText}>•</Text>
              <Text style={styles.statText}>Completed On: {completionDate}</Text>
            </View>
          </View>

          {/* Footer — fixed inside card */}
          <View style={styles.footer}>
            <View style={styles.signatureContainer}>
              <Text style={styles.signatureTextHandwritten}>Cognara Team</Text>
              <View style={styles.signatureLine}>
                <Text style={{ fontSize: 8, color: '#5B8EFF', fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 2 }}>COGNARA OFFICIAL</Text>
                <Text style={{ fontSize: 6.5, color: '#4A5272' }}>Verified Issuer</Text>
              </View>
            </View>
            <View style={styles.certIdContainer}>
              <Text style={styles.certId}>Certificate ID: {certId}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
