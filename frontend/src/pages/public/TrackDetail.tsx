import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Clock, Calendar, DollarSign, CheckCircle, ChevronDown, ChevronUp, Award, Users } from 'lucide-react';
import api from '../../lib/api';

const TRACK_SLUGS_REVERSE: Record<string, string> = {
  frontend:         'Frontend Engineering',
  backend:          'Backend Engineering',
  'product-design': 'Product Design',
  'data-analysis':  'Data Analysis',
  cloud:            'Cloud Engineering',
  cybersecurity:    'Cybersecurity',
};

export function TrackDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const cohortId  = searchParams.get('cohort');
  const programId = searchParams.get('program');

  const [program, setProgram] = useState<any>(null);
  const [cohort,  setCohort]  = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openWeek, setOpenWeek] = useState<number | null>(null);

  const normalSlug = slug ?? 'frontend';

  useEffect(() => {
    async function load() {
      try {
        const { data: cohorts } = await api.get('/cohorts');

        if (cohortId && programId) {
          const c = cohorts.find((x: any) => x.id === cohortId);
          if (c) {
            setCohort(c);
            const p = (c.programs ?? []).find((x: any) => x.id === programId);
            if (p) { setProgram(p); return; }
          }
        }

        // Fallback: first active/upcoming program whose track matches the slug
        const trackName = TRACK_SLUGS_REVERSE[normalSlug] ?? normalSlug;
        for (const c of cohorts) {
          if (c.status !== 'active' && c.status !== 'upcoming') continue;
          const p = (c.programs ?? []).find((x: any) =>
            x.track?.toLowerCase().includes(trackName.toLowerCase())
          );
          if (p) { setCohort(c); setProgram(p); return; }
        }
      } catch {
        // leave program/cohort null
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [cohortId, programId, normalSlug]);

  // Derived values — null when not available
  const trackName  = program?.track ?? TRACK_SLUGS_REVERSE[normalSlug] ?? 'Course';
  const price      = program?.price ? `₦${Number(program.price).toLocaleString()}` : null;
  const seats      = program?.maxLearners ?? null;
  const cohortName = cohort?.name ?? null;
  const duration   = program?.duration   || null;
  const format     = program?.format     || null;
  const schedule   = program?.schedule   || null;
  const description = program?.description || null;
  const outcomes: string[]  = Array.isArray(program?.outcomes)  && program.outcomes.length  ? program.outcomes  : [];
  const curriculum: any[]   = Array.isArray(program?.curriculum) && program.curriculum.length ? program.curriculum : [];

  const startDate = cohort?.startDate
    ? new Date(cohort.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const endDate = cohort?.endDate
    ? new Date(cohort.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  // Only show the main content card if there's at least one section to display
  const hasContent = outcomes.length > 0 || curriculum.length > 0;

  // Sidebar rows — only those with a value
  const sidebarRows = [
    cohortName  && { label: 'Cohort',     value: cohortName },
    startDate   && { label: 'Start Date', value: startDate },
    endDate     && { label: 'End Date',   value: endDate },
    seats       && { label: 'Seats',      value: `${seats} available` },
    duration    && { label: 'Duration',   value: duration },
    format      && { label: 'Format',     value: format },
    schedule    && { label: 'Schedule',   value: schedule },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Hero */}
      <div className="bg-qore-dark text-white pt-20 pb-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link to="/public/courses" className="text-qore-light hover:text-white text-sm font-medium mb-8 inline-flex items-center gap-1">
            ← Back to Courses
          </Link>
          <div className="max-w-3xl">
            {cohortName && (
              <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider mb-4 inline-block">
                {cohortName}
              </span>
            )}
            <h1 className="text-4xl md:text-5xl font-extrabold mb-5">{trackName}</h1>

            {description && (
              <p className="text-lg text-white/70 mb-6 leading-relaxed max-w-2xl">{description}</p>
            )}

            {/* Hero meta chips — only shown fields */}
            {(startDate || endDate || price || seats) && (
              <div className="flex flex-wrap gap-6 text-sm font-medium">
                {startDate && (
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-qore-highlight" />
                    Starts {startDate}
                  </div>
                )}
                {endDate && (
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-qore-highlight" />
                    Ends {endDate}
                  </div>
                )}
                {price && (
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-qore-highlight" />
                    {price} · Instalments available
                  </div>
                )}
                {seats && (
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-qore-highlight" />
                    {seats} seats available
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 rounded-full bg-qore-medium/30 blur-3xl pointer-events-none" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {loading && (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 flex justify-center">
                <div className="w-8 h-8 border-4 border-qore-medium border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!loading && hasContent && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
              >
                {/* Learning outcomes */}
                {outcomes.length > 0 && (
                  <>
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-6">What You'll Learn</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                      {outcomes.map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <CheckCircle size={18} className="text-qore-medium shrink-0 mt-0.5" />
                          <span className="text-gray-600 text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Curriculum */}
                {curriculum.length > 0 && (
                  <>
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Curriculum</h2>
                    <div className="space-y-3">
                      {curriculum.map((week: any) => (
                        <div key={week.week} className="border border-gray-100 rounded-xl overflow-hidden">
                          <button
                            onClick={() => setOpenWeek(openWeek === week.week ? null : week.week)}
                            className="w-full px-5 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                          >
                            <span className="font-bold text-gray-900 text-sm">
                              Week {week.week}: {week.title}
                            </span>
                            {openWeek === week.week
                              ? <ChevronUp size={18} className="text-gray-400" />
                              : <ChevronDown size={18} className="text-gray-400" />}
                          </button>
                          {openWeek === week.week && week.topics?.length > 0 && (
                            <div className="px-5 py-4 bg-white">
                              <ul className="space-y-2">
                                {week.topics.map((topic: string, i: number) => (
                                  <li key={i} className="flex items-center gap-2.5 text-sm text-gray-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-qore-medium shrink-0" />
                                    {topic}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-24"
            >
              {/* Price block */}
              {price && (
                <div className="mb-6">
                  <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">Tuition Fee</p>
                  <p className="text-3xl font-extrabold text-gray-900 mb-1">{price}</p>
                  <span className="text-xs text-qore-medium font-semibold bg-qore-light/60 px-2 py-1 rounded">
                    Instalment plan available (50/50)
                  </span>
                </div>
              )}

              {/* Sidebar detail rows */}
              {sidebarRows.length > 0 && (
                <div className="space-y-3 mb-7 text-sm">
                  {sidebarRows.map(({ label, value }, i) => (
                    <div
                      key={label}
                      className={`flex justify-between ${i < sidebarRows.length - 1 ? 'border-b border-gray-100 pb-2' : ''}`}
                    >
                      <span className="text-gray-400">{label}</span>
                      <span className="font-bold text-gray-900 text-right max-w-[55%] text-xs leading-snug">{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Certificate</span>
                    <span className="font-bold text-qore-medium flex items-center gap-1">
                      <Award size={13} /> Included
                    </span>
                  </div>
                </div>
              )}

              {!price && sidebarRows.length === 0 && !loading && (
                <div className="mb-7" />
              )}

              <Link
                to="/register"
                className="block w-full bg-qore-medium hover:bg-qore-dark text-white py-4 rounded-xl font-bold text-center transition-colors mb-3 text-sm"
              >
                Enroll Now
              </Link>
              <Link
                to="/public/verify"
                className="block w-full text-center text-xs text-gray-400 hover:text-qore-medium transition-colors"
              >
                Verify a certificate →
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
