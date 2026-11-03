import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../../lib/api';
import { useConfirm, useToast } from '../../components/feedback';

const statusBadge: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  denied: 'bg-gray-100 text-gray-600',
};

export function AdminWithdrawals() {
  const confirm = useConfirm();
  const toast = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  const load = async () => {
    try {
      const { data } = await api.get('/withdrawals');
      setRequests(data);
      const a: Record<string, string> = {};
      data.forEach((r: any) => { a[r.id] = String(r.suggestedRefund ?? 0); });
      setAmounts(a);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const progressLabel = (r: any) =>
    !r.cohortWeek || r.cohortWeek === 0
      ? 'Not started'
      : `Week ${r.cohortWeek}${r.cohortTotalWeeks ? ` of ${r.cohortTotalWeeks}` : ''}`;

  const approve = async (r: any) => {
    const amount = Number(amounts[r.id] ?? r.suggestedRefund);
    const ok = await confirm({
      title: 'Approve withdrawal & refund?',
      message: amount > 0
        ? `This issues a Paystack refund of ₦${amount.toLocaleString()} to ${r.learner?.firstName ?? 'the learner'}.`
        : 'This approves the withdrawal with no refund.',
      confirmLabel: amount > 0 ? `Refund ₦${amount.toLocaleString()}` : 'Approve',
      variant: amount > 0 ? 'danger' : 'default',
    });
    if (!ok) return;
    setBusyId(r.id);
    try {
      await api.patch(`/withdrawals/${r.id}/resolve`, { decision: 'approved', amount });
      toast({ message: amount > 0 ? 'Refund issued.' : 'Withdrawal approved.', variant: 'success' });
      await load();
    } catch (e: any) {
      toast({ message: e.response?.data?.message || 'Could not process. Try again.', variant: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const deny = async (r: any) => {
    const ok = await confirm({
      title: 'Deny refund?',
      message: 'The withdrawal stands, but no refund will be issued.',
      confirmLabel: 'Deny refund',
      variant: 'danger',
    });
    if (!ok) return;
    setBusyId(r.id);
    try {
      await api.patch(`/withdrawals/${r.id}/resolve`, { decision: 'denied' });
      toast({ message: 'Refund denied.', variant: 'info' });
      await load();
    } catch (e: any) {
      toast({ message: e.response?.data?.message || 'Could not process. Try again.', variant: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const visible = requests.filter((r) => filter === 'all' || r.status === 'pending');
  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  if (loading) return <div className="p-12 text-center text-gray-400">Loading withdrawals…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-qore-text">Withdrawals & Refunds</h1>
          <p className="text-gray-500">{pendingCount} pending review</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'pending' | 'all')}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
        >
          <option value="pending">Pending</option>
          <option value="all">All</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {visible.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No withdrawals to show.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Learner</th>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Program</th>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Progress</th>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Paid</th>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Refund</th>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Status</th>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visible.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors align-top">
                  <td className="px-6 py-4">
                    <p className="font-medium text-qore-text">{r.learner?.firstName} {r.learner?.lastName}</p>
                    <p className="text-xs text-gray-400">{r.learner?.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.createdAt?.slice(0, 10)}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{r.program?.track ?? '—'}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1 text-gray-600">
                      <Clock size={13} className="text-gray-400" /> {progressLabel(r)}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-qore-text">₦{Number(r.amountPaid).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    {r.status === 'pending' ? (
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 text-xs">₦</span>
                          <input
                            value={amounts[r.id] ?? ''}
                            onChange={(e) => setAmounts((p) => ({ ...p, [r.id]: e.target.value.replace(/[^\d.]/g, '') }))}
                            className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">Suggested: ₦{Number(r.suggestedRefund).toLocaleString()}</p>
                      </div>
                    ) : (
                      <span className="text-gray-600">₦{Number(r.approvedRefund ?? 0).toLocaleString()}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusBadge[r.status] ?? ''}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {r.status === 'pending' && (
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => approve(r)}
                          disabled={busyId === r.id}
                          className="text-xs text-green-600 hover:underline flex items-center gap-1 disabled:opacity-50"
                        >
                          <CheckCircle size={13} /> Approve & refund
                        </button>
                        <button
                          onClick={() => deny(r)}
                          disabled={busyId === r.id}
                          className="text-xs text-red-500 hover:underline flex items-center gap-1 disabled:opacity-50"
                        >
                          <XCircle size={13} /> Deny refund
                        </button>
                      </div>
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

export default AdminWithdrawals;
