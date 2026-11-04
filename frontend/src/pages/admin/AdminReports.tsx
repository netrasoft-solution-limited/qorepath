import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Users, DollarSign, TrendingUp, Award } from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../../components/feedback';

// Returns false when there was nothing to export. The BOM makes Excel read ₦ and accents correctly.
function exportCSV(data: any[], filename: string): boolean {
  if (!data.length) return false;
  const keys = Object.keys(data[0]);
  const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [keys.join(','), ...data.map((r) => keys.map((k) => cell(r[k])).join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  return true;
}

function filterByRange(items: any[], range: string, dateField = 'createdAt') {
  const now = new Date();
  return items.filter((item) => {
    const d = new Date(item[dateField]);
    if (range === 'Last 30 Days') return (now.getTime() - d.getTime()) <= 30 * 86400000;
    if (range === 'This Quarter') {
      const q = Math.floor(now.getMonth() / 3);
      return Math.floor(d.getMonth() / 3) === q && d.getFullYear() === now.getFullYear();
    }
    if (range === 'This Year') return d.getFullYear() === now.getFullYear();
    return true;
  });
}

type ReportId = 'enrollment' | 'revenue' | 'performance' | 'certificate';

const REPORTS: { id: ReportId; title: string; desc: string; icon: any; color: string; bg: string }[] = [
  { id: 'enrollment', title: 'Enrollment Report', desc: 'Detailed breakdown of enrollments by track, cohort, and status.', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'revenue', title: 'Revenue Report', desc: 'Financial data including full payments, instalments, and outstanding balances.', icon: DollarSign, color: 'text-qore-medium', bg: 'bg-qore-light' },
  { id: 'performance', title: 'At-Risk Learners', desc: 'Learners below 70% attendance, with sessions attended (current snapshot).', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'certificate', title: 'Certificate Report', desc: 'Every issued certificate with its number, track and date.', icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
];

export function AdminReports() {
  const toast = useToast();
  const [ranges, setRanges] = useState<Record<string, string>>({
    enrollment: 'All Time', revenue: 'All Time', performance: 'All Time', certificate: 'All Time',
  });
  const [exporting, setExporting] = useState<Record<string, boolean>>({});

  const setExport = (id: string, val: boolean) => setExporting((p) => ({ ...p, [id]: val }));

  const handleExport = async (id: ReportId) => {
    setExport(id, true);
    let exported = true;
    try {
      if (id === 'enrollment') {
        const { data } = await api.get('/enrollments');
        const filtered = filterByRange(data, ranges.enrollment, 'enrolledAt');
        exported = exportCSV(
          filtered.map((e: any) => ({
            Learner: `${e.learner?.firstName} ${e.learner?.lastName}`,
            Email: e.learner?.email ?? '',
            Track: e.program?.track ?? '',
            Cohort: e.program?.cohort?.name ?? '',
            Status: e.status,
            EnrolledAt: e.enrolledAt?.slice(0, 10),
          })),
          'netranova-enrollments.csv'
        );
      } else if (id === 'revenue') {
        const { data } = await api.get('/payments');
        const filtered = filterByRange(data, ranges.revenue);
        exported = exportCSV(
          filtered.map((p: any) => ({
            Learner: `${p.user?.firstName} ${p.user?.lastName}`,
            Email: p.user?.email ?? '',
            Track: p.program?.track ?? '',
            Cohort: p.cohort?.name ?? '',
            Instalment: p.totalInstallments ? `${p.installmentNumber} of ${p.totalInstallments}` : 'Full',
            Amount: p.amount,
            Method: p.method ?? '',
            Status: p.status,
            Date: p.createdAt?.slice(0, 10),
          })),
          'netranova-revenue.csv'
        );
      } else if (id === 'performance') {
        const { data } = await api.get('/sessions/at-risk');
        exported = exportCSV(
          data.map((d: any) => ({
            Learner: `${d.learner?.firstName} ${d.learner?.lastName}`,
            Email: d.learner?.email ?? '',
            Cohort: d.cohort?.name ?? '',
            AttendanceRate: `${d.attendanceRate}%`,
            SessionsAttended: d.sessionsAttended,
            TotalSessions: d.totalSessions,
          })),
          'netranova-performance.csv'
        );
      } else if (id === 'certificate') {
        const { data } = await api.get('/certificates');
        const filtered = filterByRange(data, ranges.certificate, 'issuedDate');
        exported = exportCSV(
          filtered.map((c: any) => ({
            Learner: `${c.user?.firstName} ${c.user?.lastName}`,
            Email: c.user?.email ?? '',
            CertificateNumber: c.certificateNumber,
            Track: c.enrollment?.program?.track ?? '',
            Cohort: c.cohort?.name ?? '',
            IssuedDate: String(c.issuedDate ?? '').slice(0, 10),
            File: c.fileName ? 'Yes' : 'No',
          })),
          'netranova-certificates.csv'
        );
      }
      if (!exported) toast({ message: 'Nothing to export for this date range.', variant: 'info' });
    } catch {
      toast({ message: 'Export failed. Please try again.', variant: 'error' });
    } finally {
      setExport(id, false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-qore-text">Reports & Exports</h1>
        <p className="text-gray-500">Download platform data as CSV files, which open directly in Excel or Google Sheets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {REPORTS.map((report, idx) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className={`w-12 h-12 rounded-xl ${report.bg} ${report.color} flex items-center justify-center shrink-0`}>
                <report.icon size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-qore-text">{report.title}</h2>
                <p className="text-sm text-gray-500 mt-1">{report.desc}</p>
              </div>
            </div>

            {report.id !== 'performance' && <div className="mb-6">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Date Range</label>
              <select
                value={ranges[report.id]}
                onChange={(e) => setRanges((p) => ({ ...p, [report.id]: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
              >
                <option>All Time</option>
                <option>Last 30 Days</option>
                <option>This Quarter</option>
                <option>This Year</option>
              </select>
            </div>}

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => handleExport(report.id)}
                disabled={exporting[report.id]}
                className="flex-1 bg-qore-medium hover:bg-qore-dark text-white py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Download size={16} /> {exporting[report.id] ? 'Exporting…' : 'Export CSV'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
