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
    duration: '12 weeks',
    format: 'Live online classes',
    schedule: '2 evening classes per week',
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
      { week: 1, title: 'How the web works & HTML', topics: ['Browsers, servers and the request cycle', 'Semantic HTML and accessibility', 'Your dev environment and Git basics'] },
      { week: 2, title: 'CSS & layout', topics: ['Box model, Flexbox and Grid', 'Responsive design and media queries', 'Tailwind CSS fundamentals'] },
      { week: 3, title: 'JavaScript foundations', topics: ['Values, functions and control flow', 'Arrays, objects and the DOM', 'Events and form handling'] },
      { week: 4, title: 'Async JavaScript', topics: ['Promises and async/await', 'Calling REST APIs with fetch', 'Error and loading states'] },
      { week: 5, title: 'TypeScript', topics: ['Types, interfaces and generics', 'Typing functions and API data', 'Migrating JavaScript to TypeScript'] },
      { week: 6, title: 'React fundamentals', topics: ['Components, props and JSX', 'State and events', 'Lists, keys and conditional rendering'] },
      { week: 7, title: 'React in depth', topics: ['Effects and data fetching', 'Custom hooks', 'Forms and validation'] },
      { week: 8, title: 'Routing & app structure', topics: ['React Router', 'Shared state and context', 'Organising a real codebase'] },
      { week: 9, title: 'Working with APIs', topics: ['Authentication flows', 'Caching and optimistic updates', 'Handling failures gracefully'] },
      { week: 10, title: 'Quality & performance', topics: ['Testing components', 'Accessibility audits', 'Performance and bundle size'] },
      { week: 11, title: 'Ship it', topics: ['Deployment and environment config', 'Code review and collaboration', 'Capstone build week'] },
      { week: 12, title: 'Capstone & demo day', topics: ['Final polish', 'Portfolio and README', 'Present your project'] },
    ],
  },
  backend: {
    slug: 'backend',
    track: 'Backend Engineering',
    tagline: 'Design the APIs and data that power real products.',
    overview:
      'Learn to build secure, reliable server-side applications with Node.js, NestJS and PostgreSQL. You will design databases, build authenticated REST APIs, integrate payments and deploy a live service.',
    duration: '12 weeks',
    format: 'Live online classes',
    schedule: '2 evening classes per week',
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
      { week: 1, title: 'Node.js & the terminal', topics: ['JavaScript on the server', 'npm and project setup', 'Git and GitHub workflow'] },
      { week: 2, title: 'HTTP & REST', topics: ['Requests, responses and status codes', 'Designing resources and routes', 'Testing APIs with a client'] },
      { week: 3, title: 'TypeScript for the backend', topics: ['Types and interfaces', 'Modules and project structure', 'Async patterns'] },
      { week: 4, title: 'NestJS fundamentals', topics: ['Controllers, services and modules', 'Dependency injection', 'DTOs and validation'] },
      { week: 5, title: 'Databases & SQL', topics: ['Relational modelling', 'Writing SQL queries', 'PostgreSQL in practice'] },
      { week: 6, title: 'ORMs & migrations', topics: ['TypeORM entities and relations', 'Querying efficiently', 'Schema migrations'] },
      { week: 7, title: 'Authentication', topics: ['Password hashing', 'JWTs and sessions', 'Password reset flows'] },
      { week: 8, title: 'Authorization & security', topics: ['Roles and resource ownership', 'Common vulnerabilities', 'Secrets and configuration'] },
      { week: 9, title: 'Integrations', topics: ['Payments and webhooks', 'Sending email', 'Background work'] },
      { week: 10, title: 'Testing & reliability', topics: ['Unit and end-to-end tests', 'Logging and error handling', 'Idempotency'] },
      { week: 11, title: 'Deployment', topics: ['Hosting an API and database', 'Environment variables', 'Capstone build week'] },
      { week: 12, title: 'Capstone & demo day', topics: ['Final polish', 'API documentation', 'Present your project'] },
    ],
  },
  'product-design': {
    slug: 'product-design',
    track: 'Product Design (UI/UX)',
    tagline: 'Design products that are useful, usable and beautiful.',
    overview:
      'Learn the full product design process — from user research to high-fidelity prototypes — in Figma. You will run real usability tests and leave with portfolio case studies that show how you think.',
    duration: '10 weeks',
    format: 'Live online classes',
    schedule: '2 evening classes per week',
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
      { week: 1, title: 'What product designers do', topics: ['The design process', 'Figma basics', 'Good vs bad design'] },
      { week: 2, title: 'User research', topics: ['Interview planning', 'Running interviews', 'Synthesising insights'] },
      { week: 3, title: 'Defining the problem', topics: ['Personas and journeys', 'Problem statements', 'User flows'] },
      { week: 4, title: 'Wireframing', topics: ['Information architecture', 'Low-fidelity wireframes', 'Critique sessions'] },
      { week: 5, title: 'Visual design', topics: ['Typography and colour', 'Layout and spacing', 'Hierarchy'] },
      { week: 6, title: 'Prototyping', topics: ['Interactive prototypes', 'Micro-interactions', 'Mobile patterns'] },
      { week: 7, title: 'Design systems', topics: ['Components and variants', 'Tokens and styles', 'Documentation'] },
      { week: 8, title: 'Usability testing', topics: ['Test plans', 'Moderated sessions', 'Iterating on findings'] },
      { week: 9, title: 'Handoff & collaboration', topics: ['Working with developers', 'Specs and assets', 'Case study writing'] },
      { week: 10, title: 'Portfolio & demo day', topics: ['Polishing case studies', 'Presenting your work', 'Next steps'] },
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
