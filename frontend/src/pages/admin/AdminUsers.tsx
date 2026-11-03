import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, UserCheck, UserX, Plus, X,
  ChevronDown, Mail, Phone, CheckCircle, Info, Settings2,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  ROLE_PERMISSION_DEFS, ROLE_DEFAULT_PERMISSIONS, Permission,
} from '../../lib/permissions';

const ROLES = ['learner', 'instructor', 'assistant', 'admin'];

const ROLE_META: Record<string, { label: string; color: string; desc: string }> = {
  learner:    { label: 'Learner',    color: 'bg-green-100 text-green-700',   desc: 'Can enroll in programs, attend sessions, submit assignments' },
  instructor: { label: 'Instructor', color: 'bg-blue-100 text-blue-700',    desc: 'Can manage sessions, materials, attendance, and recommend graduation' },
  assistant:  { label: 'TA',         color: 'bg-indigo-100 text-indigo-700', desc: 'Same as instructor but scoped to assigned programs' },
  admin:      { label: 'Admin',      color: 'bg-purple-100 text-purple-700', desc: 'Full platform access — cohorts, users, payments, reports' },
};

const EMPTY_FORM = { firstName: '', lastName: '', email: '', password: '', phone: '', role: 'learner' };

export function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [editingRole, setEditingRole] = useState<string | null>(null);

  // Permissions modal state
  const [permUser, setPermUser] = useState<any | null>(null);
  const [permSet, setPermSet] = useState<Set<string>>(new Set());
  const [savingPerms, setSavingPerms] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const flash = (msg: string) => { setSaved(msg); setTimeout(() => setSaved(''), 2500); };

  // ── Create user ────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      await api.post('/users', form);
      setShowCreate(false);
      setForm({ ...EMPTY_FORM });
      flash('User created successfully');
      load();
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  // ── Change role ────────────────────────────────────────────────────────
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const defaultPerms = ROLE_DEFAULT_PERMISSIONS[newRole] ?? [];
      await api.patch(`/users/${userId}`, { role: newRole, permissions: defaultPerms });
      setEditingRole(null);
      flash('Role updated');
      load();
    } catch {
      setError('Failed to update role');
    }
  };

  // ── Toggle active ──────────────────────────────────────────────────────
  const toggleActive = async (userId: string, current: boolean) => {
    try {
      await api.patch(`/users/${userId}`, { isActive: !current });
      flash(current ? 'User suspended' : 'User activated');
      load();
    } catch {
      setError('Failed to update user');
    }
  };

  // ── Open permissions modal ─────────────────────────────────────────────
  const openPerms = (u: any) => {
    const existing: string[] = u.permissions ?? ROLE_DEFAULT_PERMISSIONS[u.role] ?? [];
    setPermSet(new Set(existing));
    setPermUser(u);
  };

  const togglePerm = (key: string) => {
    setPermSet((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const savePerms = async () => {
    if (!permUser) return;
    setSavingPerms(true);
    try {
      await api.patch(`/users/${permUser.id}`, { permissions: Array.from(permSet) });
      flash('Permissions saved');
      setPermUser(null);
      load();
    } catch {
      setError('Failed to save permissions');
    } finally {
      setSavingPerms(false);
    }
  };

  // ── Filtering ──────────────────────────────────────────────────────────
  const filtered = users.filter((u) => {
    const matchSearch = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const counts = ROLES.reduce((acc, r) => {
    acc[r] = users.filter((u) => u.role === r).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-qore-text">User Management</h1>
          <p className="text-gray-500">{users.length} total accounts · manage roles and access</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-qore-medium hover:bg-qore-dark text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
      {saved && (
        <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle size={15} /> {saved}
        </div>
      )}

      {/* Record policy notice */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
        <Info size={16} className="mt-0.5 shrink-0" />
        <p>Accounts are never deleted — they are <strong>suspended</strong> instead. This preserves enrollment, payment, attendance, and graduation records for audit purposes.</p>
      </div>

      {/* Role stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(roleFilter === r ? 'all' : r)}
            className={`bg-white border rounded-2xl p-4 text-left transition-all hover:shadow-md ${
              roleFilter === r ? 'border-qore-medium shadow-sm' : 'border-gray-100'
            }`}
          >
            <p className="text-2xl font-extrabold text-qore-text">{counts[r] ?? 0}</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ROLE_META[r].color}`}>
              {ROLE_META[r].label}s
            </span>
          </button>
        ))}
      </div>

      {/* Search + role filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
        >
          <option value="all">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
        </select>
      </div>

      {/* Create user modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.form
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleCreate}
              className="bg-white rounded-2xl shadow-xl p-7 w-full max-w-lg space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-lg">Create New User</h3>
                <button type="button" onClick={() => setShowCreate(false)}>
                  <X size={18} className="text-gray-400" />
                </button>
              </div>

              {createError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{createError}</p>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">First Name</label>
                  <input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Last Name</label>
                  <input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Email</label>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Password</label>
                  <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Phone (optional)</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium" />
                </div>
              </div>

              {/* Role picker */}
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-2">Role & Access Level</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setForm({ ...form, role: r })}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        form.role === r
                          ? 'border-qore-medium bg-qore-light/50 shadow-sm'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ROLE_META[r].color}`}>
                        {ROLE_META[r].label}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{ROLE_META[r].desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 border border-gray-200 text-gray-500 py-2.5 rounded-xl text-sm hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 bg-qore-medium hover:bg-qore-dark text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60">
                  {creating ? 'Creating…' : 'Create User'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permissions modal */}
      <AnimatePresence>
        {permUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setPermUser(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl p-7 w-full max-w-md space-y-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    {permUser.firstName} {permUser.lastName}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <span className={`font-semibold px-2 py-0.5 rounded-full ${ROLE_META[permUser.role]?.color}`}>
                      {ROLE_META[permUser.role]?.label}
                    </span>
                    {' '}· customize which sections this user can see
                  </p>
                </div>
                <button onClick={() => setPermUser(null)}>
                  <X size={18} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {(ROLE_PERMISSION_DEFS[permUser.role] ?? []).map((perm: Permission) => (
                  <label
                    key={perm.key}
                    className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-qore-medium/40 hover:bg-qore-light/20 cursor-pointer transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={permSet.has(perm.key)}
                      onChange={() => togglePerm(perm.key)}
                      className="mt-0.5 accent-qore-medium"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{perm.label}</p>
                      <p className="text-xs text-gray-400">{perm.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setPermSet(new Set(ROLE_DEFAULT_PERMISSIONS[permUser.role] ?? []))}
                  className="text-xs text-qore-medium hover:underline"
                >
                  Reset to defaults
                </button>
                <div className="flex-1" />
                <button onClick={() => setPermUser(null)}
                  className="border border-gray-200 text-gray-500 px-4 py-2 rounded-xl text-sm hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={savePerms} disabled={savingPerms}
                  className="bg-qore-medium hover:bg-qore-dark text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-60">
                  {savingPerms ? 'Saving…' : 'Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No users found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 font-medium text-gray-500">User</th>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Contact</th>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Role</th>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Status</th>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                  {/* User */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-qore-medium flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-qore-text">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-gray-400">Joined {new Date(u.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-6 py-4">
                    <p className="flex items-center gap-1.5 text-gray-600 text-xs"><Mail size={11} /> {u.email}</p>
                    {u.phone && <p className="flex items-center gap-1.5 text-gray-400 text-xs mt-0.5"><Phone size={11} /> {u.phone}</p>}
                  </td>

                  {/* Role — inline dropdown */}
                  <td className="px-6 py-4">
                    {editingRole === u.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          defaultValue={u.role}
                          autoFocus
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          onBlur={() => setEditingRole(null)}
                          className="border border-qore-medium rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-qore-medium"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{ROLE_META[r].label}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <button
                        onClick={() => u.id !== (me as any)?.id && setEditingRole(u.id)}
                        disabled={u.id === (me as any)?.id}
                        title={u.id === (me as any)?.id ? "Can't change your own role" : 'Click to change role'}
                        className="flex items-center gap-1.5 group disabled:cursor-default"
                      >
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_META[u.role]?.color ?? 'bg-gray-100 text-gray-600'}`}>
                          {ROLE_META[u.role]?.label ?? u.role}
                        </span>
                        {u.id !== (me as any)?.id && (
                          <ChevronDown size={12} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                        )}
                      </button>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {u.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openPerms(u)}
                        title="Edit permissions"
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-qore-medium transition-colors"
                      >
                        <Settings2 size={16} />
                      </button>
                      <button
                        onClick={() => toggleActive(u.id, u.isActive)}
                        disabled={u.id === (me as any)?.id}
                        title={u.isActive ? 'Suspend account' : 'Reactivate account'}
                        className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-default ${
                          u.isActive
                            ? 'hover:bg-red-50 text-red-400 hover:text-red-600'
                            : 'hover:bg-green-50 text-green-500'
                        }`}
                      >
                        {u.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Role reference */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Role Permissions Reference</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ROLES.map((r) => (
            <div key={r} className="space-y-1.5">
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${ROLE_META[r].color}`}>
                {ROLE_META[r].label}
              </span>
              <p className="text-xs text-gray-400 leading-relaxed">{ROLE_META[r].desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
