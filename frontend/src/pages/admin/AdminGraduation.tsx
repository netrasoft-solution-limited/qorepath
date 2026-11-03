import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Award, AlertCircle } from 'lucide-react';
import api from '../../lib/api';

export function AdminGraduation() {
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [selectedCohort, setSelectedCohort] = useState('');
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/cohorts').then(({ data }) => {
      const active = data.filter((c: any) => c.status === 'active' || c.status === 'completed');
      setCohorts(active);
      if (active.length > 0) setSelectedCohort(active[0].id);
    }).catch(() => setError('Failed to load cohorts')).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedCohort) return;
    setRecords([]);
    api.get(`/graduation/cohort/${selectedCohort}`).then(({ data }) => setRecords(data)).catch(() => {});
  }, [selectedCohort]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating((prev) => ({ ...prev, [id]: true }));
    try {
      await api.patch(`/graduation/${id}/status`, { status });
      const { data } = await api.get(`/graduation/cohort/${selectedCohort}`);
      setRecords(data);
    } catch {
      setError('Failed to update status');
    } finally {
      setUpdating((prev) => ({ ...prev, [id]: false }));
    }
  };

  const currentCohort = cohorts.find((c) => c.id === selectedCohort);
  const passCount = records.filter((r) => r.recommendation === 'pass' && r.status === 'pending').length;

  if (loading) return <div className="p-12 text-center text-gray-400">Loading graduation queue…</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-qore-text">Graduation Queue</h1>
          <p className="text-gray-500">Review instructor recommendations and issue certificates.</p>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <select
              value={selectedCohort}
              onChange={(e) => setSelectedCohort(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-qore-medium"
            >
              {cohorts.length === 0 && <option value="">No cohorts</option>}
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.track}</option>
              ))}
            </select>
            {currentCohort?.instructor && (
              <p className="text-sm text-gray-500">
                Instructor: {currentCohort.instructor.firstName} {currentCohort.instructor.lastName}
              </p>
            )}
          </div>
          {passCount > 0 && (
            <button
              onClick={async () => {
                const passRecs = records.filter((r) => r.recommendation === 'pass' && r.status === 'pending');
                for (const r of passRecs) await updateStatus(r.id, 'approved');
              }}
              className="bg-qore-medium hover:bg-qore-dark text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Award size={16} /> Bulk Approve Passing ({passCount})
            </button>
          )}
        </div>

        {records.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No graduation recommendations submitted yet.
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {records.map((record, idx) => {
              const learner = record.enrollment?.learner;
              const recColor =
                record.recommendation === 'pass'
                  ? 'bg-qore-light text-qore-medium'
                  : record.recommendation === 'conditional'
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-red-50 text-red-600';
              const statusColor =
                record.status === 'approved'
                  ? 'bg-green-100 text-green-700'
                  : record.status === 'rejected'
                  ? 'bg-red-100 text-red-700'
                  : record.status === 'held'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-500';

              return (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row gap-6 items-start md:items-center"
                >
                  <div className="w-full md:w-1/4">
                    <h3 className="font-bold text-qore-text">
                      {learner?.firstName} {learner?.lastName}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">{learner?.email}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${recColor}`}>
                        Rec: {record.recommendation}
                      </span>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
                        {record.status}
                      </span>
                    </div>
                    {record.notes && (
                      <p className="text-xs text-amber-700 mt-2 flex items-start gap-1">
                        <AlertCircle size={11} className="shrink-0 mt-0.5" />
                        {record.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex-1" />

                  <div className="w-full md:w-auto flex gap-2 justify-end">
                    {record.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatus(record.id, 'approved')}
                          disabled={updating[record.id]}
                          className="bg-qore-medium hover:bg-qore-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-60"
                        >
                          <CheckCircle size={15} /> Approve
                        </button>
                        {record.recommendation === 'conditional' && (
                          <button
                            onClick={() => updateStatus(record.id, 'held')}
                            disabled={updating[record.id]}
                            className="border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
                          >
                            Hold
                          </button>
                        )}
                        <button
                          onClick={() => updateStatus(record.id, 'rejected')}
                          disabled={updating[record.id]}
                          className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-60"
                        >
                          <XCircle size={15} /> Reject
                        </button>
                      </>
                    )}
                    {record.status !== 'pending' && (
                      <button
                        onClick={() => updateStatus(record.id, 'pending')}
                        disabled={updating[record.id]}
                        className="border border-gray-200 text-gray-500 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
                      >
                        Reset to Pending
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
