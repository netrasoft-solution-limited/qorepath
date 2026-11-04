import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { EditableAvatar, useProfilePhoto } from '../../components/ProfilePhoto';
import { pickCurrentEnrollment } from '../../lib/enrollments';

export function LearnerProfile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [enrollment, setEnrollment] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setForm({
      firstName: (user as any).firstName ?? '',
      lastName: (user as any).lastName ?? '',
      phone: (user as any).phone ?? '',
    });
    api.get('/enrollments/my').then(({ data }) => {
      setEnrollment(pickCurrentEnrollment(data));
    }).catch(() => {});
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await api.patch(`/users/${user?.id}`, form);
      // Re-fetch the canonical user so the portal header (and context) update immediately.
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const photo = useProfilePhoto();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-qore-text">Profile Settings</h1>
        <p className="text-gray-500">Manage your personal information.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8"
      >
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
          <div className="flex flex-col items-center gap-1.5">
            <EditableAvatar user={user} className="w-20 h-20 text-2xl" />
            {(user as any)?.avatarUrl && (
              <button type="button" onClick={photo.remove} disabled={photo.busy} className="text-xs text-gray-400 hover:text-red-600">Remove photo</button>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-qore-text">{form.firstName} {form.lastName}</h2>
            <p className="text-gray-500 text-sm">{(user as any)?.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">Click your photo to change it (JPG, PNG or WebP, up to 2 MB).</p>
            {enrollment && (
              <p className="text-xs text-qore-medium mt-1">
                {enrollment.program?.track} · {enrollment.program?.cohort?.name}
              </p>
            )}
          </div>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-qore-text mb-1.5">First Name</label>
              <input
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-qore-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-qore-text mb-1.5">Last Name</label>
              <input
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-qore-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1.5">Email <span className="text-xs">(read-only)</span></label>
              <input
                type="email"
                value={(user as any)?.email ?? ''}
                disabled
                className="w-full border border-gray-100 bg-gray-50 text-gray-500 rounded-xl px-4 py-3 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-qore-text mb-1.5">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-qore-medium"
              />
            </div>
          </div>

          {enrollment && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-5 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1.5">Track</label>
                <input value={enrollment.program?.track ?? '—'} disabled
                  className="w-full border border-gray-100 bg-gray-50 text-gray-500 rounded-xl px-4 py-3 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1.5">Enrolled Since</label>
                <input value={enrollment.enrolledAt?.slice(0, 10) ?? '—'} disabled
                  className="w-full border border-gray-100 bg-gray-50 text-gray-500 rounded-xl px-4 py-3 cursor-not-allowed"
                />
              </div>
            </div>
          )}

          <div className="pt-4 flex items-center justify-end gap-3">
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-green-600">
                <CheckCircle size={16} /> Saved
              </span>
            )}
            <button
              type="submit"
              disabled={saving}
              className="bg-qore-medium hover:bg-qore-dark text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              <Save size={17} />
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
