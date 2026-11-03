import { useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { JOURNEY } from './data';

/** Four milestones joined by a line that draws itself as you scroll, with a glowing comet at its tip. */
export function JourneyPath() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 75%', 'end 60%'] });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 25, mass: 0.4 });

  return (
    <section className="relative bg-white py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-qore-medium">Your trajectory</p>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-qore-dark sm:text-5xl">
            From first class to <span className="text-qore-medium">launch</span>
          </h2>
          <p className="mt-4 text-gray-500">A clear path, the same orbit every cohort follows.</p>
        </div>

        <div ref={ref} className="relative">
          {/* track + drawn line (left on mobile, centre on desktop) */}
          <div className="absolute bottom-0 left-[18.5px] top-0 w-[3px] rounded-full bg-gray-100 md:left-[calc(50%-1.5px)]" />
          <motion.div
            style={{ scaleY: progress }}
            className="absolute bottom-0 left-[18.5px] top-0 w-[3px] origin-top rounded-full bg-gradient-to-b from-qore-medium via-[#1AA3F0] to-[#FF8A1F] md:left-[calc(50%-1.5px)]"
          />

          <div className="space-y-8 md:-space-y-6">
            {JOURNEY.map((m, i) => {
              const right = i % 2 === 1;
              return (
                <div key={m.step} className="relative grid grid-cols-1 md:grid-cols-2 md:gap-16">
                  {/* node */}
                  <span className="absolute left-5 top-6 z-10 -translate-x-1/2 md:left-1/2">
                    <motion.span
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true, margin: '-30% 0px' }}
                      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-white ring-4 ring-qore-medium"
                    >
                      <span className="h-2 w-2 rounded-full bg-[#FF8A1F]" />
                    </motion.span>
                  </span>

                  <motion.div
                    initial={{ opacity: 0, x: right ? 40 : -40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-20% 0px' }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className={`ml-12 md:ml-0 ${right ? 'md:col-start-2' : 'md:text-right'}`}
                  >
                    <div className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-qore-medium/10">
                      <span className={`pointer-events-none absolute -bottom-10 font-display text-[110px] font-extrabold leading-none text-qore-light transition-colors group-hover:text-[#FFE7CC] right-4`}>
                        {m.step}
                      </span>
                      <div className="relative">
                        <h3 className="mb-2 font-display text-xl font-bold text-qore-dark">{m.title}</h3>
                        <p className="text-sm leading-relaxed text-gray-500">{m.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
