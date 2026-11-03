import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Target, Heart, Users, Award, ArrowRight, Video, Film, CheckCircle2, Wallet, BadgeCheck, Bell } from 'lucide-react';

const values = [
  { icon: Target, title: 'Mission-driven', desc: 'We exist to close the tech skills gap in Africa with practical, employer-aligned training.' },
  { icon: Heart, title: 'Learner-first', desc: 'Every decision starts with what is best for our learners — from curriculum to support.' },
  { icon: Users, title: 'Community', desc: 'You learn with a cohort of peers, building a network that outlasts the course.' },
  { icon: Award, title: 'Excellence', desc: 'We hold ourselves and our learners to high standards — because your career deserves it.' },
];

// What every cohort includes — each line describes how the platform actually works.
const included = [
  { icon: Video, title: 'Live classes', desc: 'Expert-led sessions you join from your browser — no pre-recorded playlists.' },
  { icon: CheckCircle2, title: 'Automatic attendance', desc: "You're marked present the moment you join a class." },
  { icon: Film, title: 'Every class recorded', desc: 'Replay any session from your dashboard if you miss it.' },
  { icon: Wallet, title: 'Pay your way', desc: 'Pay in full, or in two instalments: half to start, the balance later.' },
  { icon: BadgeCheck, title: 'Verifiable certificate', desc: 'A unique certificate number anyone can check on our public verification page.' },
  { icon: Bell, title: 'Never miss an update', desc: 'New sessions, grades and announcements are emailed to you as they happen.' },
];

export function PublicAbout() {
  return (
    <div className="w-full bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-qore-dark pb-24 pt-20">
        <div className="nn-stars pointer-events-none absolute inset-0 opacity-60" />
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-qore-medium/30 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-qore-highlight">About NetraNova</p>
            <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
              We're on a mission to launch{' '}
              <span className="bg-gradient-to-r from-[#FFB020] to-[#FF6A00] bg-clip-text text-transparent">Africa's next tech generation</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
              NetraNova is a live, cohort-based learning platform that takes you from beginner to job-ready through expert-led sessions, real projects and a community that has your back.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="mb-6 font-display text-3xl font-extrabold text-qore-dark">Why we built it</h2>
            <div className="space-y-4 leading-relaxed text-gray-600">
              <p>
                Too many people pay for pre-recorded courses, watch hours of video, and still can't get a job — because what they were missing was real-world practice and someone to learn from.
              </p>
              <p>
                So NetraNova is built differently. Everything is live. Every session has a real expert on the other end. Every week you build something and get feedback on it. And you go through it all with a cohort of peers who grow alongside you.
              </p>
              <p>
                NetraNova is built by{' '}
                <a href="https://netrasoft.co" className="font-semibold text-qore-medium hover:underline">NetraSoft Solutions</a>.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What's included */}
      <section className="bg-[#F5F8FF] py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-qore-medium">Every cohort</p>
            <h2 className="font-display text-3xl font-extrabold text-qore-dark sm:text-4xl">What's included</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {included.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-qore-light">
                  <f.icon size={20} className="text-qore-medium" />
                </span>
                <h3 className="font-display font-bold text-qore-dark">{f.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center font-display text-3xl font-extrabold text-qore-dark sm:text-4xl">
            What we <span className="text-qore-medium">stand for</span>
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
                  <v.icon size={20} className="text-[#FF6A00]" />
                </span>
                <h3 className="mb-2 font-display font-bold text-qore-dark">{v.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 md:px-8 lg:px-16">
        <div className="relative overflow-hidden rounded-[36px] bg-qore-dark px-8 py-16 text-center">
          <div className="nn-stars pointer-events-none absolute inset-0 opacity-50" />
          <div className="relative z-10 mx-auto max-w-xl">
            <h2 className="mb-4 font-display text-3xl font-extrabold text-white">Ready to start?</h2>
            <p className="mb-8 text-sm text-white/70">Create a free account, then pick a track when a cohort opens.</p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/public/courses" className="flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-bold text-qore-dark transition-colors hover:bg-qore-light">
                Browse tracks <ArrowRight size={16} />
              </Link>
              <Link to="/register" className="rounded-full bg-gradient-to-r from-[#FFB020] to-[#FF6A00] px-7 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25">
                Create account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
