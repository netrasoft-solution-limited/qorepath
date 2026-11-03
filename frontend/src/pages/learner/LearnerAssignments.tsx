import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../lib/api';
import { pickCurrentEnrollment, enrollmentCohortId } from '../../lib/enrollments';

export function LearnerAssignments() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitForm, setSubmitForm] = useState<{ id: string; url: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data: enrollments } = await api.get('/enrollments/my');
        const active = pickCurrentEnrollment(enrollments);
        const subs = await api.get('/assignments/submissions/my');
        setSubmissions(subs.data);
        const cohortId = enrollmentCohortId(active);
        if (cohortId) {
          const { data } = await api.get(`/assignments/cohort/${cohortId}`);
          setAssignments(data);
        }
      } catch {
        setError('Could not load your assignments. Please refresh to try again.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitForm) return;
    setSubmitting(true);
    try {
      await api.post(`/assignments/${submitForm.id}/submit`, { submissionUrl: submitForm.url });
      const { data } = await api.get('/assignments/submissions/my');
      setSubmissions(data);
      setSubmitForm(null);
    } catch {
      // silently fallback
    } finally {
      setSubmitting(false);
    }
  };

  const getSubmission = (assignmentId: string) =>
    submissions.find((s) => s.assignment?.id === assignmentId);

  const isPastDue = (dueDate: string) => new Date(dueDate) < new Date();

  if (loading) return <div className="p-12 text-center text-gray-400">Loading assignments…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-qore-text">Assignments</h1>
        <p className="text-gray-500">{assignments.length} total assignments</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 border border-red-100">
          <AlertCircle size={16} className="shrink-0" /> {error}
        </div>
      )}

      {submitForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-qore-highlight">
          <h2 className="font-bold text-qore-text mb-4">Submit Assignment</h2>
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              required
              type="url"
              value={submitForm.url}
              onChange={(e) => setSubmitForm({ ...submitForm, url: e.target.value })}
              placeholder="https://github.com/yourrepo or Google Drive link…"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
            />
            <button type="submit" disabled={submitting}
              className="bg-qore-dark text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-qore-medium transition-colors disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
            <button type="button" onClick={() => setSubmitForm(null)}
              className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
          No assignments yet.
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((a, i) => {
            const submission = getSubmission(a.id);
            const pastDue = isPastDue(a.dueDate);
            return (
              <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mt-0.5 ${submission ? 'bg-green-50 text-green-600' : pastDue ? 'bg-red-50 text-red-500' : 'bg-qore-light text-qore-dark'}`}>
                      {submission ? <CheckCircle size={20} /> : pastDue ? <AlertCircle size={20} /> : <FileText size={20} />}
                    </div>
                    <div>
                      <p className="font-semibold text-qore-text">{a.title}</p>
                      <p className="text-sm text-gray-500 mt-1">{a.description?.slice(0, 120)}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                        <Clock size={12} />
                        <span>Due: {new Date(a.dueDate).toLocaleDateString()}</span>
                        {pastDue && !submission && <span className="text-red-500 font-medium">Overdue</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {submission ? (
                      <div className="text-right">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${submission.status === 'graded' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                          {submission.status}
                        </span>
                        {submission.score != null && (
                          <p className="text-sm font-bold text-qore-text mt-1">{submission.score}/{a.maxScore}</p>
                        )}
                        {submission.feedback && (
                          <p className="text-xs text-gray-500 mt-1 max-w-xs text-right">{submission.feedback}</p>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setSubmitForm({ id: a.id, url: '' })}
                        className="bg-qore-dark text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-qore-medium transition-colors"
                      >
                        Submit
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
