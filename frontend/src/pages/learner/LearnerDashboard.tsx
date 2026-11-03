import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, Calendar, CheckCircle, TrendingUp, Bell, BookOpen, CreditCard, Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { PaymentModal } from '../../components/PaymentModal';

// ── LearnerDashboard ────────────────────────────────────────────────────────
export function LearnerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments]   = useState<any[]>([]);
  const [sessions, setSessions]         = useState<any[]>([]);
  const [assignments, setAssignments]   = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [programs, setPrograms]         = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);

  const [showProgramPicker, setShowProgramPicker] = useState(false);
  const [selectedProgram, setSelectedProgram]     = useState<any | null>(null);
  const [payingFor, setPayingFor]                 = useState<any | null>(null);

  const load = async () => {
    try {
      const [eRes, aRes, cRes] = await Promise.all([
        api.get('/enrollments/my'),
        api.get('/announcements'),
        api.get('/cohorts'),
      ]);
      setEnrollments(eRes.data);
      setAnnouncements(aRes.data.slice(0, 3));

      const openCohorts = cRes.data.filter((c: any) => c.status === 'active' || c.status === 'upcoming');
      const allPrograms: any[] = [];
      openCohorts.forEach((c: any) => {
        (c.programs ?? []).forEach((p: any) => allPrograms.push({ ...p, cohortName: c.name }));
      });
      setPrograms(allPrograms);

      const approved = eRes.data.find((e: any) => e.status === 'approved');
      if (approved?.program?.id) {
        const [sRes, asRes] = await Promise.all([
          api.get(`/sessions/program/${approved.program.id}`),
          api.get(`/assignments/cohort/${approved.program.cohort?.id ?? ''}`),
        ]);
        setSessions(sRes.data);
        setAssignments(asRes.data);
      }
    } catch {
      // silently fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const activeEnrollment  = enrollments.find((e) => e.status === 'approved');
  const pendingEnrollment = enrollments.find((e) => e.status === 'pending');
  const upcomingSession   = sessions.find((s) => !s.isCompleted);

  const stats = [
    { label: 'Program',       value: activeEnrollment?.program?.track ?? '—', icon: Calendar,   color: 'text-blue-600',    bg: 'bg-blue-50' },
    { label: 'Assignments',   value: String(assignments.length),               icon: CheckCircle, color: 'text-qore-medium', bg: 'bg-qore-light' },
    { label: 'Announcements', value: String(announcements.length),             icon: Bell,        color: 'text-amber-600',   bg: 'bg-amber-50' },
    { label: 'Sessions',      value: String(sessions.length),                  icon: TrendingUp,  color: 'text-purple-600',  bg: 'bg-purple-50' },
  ];

  if (loading) return <div className="p-12 text-center text-gray-400">Loading your dashboard…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-qore-text">
          Welcome back, {(user as any)?.firstName ?? 'Learner'} 👋
        </h1>
        <p className="text-gray-500">Here's what's happening with your learning today.</p>
      </div>

      {/* Pending enrollment — awaiting admin approval */}
      {!activeEnrollment && pendingEnrollment && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3"
        >
          <Clock size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">Enrollment pending approval</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Your enrollment in <strong>{pendingEnrollment.program?.track}</strong>
              {pendingEnrollment.program?.cohort?.name ? ` (${pendingEnrollment.program.cohort.name})` : ''} is
              awaiting review. You'll get full access once it's approved.
            </p>
          </div>
        </motion.div>
      )}

      {/* Not enrolled — program picker + payment CTA */}
      {!activeEnrollment && !pendingEnrollment && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-qore-highlight rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 bg-qore-light rounded-xl flex items-center justify-center text-qore-dark shrink-0">
              <BookOpen size={20} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-qore-text">You're not enrolled in any program yet</p>
              <p className="text-sm text-gray-500 mt-1">Select a program below and complete payment to get instant access.</p>
              <button
                onClick={() => setShowProgramPicker(!showProgramPicker)}
                className="mt-3 bg-qore-dark text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-qore-medium transition-colors"
              >
                {showProgramPicker ? 'Cancel' : 'Browse Programs'}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showProgramPicker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-5 pt-5 border-t border-gray-100">
                  {programs.length === 0 ? (
                    <p className="text-sm text-gray-400">No programs are currently open for enrollment.</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Available Programs</p>
                      {programs.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setSelectedProgram(selectedProgram?.id === p.id ? null : p)}
                          className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                            selectedProgram?.id === p.id
                              ? 'border-qore-medium bg-qore-light/40 shadow-sm'
                              : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{p.track}</p>
                              <p className="text-xs text-gray-400">{p.cohortName}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900 text-sm">₦{Number(p.price).toLocaleString()}</p>
                              <p className="text-[10px] text-gray-400">{p.maxLearners} seats</p>
                            </div>
                          </div>
                        </button>
                      ))}

                      {selectedProgram && (
                        <motion.button
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => { setPayingFor(selectedProgram); setShowProgramPicker(false); }}
                          className="w-full mt-2 bg-[#1B4332] hover:bg-[#2D6A4F] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                        >
                          <CreditCard size={15} />
                          Pay ₦{Number(selectedProgram.price).toLocaleString()} &amp; Enroll
                        </motion.button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Next session card */}
      {upcomingSession && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-qore-dark text-white rounded-2xl p-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
              <Video size={24} />
            </div>
            <div>
              <p className="text-sm text-white/70">Next Session</p>
              <p className="font-bold text-lg">{upcomingSession.title}</p>
              <p className="text-sm text-qore-highlight">
                {new Date(upcomingSession.scheduledAt).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/classroom/${upcomingSession.id}`)}
            className="bg-white text-qore-dark px-4 py-2 rounded-xl font-semibold text-sm hover:bg-qore-light transition-colors flex items-center gap-2"
          >
            <Video size={15} /> Join Classroom
          </button>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon size={20} />
            </div>
            <p className="text-lg font-bold text-qore-text truncate">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-qore-text mb-4">Announcements</h2>
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="p-3 bg-qore-light/40 rounded-xl">
                <p className="font-medium text-sm text-qore-text">{a.title}</p>
                <p className="text-xs text-gray-500 mt-1">{a.body?.slice(0, 120)}{a.body?.length > 120 ? '…' : ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment modal */}
      <AnimatePresence>
        {payingFor && (
          <PaymentModal
            program={payingFor}
            onClose={() => setPayingFor(null)}
            onSuccess={() => { setPayingFor(null); setSelectedProgram(null); load(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
