import { useEffect, useState } from 'react';
import { Save, CheckCircle } from 'lucide-react';
import api from '../../../lib/api';

const naira = (n: number) => `₦${Math.round(n).toLocaleString()}`;

export function InstalmentPlanCard() {
  const [plan, setPlan] = useState({ allowInstallments: true, firstInstallmentPercent: '50' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/settings/enrollment-rules')
      .then(({ data }) => setPlan({ allowInstallments: data.paymentPlan.allowInstallments, firstInstallmentPercent: String(data.paymentPlan.firstInstallmentPercent) }))
      .catch(() => setError('Could not load the instalment plan'));
  }, []);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const { data } = await api.patch('/settings/payment-plan', {
        allowInstallments: plan.allowInstallments,
        firstInstallmentPercent: Number(plan.firstInstallmentPercent),
      });
      setPlan({ allowInstallments: data.allowInstallments, firstInstallmentPercent: String(data.firstInstallmentPercent) });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to save the instalment plan');
    } finally {
      setSaving(false);
    }
  };

  const pct = Number(plan.firstInstallmentPercent) || 0;

  return (
    <div className="space-y-4 max-w-xl pt-8 border-t border-gray-100">
      <div>
        <h2 className="text-lg font-bold text-qore-text">Instalments</h2>
        <p className="text-sm text-gray-400 mt-1">Learners can pay part of the fee to enroll and the balance later from their Payments page.</p>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      <label className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
        <span>
          <span className="font-medium text-qore-text text-sm">Offer two instalments</span>
          <span className="block text-xs text-gray-400">When off, checkout and the pricing page only offer paying in full.</span>
        </span>
        <input
          type="checkbox"
          checked={plan.allowInstallments}
          onChange={(e) => setPlan({ ...plan, allowInstallments: e.target.checked })}
          className="w-5 h-5 accent-qore-medium"
        />
      </label>

      {plan.allowInstallments && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">First payment (% of the price)</label>
          <input
            type="number" min={10} max={90}
            value={plan.firstInstallmentPercent}
            onChange={(e) => setPlan({ ...plan, firstInstallmentPercent: e.target.value })}
            className="w-40 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
          />
          <p className="text-xs text-gray-400 mt-1">
            Between 10 and 90. For a {naira(150000)} track: {naira((150000 * pct) / 100)} now, {naira(150000 - (150000 * pct) / 100)} later.
            Existing balances aren't changed.
          </p>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        {saved && <span className="flex items-center gap-1.5 text-sm text-green-600"><CheckCircle size={16} /> Saved</span>}
        <button
          onClick={save}
          disabled={saving}
          className="bg-qore-medium hover:bg-qore-dark text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-60"
        >
          <Save size={18} /> {saving ? 'Saving…' : 'Save Instalments'}
        </button>
      </div>
    </div>
  );
}
