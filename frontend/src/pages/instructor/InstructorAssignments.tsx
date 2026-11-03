import React, { useEffect, useState } from 'react';
import { Plus, FileText, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { getMyProgram } from '../../lib/tutor';

export function InstructorAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [cohortId, setCohortId] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', dueDate: '', maxScore: '100' });
  const [gradeForm, setGradeForm] = useState<{ id: string; score: string; feedback: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const mine = await getMyProgram();
      const cId = mine?.cohort?.id;
      if (cId) {
        setCohortId(cId);
        const { data } = await api.get(`/assignments/cohort/${cId}`);
        setAssignments(data);
      }
    } catch {
      // silently fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  const loadSubmissions = async (assignmentId: string) => {
    const { data } = await api.get(`/assignments/${assignmentId}/submissions`);
    setSubmissions(data);
  };

  const selectAssignment = (a: any) => {
    setSelected(a);
    loadSubmissions(a.id);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/assignments', { ...form, maxScore: parseInt(form.maxScore), cohort: { id: cohortId } });
      setShowForm(false);
      setForm({ title: '', description: '', dueDate: '', maxScore: '100' });
      load();
    } catch {
      // silently fallback
    } finally {
      setSaving(false);
    }
  };

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeForm) return;
    setSaving(true);
    try {
      await api.patch(`/assignments/submissions/${gradeForm.id}/grade`, {
        score: parseFloat(gradeForm.score),
        feedback: gradeForm.feedback,
      });
      setGradeForm(null);
      if (selected) loadSubmissions(selected.id);
    } catch {
      // silently fallback
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-400">Loading assignments…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-qore-text">Assignments</h1>
          <p className="text-gray-500">{assignments.length} assignments</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-qore-dark text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-qore-medium transition-colors"
        >
          <Plus size={16} /> New Assignment
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-qore-highlight">
          <h2 className="font-bold text-qore-text mb-4">Create Assignment</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input required type="datetime-local" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Score</label>
              <input type="number" value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
              />
            </div>
            <div className="flex items-end gap-3">
              <button type="submit" disabled={saving}
                className="bg-qore-dark text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-qore-medium transition-colors disabled:opacity-60"
              >
                {saving ? 'Creating…' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {assignments.map((a) => (
            <button key={a.id} onClick={() => selectAssignment(a)}
              className={`w-full text-left bg-white rounded-2xl p-4 shadow-sm border transition-colors ${selected?.id === a.id ? 'border-qore-medium' : 'border-gray-100 hover:border-qore-highlight'}`}
            >
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-qore-medium shrink-0" />
                <div>
                  <p className="font-medium text-qore-text text-sm">{a.title}</p>
                  <p className="text-xs text-gray-400">Due {new Date(a.dueDate).toLocaleDateString()}</p>
                </div>
              </div>
            </button>
          ))}
          {assignments.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm border border-gray-100 text-sm">
              No assignments yet.
            </div>
          )}
        </div>

        {selected && (
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-qore-text mb-1">{selected.title}</h2>
            <p className="text-sm text-gray-500 mb-4">{selected.description}</p>
            <h3 className="font-semibold text-qore-text text-sm mb-3">Submissions ({submissions.length})</h3>

            {gradeForm && (
              <form onSubmit={handleGrade} className="mb-4 p-4 bg-qore-light/40 rounded-xl space-y-2">
                <div className="flex gap-3">
                  <input type="number" required placeholder="Score" value={gradeForm.score}
                    onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
                    className="w-24 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                  />
                  <input required placeholder="Feedback…" value={gradeForm.feedback}
                    onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                  />
                  <button type="submit" disabled={saving}
                    className="bg-qore-dark text-white px-4 py-1.5 rounded-lg text-sm disabled:opacity-60"
                  >
                    {saving ? '…' : 'Save'}
                  </button>
                  <button type="button" onClick={() => setGradeForm(null)}
                    className="border border-gray-300 px-3 py-1.5 rounded-lg text-sm text-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {submissions.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No submissions yet.</p>
              ) : (
                submissions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                    <div>
                      <p className="font-medium text-sm text-qore-text">{s.learner?.firstName} {s.learner?.lastName}</p>
                      <a href={s.submissionUrl} target="_blank" rel="noreferrer" className="text-xs text-qore-medium hover:underline">
                        {s.submissionUrl?.slice(0, 50)}…
                      </a>
                    </div>
                    <div className="flex items-center gap-3">
                      {s.score != null && (
                        <span className="text-sm font-bold text-qore-text">{s.score}/{selected.maxScore}</span>
                      )}
                      <button onClick={() => setGradeForm({ id: s.id, score: s.score ?? '', feedback: s.feedback ?? '' })}
                        className="flex items-center gap-1 text-xs text-qore-medium hover:underline"
                      >
                        <CheckCircle size={13} /> {s.score != null ? 'Re-grade' : 'Grade'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
