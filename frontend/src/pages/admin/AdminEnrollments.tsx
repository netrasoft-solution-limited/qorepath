import React, { useEffect, useState } from 'react';
import { Search, CheckCircle, XCircle, Clock, RotateCcw } from 'lucide-react';
import api from '../../lib/api';
import { useConfirm, useToast } from '../../components/feedback';

export function AdminEnrollments() {
  const confirm = useConfirm();
  const toast = useToast();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/enrollments');
      setEnrollments(data);
    } catch {
      setError('Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.patch(`/enrollments/${id}/status`, { status });
      load();
    } catch {
      setError('Failed to update status');
    }
  };

  const reinstate = async (e: any) => {
    const ok = await confirm({
      title: 'Reinstate enrollment?',
      message: `${e.learner?.firstName ?? 'The learner'} will regain access to ${e.program?.track ?? 'the program'}. Note: if they were refunded, the payment is not restored.`,
      confirmLabel: 'Reinstate',
    });
    if (!ok) return;
    try {
      await api.patch(`/enrollments/${e.id}/reinstate`);
      toast({ message: 'Enrollment reinstated.', variant: 'success' });
      load();
    } catch (err: any) {
      toast({ message: err.response?.data?.message || 'Could not reinstate.', variant: 'error' });
    }
  };

  const filtered = enrollments.filter((e) => {
    const matchSearch =
      e.learner?.email?.toLowerCase().includes(search.toLowerCase()) ||
      `${e.learner?.firstName} ${e.learner?.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      e.program?.track?.toLowerCase().includes(search.toLowerCase()) ||
      e.program?.cohort?.name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || e.status === filter;
    return matchSearch && matchFilter;
  });

  const statusBadge: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    withdrawn: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-qore-text">Enrollments</h1>
        <p className="text-gray-500">{enrollments.filter((e) => e.status === 'pending').length} pending review</p>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, cohort…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="withdrawn">Withdrawn</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No enrollments found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Learner</th>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Program / Cohort</th>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Date</th>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Status</th>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-qore-text">
                      {e.learner?.firstName} {e.learner?.lastName}
                    </p>
                    <p className="text-xs text-gray-400">{e.learner?.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-700 font-medium text-xs">{e.program?.track ?? '—'}</p>
                    <p className="text-gray-400 text-xs">{e.program?.cohort?.name ?? ''}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{e.enrolledAt?.slice(0, 10)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge[e.status] ?? ''}`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {e.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateStatus(e.id, 'approved')}
                          title="Approve"
                          className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button
                          onClick={() => updateStatus(e.id, 'rejected')}
                          title="Reject"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    )}
                    {(e.status === 'withdrawn' || e.status === 'rejected') && (
                      <button
                        onClick={() => reinstate(e)}
                        title="Reinstate"
                        className="text-xs text-qore-medium hover:underline flex items-center gap-1"
                      >
                        <RotateCcw size={13} /> Reinstate
                      </button>
                    )}
                    {e.status === 'approved' && (
                      <span className="text-gray-400 text-xs flex items-center gap-1">
                        <Clock size={12} /> active
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
