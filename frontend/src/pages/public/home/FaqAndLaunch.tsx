import { useState, type CSSProperties, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Plus } from 'lucide-react';
import { FAQS } from './data';

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="bg-white py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:px-8">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-qore-medium">FAQ</p>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-qore-dark sm:text-5xl">
            Questions, <span className="text-qore-medium">answered.</span>
          </h2>
          <p className="mt-4 max-w-sm text-gray-500">
            Can't find what you're after?{' '}
            <Link to="/public/contact" className="font-semibold text-qore-medium hover:underline">Get in touch</Link>.
          </p>
        </div>
        <div className="divide-y divide-gray-100 border-y border-gray-100">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <button onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-6 py-6 text-left">
                  <span className={`font-display text-lg font-bold transition-colors ${isOpen ? 'text-qore-medium' : 'text-qore-dark'}`}>{f.q}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${isOpen ? 'bg-gradient-to-br from-[#FFB020] to-[#FF6A00] text-white' : 'bg-gray-100 text-qore-dark'}`}
                  >
                    <Plus size={18} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                      <p className="max-w-xl pb-6 text-sm leading-relaxed text-gray-500">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function LaunchCta() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate(`/register${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ''}`);
  };
  return (
    <section className="px-4 pb-24 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative mx-auto max-w-7xl overflow-hidden rounded-[36px] bg-qore-dark px-6 py-20 text-center sm:px-12"
      >
        <div className="nn-stars pointer-events-none absolute inset-0 opacity-60" />
        {/* concentric orbit rings */}
        {[340, 560, 780].map((s, i) => (
          <div key={s} className="pointer-events-none absolute left-1/2 top-1/2" style={{ width: s, height: s, marginLeft: -s / 2, marginTop: -s / 2 }}>
            <div className={`h-full w-full rounded-full border ${i === 1 ? 'border-dashed border-white/15' : 'border-white/10'} ${i % 2 ? 'nn-spin-rev' : 'nn-spin'}`} style={{ '--nn-dur': `${50 + i * 20}s` } as CSSProperties}>
              <span className={`absolute -top-1.5 left-1/2 h-3 w-3 rounded-full ${i === 1 ? 'bg-[#FFB020] shadow-[0_0_18px_#FFB020]' : 'bg-qore-highlight shadow-[0_0_14px_#8CCBFF]'}`} />
            </div>
          </div>
        ))}

        <div className="relative mx-auto max-w-2xl">
          <img src="/netranova-icon.webp" alt="" className="mx-auto mb-8 h-16 w-16 rounded-2xl bg-white p-2 shadow-[0_0_60px_rgba(140,203,255,.35)]" />
          <h2 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
            Your orbit <span className="bg-gradient-to-r from-[#FFB020] to-[#FF6A00] bg-clip-text text-transparent">starts here.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-white/60">Create a free account in under a minute. Pick a track when you're ready.</p>
          <form onSubmit={submit} className="mx-auto mt-9 flex max-w-md flex-col gap-3 rounded-2xl bg-white/10 p-2 backdrop-blur sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-label="Email address"
              className="min-w-0 flex-1 rounded-xl bg-white px-4 py-3.5 text-sm text-qore-dark focus:outline-none focus:ring-2 focus:ring-[#FFB020]"
            />
            <button className="group flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-[#FFB020] to-[#FF6A00] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/30">
              Get started <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </button>
          </form>
        </div>
      </motion.div>
    </section>
  );
}
