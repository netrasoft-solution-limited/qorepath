import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ShieldAlert, RefreshCw, ChevronDown, Bot } from 'lucide-react';
import api from '../../lib/api';

type AuditEntry = {
  id: string;
  createdAt: string;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  summary: string;
  changes: Record<string, [unknown, unknown]> | null;
  ip: string | null;
};

const PAGE = 100;

// Colour by what kind of action it is, not by every action name.
function actionColor(action: string) {
  if (/FAILED|DELETED|SUSPENDED|REJECTED|DENIED|REFUNDED/.test(action)) return 'bg-red-50 text-red-600';
  if (/KEYS|RESEND|INTEGRATION|SUPER_ADMIN|PERMISSIONS|ROLE|PASSWORD/.test(action)) return 'bg-orange-50 text-orange-700';
  if (/PAYMENT|PRICE|WITHDRAWAL/.test(action)) return 'bg-green-50 text-green-700';
  if (/CERTIFICATE|GRADUATION/.test(action)) return 'bg-purple-50 text-purple-600';
  if (/LOGIN/.test(action)) return 'bg-gray-100 text-gray-600';
  return 'bg-qore-light text-qore-medium';
}

const label = (action: string) => action.replace(/_/g, ' ');
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
const fmtValue = (v: unknown) =>
  v === null || v === undefined || v === '' ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v);

export function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState('');
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  const fetchPage = async (before?: string) => {
    const { data } = await api.get<AuditEntry[]>('/audit', {
      params: { search: search || undefined, action: actionFilter || undefined, before, limit: PAGE },
    });
    setHasMore(data.length === PAGE);
    return data;
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [rows, acts] = await Promise.all([fetchPage(), api.get<string[]>('/audit/actions')]);
      setLogs(rows);
      setActions(acts.data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to load the audit log');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!logs.length) return;
    setLoadingMore(true);
    try {
      const rows = await fetchPage(logs[logs.length - 1].createdAt);
      setLogs((prev) => [...prev, ...rows]);
    } catch {
      setError('Failed to load more entries');
    } finally {
      setLoadingMore(false);
    }
  };

  // Filters run on the server, so searching covers the whole history, not just the loaded page.
  useEffect(() => {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(debounce.current);
  }, [search, actionFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-qore-text">Audit Log</h1>
          <p className="text-gray-500">
            Who did what, and when: admin actions, key and permission changes, refunds, staff sign-ins and
            payments confirmed by Paystack.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
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
              placeholder="Search by person, email or description…"
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
            <option value="">All actions</option>
            {actions.map((a) => <option key={a} value={a}>{label(a)}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading audit log…</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            {search || actionFilter ? 'No entries match your filters.' : 'No activity recorded yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white border-b border-gray-100">
                <tr className="text-xs text-gray-500 uppercase tracking-wider">
                  <th className="p-4 font-medium">When</th>
                  <th className="p-4 font-medium">Who</th>
                  <th className="p-4 font-medium">Action</th>
                  <th className="p-4 font-medium">What happened</th>
                  <th className="p-4 font-medium w-8" />
                </tr>
              </thead>
              <tbody className="text-sm">
                {logs.map((log, idx) => {
                  const expandable = !!(log.changes || log.ip || log.entityId);
                  const isOpen = open === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <motion.tr
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(idx * 0.02, 0.4) }}
                        onClick={() => expandable && setOpen(isOpen ? null : log.id)}
                        className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${expandable ? 'cursor-pointer' : ''}`}
                      >
                        <td className="p-4 text-gray-500 text-xs whitespace-nowrap">{fmtTime(log.createdAt)}</td>
                        <td className="p-4 whitespace-nowrap">
                          {log.actorId || log.actorEmail ? (
                            <>
                              <p className="font-bold text-qore-text">{log.actorName || log.actorEmail}</p>
                              <p className="text-xs text-gray-400">
                                {log.actorName ? `${log.actorEmail} · ` : ''}{log.actorRole}
                              </p>
                            </>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 font-bold text-gray-500">
                              <Bot size={14} /> System
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${actionColor(log.action)}`}>
                            {label(log.action)}
                          </span>
                        </td>
                        <td className="p-4 text-gray-600 text-xs max-w-md">{log.summary}</td>
                        <td className="p-4 text-gray-400">
                          {expandable && (
                            <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          )}
                        </td>
                      </motion.tr>
                      {isOpen && (
                        <tr className="bg-gray-50/70 border-b border-gray-100">
                          <td colSpan={5} className="px-4 py-3 text-xs text-gray-600">
                            {log.changes && (
                              <table className="mb-2">
                                <tbody>
                                  {Object.entries(log.changes).map(([field, [from, to]]) => (
                                    <tr key={field}>
                                      <td className="pr-4 py-0.5 font-semibold text-gray-500">{field}</td>
                                      <td className="pr-2 py-0.5 text-red-600 line-through break-all">{fmtValue(from)}</td>
                                      <td className="pr-2 py-0.5 text-gray-400">→</td>
                                      <td className="py-0.5 text-green-700 break-all">{fmtValue(to)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                            <p className="text-gray-400">
                              {log.entity}{log.entityId ? ` ${log.entityId}` : ''}{log.ip ? ` · IP ${log.ip}` : ''}
                            </p>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && logs.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between">
            <span>Showing {logs.length} entries, newest first</span>
            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="text-qore-medium font-semibold hover:underline disabled:opacity-50"
              >
                {loadingMore ? 'Loading…' : 'Load older entries'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
