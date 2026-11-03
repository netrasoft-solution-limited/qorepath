import { useState, type CSSProperties, type FormEvent, type MouseEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Bell, BadgeCheck, CalendarPlus, GraduationCap, Megaphone, Search, Users, Wallet } from 'lucide-react';
import { naira, FALLBACK_TRACKS } from './data';
import type { OpenProgram } from './useOpenPrograms';

function Tile({ className = '', children, delay = 0 }: { className?: string; children: ReactNode; delay?: number }) {
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  return (
    <motion.div
      onMouseMove={onMove}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.55, delay }}
      className={`nn-spotlight overflow-hidden rounded-3xl border border-gray-100 bg-white p-7 shadow-sm transition-shadow hover:shadow-xl hover:shadow-qore-medium/10 ${className}`}
    >
      {children}
    </motion.div>
  );
}

function Label({ icon: Icon, children }: { icon: typeof Bell; children: ReactNode }) {
  return (
    <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-qore-medium">
      <Icon size={14} /> {children}
    </p>
  );
}

function CertificateTile() {
  const navigate = useNavigate();
  const [num, setNum] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate(num.trim() ? `/public/verify/${encodeURIComponent(num.trim())}` : '/public/verify');
  };
  return (
    <Tile className="md:col-span-2 lg:col-span-4">
      <div className="grid h-full grid-cols-1 items-center gap-8 md:grid-cols-2">
        <div>
          <Label icon={BadgeCheck}>Proof that travels</Label>
          <h3 className="font-display text-2xl font-extrabold text-qore-dark sm:text-3xl">A certificate anyone can verify</h3>
          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            Every graduate's certificate carries a unique number. Employers paste it in and see it's genuine — instantly.
          </p>
          <form onSubmit={submit} className="mt-6 flex overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 focus-within:ring-2 focus-within:ring-qore-medium">
            <span className="flex items-center pl-4 text-gray-400"><Search size={16} /></span>
            <input
              value={num}
              onChange={(e) => setNum(e.target.value)}
              placeholder="Try a certificate number…"
              aria-label="Certificate number"
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm focus:outline-none"
            />
            <button className="bg-qore-dark px-4 text-xs font-bold text-white transition-colors hover:bg-qore-medium">Verify</button>
          </form>
        </div>

        {/* mini certificate */}
        <motion.div initial={{ rotate: 2 }} whileHover={{ rotate: -1.5, scale: 1.02 }} className="relative mx-auto w-full max-w-sm rounded-2xl bg-gradient-to-br from-qore-dark to-qore-medium p-6 text-white shadow-2xl shadow-qore-dark/30">
          <div className="pointer-events-none absolute inset-2 rounded-xl border border-white/15" />
          <div className="flex items-center justify-between">
            <img src="/netranova-icon.webp" alt="" className="h-9 w-9 rounded-lg bg-white p-1" />
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-qore-highlight">Verified</span>
          </div>
          <p className="mt-6 text-[10px] uppercase tracking-[0.25em] text-white/50">Certificate of completion</p>
          <p className="mt-1 font-display text-xl font-bold">Your Name Here</p>
          <p className="text-xs text-white/60">Frontend Engineering</p>
          <div className="mt-6 flex items-end justify-between">
            <p className="font-mono text-[11px] text-white/70">NN-1793…-A7K2Q</p>
            <GraduationCap size={28} className="text-[#FFB020]" />
          </div>
        </motion.div>
      </div>
    </Tile>
  );
}

function PaymentTile({ price }: { price: number }) {
  const [plan, setPlan] = useState<'full' | 'split'>('split');
  const now = plan === 'full' ? price : Math.round(price / 2);
  return (
    <Tile className="lg:col-span-2" delay={0.08}>
      <Label icon={Wallet}>Pay your way</Label>
      <h3 className="font-display text-2xl font-extrabold text-qore-dark">Start with half</h3>
      <p className="mt-2 text-sm text-gray-500">Secure your seat with 50% and settle the rest from your dashboard.</p>

      <div className="mt-6 grid grid-cols-2 rounded-2xl bg-gray-100 p-1 text-xs font-bold">
        {(['full', 'split'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPlan(p)}
            className={`relative rounded-xl py-2.5 transition-colors ${plan === p ? 'text-white' : 'text-gray-500'}`}
          >
            {plan === p && <motion.span layoutId="nn-plan" className="absolute inset-0 rounded-xl bg-qore-dark" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
            <span className="relative">{p === 'full' ? 'Pay in full' : '2 instalments'}</span>
          </button>
        ))}
      </div>
      <div className="mt-5">
        <p className="text-xs text-gray-400">Due today</p>
        <motion.p key={now} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="font-display text-4xl font-extrabold text-qore-dark">
          {naira(now)}
        </motion.p>
        <p className="mt-1 text-xs text-gray-400">{plan === 'split' ? `then ${naira(price - now)} later` : 'nothing more to pay'}</p>
      </div>
    </Tile>
  );
}

function CohortTile() {
  const people = ['AO', 'TK', 'IB', 'FA', 'CU', 'NM'];
  return (
    <Tile className="lg:col-span-2" delay={0.05}>
      <Label icon={Users}>Learn together</Label>
      <h3 className="font-display text-2xl font-extrabold text-qore-dark">A cohort, not a course</h3>
      <p className="mt-2 text-sm text-gray-500">Start and finish with the same peers — accountability built in.</p>
      <div className="relative mx-auto mt-6 h-36 w-36">
        <div className="nn-spin absolute inset-0 rounded-full border border-dashed border-qore-medium/30" style={{ '--nn-dur': '30s' } as CSSProperties}>
          {people.map((p, i) => {
            const a = (i / people.length) * Math.PI * 2;
            return (
              <span key={p} className="absolute" style={{ left: `${50 + 50 * Math.cos(a)}%`, top: `${50 + 50 * Math.sin(a)}%` }}>
                <span className="block -translate-x-1/2 -translate-y-1/2">
                  <span className="nn-spin-rev flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-qore-medium to-[#1AA3F0] text-[10px] font-bold text-white ring-2 ring-white" style={{ '--nn-dur': '30s' } as CSSProperties}>
                    {p}
                  </span>
                </span>
              </span>
            );
          })}
        </div>
        <div className="absolute inset-[30%] flex items-center justify-center rounded-full bg-qore-light">
          <img src="/netranova-icon.webp" alt="" className="h-9 w-9" />
        </div>
      </div>
    </Tile>
  );
}

function ProjectsTile() {
  const lines = [
    { t: 'const [count, setCount] = useState(0);', c: 'text-[#8CCBFF]' },
    { t: 'useEffect(() => {', c: 'text-white/80' },
    { t: '  document.title = `Clicked ${count}×`;', c: 'text-[#FFB020]' },
    { t: '}, [count]);', c: 'text-white/80' },
  ];
  return (
    <Tile className="lg:col-span-2" delay={0.1}>
      <Label icon={CalendarPlus}>Build every week</Label>
      <h3 className="font-display text-2xl font-extrabold text-qore-dark">Graded, with feedback</h3>
      <p className="mt-2 text-sm text-gray-500">Weekly assignments reviewed by your tutor, ending in a capstone.</p>
      <div className="mt-5 rounded-2xl bg-qore-dark p-4 font-mono text-[11px] leading-6">
        {lines.map((l, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + i * 0.25 }}
            className={`truncate ${l.c}`}
          >
            {l.t}
          </motion.p>
        ))}
        <div className="mt-3 flex items-center justify-between rounded-xl bg-white/10 px-3 py-2 font-sans">
          <span className="text-[11px] font-semibold text-white/80">Score</span>
          <span className="text-sm font-extrabold text-[#FFB020]">92 / 100</span>
        </div>
      </div>
    </Tile>
  );
}

function NotifyTile() {
  const mails = [
    { icon: CalendarPlus, title: 'New session: Week 5', tone: 'bg-qore-light text-qore-medium' },
    { icon: BadgeCheck, title: 'Graded: Wireframes — 88/100', tone: 'bg-orange-50 text-[#FF6A00]' },
    { icon: Megaphone, title: 'Announcement from your tutor', tone: 'bg-sky-50 text-sky-600' },
  ];
  return (
    <Tile className="lg:col-span-2" delay={0.15}>
      <Label icon={Bell}>Never miss a beat</Label>
      <h3 className="font-display text-2xl font-extrabold text-qore-dark">It comes to your inbox</h3>
      <p className="mt-2 text-sm text-gray-500">New sessions, grades, announcements and receipts — emailed as they happen.</p>
      <div className="relative mt-6 h-36">
        {mails.map((m, i) => (
          <motion.div
            key={m.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + i * 0.18, type: 'spring', stiffness: 200, damping: 20 }}
            className="absolute inset-x-0 flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-md"
            style={{ top: i * 42, zIndex: 10 - i, scale: 1 - i * 0.04 }}
          >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${m.tone}`}>
              <m.icon size={15} />
            </span>
            <p className="truncate text-xs font-semibold text-qore-dark">{m.title}</p>
          </motion.div>
        ))}
      </div>
    </Tile>
  );
}

export function BentoFeatures({ programs }: { programs: OpenProgram[] | null }) {
  const price = programs?.find((p) => p.price > 0)?.price ?? FALLBACK_TRACKS[0].price;
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-qore-medium">Why NetraNova</p>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-qore-dark sm:text-5xl">
              Everything around the class, <span className="text-qore-medium">handled.</span>
            </h2>
          </div>
          <a href="#tracks" className="group flex items-center gap-2 text-sm font-bold text-qore-dark">
            See the tracks <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-6">
          <CertificateTile />
          <PaymentTile price={price} />
          <ProjectsTile />
          <CohortTile />
          <NotifyTile />
        </div>
      </div>
    </section>
  );
}
