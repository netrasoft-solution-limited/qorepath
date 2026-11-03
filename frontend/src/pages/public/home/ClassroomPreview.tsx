import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { CheckCircle2, Circle, Film, Globe2, Hand, Mic, MonitorUp, ShieldCheck, Video } from 'lucide-react';

const TILES = [
  { initials: 'TA', name: 'Tutor', from: 'from-qore-medium', to: 'to-[#1AA3F0]', speaking: true },
  { initials: 'AY', name: 'Amaka', from: 'from-[#FF8A1F]', to: 'to-[#FFB020]' },
  { initials: 'IB', name: 'Ibrahim', from: 'from-[#0A1F5C]', to: 'to-qore-medium' },
  { initials: 'TO', name: 'Tolu', from: 'from-[#1AA3F0]', to: 'to-[#8CCBFF]' },
];

// Illustrative chat for the mock classroom.
const CHAT = [
  { who: 'Tutor', text: "Today: React state. Share your screen when you're ready, Amaka 👋" },
  { who: 'Amaka', text: 'Sharing now — my counter re-renders twice?' },
  { who: 'Ibrahim', text: 'StrictMode does that in dev 😄' },
  { who: 'Tutor', text: "Exactly. Let's prove it with a quick log." },
];

const FEATURES = [
  { icon: Globe2, title: 'Join from your browser', desc: 'No installs. One click from your dashboard drops you into class.' },
  { icon: CheckCircle2, title: 'Attendance, automatically', desc: "You're marked present the moment you join — nothing to sign." },
  { icon: Film, title: 'Every class recorded', desc: 'Missed one? The recording lands on the session for you to replay.' },
  { icon: ShieldCheck, title: 'Only your cohort', desc: 'Rooms are locked to enrolled learners and their tutors.' },
];

export function ClassroomPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: '-20% 0px' });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? CHAT.length : 0);

  useEffect(() => {
    if (!inView || reduce) return;
    const t = setInterval(() => setShown((n) => (n >= CHAT.length + 2 ? 0 : n + 1)), 1400);
    return () => clearInterval(t);
  }, [inView, reduce]);

  const visible = CHAT.slice(0, Math.min(shown, CHAT.length));
  const showToast = shown >= 2;

  return (
    <section className="relative overflow-hidden bg-[#F5F8FF] py-24">
      <div className="pointer-events-none absolute -right-32 top-10 h-96 w-96 rounded-full bg-qore-highlight/40 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:px-8">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-qore-medium">The live classroom</p>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-qore-dark sm:text-5xl">
            A real room.
            <br />
            Real people. <span className="bg-gradient-to-r from-[#FFB020] to-[#FF6A00] bg-clip-text text-transparent">Right now.</span>
          </h2>
          <p className="mt-5 max-w-md text-gray-500">
            Not a playlist of videos. You learn face-to-face with a tutor and your cohort, ask questions out loud, and get unstuck in the moment.
          </p>
          <div className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
                  <Icon size={18} className="text-qore-medium" />
                </span>
                <div>
                  <p className="text-sm font-bold text-qore-dark">{title}</p>
                  <p className="text-sm leading-relaxed text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mock classroom window */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40, rotate: 1.5 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          viewport={{ once: true, margin: '-15% 0px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
          aria-hidden
        >
          <div className="overflow-hidden rounded-3xl bg-qore-dark shadow-2xl shadow-qore-dark/30 ring-1 ring-white/10">
            {/* top bar */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
                <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
                <span className="h-3 w-3 rounded-full bg-[#28C840]" />
                <span className="ml-3 text-xs font-semibold text-white/70">Week 4 · React State & Effects</span>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-300">
                <Circle size={8} className="animate-pulse fill-current" /> Rec
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_200px]">
              {/* video grid */}
              <div className="grid grid-cols-2 gap-2 p-3">
                {TILES.map((t) => (
                  <div key={t.name} className={`relative flex aspect-video items-center justify-center rounded-2xl bg-gradient-to-br ${t.from} ${t.to} ${t.speaking ? 'ring-2 ring-[#FFB020]' : ''}`}>
                    <span className="font-display text-2xl font-bold text-white/90">{t.initials}</span>
                    <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-black/30 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {t.speaking && <Mic size={10} />} {t.name}
                    </span>
                    {t.speaking && (
                      <span className="absolute right-2 top-2 flex gap-0.5">
                        {[0, 1, 2].map((b) => (
                          <motion.span
                            key={b}
                            animate={reduce ? undefined : { scaleY: [0.4, 1, 0.5, 0.9, 0.4] }}
                            transition={{ duration: 1, repeat: Infinity, delay: b * 0.15 }}
                            className="h-3 w-1 origin-bottom rounded-full bg-white"
                          />
                        ))}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* chat */}
              <div className="hidden min-h-[220px] flex-col gap-2 border-l border-white/10 p-3 sm:flex">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Chat</p>
                <AnimatePresence initial={false}>
                  {visible.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="rounded-xl bg-white/10 px-2.5 py-1.5"
                    >
                      <p className="text-[10px] font-bold text-qore-highlight">{m.who}</p>
                      <p className="text-[11px] leading-snug text-white/85">{m.text}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* controls */}
            <div className="flex items-center justify-center gap-3 border-t border-white/10 py-3">
              {[Mic, Video, MonitorUp, Hand].map((Icon, i) => (
                <span key={i} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80">
                  <Icon size={16} />
                </span>
              ))}
              <span className="rounded-full bg-red-500 px-4 py-2 text-[11px] font-bold text-white">Leave</span>
            </div>
          </div>

          {/* toast */}
          <AnimatePresence>
            {showToast && (
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                className="absolute -right-2 -top-5 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-gray-100 sm:-right-6"
              >
                <CheckCircle2 size={18} className="text-green-500" />
                <div>
                  <p className="text-xs font-bold text-qore-dark">Attendance marked</p>
                  <p className="text-[10px] text-gray-400">Automatically, when you joined</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="nn-float absolute -bottom-6 -left-4 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#FFB020] to-[#FF6A00] px-4 py-3 text-white shadow-xl shadow-orange-500/25 sm:-left-8">
            <Film size={16} />
            <p className="text-xs font-bold">Recording saved to your dashboard</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
