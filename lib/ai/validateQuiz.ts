import { isTechnicalSubject } from './prompts'

const TECH_KEYWORDS = [
  'database', 'sql', 'javascript', 'css', 'html', 'code', 'programming',
  'browser', 'server', 'api', 'function', 'variable', 'loop', 'array',
  'modular architecture', 'design pattern', 'runtime', 'compile',
  'debug', 'deploy', 'framework', 'library', 'algorithm'
]

export function quizHasWrongContent(
  questions: any[],
  subject: string
): boolean {
  const isTech = isTechnicalSubject(subject)
  if (isTech) return false // Tech subjects can have tech answers

  // Check if any answer option in a non-tech quiz contains tech keywords
  for (const question of questions) {
    const allText = [
      question.question,
      ...(question.options || []),
      question.explanation
    ].join(' ').toLowerCase()

    const hasTechContent = TECH_KEYWORDS.some(keyword =>
      allText.includes(keyword)
    )

    if (hasTechContent) {
      console.warn('[Quiz Validation] Tech content found in non-tech quiz:', {
        subject,
        question: question.question
      })
      return true
    }
  }

  return false
}
