import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Users, Calendar, ChevronDown, ChevronRight,
  CheckCircle, X, Layers, BookOpen, DollarSign, Trash2, FileEdit,
  GripVertical,
} from 'lucide-react';
import api from '../../lib/api';
import { useConfirm } from '../../components/feedback';

const STATUS_OPTIONS = ['upcoming', 'active', 'completed', 'cancelled'];
const STATUS_COLOR: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  upcoming: 'bg-blue-100 text-blue-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
};

const TRACK_OPTIONS = [
  'Frontend Engineering',
  'Backend Engineering',
  'Product Design (UI/UX)',
  'Data Analysis',
  'Cloud Engineering',
  'Cybersecurity',
  'Product Management',
  'Mobile Development',
];

export function AdminCohorts() {
  const confirm = useConfirm();
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [assistants, setAssistants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedCohort, setExpandedCohort] = useState<string | null>(null);

  // Cohort form
  const [showCohortForm, setShowCohortForm] = useState(false);
  const [cohortForm, setCohortForm] = useState({ name: '', startDate: '', endDate: '' });

  // Program form
  const [showProgramForm, setShowProgramForm] = useState<string | null>(null); // cohortId
  const [programForm, setProgramForm] = useState({
    track: TRACK_OPTIONS[0], price: '', maxLearners: '30', instructorId: '',
  });

  // Course content editor
  const [contentProgram, setContentProgram] = useState<any | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  const load = async () => {
    try {
      const [cohortsRes, usersRes] = await Promise.all([
        api.get('/cohorts'),
        api.get('/users'),
      ]);
      setCohorts(cohortsRes.data);
      setInstructors(usersRes.data.filter((u: any) => u.role === 'instructor'));
      setAssistants(usersRes.data.filter((u: any) => u.role === 'assistant'));
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const flash = (msg: string) => {
    setSaved(msg);
    setTimeout(() => setSaved(''), 2500);
  };

  // ── Cohort CRUD ────────────────────────────────────────────────────────
  const handleCreateCohort = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/cohorts', cohortForm);
      setShowCohortForm(false);
      setCohortForm({ name: '', startDate: '', endDate: '' });
      flash('Cohort created');
      load();
    } catch {
      setError('Failed to create cohort');
    } finally {
      setSaving(false);
    }
  };

  const handleCohortStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/cohorts/${id}`, { status });
      load();
    } catch {
      setError('Failed to update status');
    }
  };

  const handleDeleteCohort = async (id: string) => {
    const ok = await confirm({
      title: 'Delete cohort?',
      message: 'This deletes the cohort and all its programs. This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/cohorts/${id}`);
      load();
    } catch {
      setError('Failed to delete cohort');
    }
  };

  // ── Program CRUD ────────────────────────────────────────────────────────
  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showProgramForm) return;
    setSaving(true);
    setError('');
    try {
      await api.post('/programs', {
        ...programForm,
        price: parseFloat(programForm.price) || 0,
        maxLearners: parseInt(programForm.maxLearners) || 30,
        cohortId: showProgramForm,
        instructorId: programForm.instructorId || null,
      });
      setShowProgramForm(null);
      setProgramForm({ track: TRACK_OPTIONS[0], price: '', maxLearners: '30', instructorId: '' });
      flash('Program added');
      load();
    } catch {
      setError('Failed to create program');
    } finally {
      setSaving(false);
    }
  };

  const handleProgramInstructor = async (programId: string, instructorId: string) => {
    try {
      await api.patch(`/programs/${programId}`, { instructorId: instructorId || null });
      flash('Instructor updated');
      load();
    } catch {
      setError('Failed to update instructor');
    }
  };

  const handleAddTA = async (programId: string, assistantId: string) => {
    if (!assistantId) return;
    try {
      await api.patch(`/programs/${programId}`, { addAssistantId: assistantId });
      flash('TA added');
      load();
    } catch {
      setError('Failed to add TA');
    }
  };

  const handleRemoveTA = async (programId: string, assistantId: string) => {
    try {
      await api.patch(`/programs/${programId}`, { removeAssistantId: assistantId });
      load();
    } catch {
      setError('Failed to remove TA');
    }
  };

  const handleDeleteProgram = async (programId: string) => {
    const ok = await confirm({
      title: 'Delete program?',
      message: 'This permanently removes the program from the cohort.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/programs/${programId}`);
      load();
    } catch {
      setError('Failed to delete program');
    }
  };

  const handleProgramField = async (programId: string, field: string, value: any) => {
    try {
      await api.patch(`/programs/${programId}`, { [field]: value });
      load();
    } catch {
      setError('Failed to update program');
    }
  };

  const filtered = cohorts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-qore-text">Cohorts</h1>
          <p className="text-gray-500">Each cohort can have multiple programs running simultaneously.</p>
        </div>
        <button
          onClick={() => setShowCohortForm(true)}
          className="flex items-center gap-2 bg-qore-medium hover:bg-qore-dark text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> New Cohort
        </button>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
      {saved && (
        <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle size={15} /> {saved}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search cohorts…"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
        />
      </div>

      {/* Create Cohort Modal */}
      <AnimatePresence>
        {showCohortForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCohortForm(false)}
          >
            <motion.form
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleCreateCohort}
              className="bg-white rounded-2xl shadow-xl p-7 w-full max-w-md space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">New Cohort</h3>
                <button type="button" onClick={() => setShowCohortForm(false)}>
                  <X size={18} className="text-gray-400" />
                </button>
              </div>
              <p className="text-xs text-gray-400">A cohort is the intake batch. Add programs after creating it.</p>
              <input
                required
                value={cohortForm.name}
                onChange={(e) => setCohortForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Cohort name (e.g. Cohort 13)"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
                  <input
                    required
                    type="date"
                    value={cohortForm.startDate}
                    onChange={(e) => setCohortForm((p) => ({ ...p, startDate: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">End Date</label>
                  <input
                    required
                    type="date"
                    value={cohortForm.endDate}
                    onChange={(e) => setCohortForm((p) => ({ ...p, endDate: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-qore-medium hover:bg-qore-dark text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {saving ? 'Creating…' : 'Create Cohort'}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Program Modal */}
      <AnimatePresence>
        {showProgramForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowProgramForm(null)}
          >
            <motion.form
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleCreateProgram}
              className="bg-white rounded-2xl shadow-xl p-7 w-full max-w-md space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Add Program to Cohort</h3>
                <button type="button" onClick={() => setShowProgramForm(null)}>
                  <X size={18} className="text-gray-400" />
                </button>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Track / Program</label>
                <select
                  value={programForm.track}
                  onChange={(e) => setProgramForm((p) => ({ ...p, track: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
                >
                  {TRACK_OPTIONS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Price (₦)</label>
                  <input
                    required
                    type="number"
                    value={programForm.price}
                    onChange={(e) => setProgramForm((p) => ({ ...p, price: e.target.value }))}
                    placeholder="150000"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Max Learners</label>
                  <input
                    type="number"
                    value={programForm.maxLearners}
                    onChange={(e) => setProgramForm((p) => ({ ...p, maxLearners: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Assign Instructor (optional)</label>
                <select
                  value={programForm.instructorId}
                  onChange={(e) => setProgramForm((p) => ({ ...p, instructorId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
                >
                  <option value="">— unassigned —</option>
                  {instructors.map((i) => (
                    <option key={i.id} value={i.id}>{i.firstName} {i.lastName}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-qore-medium hover:bg-qore-dark text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {saving ? 'Adding…' : 'Add Program'}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Course Content Editor Modal */}
      <AnimatePresence>
        {contentProgram && (
          <CourseContentModal
            program={contentProgram}
            onClose={() => setContentProgram(null)}
            onSaved={() => { flash('Course content saved'); load(); setContentProgram(null); }}
          />
        )}
      </AnimatePresence>

      {/* Cohorts List */}
      {loading ? (
        <div className="p-12 text-center text-gray-400">Loading…</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((cohort) => (
            <div key={cohort.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              {/* Cohort header row */}
              <div
                className="flex items-center gap-4 px-6 py-5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedCohort(expandedCohort === cohort.id ? null : cohort.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-bold text-gray-900">{cohort.name}</h3>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${STATUS_COLOR[cohort.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {cohort.status}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Layers size={12} />
                      {cohort.programs?.length ?? 0} program{(cohort.programs?.length ?? 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Calendar size={11} />
                    {cohort.startDate ? new Date(cohort.startDate).toLocaleDateString() : '—'}
                    {' → '}
                    {cohort.endDate ? new Date(cohort.endDate).toLocaleDateString() : '—'}
                  </p>
                </div>

                {/* Status selector */}
                <select
                  value={cohort.status}
                  onChange={(e) => { e.stopPropagation(); handleCohortStatus(cohort.id, e.target.value); }}
                  onClick={(e) => e.stopPropagation()}
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-qore-medium"
                >
                  {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                </select>

                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteCohort(cohort.id); }}
                  className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                  title="Delete cohort"
                >
                  <Trash2 size={15} />
                </button>

                {expandedCohort === cohort.id
                  ? <ChevronDown size={18} className="text-gray-400 shrink-0" />
                  : <ChevronRight size={18} className="text-gray-400 shrink-0" />
                }
              </div>

              {/* Expanded: programs */}
              <AnimatePresence initial={false}>
                {expandedCohort === cohort.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-gray-100"
                  >
                    <div className="px-6 py-5 bg-gray-50/60 space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Programs in this cohort</p>
                        <button
                          onClick={() => setShowProgramForm(cohort.id)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-qore-medium hover:text-qore-dark transition-colors"
                        >
                          <Plus size={14} /> Add Program
                        </button>
                      </div>

                      {(!cohort.programs || cohort.programs.length === 0) ? (
                        <div className="py-6 text-center text-sm text-gray-400">
                          No programs yet.{' '}
                          <button onClick={() => setShowProgramForm(cohort.id)} className="text-qore-medium font-semibold">
                            Add one →
                          </button>
                        </div>
                      ) : (
                        cohort.programs.map((prog: any) => (
                          <ProgramRow
                            key={prog.id}
                            program={prog}
                            instructors={instructors}
                            assistants={assistants}
                            onInstructor={(iId) => handleProgramInstructor(prog.id, iId)}
                            onAddTA={(aId) => handleAddTA(prog.id, aId)}
                            onRemoveTA={(aId) => handleRemoveTA(prog.id, aId)}
                            onDelete={() => handleDeleteProgram(prog.id)}
                            onFieldUpdate={(field, val) => handleProgramField(prog.id, field, val)}
                            onEditContent={() => setContentProgram(prog)}
                          />
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── CourseContentModal ────────────────────────────────────────────────────
function CourseContentModal({ program, onClose, onSaved }: { program: any; onClose: () => void; onSaved: () => void }) {
  const [tab, setTab] = useState<'info' | 'outcomes' | 'curriculum'>('info');
  const [saving, setSaving] = useState(false);

  // Info tab
  const [description, setDescription] = useState(program.description ?? '');
  const [duration, setDuration]       = useState(program.duration ?? '');
  const [format, setFormat]           = useState(program.format ?? '');
  const [schedule, setSchedule]       = useState(program.schedule ?? '');

  // Outcomes tab
  const [outcomes, setOutcomes] = useState<string[]>(program.outcomes ?? []);
  const [newOutcome, setNewOutcome] = useState('');

  // Curriculum tab
  type Week = { week: number; title: string; topics: string[] };
  const [curriculum, setCurriculum] = useState<Week[]>(program.curriculum ?? []);
  const [newWeekTitle, setNewWeekTitle] = useState('');
  const [editingWeekIdx, setEditingWeekIdx] = useState<number | null>(null);
  const [newTopic, setNewTopic] = useState('');

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/programs/${program.id}`, { description, duration, format, schedule, outcomes, curriculum });
      onSaved();
    } catch {
      // error handled by parent
    } finally {
      setSaving(false);
    }
  };

  const addOutcome = () => {
    const v = newOutcome.trim();
    if (!v) return;
    setOutcomes((p) => [...p, v]);
    setNewOutcome('');
  };

  const addWeek = () => {
    const t = newWeekTitle.trim();
    if (!t) return;
    setCurriculum((p) => [...p, { week: p.length + 1, title: t, topics: [] }]);
    setNewWeekTitle('');
  };

  const addTopic = (weekIdx: number) => {
    const v = newTopic.trim();
    if (!v) return;
    setCurriculum((p) => p.map((w, i) => i === weekIdx ? { ...w, topics: [...w.topics, v] } : w));
    setNewTopic('');
  };

  const TABS = [
    { id: 'info' as const, label: 'Info & Details' },
    { id: 'outcomes' as const, label: 'Learning Outcomes' },
    { id: 'curriculum' as const, label: 'Curriculum' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-gray-900">Course Page Editor</h3>
            <p className="text-xs text-gray-400 mt-0.5">{program.track}</p>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 shrink-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`py-3 px-1 mr-6 text-sm font-semibold border-b-2 transition-colors ${
                tab === t.id ? 'border-qore-medium text-qore-medium' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* ── Info tab ── */}
          {tab === 'info' && (
            <>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief overview of what this course covers…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Duration</label>
                  <input
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 12 Weeks"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Format</label>
                  <input
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    placeholder="e.g. Live Online (Zoom)"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Schedule</label>
                <input
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="e.g. Tue, Thu & Sat — 7pm–9pm WAT"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
                />
              </div>
            </>
          )}

          {/* ── Outcomes tab ── */}
          {tab === 'outcomes' && (
            <>
              <p className="text-xs text-gray-400">What learners will be able to do after completing this course.</p>
              <div className="space-y-2">
                {outcomes.map((o, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-qore-medium shrink-0" />
                    <span className="flex-1 text-sm text-gray-700">{o}</span>
                    <button onClick={() => setOutcomes((p) => p.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-500 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newOutcome}
                  onChange={(e) => setNewOutcome(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOutcome())}
                  placeholder="Add a learning outcome…"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
                />
                <button
                  onClick={addOutcome}
                  className="bg-qore-medium text-white px-4 rounded-xl text-sm font-semibold hover:bg-qore-dark transition-colors"
                >
                  Add
                </button>
              </div>
            </>
          )}

          {/* ── Curriculum tab ── */}
          {tab === 'curriculum' && (
            <>
              <p className="text-xs text-gray-400">Build the week-by-week curriculum shown on the course page.</p>
              <div className="space-y-3">
                {curriculum.map((week, wi) => (
                  <div key={wi} className="border border-gray-100 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50">
                      <GripVertical size={14} className="text-gray-300" />
                      <span className="text-sm font-bold text-gray-700 flex-1">Week {week.week}: {week.title}</span>
                      <button
                        onClick={() => setEditingWeekIdx(editingWeekIdx === wi ? null : wi)}
                        className="text-xs text-qore-medium font-semibold hover:text-qore-dark"
                      >
                        {editingWeekIdx === wi ? 'Done' : 'Edit topics'}
                      </button>
                      <button onClick={() => setCurriculum((p) => p.filter((_, i) => i !== wi).map((w, i) => ({ ...w, week: i + 1 })))} className="text-gray-300 hover:text-red-500 transition-colors ml-1">
                        <X size={13} />
                      </button>
                    </div>
                    {editingWeekIdx === wi && (
                      <div className="px-4 py-3 space-y-2 bg-white">
                        {week.topics.map((topic, ti) => (
                          <div key={ti} className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                            <span className="flex-1">{topic}</span>
                            <button onClick={() => setCurriculum((p) => p.map((w, i) => i === wi ? { ...w, topics: w.topics.filter((_, j) => j !== ti) } : w))} className="text-gray-300 hover:text-red-500">
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                        <div className="flex gap-2 pt-1">
                          <input
                            value={newTopic}
                            onChange={(e) => setNewTopic(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic(wi))}
                            placeholder="Add topic…"
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-qore-medium"
                          />
                          <button onClick={() => addTopic(wi)} className="text-xs font-semibold text-qore-medium hover:text-qore-dark px-2">Add</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add week */}
              <div className="flex gap-2">
                <input
                  value={newWeekTitle}
                  onChange={(e) => setNewWeekTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addWeek())}
                  placeholder={`Week ${curriculum.length + 1} title…`}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
                />
                <button onClick={addWeek} className="bg-qore-medium text-white px-4 rounded-xl text-sm font-semibold hover:bg-qore-dark transition-colors">
                  Add Week
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="border border-gray-200 text-gray-500 px-5 py-2 rounded-xl text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={save} disabled={saving} className="bg-qore-medium hover:bg-qore-dark text-white px-6 py-2 rounded-xl text-sm font-semibold disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Content'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── ProgramRow ────────────────────────────────────────────────────────────
function ProgramRow({
  program, instructors, assistants,
  onInstructor, onAddTA, onRemoveTA, onDelete, onFieldUpdate, onEditContent,
}: {
  program: any;
  instructors: any[];
  assistants: any[];
  onInstructor: (id: string) => void;
  onAddTA: (id: string) => void;
  onRemoveTA: (id: string) => void;
  onDelete: () => void;
  onFieldUpdate: (field: string, val: any) => void;
  onEditContent: () => void;
}) {
  const [editPrice, setEditPrice] = useState(String(program.price ?? ''));
  const [editMax, setEditMax] = useState(String(program.maxLearners ?? ''));
  const [addingTA, setAddingTA] = useState(false);
  const [selectedTA, setSelectedTA] = useState('');

  const availableTAs = assistants.filter(
    (a) => !program.assistants?.find((pa: any) => pa.id === a.id)
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
      {/* Top row: track name + actions */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <BookOpen size={15} className="text-qore-medium" />
          <span className="font-semibold text-gray-900 text-sm">{program.track}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEditContent}
            className="flex items-center gap-1.5 text-xs font-semibold text-qore-medium hover:text-qore-dark border border-qore-medium/30 hover:border-qore-medium px-2.5 py-1 rounded-lg transition-colors"
            title="Edit course content"
          >
            <FileEdit size={13} /> Course Page
          </button>
          <button onClick={onDelete} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors" title="Delete program">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Price + max learners */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">Price (₦)</label>
          <input
            type="number"
            value={editPrice}
            onChange={(e) => setEditPrice(e.target.value)}
            onBlur={() => onFieldUpdate('price', parseFloat(editPrice) || 0)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">Max Learners</label>
          <input
            type="number"
            value={editMax}
            onChange={(e) => setEditMax(e.target.value)}
            onBlur={() => onFieldUpdate('maxLearners', parseInt(editMax) || 30)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
          />
        </div>
      </div>

      {/* Instructor */}
      <div>
        <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">Instructor</label>
        <select
          value={program.instructor?.id ?? ''}
          onChange={(e) => onInstructor(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
        >
          <option value="">— unassigned —</option>
          {instructors.map((i) => (
            <option key={i.id} value={i.id}>{i.firstName} {i.lastName}</option>
          ))}
        </select>
      </div>

      {/* TAs */}
      <div>
        <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-2">Technical Assistants</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {(program.assistants ?? []).map((ta: any) => (
            <span
              key={ta.id}
              className="flex items-center gap-1.5 bg-qore-light text-qore-dark text-xs font-semibold px-2.5 py-1 rounded-full"
            >
              {ta.firstName} {ta.lastName}
              <button onClick={() => onRemoveTA(ta.id)} className="text-qore-medium hover:text-red-500 transition-colors">
                <X size={11} />
              </button>
            </span>
          ))}
          {availableTAs.length > 0 && (
            addingTA ? (
              <div className="flex items-center gap-2">
                <select
                  value={selectedTA}
                  onChange={(e) => setSelectedTA(e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-qore-medium"
                >
                  <option value="">Pick TA…</option>
                  {availableTAs.map((a) => (
                    <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>
                  ))}
                </select>
                <button
                  onClick={() => { onAddTA(selectedTA); setAddingTA(false); setSelectedTA(''); }}
                  disabled={!selectedTA}
                  className="text-xs font-semibold text-qore-medium hover:text-qore-dark disabled:opacity-40"
                >
                  Add
                </button>
                <button onClick={() => setAddingTA(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
              </div>
            ) : (
              <button
                onClick={() => setAddingTA(true)}
                className="flex items-center gap-1 text-xs font-semibold text-qore-medium hover:text-qore-dark transition-colors border border-dashed border-qore-medium rounded-full px-2.5 py-1"
              >
                <Plus size={11} /> Add TA
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
