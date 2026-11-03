import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Users, DollarSign, TrendingUp, Award } from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../../components/feedback';

function exportCSV(data: any[], filename: string) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const csv = [keys.join(','), ...data.map((r) => keys.map((k) => `"${r[k] ?? ''}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
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
  { id: 'performance', title: 'Learner Performance', desc: 'Aggregated attendance and grading data across cohorts.', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'certificate', title: 'Certificate Report', desc: 'Log of all issued certificates.', icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
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
    try {
      if (id === 'enrollment') {
        const { data } = await api.get('/enrollments');
        const filtered = filterByRange(data, ranges.enrollment);
        exportCSV(
          filtered.map((e: any) => ({
            Learner: `${e.learner?.firstName} ${e.learner?.lastName}`,
            Email: e.learner?.email ?? '',
            Cohort: e.cohort?.name ?? '',
            Track: e.cohort?.track ?? '',
            Status: e.status,
            EnrolledAt: e.createdAt?.slice(0, 10),
          })),
          'netranova-enrollments.csv'
        );
      } else if (id === 'revenue') {
        const { data } = await api.get('/payments');
        const filtered = filterByRange(data, ranges.revenue);
        exportCSV(
          filtered.map((p: any) => ({
            Learner: `${p.user?.firstName} ${p.user?.lastName}`,
            Email: p.user?.email ?? '',
            Cohort: p.cohort?.name ?? '',
            Amount: p.amount,
            Method: p.method ?? '',
            Status: p.status,
            Date: p.createdAt?.slice(0, 10),
          })),
          'netranova-revenue.csv'
        );
      } else if (id === 'performance') {
        const { data } = await api.get('/sessions/at-risk');
        exportCSV(
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
        const filtered = filterByRange(data, ranges.certificate, 'issuedAt');
        exportCSV(
          filtered.map((c: any) => ({
            Learner: `${c.learner?.firstName} ${c.learner?.lastName}`,
            Email: c.learner?.email ?? '',
            CertificateNumber: c.certificateNumber,
            Cohort: c.cohort?.name ?? '',
            Track: c.cohort?.track ?? '',
            IssuedAt: c.issuedAt?.slice(0, 10),
          })),
          'netranova-certificates.csv'
        );
      }
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
        <p className="text-gray-500">Generate and download platform data.</p>
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

            <div className="mb-6">
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
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => handleExport(report.id)}
                disabled={exporting[report.id]}
                className="flex-1 bg-qore-medium hover:bg-qore-dark text-white py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Download size={16} /> {exporting[report.id] ? 'Exporting…' : 'Export CSV'}
              </button>
              <button
                onClick={() => handleExport(report.id)}
                disabled={exporting[report.id]}
                className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <FileText size={16} /> Export Excel
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
