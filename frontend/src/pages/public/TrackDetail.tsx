import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, BadgeCheck, Bell, CalendarDays, CheckCircle2, ChevronDown, Clock, Film,
  GraduationCap, Users, Video, Wallet,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { toSlug } from './trackSlug';
import { TRACKS, genericTrack, type TrackContent } from './trackContent';
import { trackIcon, naira } from './home/data';
import { usePaymentPlan, firstPayment } from './home/useOpenPrograms';

interface Offering {
  programId: string;
  cohortId: string;
  cohortName: string;
  status: string;
  startDate?: string;
  endDate?: string;
  price: number;
  maxLearners: number;
  seatsTaken: number;
  instructor?: string;
  program: any;
}

const longDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

/** Soonest cohort that hasn't started yet, otherwise one already running. */
function pickOffering(list: Offering[], cohortId: string | null, programId: string | null): Offering | null {
  const exact = list.find((o) => o.programId === programId || (!programId && o.cohortId === cohortId));
  if (exact) return exact;
  const byStart = [...list].sort((a, b) => +new Date(a.startDate ?? 0) - +new Date(b.startDate ?? 0));
  return byStart.find((o) => o.status === 'upcoming') ?? byStart.find((o) => o.status === 'active') ?? null;
}

export function TrackDetail() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const payPlan = usePaymentPlan();
  const [offerings, setOfferings] = useState<Offering[] | null>(null);
  const [openWeek, setOpenWeek] = useState<number | null>(1);

  useEffect(() => {
    let alive = true;
    api
      .get('/cohorts')
      .then(({ data }) => {
        const list: Offering[] = [];
        for (const c of data ?? []) {
          if (c.status !== 'active' && c.status !== 'upcoming') continue;
          for (const p of c.programs ?? []) {
            if (toSlug(p.track) !== slug) continue;
            list.push({
              programId: p.id,
              cohortId: c.id,
              cohortName: c.name,
              status: c.status,
              startDate: c.startDate,
              endDate: c.endDate,
              price: Number(p.price) || 0,
              maxLearners: Number(p.maxLearners) || 0,
              seatsTaken: Number(p.seatsTaken) || 0,
              instructor: p.instructor ? `${p.instructor.firstName ?? ''} ${p.instructor.lastName ?? ''}`.trim() : undefined,
              program: p,
            });
          }
        }
        if (alive) setOfferings(list);
      })
      .catch(() => alive && setOfferings([]));
    return () => { alive = false; };
  }, [slug]);

  const current = useMemo(
    () => (offerings ? pickOffering(offerings, params.get('cohort'), params.get('program')) : null),
    [offerings, params],
  );

  // Built-in copy, overridden by whatever the program record in the database provides.
  const base: TrackContent | null = TRACKS[slug] ?? (offerings?.length ? genericTrack(slug, offerings[0].program.track) : null);
  const p = current?.program ?? {};
  const content: TrackContent | null = base && {
    ...base,
    track: p.track ?? base.track,
    overview: p.description || base.overview,
    duration: p.duration || base.duration,
    format: p.format || base.format,
    schedule: p.schedule || base.schedule,
    outcomes: Array.isArray(p.outcomes) && p.outcomes.length ? p.outcomes : base.outcomes,
    curriculum: Array.isArray(p.curriculum) && p.curriculum.length ? p.curriculum : base.curriculum,
  };

  useEffect(() => {
    document.title = content ? `${content.track} · NetraNova` : 'Track not found · NetraNova';
    return () => { document.title = 'NetraNova Live Learning Platform'; };
  }, [content?.track]);

  if (offerings === null) {
    return (
      <div className="min-h-screen bg-qore-dark">
        <div className="mx-auto max-w-7xl animate-pulse px-4 py-24 sm:px-6 lg:px-8">
          <div className="h-4 w-32 rounded bg-white/10" />
          <div className="mt-8 h-14 w-2/3 rounded bg-white/10" />
          <div className="mt-6 h-5 w-1/2 rounded bg-white/10" />
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-white px-4 text-center">
        <p className="font-display text-7xl font-extrabold text-qore-light">404</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-qore-dark">We couldn't find that track</h1>
        <p className="mt-2 text-gray-500">It may have been renamed or isn't offered right now.</p>
        <Link to="/public/courses" className="mt-8 rounded-full bg-qore-dark px-6 py-3 text-sm font-bold text-white hover:bg-qore-medium">
          See all tracks
        </Link>
      </div>
    );
  }

  const Icon = trackIcon(content.track);
  const seatsLeft = current && current.maxLearners ? Math.max(0, current.maxLearners - current.seatsTaken) : null;
  const full = seatsLeft === 0;
  const enrollPath = current ? `/learner/programs?enroll=${current.programId}` : '';
  const isLearner = user?.role === 'learner';
  const isStaff = !!user && !isLearner;

  let cta: { label: string; to: string; disabled?: boolean } ;
  if (!current) cta = isLearner ? { label: "You'll be emailed when it opens", to: '', disabled: true } : { label: 'Get notified when it opens', to: '/register' };
  else if (full) cta = { label: 'This cohort is full', to: '', disabled: true };
  else if (isStaff) cta = { label: 'Enrollment is for learner accounts', to: '', disabled: true };
  else if (isLearner) cta = { label: 'Enroll now', to: enrollPath };
  else cta = { label: 'Enroll now', to: `/register?next=${encodeURIComponent(enrollPath)}` };

  const facts = [
    content.duration && { icon: Clock, label: content.duration },
    content.format && { icon: Video, label: content.format },
    content.level && { icon: GraduationCap, label: content.level },
  ].filter(Boolean) as { icon: typeof Clock; label: string }[];

  return (
    <div className="min-h-screen bg-[#F5F8FF] pb-24">
      {/* Hero */}
      <section className="relative overflow-hidden bg-qore-dark pb-36 pt-14 text-white">
        <div className="nn-stars pointer-events-none absolute inset-0 opacity-60" />
        <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-qore-medium/30 blur-3xl" />
        <div className="pointer-events-none absolute right-[8%] top-1/2 hidden -translate-y-1/2 lg:block">
          <div className="relative h-72 w-72">
            <div className="nn-spin absolute inset-0 rounded-full border border-dashed border-white/15" style={{ '--nn-dur': '50s' } as React.CSSProperties}>
              <span className="absolute -top-1.5 left-1/2 h-3 w-3 rounded-full bg-[#FFB020] shadow-[0_0_18px_#FFB020]" />
            </div>
            <div className="nn-spin-rev absolute inset-10 rounded-full border border-white/10" style={{ '--nn-dur': '35s' } as React.CSSProperties}>
              <span className="absolute -bottom-1.5 left-1/2 h-2.5 w-2.5 rounded-full bg-qore-highlight shadow-[0_0_14px_#8CCBFF]" />
            </div>
            <div className="absolute inset-[30%] flex items-center justify-center rounded-3xl bg-gradient-to-br from-qore-medium to-[#1AA3F0] shadow-2xl shadow-qore-medium/40">
              <Icon size={54} />
            </div>
          </div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link to="/public/courses" className="inline-flex items-center gap-1.5 text-sm font-medium text-qore-highlight hover:text-white">
            <ArrowLeft size={15} /> All tracks
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 max-w-2xl">
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${current ? 'bg-gradient-to-r from-[#FFB020] to-[#FF6A00] text-white' : 'bg-white/10 text-white/80'}`}>
              {current ? `Enrolling · ${current.cohortName}` : 'Next cohort coming soon'}
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">{content.track}</h1>
            <p className="mt-4 font-display text-xl font-semibold text-qore-highlight">{content.tagline}</p>
            <p className="mt-5 max-w-xl leading-relaxed text-white/65">{content.overview}</p>
            {facts.length > 0 && (
              <div className="mt-7 flex flex-wrap gap-3">
                {facts.map(({ icon: I, label }) => (
                  <span key={label} className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/85">
                    <I size={15} className="text-qore-highlight" /> {label}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-24 grid max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
        {/* Enrol card — first on mobile, sidebar on desktop */}
        <aside className="lg:order-2">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-3xl border border-gray-100 bg-white p-7 shadow-xl shadow-qore-dark/10 lg:sticky lg:top-24">
            {current ? (
              <>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Tuition</p>
                <p className="font-display text-4xl font-extrabold text-qore-dark">{current.price > 0 ? naira(current.price) : 'TBA'}</p>
                {current.price > 0 && payPlan.allowInstallments && (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-semibold text-[#FF6A00]">
                    <Wallet size={13} /> or {naira(firstPayment(current.price, payPlan.firstInstallmentPercent))} now + {naira(current.price - firstPayment(current.price, payPlan.firstInstallmentPercent))} later
                  </p>
                )}
                <dl className="mt-6 space-y-3 text-sm">
                  {[
                    ['Cohort', current.cohortName],
                    ['Starts', longDate(current.startDate)],
                    ['Ends', longDate(current.endDate)],
                    ['Schedule', content.schedule],
                    ['Tutor', current.instructor],
                  ].filter(([, v]) => v).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 border-b border-gray-100 pb-3 last:border-0">
                      <dt className="text-gray-400">{k}</dt>
                      <dd className="text-right font-semibold text-qore-dark">{v}</dd>
                    </div>
                  ))}
                </dl>
                {seatsLeft !== null && (
                  <div className="mt-5">
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-semibold text-qore-dark"><Users size={13} /> {full ? 'No seats left' : `${seatsLeft} of ${current.maxLearners} seats left`}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-qore-medium to-[#FF8A1F]" style={{ width: `${Math.min(100, (current.seatsTaken / current.maxLearners) * 100)}%` }} />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-qore-light"><Bell size={22} className="text-qore-medium" /></span>
                <p className="mt-4 font-display text-xl font-bold text-qore-dark">No cohort open right now</p>
                <p className="mt-2 text-sm text-gray-500">
                  {isLearner ? "You're on our list — we'll email you as soon as the next cohort opens." : 'Create a free account and we’ll email you the moment the next cohort opens.'}
                </p>
              </>
            )}

            {cta.disabled ? (
              <p className="mt-7 rounded-2xl bg-gray-100 py-4 text-center text-sm font-semibold text-gray-500">{cta.label}</p>
            ) : (
              <Link to={cta.to} className="group mt-7 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FFB020] to-[#FF6A00] py-4 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-transform hover:scale-[1.02]">
                {cta.label} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            )}
            <ul className="mt-6 space-y-2.5 text-sm text-gray-500">
              {[
                [Video, 'Live classes in your browser'],
                [Film, 'Every class recorded'],
                [BadgeCheck, 'Verifiable certificate'],
              ].map(([I, t]: any) => (
                <li key={t} className="flex items-center gap-2.5"><I size={15} className="text-qore-medium" /> {t}</li>
              ))}
            </ul>
          </motion.div>
        </aside>

        {/* Main content */}
        <main className="space-y-8 lg:order-1 lg:col-span-2">
          {content.outcomes.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
              <h2 className="font-display text-2xl font-extrabold text-qore-dark">What you'll learn</h2>
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                {content.outcomes.map((o) => (
                  <div key={o} className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-qore-medium" />
                    <span className="text-sm text-gray-600">{o}</span>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {content.curriculum.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
              <div className="flex items-end justify-between gap-4">
                <h2 className="font-display text-2xl font-extrabold text-qore-dark">Curriculum</h2>
                <span className="text-sm text-gray-400">{content.curriculum.length} weeks</span>
              </div>
              <div className="mt-6 space-y-2">
                {content.curriculum.map((w) => {
                  const hasTopics = (w.topics ?? []).length > 0;
                  const open = hasTopics && openWeek === w.week;
                  return (
                    <div key={w.week} className={`overflow-hidden rounded-2xl border transition-colors ${open ? 'border-qore-medium/30 bg-qore-light/30' : 'border-gray-100'}`}>
                      <button
                        onClick={() => hasTopics && setOpenWeek(open ? null : w.week)}
                        aria-expanded={open}
                        className={`flex w-full items-center gap-4 px-5 py-4 text-left ${hasTopics ? '' : 'cursor-default'}`}
                      >
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-display text-sm font-bold ${open ? 'bg-qore-medium text-white' : 'bg-gray-100 text-qore-dark'}`}>{w.week}</span>
                        <span className="flex-1 font-semibold text-qore-dark">{w.title}</span>
                        {hasTopics && <ChevronDown size={18} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />}
                      </button>
                      <AnimatePresence initial={false}>
                        {open && (
                          <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-2 overflow-hidden px-5 pb-4 pl-[4.25rem]">
                            {w.topics.map((t) => (
                              <li key={t} className="flex items-center gap-2.5 text-sm text-gray-600">
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF8A1F]" /> {t}
                              </li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.section>
          )}

          {offerings.length > 1 && (
            <section className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
              <h2 className="font-display text-2xl font-extrabold text-qore-dark">Other open cohorts</h2>
              <div className="mt-5 space-y-3">
                {offerings.filter((o) => o.programId !== current?.programId).map((o) => (
                  <Link key={o.programId} to={`/public/tracks/${slug}?cohort=${o.cohortId}&program=${o.programId}`} className="flex items-center justify-between rounded-2xl border border-gray-100 px-5 py-4 hover:border-qore-medium/40">
                    <span className="flex items-center gap-3 text-sm"><CalendarDays size={16} className="text-qore-medium" /><b className="text-qore-dark">{o.cohortName}</b><span className="text-gray-400">starts {longDate(o.startDate)}</span></span>
                    <span className="font-display font-bold text-qore-dark">{o.price > 0 ? naira(o.price) : 'TBA'}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
