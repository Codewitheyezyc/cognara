import { callClaudeJSON } from './client'
import { ROADMAP_SYSTEM_PROMPT, buildRoadmapUserMessage } from './prompts'
import { detectSubject } from '@/lib/contentSafety/subjectDetector'

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

  const detection = detectSubject(goalText)
  let additionalContext = ''

  if (detection.waecRelevant) {
    additionalContext = `
This is a WAEC examination subject. Structure the roadmap to cover:
1. All WAEC syllabus topics for this subject
2. Past question practice patterns
3. Examination technique and time management
4. Common examiner expectations

Make the content appropriate for Nigerian secondary school students
preparing for the West African Senior School Certificate Examination.
`
  } else if (detection.jambRelevant) {
    additionalContext = `
This student is preparing for JAMB (UTME).
Structure the roadmap around:
1. JAMB syllabus for this subject
2. Multiple choice question patterns
3. Speed and accuracy techniques
4. Past JAMB questions approach
`
  }

  const userPrompt = buildRoadmapUserMessage({
    goalText,
    subject,
    level,
    dailyMinutes,
    depthLevel
  }) + (additionalContext ? `\n${additionalContext}` : '')

  return callClaudeJSON<GeneratedRoadmap>(
    ROADMAP_SYSTEM_PROMPT,
    userPrompt,
    mockFallback,
    'claude-haiku-4-5-20251001'
  )
}

function getReactRoadmap(level: string, dailyMinutes: number, depthLevel: number): GeneratedRoadmap {
  const weeksMultiplier = dailyMinutes < 30 ? 1.5 : dailyMinutes > 60 ? 0.75 : 1
  const isDetailed = depthLevel === 3

  const phase1Lessons = [
    {
      order_index: 1,
      title: "ES6+ Modern Syntax Refresher",
      description: "Master destructuring, arrow functions, template literals, and rest/spread operators."
    },
    {
      order_index: 2,
      title: "Understanding JSX and Rendering",
      description: "Learn how JSX is compiled into React elements and how DOM commits are scheduled."
    },
    {
      order_index: 3,
      title: "Reusable Components and Props",
      description: "Learn to build modular components, pass state data down, and enforce prop safety."
    },
    {
      order_index: 4,
      title: "Event Handling in React",
      description: "Capture user interactions and handle synthesized event states efficiently."
    }
  ]

  if (isDetailed) {
    phase1Lessons.push(
      {
        order_index: 5,
        title: "React Portals & DOM Manipulation (Part 2)",
        description: "Mount overlays directly onto body nodes using createPortal and manage parent DOM interactions."
      },
      {
        order_index: 6,
        title: "Strict Mode & DevTools Debugging",
        description: "Diagnose rendering side-effects, find memory leaks, and profile component tree executions."
      }
    )
  }

  const phase2Lessons = [
    {
      order_index: 1,
      title: "Managing Component State with useState",
      description: "Initialize state, manage schedules, and coordinate complex form objects."
    },
    {
      order_index: 2,
      title: "Side Effects with useEffect",
      description: "Understand side effect cleanup, dependency arrays, and calling external APIs."
    },
    {
      order_index: 3,
      title: "Form Handling and Validations",
      description: "Control input forms and validate user data before state commits."
    },
    {
      order_index: 4,
      title: "Writing Custom Hook Services",
      description: "Extract reusable logic into clean, testable, and isolated custom hooks."
    }
  ]

  if (isDetailed) {
    phase2Lessons.push(
      {
        order_index: 5,
        title: "State Management Patterns (Reducer & Context Combo)",
        description: "Coordinate deep state updates using dispatch structures combined with dynamic providers."
      },
      {
        order_index: 6,
        title: "Memoization Deep Dive (useMemo & useCallback)",
        description: "Avoid redundant sub-tree renders using strict dependency audits and cached values."
      }
    )
  }

  const phase3Lessons = [
    {
      order_index: 1,
      title: "Global State with Context API",
      description: "Avoid prop-drilling by providing global variables down the component tree."
    },
    {
      order_index: 2,
      title: "Routing and Page Navigation",
      description: "Implement page layouts, dynamic route paths, and navigation guards."
    },
    {
      order_index: 3,
      title: "Fetching Data with TanStack Query",
      description: "Incorporate server state management, query caching, and mutations."
    },
    {
      order_index: 4,
      title: "Performance Tuning in React",
      description: "Optimize render trees using React.memo, useMemo, and useCallback hooks."
    }
  ]

  if (isDetailed) {
    phase3Lessons.push(
      {
        order_index: 5,
        title: "Authentication Integration in React Apps",
        description: "Set up login route guards, persist token headers, and handle invalid credentials."
      },
      {
        order_index: 6,
        title: "Testing React Components with Jest & React Testing Library",
        description: "Verify render expectations, simulate user click events, and mock API fetch hooks."
      }
    )
  }

  return {
    title: `React & Frontend Engineering Path (${level})`,
    description: `A comprehensive track designed to take you from core JavaScript paradigms to deploying production-ready Next.js application layers.`,
    estimated_weeks: Math.round((isDetailed ? 12 : 8) * weeksMultiplier),
    phases: [
      {
        phase_number: 1,
        title: "Phase 1: Modern JavaScript & React Basics",
        description: "Revisit ES6+ concepts and understand JSX syntax, rendering cycles, and custom components.",
        duration_weeks: Math.round((isDetailed ? 3 : 2) * weeksMultiplier),
        lessons: phase1Lessons
      },
      {
        phase_number: 2,
        title: "Phase 2: React State & Custom Hooks",
        description: "Learn the core hooks of functional React components to trigger UI changes and isolate state behaviors.",
        duration_weeks: Math.round((isDetailed ? 4 : 3) * weeksMultiplier),
        lessons: phase2Lessons
      },
      {
        phase_number: 3,
        title: "Phase 3: Routing, Context & State Management",
        description: "Scale your application to multi-page navigation and centralize global state variables.",
        duration_weeks: Math.round((isDetailed ? 5 : 3) * weeksMultiplier),
        lessons: phase3Lessons
      }
    ]
  }
}

function getPythonRoadmap(level: string, dailyMinutes: number, depthLevel: number): GeneratedRoadmap {
  const weeksMultiplier = dailyMinutes < 30 ? 1.5 : dailyMinutes > 60 ? 0.75 : 1
  const isDetailed = depthLevel === 3

  const phase1Lessons = [
    {
      order_index: 1,
      title: "Variables and basic data types",
      description: "Understand integers, floats, strings, booleans, and type conversion logic."
    },
    {
      order_index: 2,
      title: "Control Flow and Logical Operators",
      description: "Construct conditional blocks and iterate through collection items."
    },
    {
      order_index: 3,
      title: "Python Lists, Sets, and Dictionaries",
      description: "Understand data structures, list comprehensions, and mapping key-value stores."
    },
    {
      order_index: 4,
      title: "Writing Modular Functions",
      description: "Establish function scopes, define defaults, and handle return statements."
    }
  ]

  if (isDetailed) {
    phase1Lessons.push(
      {
        order_index: 5,
        title: "Python Lambdas & Functional Programming Helpers",
        description: "Utilize anonymous expressions, filter, map, and zip primitives on data collections."
      },
      {
        order_index: 6,
        title: "Generator Functions & Iterators",
        description: "Produce lazy-evaluated streams using yield operators to preserve system memory."
      }
    )
  }

  const phase2Lessons = [
    {
      order_index: 1,
      title: "Python Classes and Instances",
      description: "Define class scopes, initializers, object attributes, and instance methods."
    },
    {
      order_index: 2,
      title: "Inheritance and Polymorphism",
      description: "Build parent-child relationships and overwrite standard attributes."
    },
    {
      order_index: 3,
      title: "Exception Handling Protocols",
      description: "Build try-except-finally blocks to manage errors without crashing."
    },
    {
      order_index: 4,
      title: "File Operations and Context Managers",
      description: "Safely read and write file data using context managers."
    }
  ]

  if (isDetailed) {
    phase2Lessons.push(
      {
        order_index: 5,
        title: "Dunder Methods & Operator Overloading",
        description: "Customize default class actions with magic methods like __str__, __repr__, and mathematical operators."
      },
      {
        order_index: 6,
        title: "Decorators & Meta-programming Basics",
        description: "Inject behaviors across functions or classes dynamically using decorator wraps."
      }
    )
  }

  const phase3Lessons = [
    {
      order_index: 1,
      title: "Virtual Environments and PIP",
      description: "Create isolated virtual environments and install packages."
    },
    {
      order_index: 2,
      title: "Interacting with Web APIs",
      description: "Perform HTTP request methods and parse JSON payloads."
    },
    {
      order_index: 3,
      title: "Data Manipulation with Pandas",
      description: "Load dataset tables, structure data frames, and query statistics."
    },
    {
      order_index: 4,
      title: "Deploying Script Automations",
      description: "Set up scheduling cron scripts and batch process reports."
    }
  ]

  if (isDetailed) {
    phase3Lessons.push(
      {
        order_index: 5,
        title: "Database Connections with SQLite/SQLAlchemy",
        description: "Perform CRUD queries and define declarative ORM schemas in python applications."
      },
      {
        order_index: 6,
        title: "Asyncio & Concurrent Programming",
        description: "Manage multiple non-blocking async tasks using asyncio event loop systems."
      }
    )
  }

  return {
    title: `Python Masterclass & Programming Path (${level})`,
    description: `A structural path exploring standard Python libraries, object-oriented concepts, and API integrations.`,
    estimated_weeks: Math.round((isDetailed ? 13 : 9) * weeksMultiplier),
    phases: [
      {
        phase_number: 1,
        title: "Phase 1: Python Core Foundations",
        description: "Learn basic scripting, logical statements, collection lists, and procedural programming.",
        duration_weeks: Math.round((isDetailed ? 4 : 3) * weeksMultiplier),
        lessons: phase1Lessons
      },
      {
        phase_number: 2,
        title: "Phase 2: Object-Oriented Programming (OOP)",
        description: "Translate real-world concepts into code classes, inheritance lines, and modular systems.",
        duration_weeks: Math.round((isDetailed ? 4 : 3) * weeksMultiplier),
        lessons: phase2Lessons
      },
      {
        phase_number: 3,
        title: "Phase 3: Python in Practice (APIs & Tools)",
        description: "Deploy scripts to fetch third-party data and set up environments.",
        duration_weeks: Math.round((isDetailed ? 5 : 3) * weeksMultiplier),
        lessons: phase3Lessons
      }
    ]
  }
}

function getUXRoadmap(level: string, dailyMinutes: number, depthLevel: number): GeneratedRoadmap {
  const weeksMultiplier = dailyMinutes < 30 ? 1.5 : dailyMinutes > 60 ? 0.75 : 1
  const isDetailed = depthLevel === 3

  const phase1Lessons = [
    {
      order_index: 1,
      title: "Introduction to User-Centered Design",
      description: "Examine UX principles, human interaction models, and standard designs."
    },
    {
      order_index: 2,
      title: "User Research & User Personas",
      description: "Conduct surveys, interviews, and compile structural user personas."
    },
    {
      order_index: 3,
      title: "Information Architecture & Sitemaps",
      description: "Structure navigation layouts and page hierarchies for low friction."
    },
    {
      order_index: 4,
      title: "Sketching and Low-Fidelity Wireframes",
      description: "Quickly iterate design ideas on paper or basic shapes before digital wireframes."
    }
  ]

  if (isDetailed) {
    phase1Lessons.push(
      {
        order_index: 5,
        title: "Competitive Analysis & Heuristic Evaluation",
        description: "Analyze market alternatives and audit interfaces against Nielsen's design heuristics."
      },
      {
        order_index: 6,
        title: "Creating User Journey Maps",
        description: "Trace user emotional flows, pain points, and action tracks across product phases."
      }
    )
  }

  const phase2Lessons = [
    {
      order_index: 1,
      title: "Figma Environment and Vector Tools",
      description: "Master layers, vectors, styling, and frame alignments in Figma."
    },
    {
      order_index: 2,
      title: "Typography and Color Hierarchies",
      description: "Establish a clear type scale, typographic contrasts, and accessible color values."
    },
    {
      order_index: 3,
      title: "Figma Auto-Layout & Constraints",
      description: "Build responsive grids and layouts that adapt dynamically."
    },
    {
      order_index: 4,
      title: "Modular Components & Variants",
      description: "Create reusable components, variants, and design tokens."
    }
  ]

  if (isDetailed) {
    phase2Lessons.push(
      {
        order_index: 5,
        title: "Design Systems & Component Libraries in Figma",
        description: "Manage global styles, build structured libraries, and coordinate color palettes."
      },
      {
        order_index: 6,
        title: "Advanced Auto-Layout: Wrapping & Constraints",
        description: "Manage advanced flex-wrap layouts and specify precise element constraints."
      }
    )
  }

  const phase3Lessons = [
    {
      order_index: 1,
      title: "Interactive Prototyping in Figma",
      description: "Apply triggers, transitions, and navigate clicks across screens."
    },
    {
      order_index: 2,
      title: "Figma Smart Animate Extensions",
      description: "Build micro-interactions, page slides, and animations."
    },
    {
      order_index: 3,
      title: "Conducting Usability Testing",
      description: "Test your designs with users and log usability issues."
    },
    {
      order_index: 4,
      title: "Design-to-Development Handoffs",
      description: "Document layouts, CSS tokens, assets, and specs for developers."
    }
  ]

  if (isDetailed) {
    phase3Lessons.push(
      {
        order_index: 5,
        title: "High-Fidelity Prototype Animations & Transitions",
        description: "Utilize complex triggers, custom delay timing, and interactive component events."
      },
      {
        order_index: 6,
        title: "Accessibility (A11y) Auditing in UX Design",
        description: "Audit visual contrast, tap target sizing, and screen reader labels for WCAG standards."
      }
    )
  }

  return {
    title: `UI/UX Product Design Specialization (${level})`,
    description: `A path tailored to learning user research methodologies, typography layouts, Figma wireframing, and interactive prototyping.`,
    estimated_weeks: Math.round((isDetailed ? 9 : 6) * weeksMultiplier),
    phases: [
      {
        phase_number: 1,
        title: "Phase 1: Design Principles & Research",
        description: "Understand user-centric guidelines, wireframes, and interface hierarchies.",
        duration_weeks: Math.round((isDetailed ? 3 : 2) * weeksMultiplier),
        lessons: phase1Lessons
      },
      {
        phase_number: 2,
        title: "Phase 2: Figma & High-Fidelity Design",
        description: "Create grids, style guides, components, and auto-layouts inside Figma.",
        duration_weeks: Math.round((isDetailed ? 3 : 2) * weeksMultiplier),
        lessons: phase2Lessons
      },
      {
        phase_number: 3,
        title: "Phase 3: Prototyping & Testing",
        description: "Interlink frames, apply smart animations, and conduct usability testings.",
        duration_weeks: Math.round((isDetailed ? 3 : 2) * weeksMultiplier),
        lessons: phase3Lessons
      }
    ]
  }
}

function getDefaultRoadmap(goalText: string, subject: string, level: string, dailyMinutes: number, depthLevel: number): GeneratedRoadmap {
  const weeksMultiplier = dailyMinutes < 30 ? 1.5 : dailyMinutes > 60 ? 0.75 : 1
  const topic = subject || goalText || "Selected Subject"
  const isDetailed = depthLevel === 3

  const phase1Lessons = [
    {
      order_index: 1,
      title: `Introduction to ${topic}`,
      description: "Overview of the ecosystem, key histories, and what makes it essential today."
    },
    {
      order_index: 2,
      title: "Essential Glossary and Concepts",
      description: "Familiarize yourself with the terminology and basic conceptual mental models."
    },
    {
      order_index: 3,
      title: "Standard Setup and Environment",
      description: "Install, compile, configure, and verify the basic tooling required."
    },
    {
      order_index: 4,
      title: "Building your First Hello World Project",
      description: "Apply your initial learnings to compile a simple working project from scratch."
    }
  ]

  if (isDetailed) {
    phase1Lessons.push(
      {
        order_index: 5,
        title: `Introduction to ${topic} (Part 2): Core Mental Models`,
        description: "Deep dive into structural terminology and conceptual building blocks."
      },
      {
        order_index: 6,
        title: "Advanced Tooling Setup & Troubleshooting",
        description: "Configure auxiliary tools, compile compilers, and resolve system path conflicts."
      }
    )
  }

  const phase2Lessons = [
    {
      order_index: 1,
      title: "Intermediate Practical Techniques",
      description: "Solve practical problems using standard approaches and frameworks."
    },
    {
      order_index: 2,
      title: "Debugging and Error Resolutions",
      description: "Learn how to read logs, inspect data, and troubleshoot common issues."
    },
    {
      order_index: 3,
      title: "Modular Clean Code Principles",
      description: "Organize files, separate concerns, and design refactoring methods."
    },
    {
      order_index: 4,
      title: "Integrating with Libraries and Plugins",
      description: "Expand core capabilities by importing community plugins and packages."
    }
  ]

  if (isDetailed) {
    phase2Lessons.push(
      {
        order_index: 5,
        title: "Intermediate Practical Techniques (Part 2): Scale Operations",
        description: "Apply intermediate patterns to higher volumes of actions or structured datasets."
      },
      {
        order_index: 6,
        title: "Debugging (Part 2): Advanced Logs & Profiling",
        description: "Incorporate execution timers, trace stacks, and memory profile analyzers."
      }
    )
  }

  const phase3Lessons = [
    {
      order_index: 1,
      title: "Optimizations and Performance Limits",
      description: "Analyze latency, measure bottlenecks, and optimize execution profiles."
    },
    {
      order_index: 2,
      title: "Security Protocols and Best Practices",
      description: "Secure data keys, restrict networks, and validate user permissions."
    },
    {
      order_index: 3,
      title: "Deployments and Public Publishing",
      description: "Build production packages and deploy to public hosts."
    },
    {
      order_index: 4,
      title: "Final Capstone Review & Assessment",
      description: "Synthesize all prior concepts into a complete comprehensive project review."
    }
  ]

  if (isDetailed) {
    phase3Lessons.push(
      {
        order_index: 5,
        title: "Performance Optimizations & Scaling (Part 2)",
        description: "Troubleshoot bottlenecks, optimize loops, and apply caching middleware."
      },
      {
        order_index: 6,
        title: "Final Capstone Project Construction & Deploy",
        description: "Build and publish a comprehensive project demonstrating all learnings of this curriculum."
      }
    )
  }

  return {
    title: `Mastery Path for ${topic} (${level})`,
    description: `A custom generated learning path created by Cognara to help you achieve your goals in ${topic}.`,
    estimated_weeks: Math.round((isDetailed ? 9 : 6) * weeksMultiplier),
    phases: [
      {
        phase_number: 1,
        title: `Phase 1: Foundations of ${topic}`,
        description: `Establish core definitions, setups, and baseline vocabulary in the field of ${topic}.`,
        duration_weeks: Math.round((isDetailed ? 3 : 2) * weeksMultiplier),
        lessons: phase1Lessons
      },
      {
        phase_number: 2,
        title: "Phase 2: Core Practical Applications",
        description: "Translate core theory into practical steps, managing errors and working with real patterns.",
        duration_weeks: Math.round((isDetailed ? 3 : 2) * weeksMultiplier),
        lessons: phase2Lessons
      },
      {
        phase_number: 3,
        title: "Phase 3: Advanced Methods & Scaling",
        description: "Focus on optimization, security configurations, and deploying your final project capstone.",
        duration_weeks: Math.round((isDetailed ? 3 : 2) * weeksMultiplier),
        lessons: phase3Lessons
      }
    ]
  }
}

function getWebDevelopmentRoadmap(level: string, dailyMinutes: number, depthLevel: number): GeneratedRoadmap {
  const weeksMultiplier = dailyMinutes < 30 ? 1.5 : dailyMinutes > 60 ? 0.75 : 1
  const isDetailed = depthLevel === 3
  
  // Phase 1 lessons
  const phase1Lessons = [
    {
      order_index: 1,
      title: "HTML5 Document Structure & Metadata",
      description: "Understand doctypes, head elements, script placement, and viewport configurations."
    },
    {
      order_index: 2,
      title: "Semantic HTML Elements & Content Layout",
      description: "Learn to structure readable documents using section, article, nav, header, and footer elements."
    },
    {
      order_index: 3,
      title: "HTML Forms, Validations & User Inputs",
      description: "Create interactive forms using secure inputs, fieldsets, labels, and native validation attributes."
    },
    {
      order_index: 4,
      title: "Web Accessibility (A11y) & WCAG Guidelines",
      description: "Enforce accessible patterns with ARIA attributes, semantic landmarks, and screen-reader optimizations."
    }
  ]

  if (isDetailed) {
    phase1Lessons.push(
      {
        order_index: 5,
        title: "HTML Forms (Part 2): Advanced Inputs & File Uploads",
        description: "Handle file uploads, datepickers, range inputs, and custom form styling constraints."
      },
      {
        order_index: 6,
        title: "HTML SEO Best Practices & Meta Tags",
        description: "Optimise document headers with OpenGraph, JSON-LD schema markup, and Google crawl standards."
      }
    )
  }

  // Phase 2 lessons
  const phase2Lessons = [
    {
      order_index: 1,
      title: "CSS Selectors, Cascade & Box Model",
      description: "Master padding, margins, borders, specificity weights, cascade rules, and layout rendering."
    },
    {
      order_index: 2,
      title: "Flexible Box Layouts (Flexbox)",
      description: "Design flexible single-dimension containers using justify-content, align-items, and flex-wrap."
    },
    {
      order_index: 3,
      title: "CSS Grid Architecture",
      description: "Construct responsive two-dimensional grid layouts, grid templates, areas, and auto-placement."
    },
    {
      order_index: 4,
      title: "Media Queries & Mobile-First Responsive Design",
      description: "Use CSS breakpoints, fluid sizing units (rem, em, vh, vw), and mobile-first styles."
    }
  ]

  if (isDetailed) {
    phase2Lessons.push(
      {
        order_index: 5,
        title: "CSS Custom Variables & Theme Customization",
        description: "Implement dark mode and theme toggles dynamically using CSS custom properties (variables)."
      },
      {
        order_index: 6,
        title: "CSS Transitions & Micro-Animations",
        description: "Bring static components to life with keyframe animations, bezier timing paths, and hardware acceleration."
      }
    )
  }

  // Phase 3 lessons
  const phase3Lessons = [
    {
      order_index: 1,
      title: "JS Variables, Scope & Data Types",
      description: "Understand var/let/const hoisting, primitive types, type coercion, and memory scopes."
    },
    {
      order_index: 2,
      title: "Functions, Control Flow & Array Operations",
      description: "Write clean closures, loop statements, and map/filter/reduce transformations on collections."
    },
    {
      order_index: 3,
      title: "DOM Manipulation & Event Propagation",
      description: "Select elements, edit styles, attach listeners, and manage capturing and bubbling phases."
    },
    {
      order_index: 4,
      title: "Asynchronous JavaScript & Fetch API",
      description: "Master Promises, async/await blocks, HTTP requests, and rendering fetched JSON payloads."
    }
  ]

  if (isDetailed) {
    phase3Lessons.push(
      {
        order_index: 5,
        title: "JS Closures & Advanced Scope Scenarios",
        description: "Understand execution contexts, scopes, modular patterns, and memoized helper functions."
      },
      {
        order_index: 6,
        title: "JS Fetch API (Part 2): Error Handling & Retry Policies",
        description: "Learn to handle network dropouts, rate limit responses, and construct offline sync managers."
      }
    )
  }

  return {
    title: `Web Development Foundations Path (${level})`,
    description: `A detailed, comprehensive path designed to build production-ready frontends starting with Semantic HTML, moving to Responsive CSS, and mastering JavaScript core concepts.`,
    estimated_weeks: Math.round((isDetailed ? 14 : 10) * weeksMultiplier),
    phases: [
      {
        phase_number: 1,
        title: "Phase 1: Semantic HTML & Document Architecture",
        description: "Master document standards, metadata, form controls, and web accessibility principles.",
        duration_weeks: Math.round((isDetailed ? 4 : 3) * weeksMultiplier),
        lessons: phase1Lessons
      },
      {
        phase_number: 2,
        title: "Phase 2: CSS Box Model & Responsive Layouts",
        description: "Deep dive into CSS selectors, Flexbox models, CSS Grid layout systems, and responsive design practices.",
        duration_weeks: Math.round((isDetailed ? 4 : 3) * weeksMultiplier),
        lessons: phase2Lessons
      },
      {
        phase_number: 3,
        title: "Phase 3: JavaScript Programming Core & DOM API",
        description: "Learn logical program structures, control flows, loops, functions, scopes, and modern DOM interactions.",
        duration_weeks: Math.round((isDetailed ? 6 : 4) * weeksMultiplier),
        lessons: phase3Lessons
      }
    ]
  }
}
