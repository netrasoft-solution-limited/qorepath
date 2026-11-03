import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Calendar, Clock, Link as LinkIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { pickCurrentEnrollment } from '../../lib/enrollments';

export function LearnerSessions() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const { data: enrollments } = await api.get('/enrollments/my');
        const active = pickCurrentEnrollment(enrollments);
        if (active?.program?.id) {
          const { data } = await api.get(`/sessions/program/${active.program.id}`);
          setSessions(data);
        }
      } catch {
        // silently fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="p-12 text-center text-gray-400">Loading sessions…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-qore-text">Live Sessions</h1>
        <p className="text-gray-500">{sessions.length} sessions in your cohort</p>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
          No sessions scheduled yet.
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`bg-white rounded-2xl p-5 shadow-sm border transition-colors ${s.isCompleted ? 'border-gray-100 opacity-70' : 'border-qore-highlight'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.isCompleted ? 'bg-gray-100 text-gray-400' : 'bg-qore-light text-qore-dark'}`}>
                    <Video size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-qore-text">{s.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Calendar size={12} />{new Date(s.scheduledAt).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Clock size={12} />{new Date(s.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {s.durationMinutes && <span>{s.durationMinutes} min</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {s.isCompleted && s.recordingUrl && (
                    <a href={s.recordingUrl} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-sm text-qore-medium hover:underline font-medium"
                    >
                      <LinkIcon size={13} /> Watch Recording
                    </a>
                  )}
                  {!s.isCompleted && (
                    <button
                      onClick={() => navigate(`/classroom/${s.id}`)}
                      className="flex items-center gap-1.5 bg-qore-dark text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-qore-medium transition-colors"
                    >
                      <Video size={15} /> Join Classroom
                    </button>
                  )}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.isCompleted ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                    {s.isCompleted ? 'Completed' : 'Upcoming'}
                  </span>
                </div>
              </div>
              {s.description && <p className="text-sm text-gray-500 mt-3">{s.description}</p>}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
