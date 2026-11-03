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

// NOTE: placeholder social proof carried over from the original template. Replace these
// with real numbers and real learners' words (with their permission) before relying on them.
export const STATS = [
  { value: 500, suffix: '+', label: 'Learners trained' },
  { value: 85, suffix: '%', label: 'Placement rate' },
  { value: 12, suffix: '', label: 'Cohorts completed' },
  { value: 3, suffix: '', label: 'Learning tracks' },
];

export const TESTIMONIALS = [
  { name: 'Chinedu Okafor', role: 'Frontend Engineer at Paystack', text: 'NetraNova completely transformed my career. The live sessions and real-world projects gave me the confidence to land my first dev role within 3 months of graduating.' },
  { name: 'Amina Yusuf', role: 'UI/UX Designer at Flutterwave', text: 'The curriculum is industry-aligned and the instructors genuinely care. I went from zero design experience to getting hired at a product company in Lagos.' },
  { name: 'Emeka Nwachukwu', role: 'Backend Engineer at Kuda', text: 'Best investment I made this year. The cohort model keeps you accountable and the community is incredibly supportive throughout the entire journey.' },
  { name: 'Sarah Peters', role: 'Fullstack Developer at Interswitch', text: 'I tried many online courses before NetraNova. None came close to the live interaction, project-based learning, and mentorship you get here.' },
  { name: 'Michael Obi', role: 'Product Manager at PiggyVest', text: 'The structured curriculum and career guidance set NetraNova apart. My instructors pushed me to build a strong portfolio that spoke for itself.' },
  { name: 'Fatima Aliyu', role: 'React Developer at Cowrywise', text: 'From the first session to graduation, NetraNova delivers a world-class learning experience right here in Nigeria. Highly recommend.' },
];

export const FAQS = [
  { q: 'Do I need prior experience to join?', a: 'No prior experience is required for any of our tracks. We start from the foundations and build up to industry-level skills over the course of the cohort.' },
  { q: 'How long is each cohort?', a: 'Frontend and Backend Engineering run for 12 weeks; Product Design runs for 10 weeks. All sessions are live and scheduled around working hours.' },
  { q: 'What if I miss a live session?', a: 'Every live session is recorded and shows up in your dashboard, so you can catch up. Attendance is still tracked for your graduation record.' },
  { q: 'Is the certificate recognised by employers?', a: 'Every certificate has a unique number that anyone — including employers — can verify on our public verification page.' },
  { q: 'Can I pay in instalments?', a: 'Yes. Choose the two-instalment plan at checkout: pay half to secure your seat and settle the balance from your Payments page.' },
  { q: 'What if I need to withdraw?', a: 'You can withdraw from your dashboard. Refunds follow our published refund policy and are reviewed by our team before any money moves.' },
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
