import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle, XCircle, Clock, TrendingUp, TrendingDown,
  Calendar, FileText, Award, CreditCard, UserCheck,
} from 'lucide-react';
import api from '../../lib/api';
import { pickCurrentEnrollment, enrollmentCohortId } from '../../lib/enrollments';

export function LearnerProgress() {
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [capstone, setCapstone] = useState<any>(null);
  const [graduation, setGraduation] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const [attendRes, subRes, enrollRes, payRes, gradRes] = await Promise.allSettled([
          api.get('/sessions/attendance/my'),
          api.get('/assignments/submissions/my'),
          api.get('/enrollments/my'),
          api.get('/payments/my'),
          api.get('/graduation/my'),
        ]);

        if (attendRes.status === 'fulfilled') setAttendance(attendRes.value.data);
        if (subRes.status === 'fulfilled') setSubmissions(subRes.value.data);
        if (payRes.status === 'fulfilled') setPayments(payRes.value.data);
        if (gradRes.status === 'fulfilled') setGraduation(gradRes.value.data);

        if (enrollRes.status === 'fulfilled') {
          const enrollments: any[] = enrollRes.value.data;
          const active = pickCurrentEnrollment(enrollments);
          setEnrollment(active);

          // Fetch capstone (assignments) for the cohort
          const cohortId = enrollmentCohortId(active);
          if (cohortId) {
            try {
              const { data } = await api.get(`/assignments/cohort/${cohortId}`);
              setAssignments(data);
              const cap = data.find((a: any) => a.isCapstone || a.title?.toLowerCase().includes('capstone'));
              setCapstone(cap ?? null);
            } catch {}
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const attendRate = attendance?.rate ?? 0;
  const attendPresent = attendance?.present ?? 0;
  const attendTotal = attendance?.total ?? 0;
  const attendRecords: any[] = attendance?.records ?? [];

  const submittedIds = new Set(submissions.map((s: any) => s.assignment?.id));
  const regularAssignments = assignments.filter((a: any) => !a.isCapstone && !a.title?.toLowerCase().includes('capstone'));
  const submittedCount = regularAssignments.filter((a: any) => submittedIds.has(a.id)).length;
  const gradedSubs = submissions.filter((s: any) => s.status === 'graded' && s.score != null);
  const avgScore = gradedSubs.length
    ? Math.round(gradedSubs.reduce((acc: number, s: any) => acc + s.score, 0) / gradedSubs.length)
    : null;

  const paidPayments = payments.filter((p: any) => p.status === 'paid');
  const pendingPayments = payments.filter((p: any) => p.status === 'pending');
  const paymentStatus = payments.length === 0 ? 'none'
    : pendingPayments.length === 0 ? 'paid'
    : paidPayments.length > 0 ? 'partial'
    : 'pending';

  const capstoneSubmission = capstone ? submissions.find((s: any) => s.assignment?.id === capstone.id) : null;

  const checklist = [
    {
      label: 'Attendance ≥ 70%',
      icon: Calendar,
      value: attendTotal > 0 ? `${attendPresent}/${attendTotal} sessions (${attendRate}%)` : 'No sessions yet',
      status: attendTotal === 0 ? 'pending' : attendRate >= 70 ? 'met' : 'unmet',
    },
    {
      label: 'Assignments ≥ 80%',
      icon: FileText,
      value: regularAssignments.length > 0
        ? `${submittedCount}/${regularAssignments.length} submitted${avgScore != null ? ` · Avg ${avgScore}%` : ''}`
        : 'No assignments yet',
      status: regularAssignments.length === 0 ? 'pending'
        : submittedCount / Math.max(regularAssignments.length, 1) >= 0.8 ? 'met' : 'unmet',
    },
    {
      label: 'Capstone Submitted',
      icon: Award,
      value: !capstone ? 'Not assigned yet'
        : capstoneSubmission ? 'Submitted'
        : 'Not submitted',
      status: !capstone ? 'pending' : capstoneSubmission ? 'met' : 'unmet',
    },
    {
      label: 'Payments Complete',
      icon: CreditCard,
      value: paymentStatus === 'paid' ? 'Paid in Full'
        : paymentStatus === 'partial' ? 'Partial Payment'
        : paymentStatus === 'pending' ? 'Payment Pending'
        : 'No payments recorded',
      status: paymentStatus === 'paid' ? 'met' : paymentStatus === 'none' ? 'pending' : 'unmet',
    },
    {
      label: 'Instructor Recommendation',
      icon: UserCheck,
      value: !graduation ? 'Pending Review'
        : graduation.recommendation === 'pass' ? 'Recommended to Pass'
        : graduation.recommendation === 'conditional' ? 'Conditional Pass'
        : 'Not Recommended',
      status: !graduation ? 'pending'
        : graduation.recommendation === 'pass' || graduation.recommendation === 'conditional' ? 'met'
        : 'unmet',
    },
  ];

  const metCount = checklist.filter((c) => c.status === 'met').length;
  const overallGood = metCount >= 4;

  if (loading) return <div className="p-12 text-center text-gray-400">Loading your progress…</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-qore-text">My Progress</h1>
          <p className="text-gray-500">Track your performance and graduation eligibility.</p>
        </div>
        <div className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 border ${
          overallGood ? 'bg-qore-light text-qore-medium border-qore-medium/20' : 'bg-amber-50 text-amber-600 border-amber-200'
        }`}>
          {overallGood ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
          {overallGood ? 'On Track' : 'Needs Attention'}
        </div>
      </div>

      {enrollment && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-sm text-gray-500">
          Enrolled in <span className="font-semibold text-qore-text">{enrollment.program?.track}</span>
          {' · '}{enrollment.program?.cohort?.name}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attendance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          <h2 className="text-lg font-bold text-qore-text mb-4">Attendance Summary</h2>
          <div className="flex items-end justify-between mb-1">
            <span className="text-3xl font-bold text-qore-text">
              {attendPresent}<span className="text-lg text-gray-400 font-medium">/{attendTotal}</span>
            </span>
            <span className={`font-bold text-lg ${attendRate >= 70 ? 'text-qore-medium' : 'text-red-500'}`}>{attendRate}%</span>
          </div>
          <p className="text-sm text-gray-500 mb-3">Sessions attended</p>
          <div className="w-full bg-gray-100 rounded-full h-3 mb-4 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all ${attendRate >= 70 ? 'bg-qore-medium' : 'bg-red-400'}`}
              style={{ width: `${attendRate}%` }}
            />
          </div>
          {attendTotal > 0 && (
            <div className="grid grid-cols-6 gap-1.5">
              {attendRecords.map((r, i) => (
                <div key={i} title={r.status}
                  className={`h-8 rounded flex items-center justify-center text-[10px] font-bold ${
                    r.status === 'present' ? 'bg-qore-light text-qore-medium'
                    : r.status === 'excused' ? 'bg-blue-50 text-blue-500'
                    : 'bg-red-50 text-red-400'
                  }`}
                >
                  S{i + 1}
                </div>
              ))}
            </div>
          )}
          {attendTotal === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No sessions recorded yet.</p>
          )}
        </motion.div>

        {/* Assignments */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          <h2 className="text-lg font-bold text-qore-text mb-4">Assignment Completion</h2>
          <div className="flex items-end justify-between mb-1">
            <span className="text-3xl font-bold text-qore-text">
              {submittedCount}<span className="text-lg text-gray-400 font-medium">/{regularAssignments.length}</span>
            </span>
            <span className="text-purple-600 font-bold text-lg">
              {avgScore != null ? `${avgScore}% Avg` : '—'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-3">Assignments submitted</p>
          <div className="w-full bg-gray-100 rounded-full h-3 mb-4 overflow-hidden">
            <div
              className="bg-purple-500 h-3 rounded-full transition-all"
              style={{ width: regularAssignments.length > 0 ? `${(submittedCount / regularAssignments.length) * 100}%` : '0%' }}
            />
          </div>
          {regularAssignments.length > 0 ? (
            <div className="grid grid-cols-4 gap-1.5">
              {regularAssignments.map((a, i) => (
                <div key={a.id}
                  className={`h-8 rounded flex items-center justify-center text-[10px] font-bold ${
                    submittedIds.has(a.id) ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  A{i + 1}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No assignments yet.</p>
          )}
        </motion.div>
      </div>

      {/* Graduation Eligibility */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-qore-text">Graduation Eligibility</h2>
          <span className="text-sm text-gray-500">{metCount}/{checklist.length} criteria met</span>
        </div>
        <div className="space-y-3">
          {checklist.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-gray-50 bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  item.status === 'met' ? 'bg-qore-light text-qore-medium'
                  : item.status === 'pending' ? 'bg-amber-50 text-amber-500'
                  : 'bg-red-50 text-red-500'
                }`}>
                  <item.icon size={18} />
                </div>
                <div>
                  <p className="font-semibold text-qore-text text-sm">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.value}</p>
                </div>
              </div>
              {item.status === 'met' ? <CheckCircle className="text-qore-medium shrink-0" size={22} />
                : item.status === 'pending' ? <Clock className="text-amber-500 shrink-0" size={22} />
                : <XCircle className="text-red-500 shrink-0" size={22} />}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
