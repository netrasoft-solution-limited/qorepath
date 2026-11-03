import React, { useEffect, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { getMyProgram } from '../../lib/tutor';

export function InstructorRoster() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [cohortName, setCohortName] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const mine = await getMyProgram();
        const cId = mine?.cohort?.id;
        if (mine && cId) {
          setCohortName(`${mine.track}${mine.cohort?.name ? ` · ${mine.cohort.name}` : ''}`);
          const { data } = await api.get(`/enrollments/cohort/${cId}`);
          setEnrollments(
            data.filter((e: any) =>
              e.program?.id === mine.id && (e.status === 'approved' || e.status === 'withdrawn'),
            ),
          );
        }
      } catch {
        // silently fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const filtered = enrollments.filter((e) =>
    `${e.learner?.firstName} ${e.learner?.lastName} ${e.learner?.email}`.toLowerCase().includes(search.toLowerCase())
  );
  const activeCount = enrollments.filter((e) => e.status === 'approved').length;

  if (loading) return <div className="p-12 text-center text-gray-400">Loading roster…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-qore-text">Learner Roster</h1>
          <p className="text-gray-500">{cohortName || '—'} · {activeCount} active learners</p>
        </div>
        <Users size={24} className="text-qore-medium" />
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search learners…"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No learners found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Name</th>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Email</th>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Phone</th>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Enrolled</th>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((e) => {
                const withdrawn = e.status === 'withdrawn';
                return (
                <tr key={e.id} className={`hover:bg-gray-50 transition-colors ${withdrawn ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold ${withdrawn ? 'bg-gray-400' : 'bg-qore-medium'}`}>
                        {e.learner?.firstName?.charAt(0)}
                      </div>
                      <span className="font-medium text-qore-text">{e.learner?.firstName} {e.learner?.lastName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{e.learner?.email}</td>
                  <td className="px-6 py-4 text-gray-500">{e.learner?.phone ?? '—'}</td>
                  <td className="px-6 py-4 text-gray-400 text-xs">{e.enrolledAt?.slice(0, 10)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${withdrawn ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                      {withdrawn ? 'Withdrawn' : 'Active'}
                    </span>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
