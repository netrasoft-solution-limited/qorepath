import { useState, type ReactNode, type InputHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, BadgeCheck, Cloud, Code2, Eye, EyeOff, Palette, Server, ShieldCheck, Star, Video, type LucideIcon,
} from 'lucide-react';

// Shared look for sign-in, sign-up and password pages: an "orbit" scene on the left
// (same visual language as the homepage hero) and a clean form card on the right.

const ORBITS: { size: number; dur: string; icon: LucideIcon; color: string; start: number; reverse?: boolean }[] = [
  { size: 240, dur: '38s', icon: Code2, color: 'from-qore-medium to-[#1AA3F0]', start: 20 },
  { size: 360, dur: '56s', icon: Cloud, color: 'from-[#1AA3F0] to-[#8CCBFF]', start: 200, reverse: true },
  { size: 480, dur: '74s', icon: Palette, color: 'from-[#FF6A00] to-[#FFB020]', start: 120 },
  { size: 480, dur: '74s', icon: Server, color: 'from-[#0B5CF0] to-[#0A1F5C]', start: 300 },
];

function OrbitScene() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2" aria-hidden>
      {/* glow behind the core */}
      <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-qore-medium/40 blur-3xl" />
      {[240, 360, 480].map((s, i) => (
        <div key={s} className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border ${i === 1 ? 'border-dashed border-white/15' : 'border-white/10'}`} style={{ width: s, height: s }} />
      ))}
      {ORBITS.map(({ size, dur, icon: Icon, color, start, reverse }, i) => (
        <div key={i} className="absolute left-1/2 top-1/2" style={{ width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, transform: `rotate(${start}deg)` }}>
          <div className={`h-full w-full ${reverse ? 'nn-spin-rev' : 'nn-spin'}`} style={{ ['--nn-dur' as any]: dur }}>
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2" style={{ transform: `translate(-50%, -50%) rotate(${-start}deg)` }}>
              <div className={reverse ? 'nn-spin' : 'nn-spin-rev'} style={{ ['--nn-dur' as any]: dur }}>
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${color} shadow-lg shadow-black/30 ring-1 ring-white/20`}>
                  <Icon size={20} className="text-white" />
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
      {/* core */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span className="nn-pulse-ring absolute inset-0 rounded-[28px] bg-white/20" />
        <span className="relative flex h-24 w-24 items-center justify-center rounded-[28px] bg-white shadow-2xl shadow-qore-medium/40">
          <img src="/netranova-icon.webp" alt="" className="h-14 w-14" />
        </span>
      </div>
    </div>
  );
}

/** A small glass card floating over the scene. */
export function FloatCard({ className = '', delay = 0, children }: { className?: string; delay?: number; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.3 + delay, type: 'spring', stiffness: 140, damping: 16 }}
      className={`absolute ${className}`}
    >
      <div className="nn-float rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white shadow-2xl shadow-black/30 backdrop-blur-md" style={{ animationDelay: `${delay * 2}s` }}>
        {children}
      </div>
    </motion.div>
  );
}

/** Default floating cards: the moments learners care about. */
export function JourneyCards() {
  return (
    <>
      <FloatCard className="left-[6%] top-[22%]" delay={0}>
        <div className="flex items-center gap-3">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/90">
            <Video size={16} />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-400 ring-2 ring-qore-dark" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-red-200">Live now</p>
            <p className="text-sm font-semibold">Week 7 · Kubernetes</p>
          </div>
        </div>
      </FloatCard>
      <FloatCard className="right-[5%] top-[44%]" delay={0.15}>
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFB020]"><Star size={16} className="text-qore-dark" /></span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#FFD27A]">Graded</p>
            <p className="text-sm font-semibold">92 / 100 · “Excellent work”</p>
          </div>
        </div>
      </FloatCard>
      <FloatCard className="bottom-[20%] left-[10%]" delay={0.3}>
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/90"><BadgeCheck size={16} /></span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-green-200">Certificate verified</p>
            <p className="font-mono text-xs">NN-1793701087721</p>
          </div>
        </div>
      </FloatCard>
    </>
  );
}

export function AuthShell({
  eyebrow, headline, accent, blurb, scene, footer, children,
}: {
  eyebrow: string;
  headline: string;
  accent: string;
  blurb: string;
  scene?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#F5F8FF]">
      {/* ── Scene ── */}
      <aside className="relative hidden w-[52%] flex-col overflow-hidden bg-qore-dark text-white lg:flex">
        <div className="nn-stars pointer-events-none absolute inset-0 opacity-70" />
        <div className="pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-qore-medium/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 -right-24 h-[30rem] w-[30rem] rounded-full bg-[#FF6A00]/15 blur-3xl" />

        <div className="relative z-10 p-10">
          <Link to="/public/home" className="inline-flex items-center gap-2.5">
            <img src="/netranova-icon.webp" alt="" className="h-10 w-10" />
            <span className="font-display text-2xl font-extrabold tracking-tight">NetraNova</span>
          </Link>
        </div>

        <div className="relative flex-1">
          <OrbitScene />
          {scene ?? <JourneyCards />}
        </div>

        <div className="relative z-10 px-10 pb-10">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-qore-highlight">{eyebrow}</p>
          <h2 className="mt-3 max-w-md font-display text-4xl font-extrabold leading-[1.1] tracking-tight xl:text-5xl">
            {headline}{' '}
            <span className="bg-gradient-to-r from-[#FFB020] to-[#FF6A00] bg-clip-text text-transparent">{accent}</span>
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60">{blurb}</p>
          {footer}
        </div>
      </aside>

      {/* ── Form ── */}
      <main className="relative flex flex-1 flex-col">
        {/* Mobile header */}
        <div className="relative overflow-hidden bg-qore-dark px-6 pb-20 pt-8 text-white lg:hidden">
          <div className="nn-stars pointer-events-none absolute inset-0 opacity-60" />
          <Link to="/public/home" className="relative inline-flex items-center gap-2">
            <img src="/netranova-icon.webp" alt="" className="h-8 w-8" />
            <span className="font-display text-lg font-extrabold">NetraNova</span>
          </Link>
          <h2 className="relative mt-6 font-display text-3xl font-extrabold leading-tight">
            {headline} <span className="bg-gradient-to-r from-[#FFB020] to-[#FF6A00] bg-clip-text text-transparent">{accent}</span>
          </h2>
        </div>

        <div className="-mt-12 flex flex-1 items-start justify-center px-4 pb-10 sm:px-8 lg:mt-0 lg:items-center lg:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="relative w-full max-w-[460px] rounded-[28px] border border-white bg-white p-7 shadow-[0_30px_80px_-20px_rgba(10,31,92,0.25)] sm:p-9"
          >
            {children}
          </motion.div>
        </div>

        <p className="flex items-center justify-center gap-1.5 pb-6 text-xs text-gray-400">
          <ShieldCheck size={13} /> Secured connection · NetraNova
        </p>
      </main>
    </div>
  );
}

export function FormHeader({ title, subtitle }: { title: string; subtitle: ReactNode }) {
  return (
    <div className="mb-7">
      <h1 className="font-display text-[28px] font-extrabold leading-tight tracking-tight text-qore-dark">{title}</h1>
      <p className="mt-1.5 text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} role="alert"
      className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">!</span>
      <span>{children}</span>
    </motion.div>
  );
}

/** Labelled input with a leading icon; password fields get a show/hide toggle. */
export function Field({
  label, icon: Icon, hint, aside, type = 'text', ...input
}: { label: ReactNode; icon: LucideIcon; hint?: ReactNode; aside?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-xs font-semibold text-gray-600">
        <span>{label}</span>
        {aside}
      </span>
      <span className="group relative block">
        <Icon size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-qore-medium" />
        <input
          {...input}
          type={isPassword && show ? 'text' : type}
          className={`w-full rounded-2xl border border-gray-200 bg-gray-50/70 py-3.5 pl-11 text-sm text-qore-text outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-qore-medium focus:bg-white focus:ring-4 focus:ring-qore-medium/10 ${isPassword ? 'pr-12' : 'pr-4'}`}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </span>
      {hint}
    </label>
  );
}

export function SubmitButton({ loading, loadingText, children }: { loading: boolean; loadingText: string; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#FF8A00] to-[#FF6A00] py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition hover:shadow-xl hover:shadow-orange-500/40 disabled:opacity-70"
    >
      <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/30 opacity-0 transition-all duration-700 group-hover:left-[110%] group-hover:opacity-100" />
      {loading ? (
        <>
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
          {loadingText}
        </>
      ) : (
        <>{children} <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" /></>
      )}
    </button>
  );
}

export function Divider({ children }: { children: ReactNode }) {
  return (
    <div className="my-6 flex items-center gap-3 text-xs text-gray-400">
      <span className="h-px flex-1 bg-gray-100" />{children}<span className="h-px flex-1 bg-gray-100" />
    </div>
  );
}
