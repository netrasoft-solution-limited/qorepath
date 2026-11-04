import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SessionCalendarView } from '../../components/SessionCalendarView';
import api from '../../lib/api';
import { fetchMyPrograms, pickPrimaryProgram } from '../../lib/tutor';
import { TrackPicker } from '../../components/TrackPicker';

export function InstructorCalendar() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [programs, setPrograms] = useState<any[]>([]);
  const [programId, setProgramId] = useState('');

  const select = async (p: any) => {
    setProgramId(p.id);
    setLabel(`${p.track}${p.cohort?.name ? ` · ${p.cohort.name}` : ''}`);
    const { data } = await api.get(`/sessions/program/${p.id}`);
    setSessions(data);
  };

  // Starts on the track in the running cohort; tutors on several tracks can switch.
  useEffect(() => {
    fetchMyPrograms()
      .then(async (mine) => {
        setPrograms(mine);
        const current = pickPrimaryProgram(mine);
        if (current) await select(current);
      })
      .catch(() => setError('Failed to load sessions'))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="p-12 text-center text-gray-400">Loading calendar…</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-qore-text">Session Calendar</h1>
          <p className="text-gray-500">{label || 'Your program'} · {sessions.length} sessions scheduled</p>
        </div>
        <TrackPicker programs={programs} value={programId} onChange={(id) => select(programs.find((p) => p.id === id))} />
      </div>
      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
      <SessionCalendarView sessions={sessions} role="instructor" />
    </div>
  );
}
