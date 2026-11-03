import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Save, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { getMyProgram } from '../../lib/tutor';

export function InstructorAttendance() {
  const { user } = useAuth();
  const [cohortId, setCohortId] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [learners, setLearners] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const mine = await getMyProgram();
        const cId = mine?.cohort?.id;
        if (!mine || !cId) return;
        setCohortId(cId);
        const [sessRes, enrollRes] = await Promise.all([
          api.get(`/sessions/program/${mine.id}`),
          api.get(`/enrollments/cohort/${cId}`),
        ]);
        setSessions(sessRes.data);
        const approved = enrollRes.data.filter(
          (e: any) => e.status === 'approved' && e.program?.id === mine.id,
        );
        setLearners(approved.map((e: any) => e.learner));
        if (sessRes.data.length > 0) {
          setSelectedSession(sessRes.data[0].id);
        }
      } catch {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  useEffect(() => {
    if (!selectedSession) return;
    api.get(`/sessions/${selectedSession}/attendance`).then(({ data }) => {
      const map: Record<string, string> = {};
      data.forEach((a: any) => { map[a.learner?.id] = a.status; });
      setAttendance(map);
    }).catch(() => {});
  }, [selectedSession]);

  const setStatus = (learnerId: string, status: string) => {
    setAttendance((prev) => ({ ...prev, [learnerId]: status }));
  };

  const handleSave = async () => {
    if (!selectedSession) return;
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      await Promise.all(
        learners.map((l) =>
          api.post(`/sessions/${selectedSession}/attendance`, {
            learner: { id: l.id },
            status: attendance[l.id] ?? 'absent',
          })
        )
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const filtered = learners.filter(
    (l) =>
      `${l.firstName} ${l.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentSession = sessions.find((s) => s.id === selectedSession);

  if (loading) return <div className="p-12 text-center text-gray-400">Loading attendance…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-qore-text">Attendance Marking</h1>
          <p className="text-gray-500">Record attendance for a session.</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle size={16} /> Saved
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !selectedSession}
            className="bg-qore-medium hover:bg-qore-dark text-white px-5 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            <Save size={18} /> {saving ? 'Saving…' : 'Save Attendance'}
          </button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      {!cohortId && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-800 text-sm">
          You haven't been assigned to a cohort yet. Contact an admin.
        </div>
      )}

      {cohortId && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full sm:w-72 bg-white border border-gray-200 text-qore-text rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-qore-medium font-medium"
            >
              <option value="">Select a session…</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} — {new Date(s.scheduledAt).toLocaleDateString()}
                </option>
              ))}
            </select>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search learners…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-qore-medium"
              />
            </div>
          </div>

          {sessions.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No sessions scheduled yet.</div>
          ) : learners.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No enrolled learners found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-gray-100">
                    <th className="p-4 font-semibold text-gray-600 text-sm">Learner</th>
                    <th className="p-4 font-semibold text-gray-600 text-sm text-center">Present</th>
                    <th className="p-4 font-semibold text-gray-600 text-sm text-center">Excused</th>
                    <th className="p-4 font-semibold text-gray-600 text-sm text-center">Absent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((learner, index) => {
                    const status = attendance[learner.id] ?? '';
                    return (
                      <motion.tr
                        key={learner.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="p-4">
                          <p className="font-medium text-qore-text">{learner.firstName} {learner.lastName}</p>
                          <p className="text-xs text-gray-500">{learner.email}</p>
                        </td>
                        {(['present', 'excused', 'absent'] as const).map((s) => (
                          <td key={s} className="p-4 text-center">
                            <button
                              onClick={() => setStatus(learner.id, s)}
                              className={`w-9 h-9 rounded-full border-2 flex items-center justify-center mx-auto transition-all ${
                                status === s
                                  ? s === 'present'
                                    ? 'border-green-500 bg-green-50 text-green-500'
                                    : s === 'excused'
                                    ? 'border-amber-500 bg-amber-50 text-amber-500'
                                    : 'border-red-500 bg-red-50 text-red-500'
                                  : 'border-gray-200 text-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {s === 'present' ? <CheckCircle size={18} /> : s === 'excused' ? <AlertCircle size={18} /> : <XCircle size={18} />}
                            </button>
                          </td>
                        ))}
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {currentSession && filtered.length > 0 && (
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex gap-4 text-xs text-gray-500">
              <span className="text-green-600 font-medium">
                Present: {filtered.filter((l) => attendance[l.id] === 'present').length}
              </span>
              <span className="text-amber-600 font-medium">
                Excused: {filtered.filter((l) => attendance[l.id] === 'excused').length}
              </span>
              <span className="text-red-600 font-medium">
                Absent: {filtered.filter((l) => attendance[l.id] === 'absent').length}
              </span>
              <span>Unmarked: {filtered.filter((l) => !attendance[l.id]).length}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
