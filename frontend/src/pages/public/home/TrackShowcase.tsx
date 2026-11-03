import { type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { ArrowUpRight, CalendarDays, Clock } from 'lucide-react';
import { FALLBACK_TRACKS, naira, trackIcon } from './data';
import { type OpenProgram, shortDate } from './useOpenPrograms';
import { toSlug } from '../CourseListing';

interface Card {
  key: string;
  track: string;
  blurb?: string;
  price: number;
  meta: string;
  meta2?: string;
  href: string;
}

const ACCENTS = [
  'from-qore-medium to-[#1AA3F0]',
  'from-[#FF6A00] to-[#FFB020]',
  'from-[#0A1F5C] to-qore-medium',
  'from-[#1AA3F0] to-[#8CCBFF]',
];

function TiltCard({ card, index }: { card: Card; index: number }) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [8, -8]), { stiffness: 200, damping: 18 });
  const ry = useSpring(useTransform(px, [0, 1], [-10, 10]), { stiffness: 200, damping: 18 });
  const glowX = useTransform(px, (v) => `${v * 100}%`);
  const glowY = useTransform(py, (v) => `${v * 100}%`);
  const shine = useMotionTemplate`radial-gradient(360px circle at ${glowX} ${glowY}, rgba(255,255,255,.18), transparent 45%)`;
  const Icon = trackIcon(card.track);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.6, delay: index * 0.08 }}
      style={{ perspective: 1000 }}
    >
      <motion.div
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
        className="group relative h-full overflow-hidden rounded-[28px] bg-qore-dark p-7 text-white shadow-xl shadow-qore-dark/20"
      >
        <div className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br ${ACCENTS[index % ACCENTS.length]} opacity-60 blur-2xl transition-opacity group-hover:opacity-90`} />
        <motion.div className="pointer-events-none absolute inset-0" style={{ background: shine }} />

        <div className="relative flex h-full flex-col" style={{ transform: 'translateZ(40px)' }}>
          <div className="mb-8 flex items-start justify-between">
            <span className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${ACCENTS[index % ACCENTS.length]} shadow-lg`}>
              <Icon size={26} />
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70 transition-all group-hover:rotate-45 group-hover:border-white/40 group-hover:text-white">
              <ArrowUpRight size={18} />
            </span>
          </div>

          <h3 className="font-display text-2xl font-extrabold leading-tight">{card.track}</h3>
          {card.blurb && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/60">{card.blurb}</p>}

          <div className="mt-6 space-y-2 text-xs text-white/70">
            <p className="flex items-center gap-2"><CalendarDays size={13} className="text-qore-highlight" /> {card.meta}</p>
            {card.meta2 && <p className="flex items-center gap-2"><Clock size={13} className="text-qore-highlight" /> {card.meta2}</p>}
          </div>

          <div className="mt-auto flex items-end justify-between pt-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Tuition</p>
              <p className="font-display text-3xl font-extrabold">{card.price > 0 ? naira(card.price) : 'TBA'}</p>
              {card.price > 0 && <p className="text-[11px] text-[#FFB020]">or {naira(Math.round(card.price / 2))} to start</p>}
            </div>
            <Link to={card.href} className="rounded-full bg-white px-5 py-2.5 text-xs font-bold text-qore-dark transition-colors hover:bg-[#FFB020] hover:text-white">
              View track
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function TrackShowcase({ programs }: { programs: OpenProgram[] | null }) {
  const live = !!programs?.length;
  const cards: Card[] = live
    ? programs!.slice(0, 6).map((p) => ({
        key: p.id,
        track: p.track,
        blurb: p.description,
        price: p.price,
        meta: `${p.cohort}${p.startDate ? ` · starts ${shortDate(p.startDate)}` : ''}`,
        href: `/public/tracks/${p.slug}`,
      }))
    : FALLBACK_TRACKS.map((t) => ({
        key: t.track,
        track: t.track,
        blurb: t.blurb,
        price: t.price,
        meta: 'Next cohort: dates announced soon',
        meta2: t.duration,
        href: `/public/tracks/${toSlug(t.track)}`,
      }));

  return (
    <section id="tracks" className="scroll-mt-20 bg-[#F5F8FF] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-qore-medium">{live ? 'Enrolling now' : 'Tracks'}</p>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-qore-dark sm:text-5xl">
            Choose your <span className="bg-gradient-to-r from-[#FFB020] to-[#FF6A00] bg-clip-text text-transparent">orbit</span>
          </h2>
          <p className="mt-4 text-gray-500">Every track: live classes, weekly projects, recordings and a verifiable certificate.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => <TiltCard key={c.key} card={c} index={i} />)}
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          {live ? 'Seats are limited per cohort.' : 'Want a heads-up when dates are out?'}{' '}
          <Link to="/register" className="font-semibold text-qore-medium hover:underline">
            {live ? 'Create your account →' : 'Create a free account and we’ll email you →'}
          </Link>
        </p>
      </div>
    </section>
  );
}
