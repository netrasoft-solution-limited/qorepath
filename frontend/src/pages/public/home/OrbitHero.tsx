import { useEffect, useState, type CSSProperties, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, Award, CalendarDays, Radio, Sparkles, Video, Wallet, type LucideIcon } from 'lucide-react';
import { ROLES, SKILLS, FALLBACK_TRACKS, trackIcon } from './data';
import { type OpenProgram, shortDate } from './useOpenPrograms';

function RotatingRole() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setI((n) => (n + 1) % ROLES.length), 2400);
    return () => clearInterval(t);
  }, [reduce]);
  return (
    <span className="relative inline-flex h-[1.25em] overflow-hidden align-bottom">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={ROLES[i]}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="text-qore-highlight whitespace-nowrap"
        >
          {ROLES[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

interface OrbitItem {
  label: string;
  icon?: LucideIcon;
  tone?: 'glass' | 'solid' | 'accent';
}

/** A ring that spins; its items counter-spin so their labels stay upright. */
function Ring({ size, duration, items, reverse, offset = 0, dashed }: {
  size: number; duration: number; items: OrbitItem[]; reverse?: boolean; offset?: number; dashed?: boolean;
}) {
  const r = size / 2;
  const spinStyle = { width: size, height: size, '--nn-dur': `${duration}s` } as CSSProperties;
  const counterStyle = { '--nn-dur': `${duration}s` } as CSSProperties;
  return (
    <div
      className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border ${dashed ? 'border-dashed border-white/15' : 'border-white/10'}`}
      style={{ width: size, height: size }}
    >
      <div className={`absolute inset-0 ${reverse ? 'nn-spin-rev' : 'nn-spin'}`} style={spinStyle}>
        {items.map((item, idx) => {
          const angle = (offset + (360 / items.length) * idx) * (Math.PI / 180);
          const x = r + r * Math.cos(angle);
          const y = r + r * Math.sin(angle);
          const tone =
            item.tone === 'accent'
              ? 'bg-gradient-to-r from-[#FFB020] to-[#FF6A00] text-white border-transparent shadow-lg shadow-orange-500/30'
              : item.tone === 'solid'
                ? 'bg-white text-qore-dark border-white shadow-xl shadow-black/20'
                : 'bg-white/10 text-white border-white/15 backdrop-blur-md';
          return (
            <div key={item.label} className="absolute w-max" style={{ left: x, top: y }}>
              {/* translate and counter-spin on separate elements: an animated transform replaces any static one */}
              <div className="-translate-x-1/2 -translate-y-1/2">
                <div className={reverse ? 'nn-spin' : 'nn-spin-rev'} style={counterStyle}>
                  <span className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-semibold ${tone}`}>
                    {item.icon && <item.icon size={13} />}
                    {item.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrbitSystem({ programs }: { programs: OpenProgram[] | null }) {
  const trackNames = (programs?.length ? programs.map((p) => p.track) : FALLBACK_TRACKS.map((t) => t.track));
  const unique = [...new Set(trackNames)].slice(0, 4);
  return (
    <div className="relative h-[560px] w-[560px]">
      {/* glow */}
      <div className="absolute inset-[18%] rounded-full bg-qore-medium/30 blur-3xl" />

      <Ring size={240} duration={38} offset={-30} dashed items={[{ label: 'Live classes', icon: Video }, { label: 'Mentors', icon: Sparkles }]} />
      <Ring
        size={390}
        duration={60}
        reverse
        offset={20}
        items={unique.map((t, i) => ({ label: t.replace(' (UI/UX)', ''), icon: trackIcon(t), tone: i === 0 ? 'solid' : 'glass' }))}
      />
      <Ring size={540} duration={90} offset={60} dashed items={SKILLS.slice(0, 6).map((s, i) => ({ label: s, tone: i === 2 ? 'accent' : 'glass' }))} />

      {/* The comet — echoes the orange swoosh in the logo */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <svg className="nn-spin block" width="390" height="390" viewBox="0 0 390 390" style={{ '--nn-dur': '14s' } as CSSProperties} aria-hidden>
          <defs>
            <linearGradient id="nn-comet" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FF6A00" stopOpacity="0" />
              <stop offset="100%" stopColor="#FFB020" />
            </linearGradient>
          </defs>
          <circle cx="195" cy="195" r="194" fill="none" stroke="url(#nn-comet)" strokeWidth="3" strokeLinecap="round" strokeDasharray="190 1030" />
        </svg>
      </div>

      {/* core */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span className="nn-pulse-ring absolute inset-0 rounded-full border-2 border-qore-highlight/60" />
        <span className="nn-pulse-ring absolute inset-0 rounded-full border-2 border-[#FFB020]/50" style={{ animationDelay: '1.2s' }} />
        <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-[0_0_80px_rgba(140,203,255,.45)]">
          <img src="/netranova-icon.webp" alt="" className="h-20 w-20" />
        </div>
      </div>
    </div>
  );
}

export function OrbitHero({ programs }: { programs: OpenProgram[] | null }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });
  const orbitX = useTransform(sx, (v) => v * 24);
  const orbitY = useTransform(sy, (v) => v * 24);
  const cardX = useTransform(sx, (v) => v * -14);
  const cardY = useTransform(sy, (v) => v * -14);

  const onMove = (e: MouseEvent<HTMLElement>) => {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const next = programs?.[0];

  return (
    <section onMouseMove={onMove} className="relative overflow-hidden bg-qore-dark">
      <div className="nn-stars pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute -right-40 -top-40 h-[640px] w-[640px] rounded-full bg-qore-medium/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -left-40 h-[520px] w-[520px] rounded-full bg-[#FF6A00]/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-6 px-4 pb-10 pt-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-0 lg:px-8 lg:pb-20 lg:pt-20">
        {/* Copy */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10 min-w-0">
          <div className={`mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1.5 pl-1.5 pr-4 text-xs font-semibold text-white/80 backdrop-blur transition-opacity ${programs === null ? 'opacity-0' : 'opacity-100'}`}>
            <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-[#FFB020] to-[#FF6A00] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              <Radio size={11} /> {next ? 'Enrolling' : 'Soon'}
            </span>
            {next ? `${next.cohort} · starts ${shortDate(next.startDate)}` : 'New cohorts opening soon'}
          </div>

          <h1 className="font-display text-[44px] font-extrabold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-[72px]">
            Learn live.
            <br />
            Launch{' '}
            <span className="bg-gradient-to-r from-[#FFB020] via-[#FF8A1F] to-[#FF6A00] bg-clip-text text-transparent">further.</span>
          </h1>

          <p className="mt-6 font-display text-xl font-semibold text-white/90 sm:text-2xl">
            Become a <RotatingRole />
          </p>

          <p className="mt-5 max-w-[480px] text-base leading-relaxed text-white/60 sm:text-lg">
            Expert-led cohorts you join from your browser. Real projects every week, every class recorded, and a certificate anyone can verify.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FFB020] to-[#FF6A00] px-7 py-4 text-sm font-bold text-white shadow-xl shadow-orange-500/25 transition-transform hover:scale-[1.03]"
            >
              Start your journey
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#tracks"
              className="flex items-center gap-2 rounded-full border border-white/20 px-7 py-4 text-sm font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/5"
            >
              Explore tracks
            </a>
          </div>

          <ul className="mt-10 grid max-w-[520px] grid-cols-1 gap-3 text-sm text-white/70 sm:grid-cols-3">
            {[
              { icon: Video, text: 'Live, not pre-recorded' },
              { icon: Wallet, text: 'Pay in 2 instalments' },
              { icon: Award, text: 'Verifiable certificate' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon size={14} className="text-qore-highlight" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Orbit */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.15 }}
          className="relative flex h-[360px] min-w-0 items-center justify-center overflow-hidden sm:h-[460px] lg:h-[600px] lg:overflow-visible"
        >
          <motion.div style={{ x: orbitX, y: orbitY }}>
            <div className="origin-center scale-[0.62] sm:scale-[0.8] lg:scale-100">
              <OrbitSystem programs={programs} />
            </div>
          </motion.div>

          {/* floating "next cohort" card */}
          <motion.div style={{ x: cardX, y: cardY }} className="absolute bottom-2 right-0 hidden sm:block lg:bottom-16 lg:right-2">
           <div className="nn-float w-60 rounded-2xl border border-white/60 bg-white/95 p-4 shadow-2xl backdrop-blur">
            <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-qore-medium">
              <CalendarDays size={12} /> Next cohort
            </p>
            <p className="font-display text-sm font-bold text-qore-dark">{next ? next.track : 'Announced soon'}</p>
            <p className="mb-3 text-xs text-gray-500">{next ? `${next.cohort} · ${shortDate(next.startDate)}` : 'Create an account to be notified'}</p>
            <Link to={next ? `/public/tracks/${next.slug}` : '/register'} className="block rounded-xl bg-qore-dark py-2 text-center text-[11px] font-bold text-white transition-colors hover:bg-qore-medium">
              {next ? 'Reserve your seat' : 'Get notified'}
            </Link>
           </div>
          </motion.div>
        </motion.div>
      </div>

      {/* curved horizon into the next section */}
      <svg className="relative block w-full text-white" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden>
        <path d="M0 80 C 360 0 1080 0 1440 80 Z" fill="currentColor" />
      </svg>
    </section>
  );
}
