import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link as LinkIcon, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import api from '../../lib/api';
import { pickCurrentEnrollment } from '../../lib/enrollments';

export function LearnerCapstone() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', description: '', repoUrl: '', demoUrl: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data: enrollments } = await api.get('/enrollments/my');
        const active = pickCurrentEnrollment(enrollments);
        const subsRes = await api.get('/assignments/submissions/my');
        setSubmissions(subsRes.data);
        if (active?.status === 'approved' && active.program?.id) {
          const { data } = await api.get(`/assignments/program/${active.program.id}`);
          setAssignments(data.filter((a: any) => a.isCapstone));
        }
      } catch {
        setError('Could not load your capstone. Please refresh to try again.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const capstone = assignments[0];
  const submission = capstone ? submissions.find((s) => s.assignment?.id === capstone.id) : null;

  const status = !capstone
    ? 'No Assignment'
    : submission?.status === 'graded'
    ? 'Graded'
    : submission
    ? 'Submitted'
    : 'Not Started';

  const statusStyle: Record<string, string> = {
    'No Assignment': 'bg-gray-100 text-gray-600',
    'Not Started': 'bg-gray-100 text-gray-600',
    'Submitted': 'bg-blue-50 text-blue-600',
    'Graded': 'bg-qore-light text-qore-medium',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capstone) return;
    setSubmitting(true);
    setError('');
    try {
      const submissionText = `**${form.title}**\n\n${form.description}\n\nRepo: ${form.repoUrl}\nDemo: ${form.demoUrl}`;
      await api.post(`/assignments/${capstone.id}/submit`, {
        submissionUrl: form.repoUrl,
        submissionText,
      });
      setSaved(true);
      const { data } = await api.get('/assignments/submissions/my');
      setSubmissions(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-400">Loading capstone…</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-qore-text">Capstone Project</h1>
          <p className="text-gray-500">Submit your final project for graduation assessment.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {capstone?.dueDate && (
            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full flex items-center gap-1">
              <Clock size={12} /> Due {new Date(capstone.dueDate).toLocaleDateString()}
            </span>
          )}
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusStyle[status]}`}>
            {status}
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 border border-red-100">
          <AlertCircle size={16} className="shrink-0" /> {error}
        </div>
      )}

      {!capstone && !error && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-800 text-sm">
          No capstone assignment has been posted yet. Check back later.
        </div>
      )}

      {capstone && (
        <>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3"
          >
            <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm font-bold text-amber-800">{capstone.title}</h3>
              <p className="text-sm text-amber-700 mt-1">{capstone.description}</p>
              <p className="text-xs text-amber-600 mt-1">Max score: {capstone.maxScore}</p>
            </div>
          </motion.div>

          {submission ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle size={22} className="text-green-500" />
                <h2 className="font-bold text-qore-text">Submission received</h2>
              </div>
              <a href={submission.submissionUrl} target="_blank" rel="noreferrer"
                className="text-sm text-qore-medium hover:underline flex items-center gap-1"
              >
                <LinkIcon size={13} /> {submission.submissionUrl}
              </a>
              {submission.score != null && (
                <div className="mt-4 p-4 bg-qore-light/40 rounded-xl">
                  <p className="text-sm font-semibold text-qore-text">Score: {submission.score}/{capstone.maxScore}</p>
                  {submission.feedback && <p className="text-sm text-gray-600 mt-1">{submission.feedback}</p>}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8"
            >
              {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
              {saved && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
                  <CheckCircle size={16} /> Capstone submitted successfully!
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-qore-text mb-1.5">Project Title</label>
                  <input required value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. E-commerce Dashboard"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-qore-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-qore-text mb-1.5">Description</label>
                  <textarea required rows={4} value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe your project, the problem it solves, and technologies used…"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-qore-medium resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-qore-text mb-1.5">GitHub Repository URL</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-4 top-3.5 text-gray-400" size={16} />
                      <input required type="url" value={form.repoUrl}
                        onChange={(e) => setForm({ ...form, repoUrl: e.target.value })}
                        placeholder="https://github.com/..."
                        className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-qore-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-qore-text mb-1.5">Live Demo <span className="text-gray-400 font-normal">(optional)</span></label>
                    <div className="relative">
                      <LinkIcon className="absolute left-4 top-3.5 text-gray-400" size={16} />
                      <input type="url" value={form.demoUrl}
                        onChange={(e) => setForm({ ...form, demoUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-qore-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button type="submit" disabled={submitting}
                    className="px-6 py-3 rounded-xl font-medium bg-qore-medium text-white hover:bg-qore-dark transition-colors flex items-center gap-2 disabled:opacity-60"
                  >
                    <CheckCircle size={17} />
                    {submitting ? 'Submitting…' : 'Submit Capstone'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
