import React, { useEffect, useState } from 'react';
import { Search, Award, Plus } from 'lucide-react';
import api from '../../lib/api';

export function AdminCertificates() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ userId: '', cohortId: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [certRes, usersRes, cohortsRes] = await Promise.all([
        api.get('/certificates'),
        api.get('/users'),
        api.get('/cohorts'),
      ]);
      setCertificates(certRes.data);
      setUsers(usersRes.data);
      setCohorts(cohortsRes.data);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/certificates', { user: { id: form.userId }, cohort: { id: form.cohortId } });
      setShowForm(false);
      setForm({ userId: '', cohortId: '' });
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to issue certificate');
    } finally {
      setSaving(false);
    }
  };

  const filtered = certificates.filter((c) =>
    `${c.user?.firstName} ${c.user?.lastName} ${c.certificateNumber}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-qore-text">Certificates</h1>
          <p className="text-gray-500">{certificates.length} issued</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-qore-dark text-white px-4 py-2.5 rounded-xl hover:bg-qore-medium transition-colors text-sm font-medium"
        >
          <Plus size={16} /> Issue Certificate
        </button>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-qore-highlight">
          <h2 className="font-bold text-qore-text mb-4">Issue New Certificate</h2>
          <form onSubmit={handleIssue} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Learner</label>
              <select required value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
              >
                <option value="">Select learner…</option>
                {users.filter((u) => u.role === 'learner').map((u) => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName} — {u.email}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cohort</label>
              <select required value={form.cohortId} onChange={(e) => setForm({ ...form, cohortId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
              >
                <option value="">Select cohort…</option>
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={saving}
                className="bg-qore-dark text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-qore-medium transition-colors disabled:opacity-60"
              >
                {saving ? 'Issuing…' : 'Issue Certificate'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or certificate number…"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No certificates issued yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Certificate #</th>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Learner</th>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Cohort</th>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Issued</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 font-mono text-xs text-qore-medium font-medium">
                      <Award size={14} />
                      {c.certificateNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-qore-text">
                    {c.user?.firstName} {c.user?.lastName}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{c.cohort?.name ?? '—'}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{c.issuedDate?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
