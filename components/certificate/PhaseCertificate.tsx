import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#0A0C14',
    color: '#F0F4FF',
    padding: 40,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
    width: '100%',
    fontFamily: 'Helvetica'
  },
  borderOuter: {
    border: '2px solid #1E2540',
    borderRadius: 12,
    flex: 1,
    padding: 30,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative'
  },
  borderInner: {
    border: '1px solid #5B8EFF',
    borderRadius: 8,
    opacity: 0.3,
    position: 'absolute',
    top: 5,
    left: 5,
    right: 5,
    bottom: 5
  },
  headerRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5B8EFF'
  },
  certificateTitle: {
    fontSize: 12,
    letterSpacing: 4,
    color: '#8B95B3',
    textAlign: 'center',
    marginTop: 20,
    textTransform: 'uppercase'
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20
  },
  studentName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F0F4FF',
    marginVertical: 10,
    textAlign: 'center'
  },
  subText: {
    fontSize: 12,
    color: '#8B95B3',
    marginVertical: 5,
    textAlign: 'center'
  },
  phaseTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#5B8EFF',
    marginVertical: 8,
    textAlign: 'center'
  },
  subjectText: {
    fontSize: 14,
    color: '#34D399',
    marginBottom: 20,
    textAlign: 'center'
  },
  statsRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    paddingVertical: 10,
    borderTop: '1px solid #1E2540',
    borderBottom: '1px solid #1E2540',
    width: '60%',
    alignSelf: 'center'
  },
  statText: {
    fontSize: 10,
    color: '#8B95B3'
  },
  footer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 30
  },
  signatureLine: {
    borderTop: '1px solid #1E2540',
    width: 180,
    paddingTop: 5
  },
  signatureText: {
    fontSize: 9,
    color: '#8B95B3'
  },
  certId: {
    fontSize: 8,
    color: '#4A5272',
    fontFamily: 'Courier'
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
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.borderOuter}>
          <View style={styles.borderInner} />
          
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.logo}>Cognara ⚡</Text>
            <Text style={{ fontSize: 9, color: '#4A5272' }}>Official Achievement Record</Text>
          </View>

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

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureText}>Cognara AI Learning Platform</Text>
              <Text style={{ fontSize: 7, color: '#4A5272', marginTop: 2 }}>Verified issuer</Text>
            </View>
            <Text style={styles.certId}>Certificate ID: {certId}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
