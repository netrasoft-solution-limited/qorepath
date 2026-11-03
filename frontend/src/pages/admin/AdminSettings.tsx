import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, CheckCircle } from 'lucide-react';
import api from '../../lib/api';

export function AdminSettings() {
  const [activeTab, setActiveTab] = useState('tracks');
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [edits, setEdits] = useState<Record<string, { price: string; maxLearners: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Refund policy (Payment Rules tab)
  const [policy, setPolicy] = useState({ fullRefundBeforeStart: true, graceDays: 7, gracePercent: 50, afterPercent: 0 });
  const [policySaving, setPolicySaving] = useState(false);
  const [policySaved, setPolicySaved] = useState(false);

  useEffect(() => {
    api.get('/settings/refund-policy').then(({ data }) => setPolicy(data)).catch(() => {});
  }, []);

  const savePolicy = async () => {
    setPolicySaving(true);
    setError('');
    try {
      const { data } = await api.patch('/settings/refund-policy', {
        fullRefundBeforeStart: policy.fullRefundBeforeStart,
        graceDays: Number(policy.graceDays),
        gracePercent: Number(policy.gracePercent),
        afterPercent: Number(policy.afterPercent),
      });
      setPolicy(data);
      setPolicySaved(true);
      setTimeout(() => setPolicySaved(false), 3000);
    } catch {
      setError('Failed to save refund policy');
    } finally {
      setPolicySaving(false);
    }
  };

  const tabs = [
    { id: 'tracks', label: 'Program Pricing' },
    { id: 'cohorts', label: 'Cohort Rules' },
    { id: 'payments', label: 'Payment Rules' },
    { id: 'notifications', label: 'Notification Templates' },
  ];

  useEffect(() => {
    api.get('/cohorts')
      .then(({ data }) => {
        setCohorts(data);
        const initial: Record<string, { price: string; maxLearners: string }> = {};
        data.forEach((c: any) => {
          (c.programs ?? []).forEach((p: any) => {
            initial[p.id] = { price: String(p.price ?? ''), maxLearners: String(p.maxLearners ?? '') };
          });
        });
        setEdits(initial);
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const programs = cohorts.flatMap((c: any) => c.programs ?? []);
      await Promise.all(
        programs.map((p: any) =>
          api.patch(`/programs/${p.id}`, {
            price: parseFloat(edits[p.id]?.price || p.price),
            maxLearners: parseInt(edits[p.id]?.maxLearners || p.maxLearners),
          })
        )
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const setField = (id: string, field: 'price' | 'maxLearners', value: string) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-qore-text">Platform Settings</h1>
        <p className="text-gray-500">Configure pricing per program, payment rules, and more.</p>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
      {saved && (
        <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle size={15} /> Settings saved successfully.
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-qore-medium border-b-2 border-qore-medium'
                  : 'text-gray-500 hover:text-qore-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 md:p-8">
          {activeTab === 'tracks' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h2 className="text-lg font-bold text-qore-text mb-4">Program Pricing & Capacity</h2>
              <p className="text-sm text-gray-400">Pricing is set per program within each cohort.</p>

              {loading ? (
                <div className="py-12 text-center text-gray-400 text-sm">Loading…</div>
              ) : cohorts.flatMap((c: any) => c.programs ?? []).length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">No programs found. Create cohorts and add programs first.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                        <th className="pb-3 font-medium">Cohort</th>
                        <th className="pb-3 font-medium">Program / Track</th>
                        <th className="pb-3 font-medium">Instructor</th>
                        <th className="pb-3 font-medium">Price (₦)</th>
                        <th className="pb-3 font-medium">Max Learners</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cohorts.map((cohort: any) =>
                        (cohort.programs ?? []).map((prog: any) => (
                          <tr key={prog.id} className="border-b border-gray-50 last:border-0">
                            <td className="py-4 font-medium text-qore-text text-sm">{cohort.name}</td>
                            <td className="py-4 text-gray-700 text-sm">{prog.track}</td>
                            <td className="py-4 text-gray-500 text-sm">
                              {prog.instructor ? `${prog.instructor.firstName} ${prog.instructor.lastName}` : '—'}
                            </td>
                            <td className="py-4">
                              <input
                                type="number"
                                value={edits[prog.id]?.price ?? ''}
                                onChange={(e) => setField(prog.id, 'price', e.target.value)}
                                className="w-36 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
                              />
                            </td>
                            <td className="py-4">
                              <input
                                type="number"
                                value={edits[prog.id]?.maxLearners ?? ''}
                                onChange={(e) => setField(prog.id, 'maxLearners', e.target.value)}
                                className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving || loading}
                  className="bg-qore-medium hover:bg-qore-dark text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-60"
                >
                  <Save size={18} /> {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'payments' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-xl">
              <div>
                <h2 className="text-lg font-bold text-qore-text">Refund Policy</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Governs the suggested refund when a learner withdraws. Refunds are always reviewed by an
                  admin in <span className="font-medium text-qore-text">Withdrawals</span> before money moves.
                </p>
              </div>

              <label className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                <span>
                  <span className="font-medium text-qore-text text-sm">Full refund before the cohort starts</span>
                  <span className="block text-xs text-gray-400">100% back if they withdraw before day one.</span>
                </span>
                <input
                  type="checkbox"
                  checked={policy.fullRefundBeforeStart}
                  onChange={(e) => setPolicy({ ...policy, fullRefundBeforeStart: e.target.checked })}
                  className="w-5 h-5 accent-qore-medium"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Grace window (days)</label>
                  <input
                    type="number" min={0}
                    value={policy.graceDays}
                    onChange={(e) => setPolicy({ ...policy, graceDays: e.target.value as any })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Refund in grace (%)</label>
                  <input
                    type="number" min={0} max={100}
                    value={policy.gracePercent}
                    onChange={(e) => setPolicy({ ...policy, gracePercent: e.target.value as any })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Refund after grace (%)</label>
                  <input
                    type="number" min={0} max={100}
                    value={policy.afterPercent}
                    onChange={(e) => setPolicy({ ...policy, afterPercent: e.target.value as any })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-400">
                Example: before start → {policy.fullRefundBeforeStart ? '100' : policy.gracePercent}% · within {policy.graceDays} days → {policy.gracePercent}% · after → {policy.afterPercent}%.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                {policySaved && (
                  <span className="flex items-center gap-1.5 text-sm text-green-600">
                    <CheckCircle size={16} /> Saved
                  </span>
                )}
                <button
                  onClick={savePolicy}
                  disabled={policySaving}
                  className="bg-qore-medium hover:bg-qore-dark text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-60"
                >
                  <Save size={18} /> {policySaving ? 'Saving…' : 'Save Policy'}
                </button>
              </div>
            </motion.div>
          )}

          {activeTab !== 'tracks' && activeTab !== 'payments' && (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400">
              <Settings size={48} className="mb-4 text-gray-300" />
              <p>Settings panel for {tabs.find((t) => t.id === activeTab)?.label} will be added here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
