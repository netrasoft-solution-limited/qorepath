import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, CheckCircle } from 'lucide-react';
import api from '../../../lib/api';

const errMsg = (e: any, fallback: string) => {
  const m = e?.response?.data?.message;
  return Array.isArray(m) ? m.join(', ') : m || fallback;
};

export function CohortRulesTab() {
  const [rules, setRules] = useState({ defaultMaxLearners: '30', oneProgramAtATime: true, lateEnrollmentDays: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const show = (r: any) => setRules({
    defaultMaxLearners: String(r.defaultMaxLearners),
    oneProgramAtATime: r.oneProgramAtATime,
    lateEnrollmentDays: r.lateEnrollmentDays === null ? '' : String(r.lateEnrollmentDays),
  });

  useEffect(() => {
    api.get('/settings/enrollment-rules').then(({ data }) => show(data.cohortRules)).catch(() => setError('Could not load cohort rules'));
  }, []);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const { data } = await api.patch('/settings/cohort-rules', {
        defaultMaxLearners: Number(rules.defaultMaxLearners),
        oneProgramAtATime: rules.oneProgramAtATime,
        lateEnrollmentDays: rules.lateEnrollmentDays === '' ? null : Number(rules.lateEnrollmentDays),
      });
      show(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(errMsg(e, 'Failed to save cohort rules'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-lg font-bold text-qore-text">Cohort Rules</h2>
        <p className="text-sm text-gray-400 mt-1">
          Apply to every cohort. Admins can still enroll a learner by hand from <span className="font-medium text-qore-text">Enrollments</span> when you need an exception.
        </p>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Default seats per track</label>
        <input
          type="number" min={1} max={1000}
          value={rules.defaultMaxLearners}
          onChange={(e) => setRules({ ...rules, defaultMaxLearners: e.target.value })}
          className="w-40 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
        />
        <p className="text-xs text-gray-400 mt-1">Used when a new track is created without a seat limit. Existing tracks keep theirs (change them under Program Pricing).</p>
      </div>

      <label className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
        <span>
          <span className="font-medium text-qore-text text-sm">One program at a time</span>
          <span className="block text-xs text-gray-400">A learner must finish their current program before paying for another.</span>
        </span>
        <input
          type="checkbox"
          checked={rules.oneProgramAtATime}
          onChange={(e) => setRules({ ...rules, oneProgramAtATime: e.target.checked })}
          className="w-5 h-5 accent-qore-medium"
        />
      </label>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Late enrollment (days after the cohort starts)</label>
        <input
          type="number" min={0} max={365}
          value={rules.lateEnrollmentDays}
          onChange={(e) => setRules({ ...rules, lateEnrollmentDays: e.target.value })}
          placeholder="No limit"
          className="w-40 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
        />
        <p className="text-xs text-gray-400 mt-1">
          {rules.lateEnrollmentDays === ''
            ? 'Leave blank to let learners join until the cohort ends.'
            : Number(rules.lateEnrollmentDays) === 0
            ? 'Learners can join up to the day the cohort starts.'
            : `Learners can join up to ${rules.lateEnrollmentDays} day${rules.lateEnrollmentDays === '1' ? '' : 's'} after the cohort starts.`}{' '}
          Finished cohorts are always closed.
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        {saved && <span className="flex items-center gap-1.5 text-sm text-green-600"><CheckCircle size={16} /> Saved</span>}
        <button
          onClick={save}
          disabled={saving || !rules.defaultMaxLearners}
          className="bg-qore-medium hover:bg-qore-dark text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-60"
        >
          <Save size={18} /> {saving ? 'Saving…' : 'Save Rules'}
        </button>
      </div>
    </motion.div>
  );
}
