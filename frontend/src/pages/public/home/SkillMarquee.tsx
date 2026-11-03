import type { CSSProperties } from 'react';
import { SKILLS } from './data';

function Row({ items, reverse, duration }: { items: string[]; reverse?: boolean; duration: number }) {
  // Content is duplicated so translating by -50% loops seamlessly.
  const loop = [...items, ...items];
  return (
    <div className="flex overflow-hidden">
      <div className={`flex shrink-0 items-center gap-6 pr-6 ${reverse ? 'nn-marquee-rev' : 'nn-marquee'}`} style={{ '--nn-dur': `${duration}s` } as CSSProperties}>
        {loop.map((s, i) => (
          <span key={i} className="flex items-center gap-6 whitespace-nowrap font-display text-lg font-bold sm:text-2xl">
            {s}
            <span className="text-[#FFB020]" aria-hidden>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function SkillMarquee() {
  return (
    <section aria-label="Skills you'll learn" className="relative -mt-6 overflow-hidden py-10">
      <div className="-rotate-2 space-y-3 bg-gradient-to-r from-qore-medium via-[#1A73F5] to-qore-medium py-4 text-white shadow-xl shadow-qore-medium/20">
        <Row items={SKILLS} duration={45} />
      </div>
      <div className="mt-[-6px] rotate-1 bg-qore-dark py-3 text-white/70">
        <Row items={[...SKILLS].reverse()} duration={55} reverse />
      </div>
    </section>
  );
}
