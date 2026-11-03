import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, CalendarDays, Film, Video, Wallet } from 'lucide-react';
import { TRACKS } from './trackContent';
import { useOpenPrograms, shortDate, type OpenProgram } from './home/useOpenPrograms';
import { TiltCard, type Card } from './home/TrackShowcase';
import { naira, trackIcon } from './home/data';

export { toSlug } from './trackSlug';

interface Row {
  slug: string;
  track: string;
  tagline: string;
  duration: string;
  level: string;
  schedule: string;
  next?: OpenProgram;
  fromPrice: number | null;
}

/** Built-in tracks plus any extra tracks that only exist as open programs in the database. */
function buildRows(programs: OpenProgram[]): Row[] {
  const bySlug = new Map<string, OpenProgram[]>();
  for (const p of programs) bySlug.set(p.slug, [...(bySlug.get(p.slug) ?? []), p]);
  const slugs = [...new Set([...Object.keys(TRACKS), ...bySlug.keys()])];
  return slugs.map((slug) => {
    const t = TRACKS[slug];
    const open = bySlug.get(slug) ?? [];
    const priced = open.filter((o) => o.price > 0).map((o) => o.price);
    return {
      slug,
      track: t?.track ?? open[0].track,
      tagline: t?.tagline ?? open[0].description ?? 'Live, expert-led training with real projects.',
      duration: t?.duration ?? '',
      level: t?.level ?? '',
      schedule: t?.schedule ?? '',
      next: open[0],
      fromPrice: priced.length ? Math.min(...priced) : null,
    };
  });
}

export function CourseListing() {
  const programs = useOpenPrograms();
  const rows = programs ? buildRows(programs) : [];

  useEffect(() => {
    document.title = 'Tracks · NetraNova';
    return () => { document.title = 'NetraNova Live Learning Platform'; };
  }, []);

  const cards: Card[] = rows.map((r) => ({
    key: r.slug,
    track: r.track,
    blurb: r.tagline,
    price: r.fromPrice ?? 0,
    meta: r.next ? `${r.next.cohort} · starts ${shortDate(r.next.startDate)}` : 'Next cohort: dates announced soon',
    meta2: [r.duration, r.level].filter(Boolean).join(' · ') || undefined,
    href: r.next ? `/public/tracks/${r.slug}?program=${r.next.id}` : `/public/tracks/${r.slug}`,
  }));

  return (
    <div className="min-h-screen bg-[#F5F8FF]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-qore-dark pb-36 pt-20 text-white">
        <div className="nn-stars pointer-events-none absolute inset-0 opacity-60" />
        <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-qore-medium/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-[#FF6A00]/10 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-qore-highlight">Tracks</p>
            <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              Learn the skills.{' '}
              <span className="bg-gradient-to-r from-[#FFB020] to-[#FF6A00] bg-clip-text text-transparent">Ship the work.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-white/60">
              Every track is taught live by an expert, with weekly projects, recordings of every class and a certificate anyone can verify.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
              {[[Video, 'Live classes'], [Film, 'Recorded sessions'], [Wallet, 'Pay in 2 instalments'], [BadgeCheck, 'Verifiable certificate']].map(([I, t]: any) => (
                <span key={t} className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-white/80">
                  <I size={15} className="text-qore-highlight" /> {t}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Cards */}
      <section className="relative z-10 mx-auto -mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {programs === null
            ? [0, 1, 2].map((i) => <div key={i} className="h-[380px] animate-pulse rounded-[28px] bg-qore-dark/20" />)
            : cards.map((c, i) => <TiltCard key={c.key} card={c} index={i} />)}
        </div>
      </section>

      {/* Compare */}
      {rows.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-qore-medium">Side by side</p>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-qore-dark sm:text-4xl">Compare tracks</h2>
          </div>
          <div className="overflow-x-auto rounded-3xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-4 font-semibold">Track</th>
                  <th className="px-6 py-4 font-semibold">Duration</th>
                  <th className="px-6 py-4 font-semibold">Level</th>
                  <th className="px-6 py-4 font-semibold">Next cohort</th>
                  <th className="px-6 py-4 font-semibold">Tuition</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const Icon = trackIcon(r.track);
                  return (
                    <tr key={r.slug} className="border-b border-gray-50 last:border-0 hover:bg-[#F5F8FF]">
                      <td className="px-6 py-5">
                        <span className="flex items-center gap-3 font-semibold text-qore-dark">
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-qore-light"><Icon size={16} className="text-qore-medium" /></span>
                          {r.track}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-gray-600">{r.duration || '—'}</td>
                      <td className="px-6 py-5 text-gray-600">{r.level || '—'}</td>
                      <td className="px-6 py-5 text-gray-600">
                        {r.next ? (
                          <span className="flex items-center gap-1.5"><CalendarDays size={14} className="text-[#FF6A00]" /> {shortDate(r.next.startDate)}</span>
                        ) : (
                          <span className="text-gray-400">Announced soon</span>
                        )}
                      </td>
                      <td className="px-6 py-5 font-display font-bold text-qore-dark">{r.fromPrice ? `from ${naira(r.fromPrice)}` : <span className="font-sans font-normal text-gray-400">When enrolling opens</span>}</td>
                      <td className="px-6 py-5 text-right">
                        <Link to={`/public/tracks/${r.slug}`} className="inline-flex items-center gap-1 font-semibold text-qore-medium hover:underline">
                          Details <ArrowRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* How a cohort works */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center font-display text-3xl font-extrabold tracking-tight text-qore-dark sm:text-4xl">
            How a cohort <span className="text-qore-medium">works</span>
          </h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
            {[
              ['01', 'Enroll', 'Pick a track and pay in full or half now, half later.'],
              ['02', 'Learn live', 'Join classes from your browser — attendance is automatic.'],
              ['03', 'Build weekly', 'Submit projects and get graded feedback from your tutor.'],
              ['04', 'Graduate', 'Earn a certificate with a number anyone can verify.'],
            ].map(([n, t, d], i) => (
              <motion.div
                key={n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="relative overflow-hidden rounded-3xl border border-gray-100 bg-[#F5F8FF] p-7"
              >
                <span className="pointer-events-none absolute -bottom-6 right-3 font-display text-8xl font-extrabold text-qore-light">{n}</span>
                <p className="relative font-display text-lg font-bold text-qore-dark">{t}</p>
                <p className="relative mt-2 text-sm leading-relaxed text-gray-500">{d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-24 pt-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[36px] bg-qore-dark px-6 py-16 text-center">
          <div className="nn-stars pointer-events-none absolute inset-0 opacity-50" />
          <div className="relative">
            <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl">Not sure which track is right?</h2>
            <p className="mx-auto mt-3 max-w-md text-white/60">Create a free account — you'll be emailed the moment a new cohort opens, and you can decide then.</p>
            <Link to="/register" className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FFB020] to-[#FF6A00] px-7 py-4 text-sm font-bold text-white shadow-lg shadow-orange-500/30">
              Create free account <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
