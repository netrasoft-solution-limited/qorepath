import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Star, Award, Users, BookOpen, PlayCircle, TrendingUp,
  Globe, CheckCircle, ArrowRight, Zap, MessageCircle,
  ChevronDown, Monitor, Code2, Palette, BarChart2,
  Clock, Shield, Briefcase, Flame, GraduationCap,
} from 'lucide-react';

// ── Animated counter hook ──────────────────────────────────────────────────
function useCountUp(end: number, duration = 1600, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf: number;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) raf = requestAnimationFrame(step);
      else setCount(end);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [end, duration, start]);
  return count;
}

// ── Data ──────────────────────────────────────────────────────────────────
const tracks = [
  {
    icon: Code2,
    name: 'Frontend Engineering',
    duration: '12 Weeks',
    fee: '₦150,000',
    nextCohort: 'Nov 1, 2026',
    features: ['HTML, CSS & JavaScript', 'React & TypeScript', 'Real-world projects', 'Certificate of completion', 'Career mentorship'],
  },
  {
    icon: Monitor,
    name: 'Backend Engineering',
    duration: '12 Weeks',
    fee: '₦150,000',
    nextCohort: 'Nov 1, 2026',
    highlight: true,
    features: ['Node.js & NestJS', 'PostgreSQL & REST APIs', 'Authentication & Security', 'Certificate of completion', 'Career mentorship'],
  },
  {
    icon: Palette,
    name: 'Product Design (UI/UX)',
    duration: '10 Weeks',
    fee: '₦120,000',
    nextCohort: 'Nov 15, 2026',
    features: ['Figma & Design Tools', 'User Research & Testing', 'Portfolio-ready projects', 'Certificate of completion', 'Career mentorship'],
  },
];

const steps = [
  { num: '01', title: 'Apply & Enroll', desc: 'Choose your track, create your account, and secure your spot in the next cohort.', icon: BookOpen },
  { num: '02', title: 'Learn Live', desc: 'Attend expert-led sessions, work on real projects, and get feedback from industry pros.', icon: Monitor },
  { num: '03', title: 'Build & Ship', desc: 'Complete your capstone project and build a portfolio that employers actually want to see.', icon: Code2 },
  { num: '04', title: 'Graduate & Get Hired', desc: 'Receive your verified certificate and tap into our network of hiring partners.', icon: GraduationCap },
];

const benefits = [
  { title: 'Expert-Led Live Sessions', desc: 'Real practitioners — not pre-recorded videos. Every session is live, interactive, and packed with real-world context.', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
  { title: 'Cohort-Based Accountability', desc: 'You learn alongside a cohort of peers, keeping you on track and building connections that last your whole career.', icon: Users, color: 'text-qore-medium', bg: 'bg-qore-light' },
  { title: 'Verifiable Certificates', desc: 'Every certificate has a unique ID that any employer can verify instantly at our public verification portal.', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
  { title: 'Career Placement Support', desc: 'We don\'t just train you — we help you land. Resume reviews, mock interviews, and direct referrals to hiring partners.', icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50' },
  { title: 'Flexible Payment Plans', desc: 'Instalment plans available for every track. No financial barrier should stop you from starting your tech career.', icon: Globe, color: 'text-green-600', bg: 'bg-green-50' },
  { title: 'Lifetime Community Access', desc: 'Join alumni Slack, attend community events, and stay connected with 500+ NetraNova graduates building in tech.', icon: MessageCircle, color: 'text-pink-600', bg: 'bg-pink-50' },
];

const testimonials = [
  { name: 'Chinedu Okafor', role: 'Frontend Engineer at Paystack', rating: 5, text: 'NetraNova completely transformed my career. The live sessions and real-world projects gave me the confidence to land my first dev role within 3 months of graduating.' },
  { name: 'Amina Yusuf', role: 'UI/UX Designer at Flutterwave', rating: 5, text: "The curriculum is industry-aligned and the instructors genuinely care. I went from zero design experience to getting hired at a product company in Lagos." },
  { name: 'Emeka Nwachukwu', role: 'Backend Engineer at Kuda', rating: 5, text: "Best investment I made this year. The cohort model keeps you accountable and the community is incredibly supportive throughout the entire journey." },
  { name: 'Sarah Peters', role: 'Fullstack Developer at Interswitch', rating: 5, text: "I tried many online courses before NetraNova. None came close to the live interaction, project-based learning, and mentorship you get here." },
  { name: 'Michael Obi', role: 'Product Manager at PiggyVest', rating: 5, text: "The structured curriculum and career guidance set NetraNova apart. My instructors pushed me to build a strong portfolio that spoke for itself." },
  { name: 'Fatima Aliyu', role: 'React Developer at Cowrywise', rating: 5, text: "From the first session to graduation, NetraNova delivers a world-class learning experience right here in Nigeria. Highly recommend." },
];

const faqs = [
  { q: 'Do I need prior experience to join?', a: 'No prior experience is required for any of our tracks. We start from the foundations and build up to industry-level skills over the course of the cohort.' },
  { q: 'How long is each cohort?', a: 'Frontend and Backend Engineering tracks run for 12 weeks. Product Design runs for 10 weeks. All sessions are live and scheduled around working hours.' },
  { q: 'What if I miss a live session?', a: 'All live sessions are recorded and made available to enrolled learners within 24 hours so you can catch up. However, attendance is still tracked for your graduation record.' },
  { q: 'Is the certificate recognised by employers?', a: 'Yes. Our certificates are verifiable via a public portal and are recognised by our hiring partners. We also provide transcripts and project portfolios to strengthen your applications.' },
  { q: 'Can I pay in instalments?', a: 'Absolutely. We offer flexible instalment plans for all tracks. Contact us after registering to set up a payment schedule that works for you.' },
  { q: 'What happens after I graduate?', a: 'You get lifetime access to the NetraNova alumni community, career support, referrals to hiring partners, and your verified certificate to share on LinkedIn and job applications.' },
];

const companies = ['Paystack', 'Flutterwave', 'Kuda', 'PiggyVest', 'Interswitch', 'Cowrywise', 'Andela', 'Moniepoint'];

// ── Sub-components ────────────────────────────────────────────────────────
function StatItem({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const count = useCountUp(value, 1600, inView);
  return (
    <div ref={ref} className="px-4 text-center">
      <p className="text-4xl md:text-5xl font-extrabold text-white leading-none mb-1">
        {count}{suffix}
      </p>
      <p className="text-qore-highlight text-sm font-medium">{label}</p>
    </div>
  );
}

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900 text-sm">{q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
          <ChevronDown size={18} className="text-gray-400" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="faq-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-sm text-gray-500 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export function PublicHome() {
  const [email, setEmail] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const navigate = useNavigate();

  const handleCTASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/register${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ''}`);
  };

  return (
    <div className="w-full bg-white overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section className="relative bg-qore-dark overflow-hidden pt-20 pb-28">
        {/* Decorative grid background */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        {/* Gradient blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-qore-medium/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#52b788]/10 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

            {/* Left */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-qore-highlight text-xs font-semibold px-4 py-2 rounded-full mb-7"
              >
                <Flame size={12} className="text-orange-400" />
                Cohort 13 — Enrollment Now Open
              </motion.div>

              <h1 className="text-5xl md:text-[60px] font-extrabold text-white leading-[1.08] mb-6 tracking-tight">
                Launch Your<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-qore-highlight to-[#52b788]">
                  Tech Career
                </span>
                <br />from Nigeria.
              </h1>
              <p className="text-white/60 text-lg leading-relaxed mb-9 max-w-[460px]">
                Live cohort learning with industry experts. Real projects. Verified certificates. 85% placement rate.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <Link
                  to="/register"
                  className="group bg-qore-highlight hover:bg-white text-qore-dark px-7 py-3.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-qore-highlight/20 flex items-center gap-2"
                >
                  Start for Free
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/public/tracks"
                  className="border border-white/20 hover:border-white/40 text-white px-7 py-3.5 rounded-full text-sm font-semibold transition-all hover:bg-white/5 flex items-center gap-2"
                >
                  <PlayCircle size={16} />
                  Browse Tracks
                </Link>
              </div>

              {/* Trust avatars + rating */}
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2.5">
                  {['CO', 'AY', 'EN', 'SP'].map((init, i) => (
                    <div key={i} className="w-9 h-9 rounded-full border-2 border-qore-dark bg-gradient-to-br from-qore-medium to-[#52b788] flex items-center justify-center text-white text-[10px] font-bold">
                      {init}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5 mb-0.5">
                    {[1,2,3,4,5].map((s) => <Star key={s} size={12} className="text-yellow-400 fill-current" />)}
                  </div>
                  <p className="text-white/50 text-xs">Loved by <span className="text-white/80 font-semibold">500+ learners</span></p>
                </div>
              </div>
            </motion.div>

            {/* Right — visual cards */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, delay: 0.15 }}
              className="relative hidden lg:flex justify-center items-center"
            >
              <div className="relative w-[420px] h-[480px]">
                {/* Main card */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-qore-medium/80 to-[#1B4332] border border-white/10 backdrop-blur-sm flex flex-col items-center justify-center gap-5 p-8">
                  <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                    <GraduationCap size={38} className="text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-white text-2xl font-extrabold mb-1">Live Cohort Learning</p>
                    <p className="text-white/50 text-sm">Expert-led · Project-based · Certified</p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center mt-1">
                    {['React', 'Node.js', 'Figma', 'PostgreSQL', 'TypeScript'].map((t) => (
                      <span key={t} className="bg-white/10 text-white/80 text-[11px] font-semibold px-3 py-1 rounded-full border border-white/10">{t}</span>
                    ))}
                  </div>
                  {/* Progress bar */}
                  <div className="w-full mt-2">
                    <div className="flex justify-between text-xs text-white/40 mb-1.5">
                      <span>Cohort 13 progress</span>
                      <span>Enrolling</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '68%' }}
                        transition={{ delay: 0.8, duration: 1 }}
                        className="h-full bg-gradient-to-r from-qore-highlight to-[#52b788] rounded-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Floating card — next session */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="absolute -bottom-6 -right-10 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-52"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Next Cohort</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 mb-0.5">Frontend Engineering</p>
                  <p className="text-xs text-gray-400 mb-3">Starts Nov 1, 2026</p>
                  <Link to="/register" className="block text-center bg-qore-dark text-white text-[11px] font-bold py-2 rounded-xl hover:bg-qore-medium transition-colors">
                    Reserve Your Spot
                  </Link>
                </motion.div>

                {/* Floating badge — rating */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="absolute -top-5 -left-10 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center shrink-0">
                    <Star size={18} className="text-yellow-400 fill-current" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-gray-900 leading-none">4.9 / 5.0</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">500+ reviews</p>
                  </div>
                </motion.div>

                {/* Floating badge — placement */}
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 }}
                  className="absolute top-1/2 -right-12 -translate-y-1/2 bg-qore-highlight rounded-2xl shadow-lg px-4 py-3 text-center"
                >
                  <p className="text-2xl font-extrabold text-qore-dark leading-none">85%</p>
                  <p className="text-[10px] font-bold text-qore-dark/60 mt-0.5">Placement Rate</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          COMPANIES TRUST BAR
      ══════════════════════════════════════════════════════ */}
      <section className="py-8 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Our graduates now work at</p>
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-3">
            {companies.map((c) => (
              <span key={c} className="text-sm font-bold text-gray-400 hover:text-qore-medium transition-colors cursor-default">
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block bg-qore-light text-qore-medium text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-4">
              The Process
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              How NetraNova <span className="text-qore-medium">Works</span>
            </h2>
            <p className="text-gray-400 mt-3 text-base max-w-lg mx-auto">
              From your first session to your first job offer — a clear, proven path.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative group"
              >
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(50%+2.5rem)] w-[calc(100%-4.5rem)] h-px bg-gray-100 z-0" />
                )}
                <div className="relative z-10 bg-white border border-gray-100 rounded-2xl p-7 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-qore-dark flex items-center justify-center">
                      <step.icon size={22} className="text-qore-highlight" />
                    </div>
                    <span className="text-5xl font-extrabold text-gray-50 select-none leading-none">{step.num}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          STATS
      ══════════════════════════════════════════════════════ */}
      <section className="relative bg-qore-dark py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 divide-x divide-white/10">
            <StatItem value={500} suffix="+" label="Learners Trained" />
            <StatItem value={85} suffix="%" label="Placement Rate" />
            <StatItem value={12} suffix="" label="Cohorts Completed" />
            <StatItem value={3} suffix="" label="Learning Tracks" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          BENEFITS
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-start">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2 lg:sticky lg:top-24"
            >
              <span className="inline-block bg-qore-light text-qore-medium text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-4">
                Why NetraNova
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-5 leading-tight">
                Everything you need to{' '}
                <span className="text-qore-medium">break into tech</span>
              </h2>
              <p className="text-gray-500 text-base leading-relaxed mb-7">
                We don't just teach you to code — we give you the full system to launch your career: live mentorship, real projects, a hiring network, and a community that has your back.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-qore-dark hover:bg-qore-medium text-white px-6 py-3 rounded-full text-sm font-bold transition-colors"
              >
                Start Today <ArrowRight size={15} />
              </Link>
            </motion.div>

            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {benefits.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group"
                >
                  <div className={`w-11 h-11 rounded-xl ${b.bg} flex items-center justify-center mb-4`}>
                    <b.icon size={20} className={b.color} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-2">{b.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{b.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block bg-qore-light text-qore-medium text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-4">
              Success Stories
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              Real results from <span className="text-qore-medium">real learners</span>
            </h2>
          </motion.div>

          {/* Featured testimonial */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-qore-dark rounded-3xl p-8 md:p-12 mb-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-72 h-72 bg-qore-medium/20 rounded-full -translate-y-1/3 translate-x-1/3 blur-2xl pointer-events-none" />
            <div className="relative z-10 max-w-3xl">
              <div className="flex gap-0.5 mb-6">
                {[1,2,3,4,5].map((s) => <Star key={s} size={18} className="text-yellow-400 fill-current" />)}
              </div>
              <p className="text-white text-xl md:text-2xl font-medium leading-relaxed mb-8">
                "{testimonials[0].text}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-qore-medium flex items-center justify-center text-white font-bold text-base shrink-0">
                  {testimonials[0].name.charAt(0)}
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{testimonials[0].name}</p>
                  <p className="text-qore-highlight text-xs">{testimonials[0].role}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Testimonials grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.slice(1).map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 3) * 0.08 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-0.5 mb-4">
                  {[1,2,3,4,5].map((s) => <Star key={s} size={11} className="text-yellow-400 fill-current" />)}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                  <div className="w-9 h-9 rounded-full bg-qore-medium flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-xs leading-tight">{t.name}</p>
                    <p className="text-[11px] text-qore-medium font-medium">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TRACKS / PRICING
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block bg-qore-light text-qore-medium text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-4">
              Tracks & Pricing
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              Pick your <span className="text-qore-medium">learning path</span>
            </h2>
            <p className="text-gray-400 mt-3 text-base max-w-md mx-auto">
              Every track includes live sessions, mentorship, real-world projects, and a verified certificate.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {tracks.map((track, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-3xl p-8 border transition-all hover:-translate-y-1 hover:shadow-xl ${
                  track.highlight
                    ? 'bg-qore-dark border-qore-dark shadow-2xl shadow-qore-dark/30'
                    : 'bg-white border-gray-100 shadow-sm'
                }`}
              >
                {track.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-qore-highlight text-qore-dark text-[11px] font-extrabold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${track.highlight ? 'bg-white/10' : 'bg-qore-light'}`}>
                  <track.icon size={22} className={track.highlight ? 'text-qore-highlight' : 'text-qore-medium'} />
                </div>

                <p className={`text-xs font-semibold mb-1 ${track.highlight ? 'text-white/50' : 'text-gray-400'}`}>
                  {track.name}
                </p>
                <p className={`text-4xl font-extrabold mb-0.5 ${track.highlight ? 'text-white' : 'text-qore-dark'}`}>
                  {track.fee}
                </p>
                <p className={`text-xs mb-2 ${track.highlight ? 'text-white/40' : 'text-gray-400'}`}>
                  per cohort · {track.duration}
                </p>
                <div className={`flex items-center gap-1.5 text-xs mb-7 ${track.highlight ? 'text-qore-highlight' : 'text-qore-medium'}`}>
                  <Clock size={12} />
                  <span>Next cohort: {track.nextCohort}</span>
                </div>

                <Link
                  to="/register"
                  className={`block text-center py-3.5 rounded-xl font-bold text-sm mb-7 transition-colors ${
                    track.highlight
                      ? 'bg-qore-highlight text-qore-dark hover:bg-white'
                      : 'bg-qore-dark text-white hover:bg-qore-medium'
                  }`}
                >
                  Enroll Now
                </Link>

                <p className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${track.highlight ? 'text-white/30' : 'text-gray-300'}`}>
                  What's included
                </p>
                <ul className="space-y-3">
                  {track.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle size={14} className={`shrink-0 ${track.highlight ? 'text-qore-highlight' : 'text-qore-medium'}`} />
                      <span className={track.highlight ? 'text-white/70' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-sm text-gray-400 mt-8">
            Need a payment plan?{' '}
            <Link to="/register" className="text-qore-medium font-semibold hover:underline">
              Contact us after registering →
            </Link>
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="inline-block bg-qore-light text-qore-medium text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-4">
              FAQ
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              Frequently asked <span className="text-qore-medium">questions</span>
            </h2>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <FaqItem
                  q={faq.q}
                  a={faq.a}
                  open={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                />
              </motion.div>
            ))}
          </div>

          <p className="text-center text-sm text-gray-400 mt-10">
            Still have questions?{' '}
            <Link to="/public/about" className="text-qore-medium font-semibold hover:underline">
              Get in touch →
            </Link>
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════════════════ */}
      <section className="px-4 md:px-8 lg:px-16 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative bg-qore-dark rounded-3xl py-20 px-8 overflow-hidden"
        >
          {/* Background grid */}
          <div className="absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
          />
          {/* Blobs */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-qore-medium/30 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#52b788]/15 rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-5xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="text-center lg:text-left">
              <p className="text-qore-highlight text-sm font-bold uppercase tracking-widest mb-3">Cohort 13 Open</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-3">
                Your tech career<br />starts with one step.
              </h2>
              <p className="text-white/50 text-base max-w-sm">
                Join 500+ graduates who chose to level up with NetraNova. Enrollment closes when seats fill.
              </p>
            </div>
            <form onSubmit={handleCTASubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md shrink-0">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-5 py-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-qore-highlight/50 min-w-0"
              />
              <button
                type="submit"
                className="bg-qore-highlight hover:bg-white text-qore-dark px-6 py-4 rounded-xl text-sm font-extrabold whitespace-nowrap transition-colors shadow-lg shadow-qore-highlight/20"
              >
                Get Started Free
              </button>
            </form>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
