import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Target, Heart, Users, Award, CheckCircle, ArrowRight } from 'lucide-react';

const values = [
  { icon: Target, title: 'Mission-Driven', desc: 'We exist to close the tech skills gap in Africa by delivering practical, employer-aligned training.' },
  { icon: Heart, title: 'Learner-First', desc: 'Every decision we make starts with what is best for our learners — from curriculum to support.' },
  { icon: Users, title: 'Community', desc: 'We build more than skills. We build networks, friendships, and a generation of African tech professionals.' },
  { icon: Award, title: 'Excellence', desc: 'We hold ourselves and our learners to the highest standards — because mediocrity has no place in your career.' },
];

const team = [
  { initials: 'AO', name: 'Adaeze Okonkwo', role: 'Co-Founder & CEO', bio: 'Former product manager at Flutterwave with a passion for education technology.' },
  { initials: 'KA', name: 'Kolade Adeyemi', role: 'Co-Founder & CTO', bio: 'Full-stack engineer with 10+ years building products for African startups.' },
  { initials: 'TN', name: 'Tunde Nwosu', role: 'Head of Curriculum', bio: 'Ex-Google engineer who left big tech to build Africa\'s next generation of developers.' },
  { initials: 'CI', name: 'Chidera Ike', role: 'Head of Student Success', bio: 'Dedicated to ensuring every learner that starts with us finishes strong and lands a role.' },
];

const milestones = [
  { year: '2022', text: 'QorePath founded in Lagos, Nigeria with first cohort of 20 learners.' },
  { year: '2023', text: 'Expanded to 3 tracks. 200+ graduates. First partnerships with Nigerian tech companies.' },
  { year: '2024', text: '85% placement rate achieved. Introduced flexible instalment payment plans.' },
  { year: '2025', text: '500+ learners trained. Launched Backend Engineering and Product Design tracks.' },
  { year: '2026', text: 'Cohort 13 open for enrollment. Expanding reach across West Africa.' },
];

export function PublicAbout() {
  return (
    <div className="w-full bg-white">

      {/* Hero */}
      <section className="bg-[#eef3ff] pt-16 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block bg-qore-light text-qore-medium text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-6">
              About QorePath
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
              We're on a mission to launch<br />
              <span className="text-qore-medium">Africa's next tech generation</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
              QorePath is a live cohort learning academy designed to take you from beginner to job-ready through expert-led sessions, real-world projects, and a community that has your back.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-qore-dark py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/10">
            {[
              { value: '500+', label: 'Learners Trained' },
              { value: '85%', label: 'Placement Rate' },
              { value: '12', label: 'Cohorts Completed' },
              { value: '3', label: 'Learning Tracks' },
            ].map((s, i) => (
              <div key={i} className="px-4">
                <p className="text-3xl font-bold text-white mb-1">{s.value}</p>
                <p className="text-qore-highlight text-sm font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  QorePath was born from a frustration shared by many young Africans: the gap between wanting a tech career and actually getting one. Too many people were spending money on pre-recorded courses, watching videos, and still unable to get a job because they lacked real-world experience and mentorship.
                </p>
                <p>
                  We built QorePath differently. Everything is live. Every session has a real expert on the other end. Every project is something you'd actually ship in a real job. And every graduate has a cohort of peers who grow alongside them.
                </p>
                <p>
                  Since our first cohort in 2022, we've helped over 500 learners break into tech — as frontend engineers, backend engineers, and product designers — at companies across Nigeria and beyond.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              {milestones.map((m, i) => (
                <div key={i} className="flex items-start gap-4">
                  <span className="bg-qore-light text-qore-medium text-xs font-bold px-2.5 py-1 rounded-lg shrink-0 mt-0.5">
                    {m.year}
                  </span>
                  <p className="text-sm text-gray-600 leading-relaxed">{m.text}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-gray-900">
              What We <span className="text-qore-medium">Stand For</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <div className="w-11 h-11 rounded-xl bg-qore-light flex items-center justify-center mb-4">
                  <v.icon size={22} className="text-qore-medium" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Meet the <span className="text-qore-medium">Team</span>
            </h2>
            <p className="text-gray-400 mt-3 text-sm max-w-md mx-auto">
              We're practitioners, not just teachers. Everyone on the QorePath team has built real products and wants to help you do the same.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-qore-medium flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
                  {member.initials}
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-0.5">{member.name}</h3>
                <p className="text-xs text-qore-medium font-semibold mb-3">{member.role}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 md:px-8 lg:px-16 pb-20">
        <div className="bg-qore-medium rounded-3xl py-16 px-8 text-center relative overflow-hidden">
          <div className="relative z-10 max-w-xl mx-auto">
            <h2 className="text-3xl font-extrabold text-white mb-4">Ready to join us?</h2>
            <p className="text-white/70 mb-8 text-sm">
              Your next cohort is waiting. Take the first step toward your tech career today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/public/tracks"
                className="bg-white text-qore-dark px-7 py-3 rounded-full font-bold text-sm hover:bg-qore-light transition-colors flex items-center gap-2 justify-center"
              >
                Browse Tracks <ArrowRight size={16} />
              </Link>
              <Link
                to="/register"
                className="border border-white/40 text-white px-7 py-3 rounded-full font-bold text-sm hover:bg-white/10 transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />
        </div>
      </section>

    </div>
  );
}
