import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useInView } from 'framer-motion';
import { Quote } from 'lucide-react';
import { STATS, TESTIMONIALS } from './data';

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

function QuoteCard({ t }: { t: (typeof TESTIMONIALS)[number] }) {
  return (
    <figure className="w-[340px] shrink-0 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:w-[380px]">
      <Quote size={22} className="mb-4 text-[#FFB020]" />
      <blockquote className="text-sm leading-relaxed text-white/80">“{t.text}”</blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-qore-medium to-[#1AA3F0] text-sm font-bold text-white">
          {t.name.charAt(0)}
        </span>
        <span>
          <span className="block text-sm font-bold text-white">{t.name}</span>
          <span className="block text-xs text-qore-highlight">{t.role}</span>
        </span>
      </figcaption>
    </figure>
  );
}

export function Voices() {
  const half = Math.ceil(TESTIMONIALS.length / 2);
  const rows = [TESTIMONIALS.slice(0, half), TESTIMONIALS.slice(half)];
  return (
    <section className="relative overflow-hidden bg-qore-dark py-24">
      <div className="nn-stars pointer-events-none absolute inset-0 opacity-50" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-y-10 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-5xl font-extrabold text-white sm:text-6xl">
                <Counter value={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-1 text-sm font-medium text-qore-highlight">{s.label}</p>
            </div>
          ))}
        </div>

        <h2 className="mx-auto mt-20 max-w-2xl text-center font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
          Voices from the <span className="bg-gradient-to-r from-[#FFB020] to-[#FF6A00] bg-clip-text text-transparent">cohort</span>
        </h2>
      </div>

      <div className="nn-pause-on-hover relative mt-12 space-y-5 [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
        {rows.map((row, r) => (
          <div key={r} className="flex overflow-hidden">
            <div className={`flex shrink-0 gap-5 pr-5 ${r ? 'nn-marquee-rev' : 'nn-marquee'}`} style={{ '--nn-dur': `${60 + r * 10}s` } as CSSProperties}>
              {[...row, ...row].map((t, i) => <QuoteCard key={i} t={t} />)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
