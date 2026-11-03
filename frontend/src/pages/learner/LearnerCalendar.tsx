import React, { useEffect, useState } from 'react';
import { SessionCalendarView } from '../../components/SessionCalendarView';
import api from '../../lib/api';
import { pickCurrentEnrollment } from '../../lib/enrollments';

export function LearnerCalendar() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/enrollments/my')
      .then(({ data }) => {
        const active = pickCurrentEnrollment(data);
        if (!active?.program?.id) return;
        setLabel(`${active.program.track ?? ''}${active.program.cohort?.name ? ` · ${active.program.cohort.name}` : ''}`);
        return api.get(`/sessions/program/${active.program.id}`);
      })
      .then((res) => { if (res) setSessions(res.data); })
      .catch(() => setError('Failed to load sessions'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-12 text-center text-gray-400">Loading calendar…</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-qore-text">Session Calendar</h1>
        <p className="text-gray-500">{label || 'Your program'} · {sessions.length} sessions scheduled</p>
      </div>
      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
      <SessionCalendarView sessions={sessions} role="learner" />
    </div>
  );
}
