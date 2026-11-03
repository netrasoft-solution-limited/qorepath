import React, { useEffect, useState } from 'react';
import { Search, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import api from '../../lib/api';
import { useConfirm } from '../../components/feedback';

export function AdminPayments() {
  const confirm = useConfirm();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  const [rechecking, setRechecking] = useState(false);
  const [recheckMsg, setRecheckMsg] = useState('');
  const recheck = async () => {
    setRechecking(true);
    setRecheckMsg('');
    try {
      const { data } = await api.post('/payments/reconcile-all');
      setRecheckMsg(
        data.checked
          ? `Checked ${data.checked} with Paystack: ${data.confirmed} confirmed, ${data.closed} closed, ${data.stillPending} still pending.`
          : 'No unconfirmed payments to check.',
      );
      await load();
    } catch {
      setRecheckMsg('Could not reach Paystack. Try again in a moment.');
    } finally {
      setRechecking(false);
    }
  };

  const load = async () => {
    try {
      const { data } = await api.get('/payments');
      setPayments(data);
    } catch {
      setError('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markPaid = async (id: string) => {
    try {
      await api.patch(`/payments/${id}/status`, { status: 'paid' });
      load();
    } catch {
      setError('Failed to update payment');
    }
  };

  const [refundingId, setRefundingId] = useState<string | null>(null);
  const refund = async (id: string) => {
    const ok = await confirm({
      title: 'Issue refund?',
      message: 'This issues a Paystack refund and moves money back to the learner.',
      confirmLabel: 'Refund',
      variant: 'danger',
    });
    if (!ok) return;
    setError('');
    setRefundingId(id);
    try {
      await api.post(`/payments/${id}/refund`);
      load();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Refund failed at Paystack');
    } finally {
      setRefundingId(null);
    }
  };

  const filtered = payments.filter((p) => {
    const matchSearch =
      `${p.user?.firstName} ${p.user?.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      p.user?.email?.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (filter === 'all' || p.status === filter);
  });

  const total = payments.filter((p) => p.status === 'paid')
    .reduce((s: number, p: any) => s + parseFloat(p.amount), 0);

  const statusBadge: Record<string, string> = {
    paid: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    failed: 'bg-red-100 text-red-700',
    refunded: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-qore-text">Payments</h1>
          <p className="text-gray-500">Total paid: ₦{total.toLocaleString()}</p>
        </div>
        <button
          onClick={recheck}
          disabled={rechecking}
          title="Ask Paystack for the latest status of every unconfirmed payment"
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-qore-dark hover:border-qore-medium disabled:opacity-60"
        >
          <RefreshCw size={15} className={rechecking ? 'animate-spin' : ''} /> {rechecking ? 'Checking…' : 'Re-check pending'}
        </button>
      </div>
      {recheckMsg && <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">{recheckMsg}</div>}

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by learner name or email…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
        >
          <option value="all">All</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No payments found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Learner</th>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Cohort</th>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Amount</th>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Method</th>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Date</th>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Status</th>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-qore-text">{p.user?.firstName} {p.user?.lastName}</p>
                    <p className="text-xs text-gray-400">{p.user?.email}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{p.cohort?.name ?? '—'}</td>
                  <td className="px-6 py-4 font-medium text-qore-text">₦{Number(p.amount).toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-500 capitalize">{p.method ?? '—'}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{p.createdAt?.slice(0, 10)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge[p.status] ?? ''}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {p.status === 'pending' && (
                      <button
                        onClick={() => markPaid(p.id)}
                        className="text-xs text-green-600 hover:underline flex items-center gap-1"
                      >
                        <CheckCircle size={13} /> Mark paid
                      </button>
                    )}
                    {p.status === 'paid' && (
                      <button
                        onClick={() => refund(p.id)}
                        disabled={refundingId === p.id}
                        className="text-xs text-red-500 hover:underline flex items-center gap-1 disabled:opacity-50"
                      >
                        <XCircle size={13} /> {refundingId === p.id ? 'Refunding…' : 'Refund'}
                      </button>
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
