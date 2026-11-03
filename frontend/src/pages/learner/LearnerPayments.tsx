import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import api from '../../lib/api';
import { PaymentModal } from '../../components/PaymentModal';

export function LearnerPayments() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingBalance, setPayingBalance] = useState<any | null>(null);

  const load = () =>
    api.get('/payments/my').then(({ data }) => setPayments(data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const total = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + parseFloat(p.amount), 0);
  const hasFailed = payments.some((p) => p.status === 'failed');

  const statusBadge: Record<string, string> = {
    paid: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    failed: 'bg-red-100 text-red-700',
    refunded: 'bg-gray-100 text-gray-600',
  };

  if (loading) return <div className="p-12 text-center text-gray-400">Loading payments…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-qore-text">Payments</h1>
          <p className="text-gray-500">Total paid: ₦{total.toLocaleString()}</p>
        </div>
        <button
          onClick={() => navigate('/learner/programs')}
          className="bg-qore-dark hover:bg-qore-medium text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 shrink-0"
        >
          Browse Programs <ArrowRight size={14} />
        </button>
      </div>

      {hasFailed && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            A payment didn't complete. You can retry it below, or start a fresh checkout from{' '}
            <button onClick={() => navigate('/learner/programs')} className="font-semibold underline">Programs</button>.
          </p>
        </div>
      )}

      {payments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
          No payment records yet.
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                  p.status === 'paid' ? 'bg-green-50 text-green-600'
                  : p.status === 'failed' ? 'bg-red-50 text-red-500'
                  : p.status === 'refunded' ? 'bg-gray-100 text-gray-500'
                  : 'bg-amber-50 text-amber-600'
                }`}>
                  {p.status === 'paid' ? <CheckCircle size={20} />
                    : p.status === 'failed' ? <AlertCircle size={20} />
                    : <Clock size={20} />}
                </div>
                <div>
                  <p className="font-semibold text-qore-text">₦{Number(p.amount).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">
                    {p.program?.track ?? p.cohort?.name ?? '—'} · {p.createdAt?.slice(0, 10)}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {p.method && <span className="text-xs text-gray-400 capitalize">{p.method}</span>}
                    {p.totalInstallments > 1 && (
                      <span className="text-[10px] font-semibold text-qore-medium bg-qore-light px-1.5 py-0.5 rounded">
                        Installment {p.installmentNumber} of {p.totalInstallments}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {p.status === 'pending' && (
                  <button
                    onClick={() => setPayingBalance(p)}
                    className="bg-qore-dark hover:bg-qore-medium text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-colors"
                  >
                    {p.totalInstallments > 1 ? 'Pay balance' : 'Pay now'}
                  </button>
                )}
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge[p.status] ?? ''}`}>
                  {p.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {payingBalance && (
          <PaymentModal
            payment={payingBalance}
            onClose={() => setPayingBalance(null)}
            onSuccess={() => { setPayingBalance(null); setLoading(true); load(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
