import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ShieldAlert, RefreshCw } from 'lucide-react';
import api from '../../lib/api';

type LogEntry = {
  id: string;
  time: string;
  rawTime: Date;
  actor: string;
  action: string;
  entity: string;
  desc: string;
};

const ACTION_COLORS: Record<string, string> = {
  ENROLL: 'bg-blue-50 text-blue-600',
  PAYMENT: 'bg-green-50 text-green-600',
  CERTIFICATE: 'bg-amber-50 text-amber-700',
  GRADUATE: 'bg-purple-50 text-purple-600',
  APPROVE: 'bg-qore-light text-qore-medium',
  REJECT: 'bg-red-50 text-red-600',
};

export function AdminAuditLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('All Actions');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [enrollRes, payRes, certRes, gradRes] = await Promise.allSettled([
        api.get('/enrollments'),
        api.get('/payments'),
        api.get('/certificates'),
        api.get('/graduation/all').catch(() => ({ data: [] })),
      ]);

      const entries: LogEntry[] = [];

      if (enrollRes.status === 'fulfilled') {
        for (const e of enrollRes.value.data) {
          entries.push({
            id: `enroll-${e.id}`,
            rawTime: new Date(e.createdAt),
            time: new Date(e.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }),
            actor: `${e.learner?.firstName ?? ''} ${e.learner?.lastName ?? ''}`.trim() || 'Learner',
            action: 'ENROLL',
            entity: 'Enrollment',
            desc: `Enrolled in ${e.cohort?.name ?? 'cohort'} (${e.cohort?.track ?? ''}) — status: ${e.status}`,
          });
        }
      }

      if (payRes.status === 'fulfilled') {
        for (const p of payRes.value.data) {
          entries.push({
            id: `pay-${p.id}`,
            rawTime: new Date(p.createdAt),
            time: new Date(p.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }),
            actor: `${p.user?.firstName ?? ''} ${p.user?.lastName ?? ''}`.trim() || 'Learner',
            action: 'PAYMENT',
            entity: 'Payment',
            desc: `₦${parseFloat(p.amount || 0).toLocaleString()} — ${p.method ?? 'full'} — ${p.status}`,
          });
        }
      }

      if (certRes.status === 'fulfilled') {
        for (const c of certRes.value.data) {
          entries.push({
            id: `cert-${c.id}`,
            rawTime: new Date(c.issuedAt || c.createdAt),
            time: new Date(c.issuedAt || c.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }),
            actor: 'Admin',
            action: 'CERTIFICATE',
            entity: 'Certificate',
            desc: `Issued ${c.certificateNumber} to ${c.learner?.firstName ?? ''} ${c.learner?.lastName ?? ''} (${c.cohort?.name ?? ''})`,
          });
        }
      }

      if (gradRes.status === 'fulfilled') {
        for (const g of (gradRes.value as any).data ?? []) {
          entries.push({
            id: `grad-${g.id}`,
            rawTime: new Date(g.updatedAt || g.createdAt),
            time: new Date(g.updatedAt || g.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }),
            actor: `${g.submittedBy?.firstName ?? ''} ${g.submittedBy?.lastName ?? ''}`.trim() || 'Instructor',
            action: g.status === 'approved' ? 'APPROVE' : g.status === 'rejected' ? 'REJECT' : 'GRADUATE',
            entity: 'Graduation',
            desc: `${g.recommendation} recommendation for ${g.enrollment?.learner?.firstName ?? ''} ${g.enrollment?.learner?.lastName ?? ''} — ${g.status}`,
          });
        }
      }

      entries.sort((a, b) => b.rawTime.getTime() - a.rawTime.getTime());
      setLogs(entries);
    } catch {
      setError('Failed to load activity log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = logs.filter((l) => {
    const matchSearch = search === '' || l.actor.toLowerCase().includes(search.toLowerCase()) || l.desc.toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === 'All Actions' || l.action === actionFilter;
    return matchSearch && matchAction;
  });

  const actions = ['All Actions', ...Array.from(new Set(logs.map((l) => l.action)))];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-qore-text">Activity Log</h1>
          <p className="text-gray-500">Combined feed of all platform activity — enrollments, payments, certificates, graduations.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border border-orange-100">
            <ShieldAlert size={14} /> Read Only
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-qore-medium border border-gray-200 px-3 py-2 rounded-xl hover:border-qore-medium transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between bg-gray-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by actor or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-qore-medium text-sm"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-qore-medium bg-white"
          >
            {actions.map((a) => <option key={a}>{a}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading activity log…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">No activity recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white border-b border-gray-100">
                <tr className="text-xs text-gray-500 uppercase tracking-wider">
                  <th className="p-4 font-medium">Timestamp</th>
                  <th className="p-4 font-medium">Actor</th>
                  <th className="p-4 font-medium">Action</th>
                  <th className="p-4 font-medium">Entity</th>
                  <th className="p-4 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filtered.map((log, idx) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.03, 0.5) }}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="p-4 text-gray-500 text-xs whitespace-nowrap">{log.time}</td>
                    <td className="p-4 font-bold text-qore-text whitespace-nowrap">{log.actor}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600 text-xs">{log.entity}</td>
                    <td className="p-4 text-gray-600 text-xs max-w-xs truncate" title={log.desc}>{log.desc}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400 text-right">
            Showing {filtered.length} of {logs.length} events
          </div>
        )}
      </div>
    </div>
  );
}
