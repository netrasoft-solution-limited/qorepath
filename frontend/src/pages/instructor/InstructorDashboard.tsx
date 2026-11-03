import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, FileText, Calendar, BookOpen } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { fetchMyPrograms, pickPrimaryProgram } from '../../lib/tutor';

export function InstructorDashboard() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const mine = await fetchMyPrograms();
        setPrograms(mine);
        const primary = pickPrimaryProgram(mine);
        if (primary?.id) {
          const { data } = await api.get(`/sessions/program/${primary.id}`);
          setSessions(data);
        }
      } catch {
        // silently fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const upcomingSession = sessions.find((s) => !s.isCompleted);

  const stats = [
    { label: 'My Programs', value: String(programs.length), icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Sessions', value: String(sessions.length), icon: Calendar, color: 'text-qore-medium', bg: 'bg-qore-light' },
    { label: 'Completed', value: String(sessions.filter((s) => s.isCompleted).length), icon: FileText, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Upcoming', value: String(sessions.filter((s) => !s.isCompleted).length), icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  if (loading) return <div className="p-12 text-center text-gray-400">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-qore-text">
          Welcome, {(user as any)?.firstName ?? 'Instructor'} 👋
        </h1>
        <p className="text-gray-500">Instructor portal overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
          >
            <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.color} flex items-center justify-center mb-3`}>
              <s.icon size={20} />
            </div>
            <p className="text-2xl font-bold text-qore-text">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {upcomingSession && (
        <div className="bg-qore-dark text-white rounded-2xl p-6">
          <p className="text-white/60 text-sm mb-1">Next Session</p>
          <p className="font-bold text-xl">{upcomingSession.title}</p>
          <p className="text-qore-highlight text-sm mt-1">
            {new Date(upcomingSession.scheduledAt).toLocaleString()}
          </p>
        </div>
      )}

      {programs.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-800 text-sm">
          You haven't been assigned to any programs yet. Contact an admin.
        </div>
      )}

      {programs.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-qore-text mb-4">My Programs</h2>
          <div className="space-y-3">
            {programs.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-qore-light/40 rounded-xl">
                <div>
                  <p className="font-medium text-qore-text">{p.track}</p>
                  <p className="text-xs text-gray-500">{p.cohort?.name ?? '—'}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${p.cohort?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {p.cohort?.status ?? '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
