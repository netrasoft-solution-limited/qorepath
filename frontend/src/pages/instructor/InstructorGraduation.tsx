import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Award, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { getMyProgram } from '../../lib/tutor';

export function InstructorGraduation() {
  const { user } = useAuth();
  const [cohortId, setCohortId] = useState('');
  const [cohortName, setCohortName] = useState('');
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<Record<string, { rec: string; notes: string; id?: string }>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const mine = await getMyProgram();
        const cId = mine?.cohort?.id;
        if (!mine || !cId) return;
        setCohortId(cId);
        setCohortName(`${mine.track}${mine.cohort?.name ? ` · ${mine.cohort.name}` : ''}`);
        const [enrollRes, gradRes] = await Promise.all([
          api.get(`/enrollments/cohort/${cId}`),
          api.get(`/graduation/cohort/${cId}`),
        ]);
        const approved = enrollRes.data.filter(
          (e: any) => e.status === 'approved' && e.program?.id === mine.id,
        );
        setEnrollments(approved);
        const recMap: Record<string, { rec: string; notes: string; id?: string }> = {};
        gradRes.data.forEach((g: any) => {
          recMap[g.enrollment?.id] = { rec: g.recommendation, notes: g.notes ?? '', id: g.id };
        });
        approved.forEach((e: any) => {
          if (!recMap[e.id]) recMap[e.id] = { rec: 'pass', notes: '' };
        });
        setRecommendations(recMap);
      } catch {
        setError('Failed to load graduation data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const handleSubmit = async (enrollmentId: string) => {
    const rec = recommendations[enrollmentId];
    if (!rec) return;
    setSaving((prev) => ({ ...prev, [enrollmentId]: true }));
    try {
      await api.post('/graduation/recommend', {
        enrollmentId,
        recommendation: rec.rec,
        notes: rec.notes,
      });
      setSaved((prev) => ({ ...prev, [enrollmentId]: true }));
      setTimeout(() => setSaved((prev) => ({ ...prev, [enrollmentId]: false })), 3000);
    } catch {
      setError('Failed to submit recommendation');
    } finally {
      setSaving((prev) => ({ ...prev, [enrollmentId]: false }));
    }
  };

  const setRec = (enrollmentId: string, field: 'rec' | 'notes', value: string) => {
    setRecommendations((prev) => ({
      ...prev,
      [enrollmentId]: { ...prev[enrollmentId], [field]: value },
    }));
  };

  if (loading) return <div className="p-12 text-center text-gray-400">Loading graduation data…</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-qore-text">Graduation Review</h1>
          <p className="text-gray-500">Submit final recommendations for {cohortName || 'your cohort'} learners.</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm flex items-start gap-3 max-w-xs">
          <AlertCircle size={20} className="shrink-0 mt-0.5 text-amber-600" />
          <p>Recommendations are required before Admin can issue certificates.</p>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      {!cohortId && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-800 text-sm">
          You haven't been assigned to a cohort yet.
        </div>
      )}

      {enrollments.length === 0 && cohortId && (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
          No enrolled learners in this cohort yet.
        </div>
      )}

      <div className="space-y-4">
        {enrollments.map((enrollment, idx) => {
          const learner = enrollment.learner;
          const rec = recommendations[enrollment.id] ?? { rec: 'pass', notes: '' };
          const isSaving = saving[enrollment.id];
          const isSaved = saved[enrollment.id];

          return (
            <motion.div
              key={enrollment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-6"
            >
              <div className="flex-1 border-r border-gray-100 pr-6">
                <h3 className="text-lg font-bold text-qore-text mb-1">
                  {learner.firstName} {learner.lastName}
                </h3>
                <p className="text-sm text-gray-500 mb-4">{learner.email}</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Enrolled</span>
                    <span className="font-medium text-qore-text">
                      {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Status</span>
                    <span className="font-medium text-green-600 flex items-center gap-1">
                      <CheckCircle size={13} /> Enrolled
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-bold text-qore-text mb-3">Your Recommendation</label>
                <div className="flex gap-3 mb-4">
                  {(['pass', 'conditional', 'fail'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setRec(enrollment.id, 'rec', option)}
                      className={`flex-1 border rounded-xl p-3 flex items-center justify-center gap-2 capitalize text-sm font-medium transition-colors ${
                        rec.rec === option
                          ? option === 'pass'
                            ? 'border-qore-medium bg-qore-light/40 text-qore-dark'
                            : option === 'conditional'
                            ? 'border-amber-500 bg-amber-50 text-amber-800'
                            : 'border-red-500 bg-red-50 text-red-800'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {option === 'pass' && <Award size={15} />}
                      {option === 'conditional' && <AlertCircle size={15} />}
                      {option === 'fail' && <XCircle size={15} />}
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={rec.notes}
                  onChange={(e) => setRec(enrollment.id, 'notes', e.target.value)}
                  placeholder="Add notes for Admin (optional for Pass, required for Conditional/Fail)…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium resize-none mb-3"
                />
                <button
                  onClick={() => handleSubmit(enrollment.id)}
                  disabled={isSaving}
                  className="w-full bg-gray-900 hover:bg-black text-white py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSaved ? (
                    <><CheckCircle size={15} /> Recommendation saved</>
                  ) : (
                    <><Save size={15} /> {isSaving ? 'Submitting…' : 'Submit Recommendation'}</>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
