import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Search, RefreshCw } from 'lucide-react';
import api from '../../lib/api';

export function AdminAtRisk() {
  const [learners, setLearners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [resolving, setResolving] = useState<string | null>(null);
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/sessions/at-risk');
      setLearners(data);
    } catch {
      setError('Failed to load at-risk data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markResolved = async (learnerId: string) => {
    setResolving(learnerId);
    await new Promise((r) => setTimeout(r, 400));
    setResolved((prev) => new Set([...prev, learnerId]));
    setResolving(null);
  };

  const filtered = learners.filter((l) => {
    const name = `${l.learner?.firstName} ${l.learner?.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const active = filtered.filter((l) => !resolved.has(l.learner?.id));
  const resolvedList = filtered.filter((l) => resolved.has(l.learner?.id));

  const getRiskLevel = (rate: number) => {
    if (rate < 40) return { label: 'High Risk', color: 'bg-red-100 text-red-700', bar: 'bg-red-500' };
    if (rate < 60) return { label: 'Medium Risk', color: 'bg-orange-100 text-orange-700', bar: 'bg-orange-400' };
    return { label: 'Watch', color: 'bg-amber-100 text-amber-700', bar: 'bg-amber-400' };
  };

  if (loading) return <div className="p-12 text-center text-gray-400">Loading at-risk learners…</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-qore-text">At-Risk Learners</h1>
          <p className="text-gray-500">Learners with attendance below 70% across all cohorts.</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-sm text-gray-500 hover:text-qore-medium border border-gray-200 px-3 py-2 rounded-xl hover:border-qore-medium transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search learners…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-qore-medium bg-white shadow-sm text-sm"
            />
          </div>

          {active.length === 0 && resolvedList.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
              <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
              <p className="font-semibold text-gray-700">No at-risk learners</p>
              <p className="text-sm text-gray-400 mt-1">All learners are meeting the 70% attendance threshold.</p>
            </div>
          )}

          {active.map((item, idx) => {
            const risk = getRiskLevel(item.attendanceRate);
            return (
              <motion.div
                key={item.learner?.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="bg-white rounded-2xl shadow-sm border border-red-100 p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-qore-text text-base">
                      {item.learner?.firstName} {item.learner?.lastName}
                    </h3>
                    <p className="text-sm text-gray-400">{item.learner?.email}</p>
                    {item.cohort && (
                      <p className="text-xs text-gray-400 mt-0.5">{item.cohort.track} · {item.cohort.name}</p>
                    )}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${risk.color}`}>
                    <AlertTriangle size={10} /> {risk.label}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Attendance Rate</span>
                    <span className="font-bold text-red-600">{item.attendanceRate}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${risk.bar}`} style={{ width: `${item.attendanceRate}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {item.sessionsAttended} of {item.totalSessions} sessions attended
                  </p>
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <a
                    href={`mailto:${item.learner?.email}`}
                    className="flex-1 text-center bg-white border border-gray-200 hover:border-qore-medium text-gray-600 hover:text-qore-medium px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                  >
                    Send Email
                  </a>
                  <button
                    onClick={() => markResolved(item.learner?.id)}
                    disabled={resolving === item.learner?.id}
                    className="flex-1 bg-qore-light hover:bg-qore-medium hover:text-white text-qore-medium px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-60"
                  >
                    {resolving === item.learner?.id ? 'Marking…' : 'Mark Resolved'}
                  </button>
                </div>
              </motion.div>
            );
          })}

          {resolvedList.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Resolved this session</p>
              {resolvedList.map((item) => (
                <div key={item.learner?.id} className="bg-white rounded-xl p-4 border border-gray-100 opacity-60 flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-500 shrink-0" />
                  <span className="text-sm text-gray-600 font-medium">{item.learner?.firstName} {item.learner?.lastName}</span>
                  <span className="text-xs text-gray-400 ml-auto">{item.attendanceRate}% attendance</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary sidebar */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6 space-y-4">
            <h3 className="font-bold text-qore-text">Summary</h3>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl">
              <span className="text-red-800 font-medium text-sm">Active Flags</span>
              <span className="text-2xl font-bold text-red-600">{active.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
              <span className="text-green-800 font-medium text-sm">Resolved</span>
              <span className="text-2xl font-bold text-green-600">{resolved.size}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-600 font-medium text-sm">Total Flagged</span>
              <span className="text-2xl font-bold text-gray-800">{learners.length}</span>
            </div>
            <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
              Learners below 70% attendance threshold are automatically flagged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
