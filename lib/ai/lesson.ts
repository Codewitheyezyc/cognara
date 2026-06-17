import { GeneratedLesson } from '@/types/ai'
import { callClaudeJSON } from './client'
import { LESSON_SYSTEM_PROMPT, buildLessonUserMessage, isCodeSubject } from './prompts'

const depthLabels = ["", "Like I'm 10", "Beginner", "Intermediate", "Advanced", "Expert"];

export async function generateLesson(
  lessonTitle: string,
  phaseTitle: string,
  subject: string,
  level: string,
  depthLevel: number = 2,
  profile?: any
): Promise<GeneratedLesson> {
  const mockFallback = async () => {
    // Simulate network processing delay (2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const cleanTitle = lessonTitle.toLowerCase()

    if (cleanTitle.includes('es6+') || cleanTitle.includes('syntax')) {
      return getES6Lesson(depthLevel)
    } else if (cleanTitle.includes('jsx') || cleanTitle.includes('rendering')) {
      return getJSXLesson(depthLevel)
    } else if (cleanTitle.includes('components') || cleanTitle.includes('props')) {
      return getPropsLesson(depthLevel)
    } else if (cleanTitle.includes('usestate') || cleanTitle.includes('state')) {
      return getuseStateLesson(depthLevel)
    } else if (cleanTitle.includes('useeffect') || cleanTitle.includes('effects')) {
      return getuseEffectLesson(depthLevel)
    }

    // Fallback default lesson content
    return getDefaultLesson(lessonTitle, phaseTitle, subject, level, depthLevel)
  }

  const depthLabel = depthLabels[depthLevel] || 'Beginner'
  const isCode = isCodeSubject(subject)
  const systemPrompt = LESSON_SYSTEM_PROMPT
    .replace(/{subject}/g, subject)
    .replace('{lessonTitle}', lessonTitle)
    .replace('{phaseTitle}', phaseTitle)
    .replace('{depthLevel}', String(depthLevel))
    .replace('{depthLabel}', depthLabel)
    .replace('{isTechnical}', isCode ? 'YES' : 'NO')

  const userPrompt = buildLessonUserMessage({
    lessonTitle,
    phaseTitle,
    subject,
    level,
    depthLevel,
    depthLabel,
    profile
  })


  return callClaudeJSON<GeneratedLesson>(
    systemPrompt,
    userPrompt,
    mockFallback,
    'claude-haiku-4-5-20251001'
  )
}

function getES6Lesson(depthLevel: number): GeneratedLesson {
  const label = depthLabels[depthLevel] || 'Beginner'
  
  let explanation = ''
  let analogy = ''
  let exerciseDesc = ''
  
  if (depthLevel === 1) {
    explanation = "Imagine you are writing a letter to a friend. In the old days, you had to write every word by hand and it took forever. ES6+ is like having magic stickers that write sentences for you! In modern JavaScript, we have smart tricks like arrow functions and destructuring that let us write code with super-short, simple instructions. It's like code shortcuts!"
    analogy = "Think of destructuring like opening a lunchbox. If you want the apple and cookie, you don't need to take the whole lunchbox out. You just grab the apple and cookie directly! That's what destructuring does with data."
    exerciseDesc = "Draw a labeled lunchbox on a paper, and write an arrow function that grabs the 'apple' and 'sandwich' from it!"
  } else if (depthLevel === 2) {
    explanation = "ECMAScript 6 (ES6), released in 2015, introduced major syntax enhancements to JavaScript, changing how we write variable declarations, build functions, and handle data objects. For React development, mastering ES6+ is not optional—most of React's patterns, including state destructuring and arrow component structures, rely directly on modern JS specifications."
    analogy = "Imagine you receive a complete toolbox (an object or array). In older JavaScript, to use a hammer, you had to write `const hammer = toolbox.hammer;` for every single tool. With ES6 destructuring, it is like opening the lid and grabbing exactly the tools you need in one motion: `const { hammer, screwdriver } = toolbox;`."
    exerciseDesc = "Write an arrow function named `getDetails` that accepts a student object: `{ name: string, activeGoal: string, currentStreak: number }`. Destructure the variables in the parameters list, and return a formatted template literal string: `[Name] is on a [Streak]-day streak studying [Goal]`."
  } else if (depthLevel === 3) {
    explanation = "ECMAScript 2015 (ES6) marked a major evolution in JavaScript. It introduced lexical scoping via `let` and `const`, arrow functions that bind `this` lexically, and robust destructuring patterns. React relies heavily on these syntax enhancements—understanding destructuring is crucial for props and hook states, while arrow functions are standard for functional components."
    analogy = "Think of destructuring as database queries for local data structures. Instead of querying individual properties in multiple operations, you specify a schema matching the structure: `const { propA, propB } = object;`. The engine extracts and registers these bindings in the local execution scope in one single, optimized step."
    exerciseDesc = "Write a parameter-destructured arrow function that unpacks nested objects like `{ preferences: { theme: string } }` and supplies fallback default values. Verify correct resolution."
  } else if (depthLevel === 4) {
    explanation = "ES6+ represents a fundamental shift in JavaScript's capabilities, introducing block scoping, lexical contexts, and expressive destructuring. For React engineers, deep knowledge of array/object destructuring and lexical binding behaviors in arrow functions is mandatory to write performant components and avoid common context scope gotchas."
    analogy = "Consider destructuring as compile-time reference unpacking. Rather than creating intermediate reference objects or writing repeated assignment operations which pollute the scope, the JS compiler unpacks the object/array bindings directly into the current execution context stack frame."
    exerciseDesc = "Write a function utilizing JavaScript rest parameters `(...args)` to dynamically group object properties, destructure specific values, and calculate output stats. Handle null-safe checks."
  } else {
    explanation = "The ECMAScript 6 specification overhauled JS execution mechanics with block-scoped bindings, lexically-bound arrow execution contexts, and destructuring patterns. In production React, understanding hoisting differences between declaration styles, execution phase variable bindings, and lexical `this` binding behavior is vital for designing high-performance component state architectures."
    analogy = "Destructuring acts as syntax sugar for declarative identifier binding. The V8 engine optimizes object destructuring by referencing offsets in the hidden class layout rather than executing full prototype lookups for every variable assignment, significantly lowering execution context overhead in high-frequency rendering paths."
    exerciseDesc = "Analyze micro-performance changes in memory footprints when destructuring large nested arrays vs accessing elements via offset pointer loops in deep iterations. Document V8 compilation structures."
  }

  return {
    title: `ES6+ Modern Syntax Refresher (${label})`,
    estimated_minutes: 12,
    sections: [
      {
        type: 'explanation',
        heading: 'Introduction to ES6+ Paradigms',
        body: explanation,
      },

      {
        type: 'analogy',
        heading: 'Understanding Destructuring: A Mental Model',
        body: analogy,
      },
      {
        type: 'code_comparison',
        heading: 'Variable Scope Comparison: Before vs After',
        comparison_label_left: '❌ Legacy Var (Hoisted & Function Scoped)',
        code_left: `function testVar() {
  if (true) {
    var x = 10;
  }
  console.log(x); // Logs 10 (leaked scope!)
}`,
        comparison_label_right: '✅ Modern Const / Let (Block Scoped)',
        code_right: `function testConst() {
  if (true) {
    const x = 10;
  }
  console.log(x); // Throws ReferenceError (safe!)
}`,
        comparison_caption: 'Legacy var leaks variables out of block scopes. Const and let confine variables to the enclosing curly braces {}.',
      },
      {
        type: 'table',
        heading: 'Comparison: var vs let vs const',
        table_headers: ['Keyword', 'Scope', 'Re-assignable', 'Hoisting Behavior'],
        table_rows: [
          ['var', 'Function', 'Yes', 'Initialized as undefined'],
          ['let', 'Block', 'Yes', 'Temporal Dead Zone (Throws error)'],
          ['const', 'Block', 'No', 'Temporal Dead Zone (Throws error)'],
        ],
      },
      {
        type: 'diagram',
        heading: 'Visualizing Variable Scope Boundaries',
        diagram_type: 'comparison',
        diagram_content: `[Global Scope Context]
   └── [Function Context] 
         ├── var variable (visible throughout function)
         └── [Block Statement {}]
               ├── let blockVar (visible only here)
               └── const blockConst (visible only here)`,
      },
      {
        type: 'callout',
        heading: 'Critical Best Practice',
        callout_type: 'tip',
        callout_body: 'Default to declaring all variables with const. Only change to let if you know the reference must be reassigned. Avoid var completely.',
      },
      {
        type: 'code',
        heading: 'Arrow Functions and Object Unpacking',
        code_language: 'javascript',
        code_snippet: `// Unpacking object properties directly in parameters list
const greetUserES6 = ({ name, role = 'Learner' }) => {
  return \`Hello \${name}, role assigned: \${role}!\`;
};

const user = { name: 'Isaac', age: 24 };
console.log(greetUserES6(user)); // => Hello Isaac, role assigned: Learner!`,
        code_caption: 'Destructuring parameters reduces helper code boilerplate and supports default fallback variables.',
      },
      {
        type: 'exercise_code',
        heading: 'Practice Challenge: Code refactoring',
        exercise_language: 'javascript',
        exercise_starter_code: `// Refactor the legacy code below to ES6+ format
// Hint: Use arrow functions, destructuring, and let/const

// Your code here:
`,
        exercise_instructions: exerciseDesc,
        exercise_expected_output: 'John is on a 5-day streak studying JavaScript',
      },
      {
        type: 'resource',
        heading: 'Recommended Resources',
        resource_title: 'MDN Web Docs - ES6 Reference',
        resource_url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
        resource_description: 'Official Mozilla Developer Network JavaScript documentation detailing variables, scopes, and functions.',
      },
      {
        type: 'summary',
        heading: 'Lesson Summary',
        body: `1. Const and Let are block-scoped, protecting variables from leaking.\n2. Arrow functions provide clean inline declarations and lexical this bindings.\n3. Destructuring allows unpacking complex datasets in single expressions.`,
      },
    ],
    key_takeaways: [
      'Const and let enforce block-level containment.',
      'Destructuring enables cleaner parameter and object properties reading.',
      'Template literals simplify expression interpolation and formatting.',
    ],
    next_lesson_preview: 'In the next lesson, we will see how Next.js compiles JSX templates down to virtual DOM structures.',
  }
}

function getJSXLesson(depthLevel: number): GeneratedLesson {
  const label = depthLabels[depthLevel] || 'Beginner'
  
  let explanation = ''
  let analogy = ''
  let exerciseDesc = ''
  
  if (depthLevel === 1) {
    explanation = "JSX is like writing code that looks like a drawing! Instead of writing long code words to build a title or a box, we write simple tags like <h1>Hello</h1>. It looks like HTML, but it lives inside our JavaScript. It is like sketching your website directly in your code codebook!"
    analogy = "Think of JSX like a Lego instructions booklet. The booklet has pictures of Legos (the tags). React reads these pictures, grabs the actual Lego bricks (DOM elements), and builds the final castle for you!"
    exerciseDesc = "Write down a tag representing a picture of a cat with a nice caption underneath!"
  } else if (depthLevel === 2) {
    explanation = "JSX (JavaScript XML) is a syntax extension for JavaScript. It looks like HTML, but compiles down to standard React `React.createElement` or `_jsx` function calls. It allows developers to write structural template outlines directly inside JS files alongside logic components."
    analogy = "Think of JSX as an architectural blueprint. Writing `<h1>Hello</h1>` does not build a physical header instantly. Instead, it creates a JS object outlining what the heading should look like. React reads this blueprint (Virtual DOM) and constructs the real DOM elements (the physical building) on the page."
    exerciseDesc = "Create a JSX expression that maps over an array of subjects: `[\"HTML\", \"CSS\", \"JS\"]`. Render them as list items (`<li>`) inside an unordered list (`<ul>`), making sure to supply a unique `key` parameter to each item."
  } else if (depthLevel === 3) {
    explanation = "JSX is a declarative syntax extension that allows developers to write XML-like code that Next.js translates into React virtual nodes. During compilation, tags are converted to functional calls, ensuring a strict boundary between UI structures and state controllers."
    analogy = "Think of JSX as a schema or declaration. Instead of writing imperative DOM commands (like document.createElement), you declare the desired UI state. The renderer reconciles this declaration against the actual browser DOM, performing minimal mutations to achieve sync."
    exerciseDesc = "Write a custom component that dynamically renders a nested grid of cards based on an input list of user data, passing keys correctly."
  } else if (depthLevel === 4) {
    explanation = "JSX is a syntactic abstraction over React's virtual DOM node compilation. Tools like Babel or SWC compile JSX elements into nested `_jsx` calls. This representation generates immutable VNode descriptions that React uses to build its Fiber node graph, ensuring efficient re-rendering via reconciliation."
    analogy = "Think of JSX as a virtualized structural definition. The compiler compiles these tags into React Element objects containing `type`, `props`, and `key`. The reconciliation engine uses these objects to run diff algorithms against the prior Fiber state tree before committing modifications."
    exerciseDesc = "Construct a performance-optimized list rendering component using JSX, demonstrating structural optimization and key-matching patterns."
  } else {
    explanation = "At execution, JSX compiles to dynamic AST transformations representing React VNodes. The compilation target (e.g. `react/jsx-runtime`) instantiates immutable node descriptors. React processes these descriptors to compile Fiber nodes, evaluating keys and prop changes to schedule DOM updates on the microtask queue."
    analogy = "JSX acts as a declarative manifest for the rendering pipeline. The AST generator translates tags into static structures containing properties like `$$typeof: Symbol(react.element)`. The diffing algorithm resolves matches in the virtual representation before executing batch layout shifts in the rendering frame."
    exerciseDesc = "Build a JSX component demonstrating JSX AST manipulation, custom transpiler configurations, and VNode object injections in the browser thread."
  }

  return {
    title: `Understanding JSX and Rendering (${label})`,
    estimated_minutes: 15,
    sections: [
      {
        type: 'explanation',
        heading: 'What is JSX?',
        body: explanation,
      },

      {
        type: 'analogy',
        heading: 'Blueprints and Buildings',
        body: analogy,
      },
      {
        type: 'code_comparison',
        heading: 'JSX vs Compiled Output',
        comparison_label_left: '✍️ What you write in JSX',
        code_left: `const element = (
  <h1 className="title">
    Hello World
  </h1>
);`,
        comparison_label_right: '⚙️ Compiled JavaScript',
        code_right: `import { jsx as _jsx } from "react/jsx-runtime";
const element = _jsx("h1", {
  className: "title",
  children: "Hello World"
});`,
        comparison_caption: 'JSX is syntax sugar. The compiler compiles HTML tags into lightweight JavaScript objects representing VNodes.',
      },
      {
        type: 'diagram',
        heading: 'The Virtual DOM Reconciliation Cycle',
        diagram_type: 'flowchart',
        diagram_content: `[State Change] 
      │
      ▼
[Generate New JSX Tree] 
      │
      ▼
[Diff against old Virtual DOM] ──► [Calculate minimal changes] ──► [Commit to Browser DOM]`,
      },
      {
        type: 'callout',
        heading: 'Crucial Rule: Root Wrapper Element',
        callout_type: 'warning',
        callout_body: 'JSX must return a single root element. If you have multiple siblings, wrap them in a Fragment (<>...</>) to avoid compilation errors.',
      },
      {
        type: 'exercise_code',
        heading: 'Practice Challenge: JSX Templates',
        exercise_language: 'javascript',
        exercise_starter_code: `// Create a JSX element rendering list items

// Your code here:
`,
        exercise_instructions: exerciseDesc,
        exercise_expected_output: 'Unordered list showing HTML, CSS, JS',
      },
      {
        type: 'resource',
        heading: 'Further Reading',
        resource_title: 'Official React Documentation - Introducing JSX',
        resource_url: 'https://react.dev/learn/writing-markup-with-jsx',
        resource_description: 'Core developer guide to writing semantic, clean JSX layouts and templates.',
      },
      {
        type: 'summary',
        heading: 'Lesson Summary',
        body: `1. JSX is a layout syntax combining HTML structure and JS logic.\n2. Tags compile to React VNode descriptors in-memory.\n3. Fragments group siblings without introducing extra nested divs.`,
      },
    ],
    key_takeaways: [
      'JSX is a transpiled syntax extension for JavaScript.',
      'Every JSX element compiles to a standard React element node object.',
      'JSX blocks must have a single outer root element wrapper.',
    ],
    next_lesson_preview: 'In the next lesson, we will see how components receive properties (props) to make templates modular and reusable.',
  }
}

function getPropsLesson(depthLevel: number): GeneratedLesson {
  const label = depthLabels[depthLevel] || 'Beginner'
  
  let explanation = ''
  let analogy = ''
  let exerciseDesc = ''
  
  if (depthLevel === 1) {
    explanation = "Components are like custom lego blocks we design ourselves. Props are the settings we pass to customize them! For example, if we have a Card block, we can pass props like 'color' or 'title' to make each card look unique. This lets us build one template and reuse it many times with different information!"
    analogy = "Think of a component like a cookie cutter. The cookie cutter determines the shape of the cookies. The props are the toppings you add—like sprinkles or chocolate chips. The cutter is always the same, but the cookies look different based on the props you choose!"
    exerciseDesc = "Design a lego character component and write down the variables you would pass to change its hat and shirt colors!"
  } else if (depthLevel === 2) {
    explanation = "Components are the building blocks of a React application. They are JavaScript functions that return JSX. By splitting the user interface into independent, reusable pieces, you can maintain and scale large systems easily. Props (properties) are parameters passed into these component functions, enabling customization."
    analogy = "A React component is like a cookie cutter. It defines the shape. The props are the ingredients you add to customize each cookie—chocolate chips for one, sprinkles for another. The shape remains the same, but the final outputs look and taste different based on the props you passed in."
    exerciseDesc = "Write a React component named `Badge` that accepts two props: `text` (string) and `isAiGenerated` (boolean). If `isAiGenerated` is true, render a violet border around the badge with a small \"AI\" tag next to the text. Otherwise, render a standard border."
  } else if (depthLevel === 3) {
    explanation = "Components encapsulate UI structures as modular functions. Props act as parameter payloads passed from parent elements to customize children. React enforces props immutability to establish unidirectional data flow and ensure predictable rendering cycles."
    analogy = "Think of props as read-only arguments passed into a pure mathematical function. The function (component) uses these arguments to compute a visual output. Since the inputs are immutable, calling the function with the same props will always yield the identical UI layout."
    exerciseDesc = "Implement a custom user profile card component that supports default props, optional fields, and maps and validates nested object variables safely."
  } else if (depthLevel === 4) {
    explanation = "Components are functional UI modules, and props represent their external immutable interface. React's top-down data flow dictates that props are read-only. Modifying props directly is a major anti-pattern; instead, state changes should be lifted to parent components and passed down as callbacks."
    analogy = "Consider props as configuration descriptors passed down a tree graph. The parent node determines the attributes of the child. When a descriptor updates, React invalidates the sub-tree and triggers a re-evaluation of the child functions with the new parameters."
    exerciseDesc = "Write a component utilizing structural destructuring, rest parameter assignment, and React.memo optimizations to control rendering paths."
  } else {
    explanation = "React components function as pure functions relative to their props. At the Fiber level, props are stored in the `memoizedProps` slot of the Fiber node. During render reconciliation, React performs shallow comparison (`Object.is`) of incoming props to determine if updates can be bailed out or if work needs to be scheduled."
    analogy = "Props serve as immutable parameters for the virtual node factories. The reconciliation engine tracks variations between `pendingProps` and `memoizedProps`. If the reference checks fail or shallow changes are detected, the system executes the component function, compiling a new VNode tree."
    exerciseDesc = "Design a component interface with strict TypeScript typings, generic structures, and benchmark rendering differences during shallow prop compares."
  }

  return {
    title: `Reusable Components and Props (${label})`,
    estimated_minutes: 14,
    sections: [
      {
        type: 'explanation',
        heading: 'Modular Component Architecture',
        body: explanation,
      },

      {
        type: 'analogy',
        heading: 'Baking UI: The Cookie Analogy',
        body: analogy,
      },
      {
        type: 'code_comparison',
        heading: 'Props Immutability Pattern',
        comparison_label_left: '❌ Incorrect (Mutating Props)',
        code_left: `const Badge = (props) => {
  // Never reassign props properties!
  props.text = props.text.toUpperCase();
  return <span className="badge">{props.text}</span>;
};`,
        comparison_label_right: '✅ Correct (Local Transform / Reads)',
        code_right: `const Badge = ({ text }) => {
  const formattedText = text.toUpperCase();
  return <span className="badge">{formattedText}</span>;
};`,
        comparison_caption: 'Props must remain read-only. Transforming values should be done locally inside local constants.',
      },
      {
        type: 'diagram',
        heading: 'Unidirectional Data Flow Diagram',
        diagram_type: 'tree',
        diagram_content: `   [Parent Component] (holds state)
         ├── props: name="Isaac" ──► [UserCard Component] (reads props)
         └── props: name="Jane"  ──► [UserCard Component] (reads props)`,
      },
      {
        type: 'callout',
        heading: 'Immutability Principle',
        callout_type: 'important',
        callout_body: 'Props are strictly read-only. Mutating them will cause React state rendering cycles to break and lead to unpredictable UI states.',
      },
      {
        type: 'exercise_code',
        heading: 'Practice Challenge: Component Creation',
        exercise_language: 'javascript',
        exercise_starter_code: `// Create a Badge component

// Your code here:
`,
        exercise_instructions: exerciseDesc,
        exercise_expected_output: 'Rendered Badge component with text and border',
      },
      {
        type: 'resource',
        heading: 'React Components Guide',
        resource_title: 'React Learn - Passing Props to a Component',
        resource_url: 'https://react.dev/learn/passing-props-to-a-component',
        resource_description: 'Deep dive into property assignment, structural destructuring, and layout customization.',
      },
      {
        type: 'summary',
        heading: 'Lesson Summary',
        body: `1. Components are functions returning JSX layouts.\n2. Props act as external customizable properties.\n3. Unidirectional data flow guarantees that properties remain read-only.`,
      },
    ],
    key_takeaways: [
      'Components are independent, reusable building blocks.',
      'Props are parameters passed down to configure components.',
      'Props are read-only to maintain unidirectional boundaries.',
    ],
    next_lesson_preview: 'Next, we will explore useState to see how components can manage their own internal, mutable memory.',
  }
}

function getuseStateLesson(depthLevel: number): GeneratedLesson {
  const label = depthLabels[depthLevel] || 'Beginner'
  
  let explanation = ''
  let analogy = ''
  let exerciseDesc = ''
  
  if (depthLevel === 1) {
    explanation = "Props are passed to components from the outside, but State is a component's personal memory that lives inside it! It remembers things that change, like how many times a button was clicked or if a box is checked. When the state changes, React automatically updates the screen to show the new info!"
    analogy = "Think of state like a light switch. The light switch has two settings: ON and OFF. When you flip the switch, its setting (state) changes, and the light bulb immediately turns on or off. The switch remembers its current position until you change it again!"
    exerciseDesc = "Write a function that counts how many times you jump, updating the count and telling you if you are tired!"
  } else if (depthLevel === 2) {
    explanation = "Unlike props, which are passed down and immutable, state represents a component's internal memory. It holds values that can change over time based on user interactions, API fetches, or timers. When state values are updated, React schedules a re-render to update the user interface dynamically."
    analogy = "A light switch has a state: it is either ON or OFF. Turning the switch does not change the physical switch module (the component template), but it updates its state. The bulb immediately responds by glowing or going dark. In React, changing the state triggers an immediate visual response on the page."
    exerciseDesc = "Implement a React component named `TogglePanel` that contains a button and a descriptive text box. Use `useState` with a boolean value `isVisible` to show or hide the text box when the button is clicked."
  } else if (depthLevel === 3) {
    explanation = "State is the local mutable data store within a React component. The `useState` hook registers a state variable and setter function inside React's memory cell array. Calling the setter schedules a re-render, triggering React to re-execute the component function and update the Virtual DOM."
    analogy = "Think of component state as a local reactive variable. When the setter executes, React marks the component as 'dirty' and schedules a render pass. The engine compiles a new Virtual DOM tree representing the updated state and commits differences to the layout."
    exerciseDesc = "Create a custom form component handling multiple input fields inside a unified state object, validating parameters before submission."
  } else if (depthLevel === 4) {
    explanation = "State is a hook-managed primitive that binds components to React's scheduler. The `useState` hook returns the current state cell and a dispatcher function. Triggering the dispatcher schedules a reconciliation pass. React batches state modifications within event handlers to minimize rendering overhead."
    analogy = "Consider state as a reactive stream cell. When you call the dispatcher, React doesn't mutate state instantly. Instead, it pushes the update to a queue on the corresponding Fiber node, schedules a transition task, and evaluates the queue during the next render phase."
    exerciseDesc = "Implement a state history backtracking system (undo/redo logic) utilizing functional state updaters and arrays."
  } else {
    explanation = "State is managed in React via a singly-linked list of Hook objects attached to the Fiber node. `useState` leverages this list, storing the current state and queue of updates in a hook object. Calling the dispatcher triggers an update object, adds it to the hook's queue, and schedules a concurrent render task with a specific priority lane."
    analogy = "State represents a memoized cell in the Hook cell list on a Fiber node. The dispatcher executes an updater reducer. React schedules a Fiber walk, comparing hook state queues. The scheduler evaluates pending queue updates in batches during the render phase, optimizing performance via fiber bailouts."
    exerciseDesc = "Construct a custom state reducer hook mimicking useReducer, analyzing internal schedules, lane updates, and batched renders."
  }

  return {
    title: `Managing Component State with useState (${label})`,
    estimated_minutes: 16,
    sections: [
      {
        type: 'explanation',
        heading: 'What is Component State?',
        body: explanation,
      },

      {
        type: 'analogy',
        heading: 'Switching Layouts: Switches and Bulbs',
        body: analogy,
      },
      {
        type: 'code_comparison',
        heading: 'Updating State: Right vs Wrong',
        comparison_label_left: '❌ Direct Mutation (No Re-render)',
        code_left: `const [count, setCount] = useState(0);
const increment = () => {
  // Never mutate state variables directly!
  count = count + 1;
};`,
        comparison_label_right: '✅ Functional Setter (Safe Re-render)',
        code_right: `const [count, setCount] = useState(0);
const increment = () => {
  // Use setter to trigger update scheduler
  setCount(prev => prev + 1);
};`,
        comparison_caption: 'React requires state variables to be updated via dispatcher functions to schedule Virtual DOM rendering passes.',
      },
      {
        type: 'diagram',
        heading: 'Interactive State Update Flow',
        diagram_type: 'process',
        diagram_content: `[User Click Event] ──► [Call setCount()] ──► [React Schedules Re-render] ──► [Diff VNode Graph] ──► [DOM Paint]`,
      },
      {
        type: 'callout',
        heading: 'Asynchronous State Commits',
        callout_type: 'pro_tip',
        callout_body: 'React batches state updates within event handlers. If you need the latest state value immediately inside a callback, use functional setters: `setValue(prev => prev + 1)`.',
      },
      {
        type: 'exercise_code',
        heading: 'Practice Challenge: React State',
        exercise_language: 'javascript',
        exercise_starter_code: `// Manage toggle panel visibility state

// Your code here:
`,
        exercise_instructions: exerciseDesc,
        exercise_expected_output: 'Toggle panel opens and closes on click',
      },
      {
        type: 'resource',
        heading: 'State Documentation Guides',
        resource_title: 'React Dev - State: A Component Memory',
        resource_url: 'https://react.dev/learn/state-a-components-memory',
        resource_description: 'Official introduction to state parameters, useState hooks, and interactive components.',
      },
      {
        type: 'summary',
        heading: 'Lesson Summary',
        body: `1. State holds local component mutable values.\n2. useState exports the current value and a setter dispatcher.\n3. Updating via setter schedules re-renders to paint state modifications.`,
      },
    ],
    key_takeaways: [
      'State represents local mutable values within React components.',
      'useState exports a current reference and setter function in a tuple.',
      'Setters trigger the renderer to compile new Virtual DOM layouts.',
    ],
    next_lesson_preview: 'Next we will explore useEffect to perform side effects like fetching data or syncing with third-party libraries.',
  }
}

function getuseEffectLesson(depthLevel: number): GeneratedLesson {
  const label = depthLabels[depthLevel] || 'Beginner'
  
  let explanation = ''
  let analogy = ''
  let exerciseDesc = ''
  
  if (depthLevel === 1) {
    explanation = "Normally, components just draw things on the screen. But sometimes, they need to do things outside the screen—like talking to the internet, starting a clock timer, or changing the tab title. These extra actions are called Side Effects. We use a tool called `useEffect` to tell our component when to do these actions!"
    analogy = "Think of a smart thermostat. It watches the room. It does not do anything until the temperature changes. When the room gets too cold, it turns on the heater (a side effect). `useEffect` is like a watcher that does an action when a variable changes!"
    exerciseDesc = "Write a watcher that updates your tab title to show the current game score whenever points change!"
  } else if (depthLevel === 2) {
    explanation = "React components should ideally be pure rendering blocks. However, applications need to interact with external systems—such as fetching data over the network, setting up subscriptions, or manipulating DOM elements manually. These operations are called 'side effects', and React provides the `useEffect` hook to execute them safely."
    analogy = "A thermostat monitors the temperature. It doesn't change its display unless the temperature changes. When it detects a change, it fires a side effect: it turns on the heater. In React, `useEffect` acts as a listener that watches specific variables and triggers external actions whenever those variables change."
    exerciseDesc = "Write a component that manages a counter state. Use `useEffect` to synchronize the browser tab title (`document.title`) with the current counter value, running the effect only when the counter changes."
  } else if (depthLevel === 3) {
    explanation = "The `useEffect` hook isolates side effects from the pure render loop. It accepts a callback function and a dependency array. If dependencies change between renders, React schedules the callback to run after the DOM updates, ensuring side effects don't block the visual paint layout."
    analogy = "Think of `useEffect` as a post-render action listener. It runs asynchronously after React has completed writing layout shifts to the DOM. The dependency array acts as an expression cache, validating if the current render variables match the cached ones to determine if execution is needed."
    exerciseDesc = "Write a user data fetching hook that runs when an input `userId` changes, aborting active fetches if a new request is triggered."
  } else if (depthLevel === 4) {
    explanation = "The `useEffect` hook acts as a synchronization boundary. It schedules side effects to run asynchronously after layouts are painted. Returning a function from the effect sets up cleanups. The dependency array must list all variables referenced within the effect to prevent stale closure bugs."
    analogy = "Consider `useEffect` as a transaction synchronization loop. The effect callback initiates a transaction with an external system (like a fetch or listener). The cleanup function acts as a transaction rollback, executing on unmount or before the next execution to clear memory contexts."
    exerciseDesc = "Build an event listener synchronizer using useEffect, managing window dimensions, debounce logic, and cleanups correctly."
  } else {
    explanation = "In the Fiber architecture, effects are represented as effect objects in a circular linked list on the Fiber's update queue. `useEffect` registers these effects during the render phase. During the commit phase, React walks this list, executing cleanups first, then executing effect callbacks asynchronously using the Scheduler library."
    analogy = "Effects are nodes in a circular linked list tracked in the `updateQueue` of the Fiber node. During the commit phase, React processes these nodes under the `Passive` tag. The scheduler schedules these callbacks on a post-paint task, preserving layout paint times while resolving asynchronous actions."
    exerciseDesc = "Analyze task scheduling priorities in React. Assess how useEffect microtasks coordinate relative to paint loops under concurrent rendering."
  }

  return {
    title: `Side Effects with useEffect (${label})`,
    estimated_minutes: 18,
    sections: [
      {
        type: 'explanation',
        heading: 'What are Side Effects?',
        body: explanation,
      },

      {
        type: 'analogy',
        heading: 'Watcher Circuits: Climate and Action',
        body: analogy,
      },
      {
        type: 'code_comparison',
        heading: 'Effect Subscription Cleanups',
        comparison_label_left: '❌ Leaky Listener (Memory Leak Risk)',
        code_left: `useEffect(() => {
  window.addEventListener('resize', handleResize);
  // Missing cleanup function!
}, []);`,
        comparison_label_right: '✅ Safe Subscription (Rollback Return)',
        code_right: `useEffect(() => {
  window.addEventListener('resize', handleResize);
  
  // Return cleanup to remove listeners on unmount
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);`,
        comparison_caption: 'Always clean up event listeners, timers, or global variables to prevent memory leaks when components unmount.',
      },
      {
        type: 'diagram',
        heading: 'Lifecycle of an Asynchronous Effect',
        diagram_type: 'timeline',
        diagram_content: `[1. Component Mount] ──► [2. Render DOM] ──► [3. Run Effect Callback]
                                                  │
[5. Component Unmount] ◄── [4. Run Cleanup Function] ◄── [State/Props Change]`,
      },
      {
        type: 'callout',
        heading: 'Memory Leak Warnings',
        callout_type: 'warning',
        callout_body: 'Leaving timers (setInterval) or event listeners active after unmounting can cause severe memory leaks. Always return a cleanup function to roll back effects.',
      },
      {
        type: 'exercise_code',
        heading: 'Practice Challenge: Watcher Hook',
        exercise_language: 'javascript',
        exercise_starter_code: `// Synchronize page title with click counter

// Your code here:
`,
        exercise_instructions: exerciseDesc,
        exercise_expected_output: 'Browser title dynamically reflects count changes',
      },
      {
        type: 'resource',
        heading: 'Syncing with Effects Guidelines',
        resource_title: 'React Dev - Synchronizing with Effects',
        resource_url: 'https://react.dev/learn/synchronizing-with-effects',
        resource_description: 'Core instructions detailing side effect isolation, dependency validation, and component cleanups.',
      },
      {
        type: 'summary',
        heading: 'Lesson Summary',
        body: `1. Effects sync components with external systems.\n2. Dependency arrays control when the callback triggers.\n3. Return cleanups roll back resources to maintain stability.`,
      },
    ],
    key_takeaways: [
      'useEffect isolates external interactions (side effects) from core rendering.',
      'Dependency arrays regulate effect executions based on value shifts.',
      'Cleanup callbacks purge active timers and events to stabilize memory.',
    ],
    next_lesson_preview: 'In the next lesson, we will see how to handle forms and apply input validations using React Hook Form.',
  }
}

function getDefaultLesson(lessonTitle: string, phaseTitle: string, subject: string, level: string, depthLevel: number): GeneratedLesson {
  const label = depthLabels[depthLevel] || 'Beginner'
  const technical = isCodeSubject(subject)
  
  let explanation = ''
  let analogy = ''
  let exerciseDesc = ''
  
  if (technical) {
    if (depthLevel === 1) {
      explanation = `Welcome! Today we are learning about ${lessonTitle}. In our ${subject} journey, this topic helps us organize things and keep them clean. We will explain how this works using easy words and simple pictures, so you can start writing your own code projects right away!`
      analogy = `To understand ${lessonTitle}, think of a toy box. When you have many toys, you don't throw them all over the floor. You put them in little labeled drawers so you can find them easily later. ${lessonTitle} does the same thing by organizing data into clean boxes!`
      exerciseDesc = "Draw three boxes and write down the names of items you would sort into them!"
    } else if (depthLevel === 2) {
      explanation = `In this lesson, we explore the core mental models and execution parameters behind ${lessonTitle} as part of the ${phaseTitle} stage of your ${subject} journey. Calibrated for a student at the ${level} tier, this module aims to transition you from theoretical understanding to direct code and practical deployment.`
      analogy = `To understand the core mechanisms of ${lessonTitle}, think of a sorting warehouse. Data and tasks represent packages arriving on the loading dock. Instead of attempting to sort them all at once (causing blockages), the warehouse structures organized lanes, filters, and triggers. Similarly, ${lessonTitle} provides structure to handle execution flows smoothly.`
      exerciseDesc = "Write a simple helper block in JS implementing the core logic of this concept, testing it with a mock string."
    } else if (depthLevel === 3) {
      explanation = `This module covers the operational patterns and paradigms of ${lessonTitle} within the context of ${phaseTitle} in ${subject}. It is calibrated to bridge basic syntax definitions with structural implementation patterns, explaining not just the 'how' but the underlying 'why' of this pattern.`
      analogy = `To visualize the mechanics of ${lessonTitle}, think of an event-driven dispatch router in a supply chain. Rather than having modules request resources directly, they register handlers on the router. The router delegates events to the appropriate channels, reducing component dependency coupling.`
      exerciseDesc = "Create an active modular script that maps and transforms input values based on custom rules."
    } else if (depthLevel === 4) {
      explanation = `This analysis explores the technical architecture and implementation strategies for ${lessonTitle} within ${phaseTitle}. Calibrated for advanced learners, we evaluate performance considerations, typical edge cases, and design trade-offs associated with this pattern in modern production codebases.`
      analogy = `Consider ${lessonTitle} as a virtualized execution pipeline. By isolating state transitions into distinct, idempotent transactions, the system prevents side-channel modifications and minimizes reference invalidation throughout the sub-tree structures.`
      exerciseDesc = "Build a refactored implementation that optimizes memory usage and isolates scope under high-concurrency."
    } else {
      explanation = `This theoretical overview analyzes the design principles, concurrency implications, and architectural parameters of ${lessonTitle} during ${phaseTitle}. Calibrated for expert engineers, we review memory layout models, hidden classes optimizations, and garbage collection behaviors associated with these patterns.`
      analogy = `In an optimized compiler environment, ${lessonTitle} behaves similarly to an inline instruction cache. The virtual machine resolves references by optimizing call site offsets, bypassing generic prototype chains to maintain high execution density within critical path loops.`
      exerciseDesc = "Analyze layout benchmarks and bytecode traces for this execution model, assessing hidden class allocations."
    }

    return {
      title: `${lessonTitle} (${label})`,
      estimated_minutes: 10,
      sections: [
        {
          type: 'explanation',
          heading: `Introduction to ${lessonTitle}`,
          body: explanation,
        },
        {
          type: 'analogy',
          heading: 'Working Analogy',
          body: analogy,
        },
        {
          type: 'code_comparison',
          heading: 'Refactoring Example',
          comparison_label_left: '❌ Legacy Approach (Messy / Coupled)',
          code_left: `function runLegacy(data) {
  // Hardcoded values & global pollution
  window.tempData = data;
  return window.tempData;
}`,
          comparison_label_right: '✅ Modular Approach (Clean / Scoped)',
          code_right: `function runModern(data) {
  // Encapsulated local references
  const localData = { ...data };
  return localData;
}`,
          comparison_caption: 'Decoupling references and encapsulating logic leads to cleaner compilation and unit-testing.',
        },
        {
          type: 'table',
          heading: 'Comparison Breakdown',
          table_headers: ['Metric', 'Legacy Method', 'Modern Method'],
          table_rows: [
            ['Maintainability', 'Low', 'High'],
            ['Reusability', 'Hard', 'Easy'],
            ['Isolation', 'None', 'Complete'],
          ],
        },
        {
          type: 'callout',
          heading: 'Key Architectural Takeaway',
          callout_type: 'important',
          callout_body: `Always decouple execution parameters from display layouts when implementing ${lessonTitle}. This isolates rendering updates.`,
        },
        {
          type: 'exercise_task',
          heading: 'Practical Exercise',
          exercise_instructions: exerciseDesc,
          exercise_steps: [
            'Identify the primary data entities in your application',
            'Map relationships between the entities',
            'Sort them according to dependencies',
            'Verify that all structural dependencies are resolved'
          ]
        },
        {
          type: 'resource',
          heading: 'Recommended Resources',
          resource_title: 'MDN Developer Documentation',
          resource_url: 'https://developer.mozilla.org',
          resource_description: 'Core developer glossary, guides, and specifications for modern programming concepts.',
        },
        {
          type: 'summary',
          heading: 'Lesson Summary',
          body: `1. Encapsulation protects scope parameters.\n2. Decoupling structures enable easier automated testing.\n3. Optimizations limit re-render footprints in complex engines.`,
        },
      ],
      key_takeaways: [
        `Mastering ${lessonTitle} is essential for scaling applications in the ${subject} domain.`,
        'Encapsulation patterns help prevent global conflicts and structure predictable flows.',
        'Isolating functions ensures modular code blocks are easily unit-tested.',
      ],
      next_lesson_preview: 'Next, we will test your understanding of this topic with a quick quiz assessment.',
    }
  } else {
    // Non-technical content mock
    if (depthLevel === 1) {
      explanation = `Welcome! Today we are learning about ${lessonTitle}. In our ${subject} journey, this topic is like the foundation of a house. We will explain it using simple everyday words and clear guides, so you can practice your new skill right away!`
      analogy = `To understand ${lessonTitle}, think of sorting your clothes. You put shirts in one drawer, pants in another, and socks in a third. Labeled drawers make it easy to find what you need. ${lessonTitle} does the same by organizing your work steps!`
      exerciseDesc = `Write down three categories of items you use in ${subject} and list one item for each category.`
    } else if (depthLevel === 2) {
      explanation = `In this lesson, we explore the essential techniques and processes behind ${lessonTitle} as part of the ${phaseTitle} stage of your ${subject} journey. Calibrated for a student at the ${level} tier, this module aims to transition you from basic understanding to practical, real-world application.`
      analogy = `To understand the core mechanisms of ${lessonTitle}, think of baking a cake. If you add ingredients in the wrong order or skip a step, the cake won't rise. Similarly, ${lessonTitle} provides a clear, ordered set of instructions to guarantee success in your craft.`
      exerciseDesc = "Write a one-paragraph description of how you would apply this concept to a real project."
    } else if (depthLevel === 3) {
      explanation = `This module covers the operational techniques and best practices of ${lessonTitle} within the context of ${phaseTitle} in ${subject}. It is calibrated to bridge basic definitions with professional structures, explaining not just 'how' to perform the steps but the underlying 'why' of each method.`
      analogy = `To visualize the mechanics of ${lessonTitle}, think of a musical orchestra. Each instrument must play at the correct volume and time. If one instrument plays out of turn, it disrupts the harmony. Similarly, ${lessonTitle} coordinates different resources to create a seamless workflow.`
      exerciseDesc = "List three common challenges in this area and write down a mitigation plan for each."
    } else if (depthLevel === 4) {
      explanation = `This analysis explores the professional methods and strategies for ${lessonTitle} within ${phaseTitle}. Calibrated for advanced students, we evaluate performance considerations, quality metrics, and trade-offs associated with different techniques in professional settings.`
      analogy = `Consider ${lessonTitle} as a precision blueprints assembly. By isolating each stage of production into checked milestones, the craftsman prevents structural defects and minimizes waste throughout the creation process.`
      exerciseDesc = "Create a detailed workflow checklist for a complex project, detailing quality standards at each step."
    } else {
      explanation = `This comprehensive overview analyzes the design principles, historical contexts, and master-level parameters of ${lessonTitle} during ${phaseTitle}. Calibrated for expert practitioners, we review advanced material selections, efficiency loops, and aesthetic alignments.`
      analogy = `In master-level craft, ${lessonTitle} behaves like muscle memory. The expert doesn't think about individual movements; rather, the entire sequence flows naturally because of deep structural habits built over years of deliberate practice.`
      exerciseDesc = "Outline an expert-level critique framework for evaluating work quality in this domain, detailing the core attributes."
    }

    return {
      title: `${lessonTitle} (${label})`,
      estimated_minutes: 10,
      sections: [
        {
          type: 'explanation',
          heading: `Introduction to ${lessonTitle}`,
          body: explanation,
        },
        {
          type: 'analogy',
          heading: 'Working Analogy',
          body: analogy,
        },
        {
          type: 'diagram',
          heading: 'Process Flowchart',
          diagram_type: 'process',
          diagram_content: `[Start Preparation] ──► [Apply Techniques] ──► [Perform Quality Check] ──► [Final Review]`,
        },
        {
          type: 'table',
          heading: 'Comparison Breakdown',
          table_headers: ['Method Type', 'Primary Benefit', 'Common Pitfall'],
          table_rows: [
            ['Traditional Method', 'High control and custom feel', 'Takes more time and practice'],
            ['Accelerated Method', 'Faster results for standard tasks', 'May reduce custom details'],
          ],
        },
        {
          type: 'callout',
          heading: 'Key Takeaway',
          callout_type: 'important',
          callout_body: `Always verify your preparation steps before committing to the final application in ${lessonTitle}. This prevents mistakes.`,
        },
        {
          type: 'exercise_task',
          heading: 'Practical Exercise',
          exercise_instructions: exerciseDesc,
          exercise_steps: [
            'Gather the necessary materials and workspace tools',
            'Perform a small practice trial to calibrate your setup',
            'Execute the core technique outlined in this lesson',
            'Conduct a final quality check and note any improvements needed'
          ]
        },
        {
          type: 'resource',
          heading: 'Recommended Resources',
          resource_title: `Craft Guild Guides - ${subject}`,
          resource_url: 'https://en.wikipedia.org/wiki/Craft',
          resource_description: 'An overview of historical techniques, guild structures, and training standards in manual crafts.',
        },
        {
          type: 'summary',
          heading: 'Lesson Summary',
          body: `1. Ordered steps prevent mistakes and material waste.\n2. Quality checks at milestones guarantee consistent outcomes.\n3. Consistent practice builds reliable habits and muscle memory.`,
        },
      ],
      key_takeaways: [
        `Mastering ${lessonTitle} is essential for refining your skills in the ${subject} domain.`,
        'Ordered checklists help prevent process conflicts and keep your work organized.',
        'Continuous practice ensures high quality and efficiency in your output.',
      ],
      next_lesson_preview: 'Next, we will test your understanding of this topic with a quick quiz assessment.',
    }
  }
}
