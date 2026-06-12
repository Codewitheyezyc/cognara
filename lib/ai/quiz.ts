import { GeneratedQuiz, QuizQuestion } from '@/types/ai'
import { callClaudeJSON } from './client'
import { QUIZ_SYSTEM_PROMPT, buildQuizUserMessage } from './prompts'

export async function generateQuiz(
  lessonTitle: string,
  subject: string,
  level: string,
  keyTakeaways: string[]
): Promise<GeneratedQuiz> {
  const mockFallback = async () => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const cleanTitle = lessonTitle.toLowerCase()

    if (cleanTitle.includes('es6+') || cleanTitle.includes('syntax')) {
      return { questions: getES6Questions() }
    } else if (cleanTitle.includes('jsx') || cleanTitle.includes('rendering')) {
      return { questions: getJSXQuestions() }
    } else if (cleanTitle.includes('components') || cleanTitle.includes('props')) {
      return { questions: getPropsQuestions() }
    } else if (cleanTitle.includes('usestate') || cleanTitle.includes('state')) {
      return { questions: getuseStateQuestions() }
    } else if (cleanTitle.includes('useeffect') || cleanTitle.includes('effects')) {
      return { questions: getuseEffectQuestions() }
    }

    return { questions: getDefaultQuestions(lessonTitle) }
  }

  const userPrompt = buildQuizUserMessage({
    lessonTitle,
    subject,
    level,
    keyTakeaways
  })

  return callClaudeJSON<GeneratedQuiz>(
    QUIZ_SYSTEM_PROMPT,
    userPrompt,
    mockFallback
  )
}

function getES6Questions(): QuizQuestion[] {
  return [
    {
      id: 'es6_q1',
      type: 'multiple_choice',
      question: 'Which variable declaration keyword should you use by default in modern JavaScript to prevent re-assignment?',
      options: ['var', 'let', 'const', 'def'],
      correct_answer: 'const',
      explanation: 'Using const by default enforces reference immutability, preventing accidental re-assignment of values. If the reference needs to change, let should be used.'
    },
    {
      id: 'es6_q2',
      type: 'true_false',
      question: 'Variables declared with let and const are block-scoped and hoisted, but they cannot be accessed before their declaration due to the Temporal Dead Zone.',
      correct_answer: 'true',
      explanation: 'Unlike var (which is initialized as undefined), let and const variables exist in a Temporal Dead Zone from the start of the block until the declaration is processed, throwing a ReferenceError if accessed early.'
    },
    {
      id: 'es6_q3',
      type: 'fill_blank',
      question: 'Lexical context binding issues of the keyword "this" inside callbacks are resolved by using _____ functions.',
      correct_answer: 'arrow',
      explanation: 'Arrow functions do not bind their own "this" value. They inherit "this" from the outer scope in which they are defined, which is extremely helpful inside event listeners or async callbacks.'
    },
    {
      id: 'es6_q4',
      type: 'multiple_choice',
      question: 'What is the outcome of destructuring a non-existent property from an object, like const { nickname } = user, if no default value is defined?',
      options: [
        'It throws a NullPointerException',
        'It evaluates to undefined',
        'It throws a ReferenceError',
        'It evaluates to null'
      ],
      correct_answer: 'It evaluates to undefined',
      explanation: 'In JavaScript, accessing a non-existent key from an object evaluates to undefined. Destructuring works the same way and results in the binding being assigned undefined.'
    },
    {
      id: 'es6_q5',
      type: 'multiple_choice',
      question: 'Consider this code: for (var i = 0; i < 3; i++) { setTimeout(() => console.log(i), 100); }. What does it print, and why?',
      options: [
        '0, 1, 2 — because setTimeout retains the index at each execution frame.',
        '3, 3, 3 — because var has function scope and i equals 3 when the timer callbacks execute.',
        'undefined, undefined, undefined — because the loop terminates early.',
        'It throws a ReferenceError — because i is not accessible in the async callback.'
      ],
      correct_answer: '3, 3, 3 — because var has function scope and i equals 3 when the timer callbacks execute.',
      explanation: 'Because var is function-scoped, there is only one shared binding for i. By the time the async setTimeout triggers, the loop has completed, leaving i equal to 3. Replacing var with let creates a new block-scoped binding for i in each loop iteration, printing 0, 1, 2.'
    }
  ]
}

function getJSXQuestions(): QuizQuestion[] {
  return [
    {
      id: 'jsx_q1',
      type: 'multiple_choice',
      question: 'What does JSX compile down to in standard modern React environments?',
      options: [
        'Direct HTML strings inserted into innerHTML',
        'Standard JavaScript function calls (like _jsx or React.createElement)',
        'Binary instructions interpreted by browser threads',
        'Custom web component descriptors'
      ],
      correct_answer: 'Standard JavaScript function calls (like _jsx or React.createElement)',
      explanation: 'JSX is syntax sugar. The compiler (Babel/SWC) compiles JSX elements into nested JavaScript function calls that generate Virtual DOM node descriptors.'
    },
    {
      id: 'jsx_q2',
      type: 'true_false',
      question: 'JSX requires a single root element wrapper because JavaScript functions can only return a single value.',
      correct_answer: 'true',
      explanation: 'Under the hood, JSX compiles to function calls. Since a JS function can only return a single value/object, JSX expressions must be enclosed in a single wrapper tag or Fragment (<>...</>).'
    },
    {
      id: 'jsx_q3',
      type: 'fill_blank',
      question: 'The lightweight in-memory representation of the real DOM that React uses to run diff checks is called the _____ DOM.',
      correct_answer: 'virtual',
      explanation: 'The Virtual DOM (VDOM) is a lightweight copy of the browser DOM represented as JavaScript objects, allowing React to compute mutations efficiently before painting them.'
    },
    {
      id: 'jsx_q4',
      type: 'multiple_choice',
      question: 'Why must you supply a unique "key" prop to lists mapped in JSX templates?',
      options: [
        'To speed up CSS styles matching inside the DOM tree.',
        'To help React identify which items have changed, been added, or been removed during reconciliation.',
        'To automatically bind local state values to each child item.',
        'To compile the list elements into static static nodes.'
      ],
      correct_answer: 'To help React identify which items have changed, been added, or been removed during reconciliation.',
      explanation: 'Keys provide a stable identity for mapped list items. React uses keys during the diff phase to determine if a list child can be reordered or reused, avoiding full re-mounts.'
    },
    {
      id: 'jsx_q5',
      type: 'multiple_choice',
      question: 'What happens when you write a JSX element with lowercase letters, like <customElement />?',
      options: [
        'React compiles it as a standard built-in HTML tag.',
        'React throws a compile-time SyntaxError.',
        'It searches for a local component named customElement in current scope.',
        'The tag is ignored and skipped in the DOM tree.'
      ],
      correct_answer: 'React compiles it as a standard built-in HTML tag.',
      explanation: 'In JSX, lowercase tags are treated as built-in HTML nodes (like div, span). User-defined React components must start with an uppercase letter so the compiler resolves them as JavaScript references.'
    }
  ]
}

function getPropsQuestions(): QuizQuestion[] {
  return [
    {
      id: 'props_q1',
      type: 'multiple_choice',
      question: 'What is the primary constraint regarding "props" in React?',
      options: [
        'Props can only contain primitive string types.',
        'Props are strictly read-only and immutable.',
        'Props must be defined using global database schemas.',
        'Props can only be passed between sibling components.'
      ],
      correct_answer: 'Props are strictly read-only and immutable.',
      explanation: 'React enforces unidirectional data flow. Props are passed from parent to child and must never be mutated by the receiving child component.'
    },
    {
      id: 'props_q2',
      type: 'true_false',
      question: 'You can pass functions, objects, and other JSX elements as props to child components.',
      correct_answer: 'true',
      explanation: 'Props are highly flexible. You can pass any JavaScript data type, including primitive numbers, strings, arrays, complex objects, functions (callbacks), and even full JSX templates.'
    },
    {
      id: 'props_q3',
      type: 'fill_blank',
      question: 'React component props passed between tags are accessible via the special prop named _____.',
      correct_answer: 'children',
      explanation: 'The children prop is a special prop that automatically contains whatever JSX content is placed between the opening and closing tags of a custom component.'
    },
    {
      id: 'props_q4',
      type: 'multiple_choice',
      question: 'What is the outcome if you try to mutate a prop directly inside a child component, like props.username = "Jane"?',
      options: [
        'React throws a hard runtime exception immediately.',
        'It silently changes the value in the UI but does not trigger a re-render.',
        'It is an anti-pattern that violates component purity and may lead to UI inconsistency or read-only crashes.',
        'The change automatically updates the parent component state.'
      ],
      correct_answer: 'It is an anti-pattern that violates component purity and may lead to UI inconsistency or read-only crashes.',
      explanation: 'React props are frozen (read-only) in strict mode. Directly mutating a prop violates the purity guidelines and will lead to synchronization issues since React does not track prop mutations for rendering.'
    },
    {
      id: 'props_q5',
      type: 'multiple_choice',
      question: 'How does React.memo optimize components relative to their props?',
      options: [
        'It saves the component state into local storage.',
        'It checks the DOM and skips execution if the elements look the same.',
        'It performs a shallow comparison of props and skips rendering if the props are unchanged.',
        'It compiles the props values into static JSX descriptors.'
      ],
      correct_answer: 'It performs a shallow comparison of props and skips rendering if the props are unchanged.',
      explanation: 'React.memo is a higher-order component that wraps a functional component. It performs a shallow reference check on incoming props; if they are identical, React reuses the previous rendered output, skipping the render walk.'
    }
  ]
}

function getuseStateQuestions(): QuizQuestion[] {
  return [
    {
      id: 'state_q1',
      type: 'multiple_choice',
      question: 'What is the main purpose of state inside a React component?',
      options: [
        'To hold global API key configurations.',
        'To store mutable, reactive data that triggers a UI re-render when changed.',
        'To connect the browser directly to local files.',
        'To define static styling rules.'
      ],
      correct_answer: 'To store mutable, reactive data that triggers a UI re-render when changed.',
      explanation: 'State is the internal memory of a component. When values in state change (via its setter function), React automatically schedules a render pass to update the visible screen.'
    },
    {
      id: 'state_q2',
      type: 'true_false',
      question: 'If you modify a state variable directly (e.g., stateVal = 5), React will automatically trigger a component re-render.',
      correct_answer: 'false',
      explanation: 'React only tracks state changes through the setter dispatcher function returned by useState. Direct mutations do not notify React, meaning the screen will not update.'
    },
    {
      id: 'state_q3',
      type: 'fill_blank',
      question: 'To update state based on a previous value without encountering stale closure issues, you should pass a _____ function to the state setter.',
      correct_answer: 'functional',
      explanation: 'Passing a functional updater (e.g., setCount(prev => prev + 1)) ensures you receive the latest, queue-resolved state value, preventing stale updates in asynchronous scopes.'
    },
    {
      id: 'state_q4',
      type: 'multiple_choice',
      question: 'Consider: const [user, setUser] = useState({ name: "Isaac", age: 24 }). How do you update the age property correctly?',
      options: [
        'setUser(user.age = 25)',
        'user.age = 25; setUser(user)',
        'setUser({ ...user, age: 25 })',
        'setUser({ age: 25 })'
      ],
      correct_answer: 'setUser({ ...user, age: 25 })',
      explanation: 'React state updates replace the previous state object rather than merging it. To update nested values, you must spread the existing properties first and then overwrite the specific key.'
    },
    {
      id: 'state_q5',
      type: 'multiple_choice',
      question: 'Why does React batch multiple state setter calls inside a single click handler function?',
      options: [
        'To block garbage collection cycles until execution finishes.',
        'To group them into a single render pass, reducing paint overhead and optimizing rendering performance.',
        'To convert the setters into synchronous calls.',
        'To store the batch values in the browser cookies.'
      ],
      correct_answer: 'To group them into a single render pass, reducing paint overhead and optimizing rendering performance.',
      explanation: 'React automatic batching bundles state updates within event handlers. Instead of executing multiple costly render passes, React resolves all setters in the call stack and commits the final result in one single render pass.'
    }
  ]
}

function getuseEffectQuestions(): QuizQuestion[] {
  return [
    {
      id: 'effect_q1',
      type: 'multiple_choice',
      question: 'When does a useEffect block with an empty dependency array ([]) run?',
      options: [
        'On every render pass of the component.',
        'Only once, after the component has mounted to the DOM.',
        'Every time the parent component changes its own state.',
        'Just before the component is destroyed.'
      ],
      correct_answer: 'Only once, after the component has mounted to the DOM.',
      explanation: 'An empty dependency array indicates the effect has no variables to track. React executes it once, immediately after the initial layout mounting.'
    },
    {
      id: 'effect_q2',
      type: 'true_false',
      question: 'Failing to return a cleanup function from a useEffect that sets up a setInterval will result in a memory leak when the component unmounts.',
      correct_answer: 'true',
      explanation: 'Subscriptions, timers, and event listeners continue running in the background even after a component is removed from the DOM. Returning a cleanup callback clears these resources.'
    },
    {
      id: 'effect_q3',
      type: 'fill_blank',
      question: 'The function returned from the useEffect callback that runs before execution and on unmount is called the _____ function.',
      correct_answer: 'cleanup',
      explanation: 'The cleanup function is returned by the effect callback. React runs it to tear down active streams, listeners, or timers, preventing reference leaks.'
    },
    {
      id: 'effect_q4',
      type: 'multiple_choice',
      question: 'What happens if you reference a state variable inside useEffect, but omit it from the dependency array?',
      options: [
        'React throws a compile-time SyntaxError.',
        'The effect will trigger an infinite loop.',
        'The effect might capture stale data because it does not update when that state variable changes.',
        'The state variable is automatically converted to read-only.'
      ],
      correct_answer: 'The effect might capture stale data because it does not update when that state variable changes.',
      explanation: 'If a variable is missing from the dependency list, React will not re-run the effect when that variable changes, causing the effect scope to hold onto its old value (a stale closure).'
    },
    {
      id: 'effect_q5',
      type: 'multiple_choice',
      question: 'If you update state inside a useEffect without specifying a dependency array, what is the outcome?',
      options: [
        'Nothing, this is standard React behavior.',
        'An infinite rendering loop, because updating state triggers a render, which runs the effect, which updates state again.',
        'React automatically memoizes the effect to prevent rendering loops.',
        'The effect triggers only on user events.'
      ],
      correct_answer: 'An infinite rendering loop, because updating state triggers a render, which runs the effect, which updates state again.',
      explanation: 'An effect without a dependency array runs after every render. If that effect updates state, it triggers a new render, running the effect again, resulting in an infinite rendering loop.'
    }
  ]
}

function getDefaultQuestions(lessonTitle: string): QuizQuestion[] {
  return [
    {
      id: 'def_q1',
      type: 'multiple_choice',
      question: `What is the primary objective of studying ${lessonTitle}?`,
      options: [
        'To implement complex databases.',
        'To master modular architectures and conceptual design patterns.',
        'To override browser security settings.',
        'To style pages using absolute layouts.'
      ],
      correct_answer: 'To master modular architectures and conceptual design patterns.',
      explanation: 'Studying these concepts ensures you build robust foundations, write clean code structure, and avoid common development mistakes.'
    },
    {
      id: 'def_q2',
      type: 'true_false',
      question: `Understanding the foundational patterns of ${lessonTitle} is crucial for designing modern, scalable web interfaces.`,
      correct_answer: 'true',
      explanation: 'Modern web development relies on structural paradigms. Understanding these concepts enables engineering scalable interfaces.'
    },
    {
      id: 'def_q3',
      type: 'fill_blank',
      question: `To verify that our modules function independently, we implement automated _____ tests.`,
      correct_answer: 'unit',
      explanation: 'Unit tests confirm that isolated pieces of functions execute correctly without requiring the entire system context.'
    },
    {
      id: 'def_q4',
      type: 'multiple_choice',
      question: 'What is a major benefit of separating execution logic from display structures?',
      options: [
        'It speeds up database load times.',
        'It improves maintainability, making code easier to test and reuse.',
        'It automatically updates CSS styling tags.',
        'It runs compilation in the background.'
      ],
      correct_answer: 'It improves maintainability, making code easier to test and reuse.',
      explanation: 'Decoupling display layouts from business logic keeps your functions clear, testable, and reusable across different platforms.'
    },
    {
      id: 'def_q5',
      type: 'multiple_choice',
      question: 'Which tool handles static validation of typings and parameters in a TypeScript application?',
      options: [
        'Babel transpiler',
        'TypeScript compiler (tsc)',
        'V8 JavaScript engine',
        'Chrome DevTools console'
      ],
      correct_answer: 'TypeScript compiler (tsc)',
      explanation: 'The TypeScript compiler performs static analysis to catch type mismatches, parameter omissions, and syntax bugs before compilation.'
    }
  ]
}
