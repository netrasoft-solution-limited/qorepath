import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useInView } from 'framer-motion';
import { Hammer } from 'lucide-react';
import { FACTS, PROJECTS } from './data';

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / 1600, 1);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * value));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);
  return <span ref={ref}>{n}{suffix}</span>;
}

const TRACK_TONE: Record<string, string> = {
  Frontend: 'from-qore-medium to-[#1AA3F0]',
  Backend: 'from-[#FF6A00] to-[#FFB020]',
  Design: 'from-[#1AA3F0] to-[#8CCBFF]',
};

function ProjectCard({ p }: { p: (typeof PROJECTS)[number] }) {
  return (
    <figure className="w-[300px] shrink-0 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:w-[340px]">
      <span className={`mb-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${TRACK_TONE[p.track]} px-3 py-1 text-[11px] font-bold text-white`}>
        <Hammer size={11} /> {p.track}
      </span>
      <p className="font-display text-lg font-bold text-white">{p.title}</p>
      <p className="mt-2 text-sm leading-relaxed text-white/65">{p.desc}</p>
    </figure>
  );
}

/** "Founding cohort" band: how the program works, plus the kind of work learners ship. */
export function Voices() {
  const half = Math.ceil(PROJECTS.length / 2);
  const rows = [PROJECTS.slice(0, half), PROJECTS.slice(half)];
  return (
    <section className="relative overflow-hidden bg-qore-dark py-24">
      <div className="nn-stars pointer-events-none absolute inset-0 opacity-50" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-y-10 md:grid-cols-4">
          {FACTS.map((s) => (
            <div key={s.label} className="px-2 text-center">
              <p className="font-display text-5xl font-extrabold text-white sm:text-6xl">
                <Counter value={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-1 text-sm font-medium text-qore-highlight">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-20 max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#FFB020]">Founding cohort</p>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Ship work you can <span className="bg-gradient-to-r from-[#FFB020] to-[#FF6A00] bg-clip-text text-transparent">show off</span>
          </h2>
          <p className="mt-4 text-white/60">The kind of projects you build during a cohort — each one reviewed by your tutor and ready for your portfolio.</p>
        </div>
      </div>

      <div className="nn-pause-on-hover relative mt-12 space-y-5 [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
        {rows.map((row, r) => (
          <div key={r} className="flex overflow-hidden">
            <div className={`flex shrink-0 gap-5 pr-5 ${r ? 'nn-marquee-rev' : 'nn-marquee'}`} style={{ '--nn-dur': `${55 + r * 10}s` } as CSSProperties}>
              {[...row, ...row].map((p, i) => <ProjectCard key={i} p={p} />)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
