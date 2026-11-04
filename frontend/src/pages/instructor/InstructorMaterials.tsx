import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Folder, FileText, Link as LinkIcon, Video, Download,
  Plus, Trash2, ChevronDown, ChevronRight, X, CheckCircle,
} from 'lucide-react';
import api from '../../lib/api';
import { fetchMyPrograms, pickPrimaryProgram } from '../../lib/tutor';
import { TrackPicker } from '../../components/TrackPicker';

const TYPE_ICONS: Record<string, any> = {
  pdf: FileText,
  link: LinkIcon,
  video: Video,
  doc: FileText,
};

const TYPE_COLORS: Record<string, string> = {
  pdf: 'bg-red-50 text-red-500',
  link: 'bg-blue-50 text-blue-500',
  video: 'bg-purple-50 text-purple-500',
  doc: 'bg-orange-50 text-orange-500',
};

export function InstructorMaterials() {
  const [programId, setProgramId] = useState<string | null>(null);
  const [programName, setProgramName] = useState('');
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWeek, setExpandedWeek] = useState<number>(1);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', url: '', type: 'link', week: 1 });

  const load = async (pId: string) => {
    try {
      const { data } = await api.get(`/materials/program/${pId}`);
      setMaterials(data);
    } catch {
      setError('Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  const [programs, setPrograms] = useState<any[]>([]);
  const select = (p: any) => {
    setProgramId(p.id);
    setProgramName(`${p.track}${p.cohort?.name ? ` · ${p.cohort.name}` : ''}`);
    load(p.id);
  };

  // Starts on the track in the running cohort; tutors on several tracks can switch.
  useEffect(() => {
    fetchMyPrograms().then((mine) => {
      setPrograms(mine);
      const current = pickPrimaryProgram(mine);
      if (current) select(current);
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programId) return;
    setSaving(true);
    setError('');
    try {
      await api.post('/materials', { ...form, programId });
      setSaved(true);
      setShowForm(false);
      setForm({ title: '', url: '', type: 'link', week: 1 });
      setTimeout(() => setSaved(false), 3000);
      load(programId);
    } catch {
      setError('Failed to add material');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!programId) return;
    setDeleting(id);
    try {
      await api.delete(`/materials/${id}`);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    } catch {
      setError('Failed to delete material');
    } finally {
      setDeleting(null);
    }
  };

  const WEEKS = Array.from({ length: 12 }, (_, i) => i + 1);
  const byWeek = (week: number) => materials.filter((m) => m.week === week);

  if (loading) return <div className="p-12 text-center text-gray-400">Loading materials…</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-qore-text">Materials Library</h1>
          <p className="text-gray-500">Resources for{programName ? ` · ${programName}` : ' your program'}.</p>
        </div>
        <div className="flex items-center gap-2">
          <TrackPicker programs={programs} value={programId ?? ''} onChange={(id) => select(programs.find((p) => p.id === id))} />
          <button
            onClick={() => setShowForm(true)}
            className="bg-qore-medium hover:bg-qore-dark text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 text-sm"
          >
            <Plus size={16} /> Add Material
          </button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
      {saved && (
        <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle size={15} /> Material added successfully.
        </div>
      )}

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-qore-highlight shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-qore-text">Add New Material</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Title</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. React Hooks Deep Dive Slides"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">URL</label>
              <input required type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://drive.google.com/… or any link"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium">
                <option value="link">Link</option>
                <option value="pdf">PDF</option>
                <option value="video">Video</option>
                <option value="doc">Document</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Week</label>
              <select value={form.week} onChange={(e) => setForm({ ...form, week: parseInt(e.target.value) })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium">
                {WEEKS.map((w) => <option key={w} value={w}>Week {w}</option>)}
              </select>
            </div>
            <div className="md:col-span-2 flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="border border-gray-200 text-gray-500 px-5 py-2.5 rounded-xl text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="bg-qore-medium hover:bg-qore-dark text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60">
                {saving ? 'Adding…' : 'Add Material'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="space-y-3">
        {WEEKS.map((week) => {
          const weekMaterials = byWeek(week);
          return (
            <motion.div
              key={week}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: week * 0.04 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <button
                onClick={() => setExpandedWeek(expandedWeek === week ? 0 : week)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Folder className={expandedWeek === week ? 'text-qore-medium' : 'text-gray-400'} size={20} />
                  <span className="font-bold text-qore-text">Week {week} Materials</span>
                  {weekMaterials.length > 0 && (
                    <span className="px-2 py-0.5 bg-qore-light text-qore-medium text-xs rounded-full ml-1 font-semibold">
                      {weekMaterials.length}
                    </span>
                  )}
                </div>
                {expandedWeek === week
                  ? <ChevronDown size={18} className="text-gray-400" />
                  : <ChevronRight size={18} className="text-gray-400" />}
              </button>

              {expandedWeek === week && (
                <div className="p-5 pt-2 border-t border-gray-50 bg-gray-50/30 space-y-2">
                  {weekMaterials.length === 0 ? (
                    <p className="text-center py-6 text-gray-400 text-sm">No materials for this week yet.</p>
                  ) : weekMaterials.map((m) => {
                    const Icon = TYPE_ICONS[m.type] ?? LinkIcon;
                    const colorClass = TYPE_COLORS[m.type] ?? 'bg-gray-50 text-gray-500';
                    return (
                      <div key={m.id}
                        className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-qore-highlight transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                            <Icon size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-qore-text truncate">{m.title}</p>
                            <p className="text-xs text-gray-400 uppercase tracking-wide">{m.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-3 shrink-0">
                          <a href={m.url} target="_blank" rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-qore-medium transition-colors">
                            <Download size={16} />
                          </a>
                          <button
                            onClick={() => handleDelete(m.id)}
                            disabled={deleting === m.id}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                          >
                            <Trash2 size={16} />
                          </button>
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
  );
}
