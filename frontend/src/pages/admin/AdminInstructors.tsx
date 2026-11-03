import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Mail, CheckCircle, X, Eye, EyeOff } from 'lucide-react';
import api from '../../lib/api';

type StaffRole = 'instructor' | 'assistant';

const ROLE_LABEL: Record<StaffRole, string> = {
  instructor: 'Instructor',
  assistant: 'Technical Assistant',
};

export function AdminInstructors() {
  const [users, setUsers] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<StaffRole>('instructor');
  const [showForm, setShowForm] = useState(false);
  const [formRole, setFormRole] = useState<StaffRole>('instructor');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '' });

  const load = async () => {
    try {
      const [usersRes, cohortsRes] = await Promise.all([api.get('/users'), api.get('/cohorts')]);
      setUsers(usersRes.data.filter((u: any) => u.role === 'instructor' || u.role === 'assistant'));
      setCohorts(cohortsRes.data);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/users', { ...form, role: formRole });
      setSaved(true);
      setShowForm(false);
      setForm({ firstName: '', lastName: '', email: '', password: '', phone: '' });
      setTimeout(() => setSaved(false), 3000);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create account');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await api.patch(`/users/${id}`, { isActive: !current });
      load();
    } catch {
      setError('Failed to update');
    }
  };

  const getAssignedCohorts = (userId: string, role: StaffRole) => {
    if (role === 'instructor') {
      const assigned = cohorts.filter((c) => c.instructor?.id === userId);
      return assigned.length ? assigned.map((c) => c.name).join(', ') : '—';
    } else {
      const assigned = cohorts.filter((c) => c.assistants?.some((a: any) => a.id === userId));
      return assigned.length ? assigned.map((c) => c.name).join(', ') : '—';
    }
  };

  const staff = users.filter((u) => u.role === tab);

  if (loading) return <div className="p-12 text-center text-gray-400">Loading…</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-qore-text">Teaching Staff</h1>
          <p className="text-gray-500">Manage instructors and technical assistants.</p>
        </div>
        <button
          onClick={() => { setFormRole(tab); setShowForm(true); }}
          className="bg-qore-medium hover:bg-qore-dark text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 text-sm"
        >
          <Plus size={16} /> Add {ROLE_LABEL[tab]}
        </button>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
      {saved && (
        <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle size={15} /> Account created successfully.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['instructor', 'assistant'] as StaffRole[]).map((r) => (
          <button key={r}
            onClick={() => setTab(r)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === r ? 'bg-white text-qore-text shadow-sm' : 'text-gray-500 hover:text-qore-text'}`}
          >
            {ROLE_LABEL[r]}s
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${tab === r ? 'bg-qore-light text-qore-medium' : 'bg-gray-200 text-gray-400'}`}>
              {users.filter((u) => u.role === r).length}
            </span>
          </button>
        ))}
      </div>

      {/* Create form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-qore-highlight shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-qore-text">New {ROLE_LABEL[formRole]} Account</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">First Name</label>
              <input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Last Name</label>
              <input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Email</label>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Temporary Password</label>
              <div className="relative">
                <input required minLength={8} type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 8 characters"
                  className="w-full border border-gray-200 rounded-xl px-4 pr-12 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="md:col-span-2 flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="border border-gray-200 text-gray-500 px-5 py-2.5 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving}
                className="bg-qore-medium hover:bg-qore-dark text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60">
                {saving ? 'Creating…' : `Create ${ROLE_LABEL[formRole]}`}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Staff table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {staff.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="font-medium mb-1">No {ROLE_LABEL[tab].toLowerCase()}s yet.</p>
            <p className="text-sm">Click "Add {ROLE_LABEL[tab]}" to create the first account.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr className="text-xs text-gray-500 uppercase tracking-wider">
                  <th className="p-4 font-medium">{ROLE_LABEL[tab]}</th>
                  <th className="p-4 font-medium">Assigned Cohort(s)</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {staff.map((person, idx) => (
                  <motion.tr key={person.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${tab === 'instructor' ? 'bg-qore-light text-qore-medium' : 'bg-purple-50 text-purple-600'}`}>
                          {person.firstName?.charAt(0)}{person.lastName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-qore-text">{person.firstName} {person.lastName}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Mail size={10} /> {person.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600 text-sm">{getAssignedCohorts(person.id, tab)}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${person.isActive ? 'bg-qore-light text-qore-medium' : 'bg-gray-100 text-gray-500'}`}>
                        {person.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => toggleActive(person.id, person.isActive)}
                        className="text-xs border border-gray-200 text-gray-500 hover:border-qore-medium hover:text-qore-medium px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {person.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
