import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Star, BookOpen, Layers } from 'lucide-react';
import api from '../../lib/api';

const TRACK_SLUGS: Record<string, string> = {
  'Frontend Engineering':   'frontend',
  'Backend Engineering':    'backend',
  'Product Design (UI/UX)': 'product-design',
  'Product Design':         'product-design',
  'Data Analysis':          'data-analysis',
  'Cloud Engineering':      'cloud',
  'Cybersecurity':          'cybersecurity',
};

function toSlug(track: string) {
  return TRACK_SLUGS[track] ?? track.toLowerCase().replace(/\s+/g, '-');
}

// Representative images per track (Unsplash curated IDs)
const TRACK_IMAGES: Record<string, string> = {
  'frontend':       'https://images.unsplash.com/photo-1621839673705-6617adf9e890?w=600&q=80',
  'backend':        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80',
  'product-design': 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80',
  'data-analysis':  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80',
  'cloud':          'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&q=80',
  'cybersecurity':  'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&q=80',
};

const TRACK_TAG: Record<string, string> = {
  'frontend':       'Design & Build',
  'backend':        'Systems & APIs',
  'product-design': 'Design & UX',
  'data-analysis':  'Data & Insights',
  'cloud':          'Infrastructure',
  'cybersecurity':  'Security',
};

const TRACK_GRADIENT: Record<string, string> = {
  'frontend':       'from-violet-600 to-purple-800',
  'backend':        'from-blue-600 to-blue-900',
  'product-design': 'from-pink-500 to-rose-700',
  'data-analysis':  'from-amber-500 to-orange-700',
  'cloud':          'from-cyan-500 to-teal-700',
  'cybersecurity':  'from-red-600 to-rose-800',
};

interface CourseCard {
  track: string;
  description: string;
  minPrice: number | null;
  totalSeats: number;
  openCohorts: number;
  slug: string;
  sampleProgramId: string;
  sampleCohortId: string;
}

export function CourseListing() {
  const [courses, setCourses] = useState<CourseCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/cohorts')
      .then(({ data }) => {
        const map = new Map<string, CourseCard>();
        for (const cohort of data) {
          if (cohort.status !== 'active' && cohort.status !== 'upcoming') continue;
          for (const prog of (cohort.programs ?? [])) {
            if (!map.has(prog.track)) {
              map.set(prog.track, {
                track: prog.track,
                description: prog.description ?? '',
                minPrice: null,
                totalSeats: 0,
                openCohorts: 0,
                slug: toSlug(prog.track),
                sampleProgramId: prog.id,
                sampleCohortId: cohort.id,
              });
            }
            const card = map.get(prog.track)!;
            const price = Number(prog.price);
            if (!isNaN(price) && price > 0) {
              card.minPrice = card.minPrice === null ? price : Math.min(card.minPrice, price);
            }
            card.totalSeats += Number(prog.maxLearners) || 0;
            card.openCohorts += 1;
          }
        }
        setCourses(Array.from(map.values()));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-[#1B4332] pt-20 pb-28 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #B7E4C7 0%, transparent 50%), radial-gradient(circle at 80% 20%, #52B788 0%, transparent 40%)' }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 bg-white/10 text-green-200 text-xs font-bold px-4 py-1.5 rounded-full mb-5 backdrop-blur-sm border border-white/10">
            <Layers size={12} /> Live Cohort Learning
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-5 leading-tight">
            Build Skills That<br /><span className="text-[#B7E4C7]">Get You Hired</span>
          </h1>
          <p className="text-lg text-green-100/80 max-w-xl mx-auto">
            Industry-led courses delivered live. Every track comes with real projects, mentorship, and career support.
          </p>
        </motion.div>

        {!loading && courses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="relative mt-10 inline-flex flex-wrap justify-center gap-8 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-8 py-4 text-white"
          >
            <span><strong className="text-xl font-extrabold">{courses.length}</strong><br /><span className="text-green-200/70 text-xs">Tracks</span></span>
            <div className="w-px bg-white/10 self-stretch" />
            <span><strong className="text-xl font-extrabold">{courses.reduce((s, c) => s + c.openCohorts, 0)}</strong><br /><span className="text-green-200/70 text-xs">Open Cohorts</span></span>
            <div className="w-px bg-white/10 self-stretch" />
            <span><strong className="text-xl font-extrabold">{courses.reduce((s, c) => s + c.totalSeats, 0)}</strong><br /><span className="text-green-200/70 text-xs">Seats Available</span></span>
          </motion.div>
        )}

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full fill-gray-50" preserveAspectRatio="none">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-24">
        {loading && (
          <div className="flex justify-center items-center py-32">
            <div className="w-10 h-10 border-4 border-qore-medium border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && courses.length === 0 && (
          <div className="text-center py-32 text-gray-400">
            <BookOpen size={40} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">No courses available right now.</p>
            <p className="text-sm">
              <Link to="/register" className="text-qore-medium font-semibold hover:underline">Create an account</Link> to get notified when new cohorts open.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 pt-6">
          {courses.map((course, idx) => {
            const img = TRACK_IMAGES[course.slug];
            const gradient = TRACK_GRADIENT[course.slug] ?? 'from-qore-medium to-qore-dark';
            const tag = TRACK_TAG[course.slug] ?? 'Technology';

            return (
              <motion.div
                key={course.track}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + idx * 0.07 }}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
              >
                {/* Course image */}
                <div className="relative h-44 overflow-hidden">
                  {img ? (
                    <img
                      src={img}
                      alt={course.track}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${gradient}`} />
                  )}
                  {/* Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${gradient} opacity-60`} />
                  {/* Tag */}
                  <span className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-white/20">
                    {tag}
                  </span>
                  {/* Cohort badge */}
                  {course.openCohorts > 0 && (
                    <span className="absolute top-4 right-4 bg-white text-gray-800 text-[10px] font-bold px-2.5 py-1 rounded-full">
                      {course.openCohorts} cohort{course.openCohorts !== 1 ? 's' : ''} open
                    </span>
                  )}
                </div>

                {/* Card body */}
                <div className="flex-1 flex flex-col p-6">
                  <h3 className="text-lg font-extrabold text-gray-900 mb-2 leading-snug">{course.track}</h3>

                  {course.description ? (
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">{course.description}</p>
                  ) : (
                    <p className="text-sm text-gray-400 italic mb-4">Live cohort · Hands-on projects · Career support</p>
                  )}

                  {/* Meta chips */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {course.totalSeats > 0 && (
                      <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                        <Users size={11} className="text-gray-400" /> {course.totalSeats} seats
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                      {[1,2,3,4,5].map(s => <Star key={s} size={9} className="fill-amber-400 text-amber-400" />)}
                      <span className="ml-1">5.0</span>
                    </span>
                  </div>

                  {/* Price */}
                  {course.minPrice !== null && (
                    <div className="mb-5">
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">Starting from</p>
                      <p className="text-2xl font-extrabold text-gray-900">₦{Number(course.minPrice).toLocaleString()}</p>
                      <p className="text-[10px] text-gray-400">Instalment plan available</p>
                    </div>
                  )}

                  {/* CTAs */}
                  <div className="mt-auto flex gap-3">
                    <Link
                      to={`/public/tracks/${course.slug}?cohort=${course.sampleCohortId}&program=${course.sampleProgramId}`}
                      className="flex-1 border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 py-2.5 rounded-xl text-sm font-semibold text-center transition-colors"
                    >
                      Learn More
                    </Link>
                    <Link
                      to="/register"
                      className={`flex-1 bg-gradient-to-r ${gradient} text-white py-2.5 rounded-xl text-sm font-semibold text-center flex items-center justify-center gap-1.5 group-hover:shadow-md transition-all`}
                    >
                      Enroll <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
