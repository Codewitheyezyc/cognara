import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { QuizQuestion } from '@/types/ai'

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr
}

const FALLBACK_QUESTIONS: QuizQuestion[] = [
  {
    id: "fb_html_1",
    type: "multiple_choice",
    question: "What does HTML stand for?",
    options: ["HyperText Markup Language", "HyperTech Main Language", "HighText Machine Language", "Hyperlink Text Markup Language"],
    correct_answer: "HyperText Markup Language",
    explanation: "HTML stands for HyperText Markup Language, the standard formatting language for web pages."
  },
  {
    id: "fb_css_1",
    type: "multiple_choice",
    question: "Which CSS property is used to change the text color of an element?",
    options: ["color", "text-color", "font-color", "fgcolor"],
    correct_answer: "color",
    explanation: "The 'color' property in CSS specifies the color of text inside an element."
  },
  {
    id: "fb_js_1",
    type: "multiple_choice",
    question: "Which operator is used to check for both value and type equality in JavaScript?",
    options: ["===", "==", "=", "!="],
    correct_answer: "===",
    explanation: "The strict equality operator (===) checks if both value and type are identical."
  },
  {
    id: "fb_react_1",
    type: "multiple_choice",
    question: "In React, which hook is used to perform side effects in functional components?",
    options: ["useEffect", "useState", "useContext", "useReducer"],
    correct_answer: "useEffect",
    explanation: "useEffect is the React Hook designed to run side effects like API calls, event listeners, and DOM updates."
  },
  {
    id: "fb_git_1",
    type: "multiple_choice",
    question: "Which command in Git is used to save changes locally without committing them to a branch?",
    options: ["git stash", "git save", "git pause", "git backup"],
    correct_answer: "git stash",
    explanation: "git stash temporarily shelves (or stashes) changes you've made to your working copy so you can work on something else."
  },
  {
    id: "fb_sql_1",
    type: "multiple_choice",
    question: "Which SQL clause is used to filter results returned by a SELECT query?",
    options: ["WHERE", "FILTER", "HAVING", "GROUP BY"],
    correct_answer: "WHERE",
    explanation: "The WHERE clause is used to extract only those records that fulfill a specified condition."
  },
  {
    id: "fb_python_1",
    type: "multiple_choice",
    question: "Which keyword is used to define a function in Python?",
    options: ["def", "function", "func", "define"],
    correct_answer: "def",
    explanation: "In Python, a function is defined using the 'def' keyword."
  },
  {
    id: "fb_net_1",
    type: "multiple_choice",
    question: "Which HTTP method is designed to update an existing resource or create it if it doesn't exist?",
    options: ["PUT", "GET", "POST", "DELETE"],
    correct_answer: "PUT",
    explanation: "PUT is typically used to replace the target resource completely or create it if it does not exist."
  },
  {
    id: "fb_ds_1",
    type: "multiple_choice",
    question: "Which data structure follows the First-In, First-Out (FIFO) principle?",
    options: ["Queue", "Stack", "Binary Tree", "Heap"],
    correct_answer: "Queue",
    explanation: "A Queue operates on a First-In, First-Out (FIFO) basis, where the first element added is the first one removed."
  },
  {
    id: "fb_api_1",
    type: "multiple_choice",
    question: "What does API stand for?",
    options: ["Application Programming Interface", "Advanced Program Integration", "Automated Process Interface", "Application Protocol Integration"],
    correct_answer: "Application Programming Interface",
    explanation: "API stands for Application Programming Interface, which allows different software applications to communicate with each other."
  },
  {
    id: "fb_js_2",
    type: "multiple_choice",
    question: "Which of the following is NOT a primitive data type in JavaScript?",
    options: ["Array", "String", "Number", "Boolean"],
    correct_answer: "Array",
    explanation: "In JavaScript, Array is an object type, not a primitive type. Primitives include String, Number, Boolean, BigInt, Symbol, Undefined, and Null."
  },
  {
    id: "fb_css_2",
    type: "multiple_choice",
    question: "What is the default value of the position property in CSS?",
    options: ["static", "relative", "absolute", "fixed"],
    correct_answer: "static",
    explanation: "HTML elements are positioned static by default. Static positioned elements are not affected by the top, bottom, left, and right properties."
  },
  {
    id: "fb_sec_1",
    type: "multiple_choice",
    question: "What does HTTPS stand for?",
    options: ["Hypertext Transfer Protocol Secure", "Hypertext Transfer Protocol Standard", "Hyperlink Text Technology System", "Hypertext Technology Secure Protocol"],
    correct_answer: "Hypertext Transfer Protocol Secure",
    explanation: "HTTPS stands for Hypertext Transfer Protocol Secure, which encrypts traffic using SSL/TLS."
  },
  {
    id: "fb_comp_1",
    type: "multiple_choice",
    question: "What is the term for a software program that translates source code into machine code?",
    options: ["Compiler", "Interpreter", "Linker", "Assembler"],
    correct_answer: "Compiler",
    explanation: "A compiler translates high-level source code into machine code/object code at once before execution."
  },
  {
    id: "fb_dom_1",
    type: "multiple_choice",
    question: "What does the DOM stand for in web development?",
    options: ["Document Object Model", "Data Object Management", "Digital Organization Method", "Document Order Module"],
    correct_answer: "Document Object Model",
    explanation: "DOM stands for Document Object Model, which represents the page structure as a hierarchical tree of objects."
  }
]

export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Authenticate user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Fetch completed lessons for the user
    const { data: progress, error: progressError } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', user.id)
      .eq('status', 'completed')

    if (progressError) {
      console.error('[Speedrun Questions] Error fetching progress:', progressError)
    }

    const completedLessonIds = progress?.map(p => p.lesson_id) || []
    let gatheredQuestions: QuizQuestion[] = []

    // 3. Fetch quizzes for completed lessons
    if (completedLessonIds.length > 0) {
      const { data: quizzes, error: quizzesError } = await supabase
        .from('quizzes')
        .select('questions')
        .in('lesson_id', completedLessonIds)

      if (quizzesError) {
        console.error('[Speedrun Questions] Error fetching quizzes:', quizzesError)
      } else if (quizzes) {
        for (const quiz of quizzes) {
          const questionsList = quiz.questions as unknown as QuizQuestion[]
          if (Array.isArray(questionsList)) {
            // Keep only multiple choice questions
            const multipleChoiceOnly = questionsList.filter(
              q => q.type === 'multiple_choice' && Array.isArray(q.options) && q.options.length > 0
            )
            gatheredQuestions.push(...multipleChoiceOnly)
          }
        }
      }
    }

    // 4. Shuffle gathered questions
    let finalQuestions = shuffleArray(gatheredQuestions)

    // 5. If we have fewer than 15 questions, mix in fallback questions
    if (finalQuestions.length < 15) {
      const shuffledFallbacks = shuffleArray(FALLBACK_QUESTIONS)
      
      // Prevent duplicates by checking question ID or content
      for (const fallback of shuffledFallbacks) {
        const isDuplicate = finalQuestions.some(
          q => q.question.toLowerCase().trim() === fallback.question.toLowerCase().trim()
        )
        if (!isDuplicate) {
          finalQuestions.push(fallback)
        }
      }
    }

    // 6. Reshuffle and cap at 30 questions
    finalQuestions = shuffleArray(finalQuestions).slice(0, 30)

    // Ensure options within each question are also shuffled for variety
    finalQuestions = finalQuestions.map(q => {
      if (q.options) {
        return {
          ...q,
          options: shuffleArray(q.options)
        }
      }
      return q
    })

    return NextResponse.json({ questions: finalQuestions })
  } catch (err: any) {
    console.error('[Speedrun Questions] Handler crash:', err)
    return NextResponse.json({ error: 'Failed to retrieve questions' }, { status: 500 })
  }
}
