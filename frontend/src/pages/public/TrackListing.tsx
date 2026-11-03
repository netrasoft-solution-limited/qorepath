import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Clock, DollarSign, User, Users, ArrowRight, CalendarDays } from 'lucide-react';
import api from '../../lib/api';

const TRACK_SLUGS: Record<string, string> = {
  'Frontend Engineering': 'frontend',
  'Backend Engineering': 'backend',
  'Product Design (UI/UX)': 'product-design',
  'Product Design': 'product-design',
  'Data Analysis': 'data-analysis',
  'Cloud Engineering': 'cloud',
  'Cybersecurity': 'cybersecurity',
};

function toSlug(track: string) {
  return TRACK_SLUGS[track] ?? track.toLowerCase().replace(/\s+/g, '-');
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  active:   { label: 'Enrollment Open', color: 'bg-qore-light text-qore-medium' },
  upcoming: { label: 'Starting Soon',   color: 'bg-blue-50 text-blue-600' },
};

export function TrackListing() {
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/cohorts')
      .then(({ data }) => {
        const visible = data.filter((c: any) => c.status === 'active' || c.status === 'upcoming');
        setCohorts(visible);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen pt-12 pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Page header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5"
          >
            Cohorts &amp; <span className="text-qore-medium">Pricing</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-500"
          >
            Each cohort is a live intake batch. Pick the cohort that fits your schedule and enroll in one or more tracks running inside it.
          </motion.p>
        </div>

        {loading && (
          <div className="text-center text-gray-400 py-20">Loading cohorts…</div>
        )}

        {!loading && cohorts.length === 0 && (
          <div className="text-center text-gray-400 py-20">
            <p className="text-lg font-medium mb-3">No cohorts are currently open.</p>
            <p className="text-sm">
              Check back soon or{' '}
              <Link to="/register" className="text-qore-medium font-semibold hover:underline">
                create an account
              </Link>{' '}
              to get notified.
            </p>
          </div>
        )}

        <div className="space-y-12">
          {cohorts.map((cohort, ci) => {
            const meta = STATUS_META[cohort.status] ?? STATUS_META.upcoming;
            const programs: any[] = cohort.programs ?? [];

            return (
              <motion.div
                key={cohort.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + ci * 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                {/* Cohort header */}
                <div className="px-7 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-xl font-extrabold text-gray-900">{cohort.name}</h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${meta.color}`}>
                        {meta.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-400 font-medium">
                      {cohort.startDate && (
                        <span className="flex items-center gap-1.5">
                          <CalendarDays size={12} />
                          Starts {new Date(cohort.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      {cohort.endDate && (
                        <span className="flex items-center gap-1.5">
                          <Clock size={12} />
                          Ends {new Date(cohort.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Users size={12} />
                        {programs.length} track{programs.length !== 1 ? 's' : ''} available
                      </span>
                    </div>
                  </div>
                  <Link
                    to="/register"
                    className="shrink-0 flex items-center gap-2 bg-qore-medium hover:bg-qore-dark text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Enroll Now <ArrowRight size={14} />
                  </Link>
                </div>

                {/* Programs grid */}
                {programs.length === 0 ? (
                  <div className="px-7 py-8 text-sm text-gray-400 italic">No programs added to this cohort yet.</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {programs.map((prog: any) => {
                      const slug = toSlug(prog.track);
                      return (
                        <div key={prog.id} className="px-7 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
                          {/* Track info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-base mb-0.5">{prog.track}</p>
                            {prog.description && (
                              <p className="text-sm text-gray-400 line-clamp-1">{prog.description}</p>
                            )}
                            <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                              {prog.instructor && (
                                <span className="flex items-center gap-1.5">
                                  <User size={11} />
                                  {prog.instructor.firstName} {prog.instructor.lastName}
                                </span>
                              )}
                              {prog.maxLearners && (
                                <span className="flex items-center gap-1.5">
                                  <Users size={11} />
                                  {prog.maxLearners} seats
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Price + CTA */}
                          <div className="flex items-center gap-4 shrink-0">
                            {prog.price != null && (
                              <div className="text-right">
                                <p className="text-lg font-extrabold text-gray-900">
                                  ₦{Number(prog.price).toLocaleString()}
                                </p>
                                <p className="text-[10px] text-gray-400">instalments available</p>
                              </div>
                            )}
                            <Link
                              to={`/public/tracks/${slug}?cohort=${cohort.id}&program=${prog.id}`}
                              className="border border-gray-200 text-gray-600 hover:border-qore-medium hover:text-qore-medium px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
