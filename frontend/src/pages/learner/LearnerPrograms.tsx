import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BookOpen, Users, Clock, CalendarDays, CheckCircle, Lock, Info, GraduationCap,
} from 'lucide-react';
import api from '../../lib/api';
import { reconcilePayments } from '../../lib/payments';
import { PaymentModal } from '../../components/PaymentModal';
import { useConfirm, useToast } from '../../components/feedback';

const cohortBadge: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  upcoming: 'bg-blue-100 text-blue-700',
};

const ONGOING = ['active', 'upcoming'];

export function LearnerPrograms() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingFor, setPayingFor] = useState<any | null>(null);

  const load = async () => {
    try {
      await reconcilePayments();
      const [cRes, eRes] = await Promise.all([
        api.get('/cohorts'),
        api.get('/enrollments/my'),
      ]);
      setCohorts(cRes.data.filter((c: any) => ONGOING.includes(c.status)));
      setEnrollments(eRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Deep link from a public track page: /learner/programs?enroll=<programId> opens checkout.
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const wanted = searchParams.get('enroll');
    if (loading || !wanted) return;
    setSearchParams({}, { replace: true });
    const mine = enrollments.find((e) => e.program?.id === wanted);
    const busy = enrollments.some((e) => e.status === 'approved' && ONGOING.includes(e.program?.cohort?.status));
    if (mine?.status === 'approved') { toast({ message: "You're already enrolled in this program.", variant: 'info' }); return; }
    if (busy) { toast({ message: 'Finish your current program before enrolling in another.', variant: 'info' }); return; }
    for (const c of cohorts) {
      const prog = (c.programs ?? []).find((p: any) => p.id === wanted);
      if (prog) { setPayingFor({ ...prog, cohortName: c.name }); return; }
    }
    toast({ message: 'That cohort is no longer open for enrollment.', variant: 'info' });
  }, [loading]);

  // Per-program enrollment for this learner (status + id for withdrawal).
  const enrollmentByProgram: Record<string, any> = {};
  enrollments.forEach((e) => {
    if (e.program?.id) enrollmentByProgram[e.program.id] = e;
  });

  const handleWithdraw = async (enrollmentId: string, track: string) => {
    const ok = await confirm({
      title: `Withdraw from ${track}?`,
      message: "You'll lose access to this program. Any refund is handled by an admin.",
      confirmLabel: 'Withdraw',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.post('/withdrawals', { enrollmentId, reason: 'Withdrawn by learner' });
      await load();
      toast({ message: 'Withdrawal submitted. Any refund will be reviewed per policy.', variant: 'success' });
    } catch {
      toast({ message: 'Could not withdraw. Please try again.', variant: 'error' });
    }
  };

  // A learner may hold only one active program at a time. "Ongoing" = approved
  // enrollment whose cohort hasn't finished yet.
  const ongoing = enrollments.find(
    (e) => e.status === 'approved' && ONGOING.includes(e.program?.cohort?.status),
  );

  if (loading) return <div className="p-12 text-center text-gray-400">Loading programs…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-qore-text">Programs</h1>
        <p className="text-gray-500">Browse open cohorts and enroll in a track.</p>
      </div>

      {/* One-active-program notice */}
      {ongoing && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
          <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            You're currently enrolled in <strong>{ongoing.program?.track}</strong> ({ongoing.program?.cohort?.name}).
            You can enroll in another program once your current one completes.
          </p>
        </div>
      )}

      {cohorts.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
          No open cohorts right now. Check back soon.
        </div>
      )}

      {cohorts.map((cohort) => (
        <div key={cohort.id} className="space-y-3">
          {/* Cohort heading */}
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-qore-text">{cohort.name}</h2>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${cohortBadge[cohort.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {cohort.status === 'upcoming' ? 'Enrollment Open' : cohort.status}
            </span>
            {(cohort.startDate || cohort.endDate) && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <CalendarDays size={12} />
                {cohort.startDate?.slice(0, 10)} → {cohort.endDate?.slice(0, 10)}
              </span>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(cohort.programs ?? []).map((prog: any, i: number) => {
              const myEnrollment = enrollmentByProgram[prog.id];
              const myStatus = myEnrollment?.status;
              const isEnrolled = myStatus === 'approved';
              const isPending = myStatus === 'pending';
              const price = Number(prog.price);
              const instructor = prog.instructor
                ? `${prog.instructor.firstName ?? ''} ${prog.instructor.lastName ?? ''}`.trim()
                : 'TBA';

              return (
                <motion.div
                  key={prog.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-10 h-10 bg-qore-light rounded-xl flex items-center justify-center text-qore-dark shrink-0">
                      <BookOpen size={18} />
                    </div>
                    {isEnrolled && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                        <CheckCircle size={12} /> Enrolled
                      </span>
                    )}
                    {isPending && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        Pending approval
                      </span>
                    )}
                  </div>

                  <p className="font-bold text-gray-900 mt-3">{prog.track}</p>
                  {prog.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{prog.description}</p>
                  )}

                  <div className="mt-3 space-y-1.5 text-xs text-gray-500">
                    <p className="flex items-center gap-1.5"><GraduationCap size={13} /> {instructor}</p>
                    <p className="flex items-center gap-1.5"><Users size={13} /> {prog.maxLearners} seats</p>
                    {prog.schedule && <p className="flex items-center gap-1.5"><Clock size={13} /> {prog.schedule}</p>}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                    <span className="text-lg font-extrabold text-gray-900">₦{price.toLocaleString()}</span>

                    {isEnrolled ? (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleWithdraw(myEnrollment.id, prog.track)}
                          className="text-xs font-medium text-red-500 hover:underline"
                        >
                          Withdraw
                        </button>
                        <button
                          onClick={() => navigate('/learner/dashboard')}
                          className="text-sm font-semibold text-qore-medium hover:underline"
                        >
                          Go to dashboard →
                        </button>
                      </div>
                    ) : isPending ? (
                      <span className="text-xs text-gray-400">Awaiting review</span>
                    ) : ongoing ? (
                      <button
                        disabled
                        title="Finish your current program first"
                        className="bg-gray-100 text-gray-400 px-3 py-2 rounded-xl text-sm font-medium cursor-not-allowed flex items-center gap-1.5"
                      >
                        <Lock size={13} /> Locked
                      </button>
                    ) : (
                      <button
                        onClick={() => setPayingFor({ ...prog, cohortName: cohort.name })}
                        className="bg-qore-dark hover:bg-qore-medium text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                      >
                        Enroll
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {(cohort.programs ?? []).length === 0 && (
              <p className="text-sm text-gray-400">No programs in this cohort yet.</p>
            )}
          </div>
        </div>
      ))}

      <AnimatePresence>
        {payingFor && (
          <PaymentModal
            program={payingFor}
            onClose={() => setPayingFor(null)}
            onSuccess={() => { setPayingFor(null); load(); navigate('/learner/dashboard'); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default LearnerPrograms;
