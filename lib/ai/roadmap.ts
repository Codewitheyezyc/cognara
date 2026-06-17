import { callClaudeJSON } from './client'
import { ROADMAP_SYSTEM_PROMPT, buildRoadmapUserMessage } from './prompts'

export interface LessonStub {
  order_index: number
  title: string
  description: string
}

export interface PhaseStub {
  phase_number: number
  title: string
  description: string
  duration_weeks: number
  lessons: LessonStub[]
}

export interface GeneratedRoadmap {
  title: string
  description: string
  estimated_weeks: number
  phases: PhaseStub[]
}

export async function generateRoadmap(
  goalText: string,
  subject: string,
  level: string,
  dailyMinutes: number,
  depthLevel: number
): Promise<GeneratedRoadmap> {
  const mockFallback = async () => {
    // Simulate network processing latency (3 seconds)
    await new Promise((resolve) => setTimeout(resolve, 3000))

    const query = (goalText + ' ' + subject).toLowerCase()

    if (query.includes('web development') || query.includes('web dev') || query.includes('html') || query.includes('css') || query.includes('javascript') || query.includes('js')) {
      return getWebDevelopmentRoadmap(level, dailyMinutes, depthLevel)
    } else if (query.includes('react') || query.includes('next.js') || query.includes('frontend')) {
      return getReactRoadmap(level, dailyMinutes, depthLevel)
    } else if (query.includes('python') || query.includes('data science') || query.includes('backend')) {
      return getPythonRoadmap(level, dailyMinutes, depthLevel)
    } else if (query.includes('design') || query.includes('ux') || query.includes('ui') || query.includes('figma')) {
      return getUXRoadmap(level, dailyMinutes, depthLevel)
    }

    // Fallback generic but personalized roadmap
    return getDefaultRoadmap(goalText, subject, level, dailyMinutes, depthLevel)
  }

  const userPrompt = buildRoadmapUserMessage({
    goalText,
    subject,
    level,
    dailyMinutes,
    depthLevel
  })

  return callClaudeJSON<GeneratedRoadmap>(
    ROADMAP_SYSTEM_PROMPT,
    userPrompt,
    mockFallback
  )
}

function getReactRoadmap(level: string, dailyMinutes: number, depthLevel: number): GeneratedRoadmap {
  const weeksMultiplier = dailyMinutes < 30 ? 1.5 : dailyMinutes > 60 ? 0.75 : 1
  return {
    title: `React & Frontend Engineering Path (${level})`,
    description: `A comprehensive track designed to take you from core JavaScript paradigms to deploying production-ready Next.js application layers.`,
    estimated_weeks: Math.round(8 * weeksMultiplier),
    phases: [
      {
        phase_number: 1,
        title: "Phase 1: Modern JavaScript & React Basics",
        description: "Revisit ES6+ concepts and understand JSX syntax, rendering cycles, and custom components.",
        duration_weeks: Math.round(2 * weeksMultiplier),
        lessons: []
      },
      {
        phase_number: 2,
        title: "Phase 2: React State & Custom Hooks",
        description: "Learn the core hooks of functional React components to trigger UI changes and isolate state behaviors.",
        duration_weeks: Math.round(3 * weeksMultiplier),
        lessons: []
      },
      {
        phase_number: 3,
        title: "Phase 3: Routing, Context & State Management",
        description: "Scale your application to multi-page navigation and centralize global state variables.",
        duration_weeks: Math.round(3 * weeksMultiplier),
        lessons: []
      }
    ]
  }
}

function getPythonRoadmap(level: string, dailyMinutes: number, depthLevel: number): GeneratedRoadmap {
  const weeksMultiplier = dailyMinutes < 30 ? 1.5 : dailyMinutes > 60 ? 0.75 : 1
  return {
    title: `Python Masterclass & Programming Path (${level})`,
    description: `A structural path exploring standard Python libraries, object-oriented concepts, and API integrations.`,
    estimated_weeks: Math.round(9 * weeksMultiplier),
    phases: [
      {
        phase_number: 1,
        title: "Phase 1: Python Core Foundations",
        description: "Learn basic scripting, logical statements, collection lists, and procedural programming.",
        duration_weeks: Math.round(3 * weeksMultiplier),
        lessons: []
      },
      {
        phase_number: 2,
        title: "Phase 2: Object-Oriented Programming (OOP)",
        description: "Translate real-world concepts into code classes, inheritance lines, and modular systems.",
        duration_weeks: Math.round(3 * weeksMultiplier),
        lessons: []
      },
      {
        phase_number: 3,
        title: "Phase 3: Python in Practice (APIs & Tools)",
        description: "Deploy scripts to fetch third-party data and set up environments.",
        duration_weeks: Math.round(3 * weeksMultiplier),
        lessons: []
      }
    ]
  }
}

function getUXRoadmap(level: string, dailyMinutes: number, depthLevel: number): GeneratedRoadmap {
  const weeksMultiplier = dailyMinutes < 30 ? 1.5 : dailyMinutes > 60 ? 0.75 : 1
  return {
    title: `UI/UX Product Design Specialization (${level})`,
    description: `A path tailored to learning user research methodologies, typography layouts, Figma wireframing, and interactive prototyping.`,
    estimated_weeks: Math.round(6 * weeksMultiplier),
    phases: [
      {
        phase_number: 1,
        title: "Phase 1: Design Principles & Research",
        description: "Understand user-centric guidelines, wireframes, and interface hierarchies.",
        duration_weeks: Math.round(2 * weeksMultiplier),
        lessons: []
      },
      {
        phase_number: 2,
        title: "Phase 2: Figma & High-Fidelity Design",
        description: "Create grids, style guides, components, and auto-layouts inside Figma.",
        duration_weeks: Math.round(2 * weeksMultiplier),
        lessons: []
      },
      {
        phase_number: 3,
        title: "Phase 3: Prototyping & Testing",
        description: "Interlink frames, apply smart animations, and conduct usability testings.",
        duration_weeks: Math.round(2 * weeksMultiplier),
        lessons: []
      }
    ]
  }
}

function getDefaultRoadmap(goalText: string, subject: string, level: string, dailyMinutes: number, depthLevel: number): GeneratedRoadmap {
  const weeksMultiplier = dailyMinutes < 30 ? 1.5 : dailyMinutes > 60 ? 0.75 : 1
  const topic = subject || goalText || "Selected Subject"

  return {
    title: `Mastery Path for ${topic} (${level})`,
    description: `A custom generated learning path created by Cognara to help you achieve your goals in ${topic}.`,
    estimated_weeks: Math.round(6 * weeksMultiplier),
    phases: [
      {
        phase_number: 1,
        title: `Phase 1: Foundations of ${topic}`,
        description: `Establish core definitions, setups, and baseline vocabulary in the field of ${topic}.`,
        duration_weeks: Math.round(2 * weeksMultiplier),
        lessons: []
      },
      {
        phase_number: 2,
        title: "Phase 2: Core Practical Applications",
        description: "Translate core theory into practical steps, managing errors and working with real patterns.",
        duration_weeks: Math.round(2 * weeksMultiplier),
        lessons: []
      },
      {
        phase_number: 3,
        title: "Phase 3: Advanced Methods & Scaling",
        description: "Focus on optimization, security configurations, and deploying your final project capstone.",
        duration_weeks: Math.round(2 * weeksMultiplier),
        lessons: []
      }
    ]
  }
}

function getWebDevelopmentRoadmap(level: string, dailyMinutes: number, depthLevel: number): GeneratedRoadmap {
  const weeksMultiplier = dailyMinutes < 30 ? 1.5 : dailyMinutes > 60 ? 0.75 : 1
  return {
    title: `Web Development Foundations Path (${level})`,
    description: `A detailed, comprehensive path designed to build production-ready frontends starting with Semantic HTML, moving to Responsive CSS, and mastering JavaScript core concepts.`,
    estimated_weeks: Math.round(10 * weeksMultiplier),
    phases: [
      {
        phase_number: 1,
        title: "Phase 1: Semantic HTML & Document Architecture",
        description: "Master document standards, metadata, form controls, and web accessibility principles.",
        duration_weeks: Math.round(3 * weeksMultiplier),
        lessons: []
      },
      {
        phase_number: 2,
        title: "Phase 2: CSS Box Model & Responsive Layouts",
        description: "Deep dive into CSS selectors, Flexbox models, CSS Grid layout systems, and responsive design practices.",
        duration_weeks: Math.round(3 * weeksMultiplier),
        lessons: []
      },
      {
        phase_number: 3,
        title: "Phase 3: JavaScript Programming Core & DOM API",
        description: "Learn logical program structures, control flows, loops, functions, scopes, and modern DOM interactions.",
        duration_weeks: Math.round(4 * weeksMultiplier),
        lessons: []
      }
    ]
  }
}
