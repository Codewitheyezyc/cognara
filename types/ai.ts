export type LessonSectionType =
  | 'explanation'
  | 'analogy'
  | 'code'
  | 'code_comparison'
  | 'diagram'
  | 'table'
  | 'callout'
  | 'exercise_code'
  | 'exercise_writing'
  | 'exercise_task'
  | 'exercise_project'
  | 'use_case'
  | 'summary'
  | 'resource'

export interface LessonSection {
  type: LessonSectionType
  heading: string

  // For: explanation, analogy, use_case, summary
  body?: string

  // For: code
  code_language?: string
  code_snippet?: string
  code_caption?: string

  // For: code_comparison
  comparison_label_left?: string
  code_left?: string
  comparison_label_right?: string
  code_right?: string
  comparison_caption?: string

  // For: diagram
  diagram_type?: 'flowchart' | 'tree' | 'process' | 'comparison' | 'timeline'
  diagram_content?: string

  // For: table
  table_headers?: string[]
  table_rows?: string[][]

  // For: callout
  callout_type?: 'info' | 'warning' | 'tip' | 'important' | 'pro_tip'
  callout_body?: string

  // For: resource
  resource_title?: string
  resource_url?: string
  resource_description?: string

  // For exercise_code
  exercise_language?: string        // 'javascript' | 'html' | 'css' | 'python' | 'sql'
  exercise_starter_code?: string    // pre-written starter code shown in editor
  exercise_instructions?: string    // what the student must do
  exercise_expected_output?: string // what correct output looks like (shown after attempt)

  // For exercise_writing
  exercise_criteria?: string[]      // what Claude will evaluate e.g. ["Hook", "Clarity", "CTA"]

  // For exercise_task
  exercise_steps?: string[]         // checklist of steps to complete

  // For exercise_project
  exercise_project_title?: string      // e.g. "Build a Todo App"
  exercise_project_description?: string // what they are building
  exercise_project_template?: string   // 'react' | 'node' | 'vanilla' | 'nextjs'
  exercise_project_files?: {           // starter files
    [filename: string]: string         // filename: file content
  }
  exercise_project_steps?: string[]    // guided steps to complete the project
}

export interface GeneratedLesson {
  title: string
  estimated_minutes: number
  sections: LessonSection[]
  key_takeaways: string[]
  next_lesson_preview: string
}

export type QuestionType = 'multiple_choice' | 'fill_blank' | 'true_false'

export interface QuizQuestion {
  id: string
  type: QuestionType
  question: string
  options?: string[]
  correct_answer: string
  explanation: string
}

export interface GeneratedQuiz {
  questions: QuizQuestion[]
}

export interface GeneratedInsight {
  insight: string
  weak_areas: string[]
  strong_areas: string[]
  recommendation: string
  recommended_lesson_title: string | null
}
