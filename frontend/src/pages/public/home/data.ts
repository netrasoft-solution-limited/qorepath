import { BarChart2, BookOpen, Cloud, Code2, Palette, Server, Shield, type LucideIcon } from 'lucide-react';

// Static landing-page content. Track cards and the "now enrolling" badge come from the
// live API (see useOpenPrograms); these are the fallbacks and the copy around them.

export const ROLES = ['Frontend Engineer', 'Backend Engineer', 'Product Designer', 'Data Analyst'];

export const SKILLS = [
  'React', 'TypeScript', 'Node.js', 'NestJS', 'PostgreSQL', 'Figma', 'User Research',
  'REST APIs', 'Git & GitHub', 'Tailwind CSS', 'SQL', 'Data Visualisation', 'System Design', 'Cloud Basics',
];

// Shown when no cohort is currently open in the database.
export const FALLBACK_TRACKS = [
  { track: 'Frontend Engineering', duration: '12 weeks', price: 150000, blurb: 'HTML, CSS & JavaScript through React and TypeScript.' },
  { track: 'Backend Engineering', duration: '12 weeks', price: 150000, blurb: 'Node.js, NestJS, PostgreSQL, REST APIs and security.' },
  { track: 'Product Design (UI/UX)', duration: '10 weeks', price: 120000, blurb: 'Figma, user research, testing and a portfolio.' },
];

export const JOURNEY = [
  { step: '01', title: 'Pick your orbit', desc: 'Choose a track, create your account, and pay in full or in two instalments to lock your seat.' },
  { step: '02', title: 'Learn live', desc: 'Join expert-led classes from your browser. Attendance is marked the moment you walk in, and every session is recorded.' },
  { step: '03', title: 'Build & ship', desc: 'Weekly assignments graded with real feedback, ending in a capstone you can put in front of employers.' },
  { step: '04', title: 'Graduate & launch', desc: 'Earn a certificate with a unique number anyone can verify — then take your portfolio into the job market.' },
];

// Facts about how the program works (shown as counters) — no marketing numbers.
export const FACTS = [
  { value: 100, suffix: '%', label: 'Live, expert-led classes' },
  { value: 50, suffix: '%', label: 'Is all you pay to start' },
  { value: 1, suffix: '', label: 'Click from dashboard to class' },
  { value: 24, suffix: '/7', label: 'Access to class recordings' },
];

// Example portfolio projects, by track — what learners build during a cohort.
export const PROJECTS = [
  { track: 'Frontend', title: 'Responsive landing page', desc: 'Pixel-accurate from a Figma file, fast and accessible on any phone.' },
  { track: 'Frontend', title: 'React dashboard', desc: 'Charts, filters and state that survives a refresh — wired to a real API.' },
  { track: 'Frontend', title: 'E-commerce storefront', desc: 'Product listing, cart and checkout flow in React + TypeScript.' },
  { track: 'Backend', title: 'REST API with auth', desc: 'NestJS + PostgreSQL with sign-up, login, roles and validation.' },
  { track: 'Backend', title: 'Payments integration', desc: 'Initialise, verify and webhook-settle payments the right way.' },
  { track: 'Backend', title: 'Deployed service', desc: 'Your API live on the internet with a database and environment config.' },
  { track: 'Design', title: 'Mobile app case study', desc: 'Research, user flows, wireframes and a tested high-fidelity prototype.' },
  { track: 'Design', title: 'Design system', desc: 'Type, colour and components documented so a team can build with it.' },
  { track: 'Design', title: 'Usability test report', desc: 'Plan, run and present findings from real user testing sessions.' },
];

export const FAQS = [
  { q: 'Do I need prior experience to join?', a: 'No prior experience is required for any of our tracks. We start from the foundations and build up to industry-level skills over the course of the cohort.' },
  { q: 'How long is each cohort?', a: 'Frontend and Backend Engineering run for 12 weeks; Product Design runs for 10 weeks. All sessions are live and scheduled around working hours.' },
  { q: 'What if I miss a live session?', a: 'Every live session is recorded and shows up in your dashboard, so you can catch up. Attendance is still tracked for your graduation record.' },
  { q: 'Is the certificate recognised by employers?', a: 'Every certificate has a unique number that anyone — including employers — can verify on our public verification page.' },
  { q: 'Can I pay in instalments?', a: 'Yes. Choose the two-instalment plan at checkout: pay part of the fee to secure your seat and settle the balance from your Payments page.' },
  { q: 'What if I need to withdraw?', a: 'You can withdraw from the Programs page in your dashboard. Refunds follow our published refund policy and are reviewed by our team before any money moves.' },
];

export function trackIcon(track: string): LucideIcon {
  const t = track.toLowerCase();
  if (t.includes('front')) return Code2;
  if (t.includes('back')) return Server;
  if (t.includes('design') || t.includes('ui')) return Palette;
  if (t.includes('data')) return BarChart2;
  if (t.includes('cloud')) return Cloud;
  if (t.includes('secur')) return Shield;
  return BookOpen;
}

export const naira = (n: number) => `₦${n.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
