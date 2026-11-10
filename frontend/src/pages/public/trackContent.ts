// Built-in description of each track, shown on the track page even when no cohort is open.
// A program's own fields in the database (description, outcomes, curriculum, duration…)
// take precedence when present. DRAFT copy — review against what tutors actually teach.

export interface TrackContent {
  slug: string;
  track: string;
  tagline: string;
  overview: string;
  duration: string;
  format: string;
  schedule: string;
  level: string;
  outcomes: string[];
  curriculum: { week: number; title: string; topics: string[] }[];
}

export const TRACKS: Record<string, TrackContent> = {
  frontend: {
    slug: 'frontend',
    track: 'Frontend Engineering',
    tagline: 'Build fast, beautiful web apps people love to use.',
    overview:
      'Go from your first line of HTML to shipping production-grade React and TypeScript apps. Every week you build something real, get it reviewed by your tutor, and finish with a capstone you can show employers.',
    duration: '2 months (8 weeks)',
    format: 'Live online classes',
    schedule: 'Fri, Sat & Sun · 4:30–6:30pm WAT',
    level: 'Beginner friendly',
    outcomes: [
      'Write semantic, accessible HTML and modern CSS',
      'Build responsive layouts that work on any phone',
      'Program confidently in JavaScript and TypeScript',
      'Build component-based apps with React',
      'Fetch, cache and display data from real APIs',
      'Use Git and GitHub like a professional team',
      'Test, debug and deploy your apps to the internet',
      'Present a polished capstone project',
    ],
    curriculum: [
      { week: 1, title: 'How the web works & HTML · CSS & layout', topics: ['Browsers, servers and the request cycle', 'Semantic HTML and accessibility', 'Your dev environment and Git basics', 'Box model, Flexbox and Grid', 'Responsive design and media queries', 'Tailwind CSS fundamentals'] },
      { week: 2, title: 'JavaScript foundations · Async JavaScript', topics: ['Values, functions and control flow', 'Arrays, objects and the DOM', 'Events and form handling', 'Promises and async/await', 'Calling REST APIs with fetch', 'Error and loading states'] },
      { week: 3, title: 'TypeScript · React fundamentals', topics: ['Types, interfaces and generics', 'Typing functions and API data', 'Migrating JavaScript to TypeScript', 'Components, props and JSX', 'State and events', 'Lists, keys and conditional rendering'] },
      { week: 4, title: 'React in depth', topics: ['Effects and data fetching', 'Custom hooks', 'Forms and validation'] },
      { week: 5, title: 'Routing & app structure', topics: ['React Router', 'Shared state and context', 'Organising a real codebase'] },
      { week: 6, title: 'Working with APIs · Quality & performance', topics: ['Authentication flows', 'Caching and optimistic updates', 'Handling failures gracefully', 'Testing components', 'Accessibility audits', 'Performance and bundle size'] },
      { week: 7, title: 'Ship it', topics: ['Deployment and environment config', 'Code review and collaboration', 'Capstone build week'] },
      { week: 8, title: 'Capstone & demo day', topics: ['Final polish', 'Portfolio and README', 'Present your project'] },
    ],
  },
  backend: {
    slug: 'backend',
    track: 'Backend Engineering',
    tagline: 'Design the APIs and data that power real products.',
    overview:
      'Learn to build secure, reliable server-side applications with Node.js, NestJS and PostgreSQL. You will design databases, build authenticated REST APIs, integrate payments and deploy a live service.',
    duration: '2 months (8 weeks)',
    format: 'Live online classes',
    schedule: 'Fri, Sat & Sun · 4:30–6:30pm WAT',
    level: 'Some programming helpful',
    outcomes: [
      'Build REST APIs with Node.js and NestJS',
      'Model data and write SQL with PostgreSQL',
      'Implement sign-up, login, roles and permissions',
      'Validate input and handle errors properly',
      'Integrate third-party services like payments and email',
      'Write tests for your services',
      'Deploy and configure a production API',
      'Present a polished capstone project',
    ],
    curriculum: [
      { week: 1, title: 'Node.js & the terminal · HTTP & REST', topics: ['JavaScript on the server', 'npm and project setup', 'Git and GitHub workflow', 'Requests, responses and status codes', 'Designing resources and routes', 'Testing APIs with a client'] },
      { week: 2, title: 'TypeScript for the backend · NestJS fundamentals', topics: ['Types and interfaces', 'Modules and project structure', 'Async patterns', 'Controllers, services and modules', 'Dependency injection', 'DTOs and validation'] },
      { week: 3, title: 'Databases & SQL · ORMs & migrations', topics: ['Relational modelling', 'Writing SQL queries', 'PostgreSQL in practice', 'TypeORM entities and relations', 'Querying efficiently', 'Schema migrations'] },
      { week: 4, title: 'Authentication', topics: ['Password hashing', 'JWTs and sessions', 'Password reset flows'] },
      { week: 5, title: 'Authorization & security', topics: ['Roles and resource ownership', 'Common vulnerabilities', 'Secrets and configuration'] },
      { week: 6, title: 'Integrations · Testing & reliability', topics: ['Payments and webhooks', 'Sending email', 'Background work', 'Unit and end-to-end tests', 'Logging and error handling', 'Idempotency'] },
      { week: 7, title: 'Deployment', topics: ['Hosting an API and database', 'Environment variables', 'Capstone build week'] },
      { week: 8, title: 'Capstone & demo day', topics: ['Final polish', 'API documentation', 'Present your project'] },
    ],
  },
  'product-design': {
    slug: 'product-design',
    track: 'Product Design (UI/UX)',
    tagline: 'Design products that are useful, usable and beautiful.',
    overview:
      'Learn the full product design process — from user research to high-fidelity prototypes — in Figma. You will run real usability tests and leave with portfolio case studies that show how you think.',
    duration: '2 months (8 weeks)',
    format: 'Live online classes',
    schedule: 'Fri, Sat & Sun · 4:30–6:30pm WAT',
    level: 'Beginner friendly',
    outcomes: [
      'Plan and run user research interviews',
      'Turn insights into personas, journeys and flows',
      'Wireframe and prototype in Figma',
      'Apply visual design: type, colour, layout and hierarchy',
      'Build and document a design system',
      'Run usability tests and iterate on findings',
      'Hand off designs to developers cleanly',
      'Present portfolio-ready case studies',
    ],
    curriculum: [
      { week: 1, title: 'What product designers do · User research', topics: ['The design process', 'Figma basics', 'Good vs bad design', 'Interview planning', 'Running interviews', 'Synthesising insights'] },
      { week: 2, title: 'Defining the problem', topics: ['Personas and journeys', 'Problem statements', 'User flows'] },
      { week: 3, title: 'Wireframing', topics: ['Information architecture', 'Low-fidelity wireframes', 'Critique sessions'] },
      { week: 4, title: 'Visual design', topics: ['Typography and colour', 'Layout and spacing', 'Hierarchy'] },
      { week: 5, title: 'Prototyping', topics: ['Interactive prototypes', 'Micro-interactions', 'Mobile patterns'] },
      { week: 6, title: 'Design systems', topics: ['Components and variants', 'Tokens and styles', 'Documentation'] },
      { week: 7, title: 'Usability testing · Handoff & collaboration', topics: ['Test plans', 'Moderated sessions', 'Iterating on findings', 'Working with developers', 'Specs and assets', 'Case study writing'] },
      { week: 8, title: 'Portfolio & demo day', topics: ['Polishing case studies', 'Presenting your work', 'Next steps'] },
    ],
  },
  qa: {
    slug: 'qa',
    track: 'Quality Assurance (QA)',
    tagline: 'Find the bugs before your users do.',
    overview:
      'Learn to test software the way product teams do: plan tests, find and report bugs clearly, test APIs, and automate checks so every release is safer. You work on real apps each week and finish with a full test project for your portfolio.',
    duration: '2 months (8 weeks)',
    format: 'Live online classes',
    schedule: 'Fri, Sat & Sun · 4:30–6:30pm WAT',
    level: 'Beginner friendly',
    outcomes: [
      'Explain how testing fits into the way software is built and released',
      'Write clear test plans, test cases and bug reports',
      'Test web and mobile apps by hand, including accessibility checks',
      'Test APIs with Postman and check data with basic SQL',
      'Write automated browser tests with Playwright',
      'Run tests automatically on every change with GitHub Actions',
      'Check speed and basic security with performance and security tools',
      'Present a complete test project to a panel',
    ],
    curriculum: [
      { week: 1, title: 'What QA does · Test design', topics: ['How software is built and released', 'Testing levels and types', 'Agile teams and where QA fits', 'Requirements and acceptance criteria', 'Boundary values and equivalence classes', 'Writing test cases'] },
      { week: 2, title: 'Manual and exploratory testing · Bugs and test management', topics: ['Exploratory sessions', 'Cross-browser and mobile checks', 'Accessibility basics', 'Writing a good bug report', 'Severity and priority', 'Jira and test plans'] },
      { week: 3, title: 'API testing · SQL for testers', topics: ['HTTP and REST', 'Postman collections and assertions', 'Testing errors and edge cases', 'Querying test data', 'Checking what the app saved', 'Preparing test data'] },
      { week: 4, title: 'Programming for testers', topics: ['JavaScript or TypeScript basics', 'Git and GitHub', 'Reading the code you test'] },
      { week: 5, title: 'Browser automation', topics: ['Playwright setup', 'Locators and assertions', 'Page objects'] },
      { week: 6, title: 'Reliable test suites · Automation in the pipeline', topics: ['Fixing flaky tests', 'Test data and environments', 'Reports and screenshots', 'Running tests in GitHub Actions', 'API tests in code', 'Release checklists'] },
      { week: 7, title: 'Performance and security', topics: ['Load tests with k6', 'OWASP basics with ZAP', 'Capstone checkpoint'] },
      { week: 8, title: 'Capstone & demo day', topics: ['Full test project on a real app', 'Bug report and quality summary', 'Present to a panel'] },
    ],
  },
};

/** Generic content for a track that exists in the database but has no built-in page copy. */
export function genericTrack(slug: string, track: string): TrackContent {
  return {
    slug,
    track,
    tagline: 'Live, expert-led training with real projects.',
    overview: `Learn ${track} live with an expert tutor and a cohort of peers. Every week you build something real and get feedback on it.`,
    duration: '',
    format: 'Live online classes',
    schedule: '',
    level: '',
    outcomes: [],
    curriculum: [],
  };
}
