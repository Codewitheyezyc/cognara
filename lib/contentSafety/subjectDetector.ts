export type EducationLevel =
  | 'primary'      // Primary 1-6 (ages 6-12)
  | 'jss'          // Junior Secondary School 1-3 (ages 12-15)
  | 'sss'          // Senior Secondary School 1-3 (ages 15-18)
  | 'university'   // University level
  | 'professional' // Professional/adult skills

export interface SubjectDetection {
  isAcademicSubject: boolean
  subject: string
  suggestedLevel: EducationLevel | null
  waecRelevant: boolean    // Is this a WAEC examination subject?
  jambRelevant: boolean    // Is this a JAMB subject?
}

const WAEC_SUBJECTS = [
  'mathematics', 'english language', 'biology', 'chemistry',
  'physics', 'geography', 'economics', 'government', 'history',
  'literature', 'agricultural science', 'commerce', 'accounting',
  'further mathematics', 'civic education', 'french', 'yoruba',
  'igbo', 'hausa', 'fine arts', 'music', 'home economics',
  'technical drawing', 'computer science', 'data processing',
  'christian religious studies', 'islamic religious studies',
  'social studies', 'basic science', 'basic technology'
]

const JAMB_SUBJECTS = [
  'mathematics', 'english language', 'biology', 'chemistry',
  'physics', 'economics', 'government', 'literature in english',
  'geography', 'history', 'agricultural science', 'accounting',
  'commerce', 'further mathematics', 'french', 'arabic'
]

export function detectSubject(goalText: string): SubjectDetection {
  const lower = goalText.toLowerCase()

  const matchedWaec = WAEC_SUBJECTS.find(s => lower.includes(s))
  const matchedJamb = JAMB_SUBJECTS.find(s => lower.includes(s))

  const isAcademic = !!(matchedWaec || matchedJamb)

  // Detect level from goal text
  let suggestedLevel: EducationLevel | null = null
  if (lower.includes('primary') || lower.includes('basic')
      || lower.includes('jss') || lower.includes('junior')) {
    suggestedLevel = lower.includes('primary') ? 'primary' : 'jss'
  } else if (lower.includes('waec') || lower.includes('sss')
      || lower.includes('senior') || lower.includes('ss1')
      || lower.includes('ss2') || lower.includes('ss3')) {
    suggestedLevel = 'sss'
  } else if (lower.includes('jamb') || lower.includes('university')
      || lower.includes('degree') || lower.includes('100 level')) {
    suggestedLevel = 'university'
  }

  return {
    isAcademicSubject: isAcademic,
    subject: matchedWaec || matchedJamb || goalText,
    suggestedLevel,
    waecRelevant: !!matchedWaec,
    jambRelevant: !!matchedJamb
  }
}
