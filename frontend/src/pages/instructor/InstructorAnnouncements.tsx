import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Send, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { getMyProgram } from '../../lib/tutor';

export function InstructorAnnouncements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [cohortId, setCohortId] = useState('');
  const [form, setForm] = useState({ title: '', body: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const mine = await getMyProgram();
      const cId = mine?.cohort?.id;
      if (cId) {
        setCohortId(cId);
        const { data } = await api.get(`/announcements/cohort/${cId}`);
        setAnnouncements(data);
      }
    } catch {
      // silently fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cohortId) return; // no program → nothing to scope the announcement to
    setSaving(true);
    try {
      await api.post('/announcements', { ...form, cohort: { id: cohortId } });
      setForm({ title: '', body: '' });
      load();
    } catch {
      // silently fallback
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/announcements/${id}`);
      load();
    } catch {
      // silently fallback
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-400">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-qore-text">Announcements</h1>
        <p className="text-gray-500">Post updates to your cohort</p>
      </div>

      <form onSubmit={handlePost} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-3">
        <input
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Announcement title…"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
        />
        <textarea
          required
          rows={3}
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          placeholder="Write your announcement…"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium resize-none"
        />
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 bg-qore-dark text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-qore-medium transition-colors disabled:opacity-60"
        >
          <Send size={15} /> {saving ? 'Posting…' : 'Post Announcement'}
        </button>
      </form>

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
            No announcements yet.
          </div>
        ) : (
          announcements.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-qore-light rounded-xl flex items-center justify-center text-qore-dark mt-0.5">
                    <Megaphone size={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-qore-text">{a.title}</p>
                    <p className="text-sm text-gray-500 mt-1">{a.body}</p>
                    <p className="text-xs text-gray-400 mt-2">{a.createdAt?.slice(0, 10)}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(a.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
