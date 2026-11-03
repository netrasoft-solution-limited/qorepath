import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Video, Calendar, Clock, Link as LinkIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';

export function InstructorSessions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [programId, setProgramId] = useState('');
  const [programName, setProgramName] = useState('');
  const [cohortName, setCohortName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', scheduledAt: '', durationMinutes: '90', zoomLink: '',
  });

  const load = async () => {
    try {
      const { data: programs } = await api.get('/programs/mine');
      const mine = programs[0];
      if (mine) {
        setProgramId(mine.id);
        setProgramName(mine.track);
        setCohortName(mine.cohort?.name ?? '');
        const { data } = await api.get(`/sessions/program/${mine.id}`);
        setSessions(data);
      }
    } catch {
      setError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programId) { setError('No program assigned to you'); return; }
    setSaving(true);
    setError('');
    try {
      await api.post('/sessions', {
        ...form,
        durationMinutes: parseInt(form.durationMinutes),
        program: { id: programId },
      });
      setShowForm(false);
      setForm({ title: '', description: '', scheduledAt: '', durationMinutes: '90', zoomLink: '' });
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create session');
    } finally {
      setSaving(false);
    }
  };

  const markComplete = async (id: string) => {
    try {
      await api.patch(`/sessions/${id}`, { isCompleted: true });
      load();
    } catch {
      setError('Failed to update session');
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-400">Loading sessions…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-qore-text">Sessions</h1>
          <p className="text-gray-500">{programName || '—'}{cohortName ? ` · ${cohortName}` : ''} · {sessions.length} sessions</p>
        </div>
        {programId && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-qore-dark text-white px-4 py-2.5 rounded-xl hover:bg-qore-medium transition-colors text-sm font-medium"
          >
            <Plus size={16} /> Schedule Session
          </button>
        )}
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      {!programId && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-800 text-sm">
          You haven't been assigned to a program yet. Contact an admin.
        </div>
      )}

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-qore-highlight"
        >
          <h2 className="font-bold text-qore-text mb-4">Schedule New Session</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Introduction to React Hooks"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
              <input required type="datetime-local" value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <input type="number" value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zoom Link <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="url" value={form.zoomLink}
                onChange={(e) => setForm({ ...form, zoomLink: e.target.value })}
                placeholder="https://zoom.us/j/..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea rows={2} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium resize-none"
              />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={saving}
                className="bg-qore-dark text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-qore-medium transition-colors disabled:opacity-60"
              >
                {saving ? 'Creating…' : 'Create Session'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {sessions.length === 0 && programId ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
          No sessions yet. Schedule the first one above.
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
                    {s.zoomLink && (
                      <a href={s.zoomLink} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-qore-medium hover:underline mt-1"
                      >
                        <LinkIcon size={11} /> Zoom link
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.isCompleted ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                    {s.isCompleted ? 'Completed' : 'Upcoming'}
                  </span>
                  {s.isCompleted && s.recordingUrl && (
                    <a href={s.recordingUrl} target="_blank" rel="noreferrer"
                      className="text-xs text-qore-medium hover:underline font-medium flex items-center gap-1"
                    >
                      <LinkIcon size={11} /> Recording
                    </a>
                  )}
                  {!s.isCompleted && (
                    <button
                      onClick={() => navigate(`/classroom/${s.id}`)}
                      className="flex items-center gap-1.5 text-xs bg-qore-dark hover:bg-qore-medium text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
                    >
                      <Video size={13} /> Launch Classroom
                    </button>
                  )}
                  {!s.isCompleted && (
                    <button
                      onClick={() => markComplete(s.id)}
                      className="text-xs text-gray-500 hover:text-qore-dark border border-gray-200 px-3 py-1.5 rounded-lg hover:border-qore-medium transition-colors"
                    >
                      Mark complete
                    </button>
                  )}
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
