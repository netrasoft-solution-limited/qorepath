import React, { useEffect, useState } from 'react';
import { Plus, FileText, CheckCircle, Award, Trash2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { fetchMyPrograms, pickPrimaryProgram } from '../../lib/tutor';

const EMPTY_FORM = { title: '', description: '', dueDate: '', maxScore: '100', isCapstone: false };
const errorText = (err: any, fallback: string) => err?.response?.data?.message ?? fallback;

export function InstructorAssignments() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<any[]>([]);
  const [programId, setProgramId] = useState('');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [gradeForm, setGradeForm] = useState<{ id: string; score: string; feedback: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadAssignments = async (pId: string) => {
    if (!pId) return;
    const { data } = await api.get(`/assignments/program/${pId}`);
    setAssignments(data);
    return data as any[];
  };

  useEffect(() => {
    (async () => {
      try {
        const mine = await fetchMyPrograms();
        setPrograms(mine);
        const primary = pickPrimaryProgram(mine);
        if (primary) {
          setProgramId(primary.id);
          await loadAssignments(primary.id);
        }
      } catch {
        setError('Could not load your assignments. Please refresh to try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const switchProgram = async (pId: string) => {
    setProgramId(pId);
    setSelected(null);
    setSubmissions([]);
    setError('');
    try {
      await loadAssignments(pId);
    } catch {
      setError('Could not load assignments for that track.');
    }
  };

  const loadSubmissions = async (assignmentId: string) => {
    const { data } = await api.get(`/assignments/${assignmentId}/submissions`);
    setSubmissions(data);
  };

  const selectAssignment = (a: any) => {
    setSelected(a);
    setGradeForm(null);
    loadSubmissions(a.id);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/assignments', { ...form, maxScore: parseInt(form.maxScore), program: { id: programId } });
      setShowForm(false);
      setForm(EMPTY_FORM);
      await loadAssignments(programId);
    } catch (err) {
      setError(errorText(err, 'Could not create the assignment.'));
    } finally {
      setSaving(false);
    }
  };

  const toggleCapstone = async (a: any) => {
    setError('');
    try {
      const { data } = await api.patch(`/assignments/${a.id}`, { isCapstone: !a.isCapstone });
      const list = await loadAssignments(programId);
      if (selected?.id === a.id) setSelected(list?.find((x) => x.id === a.id) ?? data);
    } catch (err) {
      setError(errorText(err, 'Could not update the assignment.'));
    }
  };

  const handleDelete = async (a: any) => {
    if (!window.confirm(`Delete "${a.title}"? This can't be undone.`)) return;
    setError('');
    try {
      await api.delete(`/assignments/${a.id}`);
      setSelected(null);
      await loadAssignments(programId);
    } catch (err) {
      setError(errorText(err, 'Could not delete the assignment.'));
    }
  };

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeForm) return;
    setSaving(true);
    setError('');
    try {
      await api.patch(`/assignments/submissions/${gradeForm.id}/grade`, {
        score: parseFloat(gradeForm.score),
        feedback: gradeForm.feedback,
      });
      setGradeForm(null);
      if (selected) loadSubmissions(selected.id);
    } catch (err) {
      setError(errorText(err, 'Could not save the grade.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-400">Loading assignments…</div>;

  const currentProgram = programs.find((p) => p.id === programId);

  if (!programs.length) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-qore-text">Assignments</h1>
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
          You haven't been assigned to a track yet. An admin can add you to one from Cohorts.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-qore-text">Assignments</h1>
          <p className="text-gray-500">
            {assignments.length} assignment{assignments.length === 1 ? '' : 's'} for {currentProgram?.track ?? 'this track'}
            {currentProgram?.cohort?.name ? ` · ${currentProgram.cohort.name}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {programs.length > 1 && (
            <select
              value={programId}
              onChange={(e) => switchProgram(e.target.value)}
              className="border border-gray-200 text-gray-700 px-3 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-qore-medium bg-white"
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.track}{p.cohort?.name ? ` · ${p.cohort.name}` : ''}</option>
              ))}
            </select>
          )}
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-qore-dark text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-qore-medium transition-colors whitespace-nowrap"
          >
            <Plus size={16} /> New Assignment
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 border border-red-100">
          <AlertCircle size={16} className="shrink-0" /> {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-qore-highlight">
          <h2 className="font-bold text-qore-text mb-4">Create Assignment for {currentProgram?.track}</h2>
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
              <input type="number" min={1} value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
              />
            </div>
            <label className="flex items-start gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50/60 cursor-pointer">
              <input type="checkbox" checked={form.isCapstone} onChange={(e) => setForm({ ...form, isCapstone: e.target.checked })}
                className="mt-0.5 accent-amber-600"
              />
              <span className="text-sm">
                <span className="font-semibold text-amber-800">This is the capstone project</span>
                <span className="block text-xs text-amber-700">Learners submit it on their Capstone page. One per track.</span>
              </span>
            </label>
            <div className="md:col-span-2 flex items-center gap-3">
              <button type="submit" disabled={saving}
                className="bg-qore-dark text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-qore-medium transition-colors disabled:opacity-60"
              >
                {saving ? 'Creating…' : 'Create'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
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
                {a.isCapstone
                  ? <Award size={16} className="text-amber-600 shrink-0" />
                  : <FileText size={16} className="text-qore-medium shrink-0" />}
                <div className="min-w-0">
                  <p className="font-medium text-qore-text text-sm truncate">{a.title}</p>
                  <p className="text-xs text-gray-400">
                    Due {new Date(a.dueDate).toLocaleDateString()}
                    {a.isCapstone && <span className="ml-2 font-semibold text-amber-700">Capstone</span>}
                    {!a.program && <span className="ml-2">· all tracks</span>}
                  </p>
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
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="font-bold text-qore-text mb-1">{selected.title}</h2>
                <p className="text-sm text-gray-500">{selected.description}</p>
              </div>
              {selected.program && (
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleCapstone(selected)}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${selected.isCapstone ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-gray-200 text-gray-600 hover:border-amber-300'}`}
                  >
                    <Award size={13} /> {selected.isCapstone ? 'Capstone ✓' : 'Mark as capstone'}
                  </button>
                  {submissions.length === 0 && (
                    <button onClick={() => handleDelete(selected)} title="Delete assignment"
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
            <h3 className="font-semibold text-qore-text text-sm mb-3">Submissions ({submissions.length})</h3>

            {gradeForm && (
              <form onSubmit={handleGrade} className="mb-4 p-4 bg-qore-light/40 rounded-xl space-y-2">
                <div className="flex flex-wrap gap-3">
                  <input type="number" required min={0} max={selected.maxScore} step="any" placeholder={`Score / ${selected.maxScore}`} value={gradeForm.score}
                    onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
                    className="w-28 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                  />
                  <input required placeholder="Feedback…" value={gradeForm.feedback}
                    onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                    className="flex-1 min-w-[12rem] border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
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
                  <div key={s.id} className="flex items-start justify-between gap-3 p-3 border border-gray-100 rounded-xl">
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-qore-text">{s.learner?.firstName} {s.learner?.lastName}</p>
                      {s.submissionUrl && (
                        <a href={s.submissionUrl} target="_blank" rel="noreferrer" className="text-xs text-qore-medium hover:underline break-all">
                          {s.submissionUrl}
                        </a>
                      )}
                      {s.submissionText && (
                        <p className="text-xs text-gray-500 mt-1 whitespace-pre-line line-clamp-4">{s.submissionText}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {s.score != null && (
                        <span className="text-sm font-bold text-qore-text">{Number(s.score)}/{selected.maxScore}</span>
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
