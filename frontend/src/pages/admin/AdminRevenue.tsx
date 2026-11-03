import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { DollarSign, TrendingUp, Download, CreditCard, Clock } from 'lucide-react';
import api from '../../lib/api';

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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function AdminRevenue() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/payments').then(({ data }) => setPayments(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const paid = payments.filter((p) => p.status === 'paid');
  const pending = payments.filter((p) => p.status === 'pending');
  const totalRevenue = paid.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const pendingAmount = pending.reduce((s, p) => s + parseFloat(p.amount || 0), 0);

  // Monthly breakdown from real data
  const monthlyMap: Record<string, number> = {};
  paid.forEach((p) => {
    const month = MONTHS[new Date(p.createdAt).getMonth()];
    monthlyMap[month] = (monthlyMap[month] ?? 0) + parseFloat(p.amount || 0);
  });
  const revenueData = MONTHS.filter((m) => monthlyMap[m]).map((m) => ({ name: m, Revenue: monthlyMap[m] }));

  // Payment type split
  const fullPaid = paid.filter((p) => p.method !== 'instalment').length;
  const instalment = paid.filter((p) => p.method === 'instalment').length;
  const total = fullPaid + instalment || 1;
  const paymentTypeData = [
    { name: 'Full Payment', value: Math.round((fullPaid / total) * 100) },
    { name: 'Instalment', value: Math.round((instalment / total) * 100) },
  ];

  const PIE_COLORS = ['#2D6A4F', '#F59E0B'];

  const exportPayments = () => {
    exportCSV(
      payments.map((p) => ({
        Learner: `${p.user?.firstName} ${p.user?.lastName}`,
        Email: p.user?.email,
        Cohort: p.cohort?.name ?? '',
        Amount: p.amount,
        Method: p.method ?? '',
        Status: p.status,
        Date: p.createdAt?.slice(0, 10),
      })),
      'netranova-payments.csv'
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-qore-text">Revenue Dashboard</h1>
          <p className="text-gray-500">Financial overview and payment tracking.</p>
        </div>
        <button
          onClick={exportPayments}
          className="inline-flex items-center gap-2 bg-white border border-gray-200 text-qore-text px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: 'Total Revenue (All Time)',
            value: loading ? '…' : `₦${totalRevenue.toLocaleString()}`,
            sub: `From ${paid.length} paid transactions`,
            icon: DollarSign, color: 'text-qore-medium', bg: 'bg-qore-light',
          },
          {
            label: 'Pending Payments',
            value: loading ? '…' : `₦${pendingAmount.toLocaleString()}`,
            sub: `${pending.length} payments outstanding`,
            icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50',
          },
          {
            label: 'Total Transactions',
            value: loading ? '…' : String(payments.length),
            sub: `${paid.length} paid · ${pending.length} pending`,
            icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50',
          },
        ].map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className={`w-12 h-12 rounded-xl ${card.bg} ${card.color} flex items-center justify-center shrink-0`}>
                <card.icon size={22} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-qore-text">{card.value}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <h2 className="text-lg font-bold text-qore-text mb-6">Monthly Revenue</h2>
          {revenueData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
              No paid payments recorded yet.
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }}
                    tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                  <Tooltip cursor={{ fill: '#F3F4F6' }} formatter={(v: number) => [`₦${v.toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="Revenue" fill="#2D6A4F" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <h2 className="text-lg font-bold text-qore-text mb-4">Payment Types</h2>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={paymentTypeData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                  {paymentTypeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`, '']} />
                <Legend verticalAlign="bottom" height={30} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-2">
            {paymentTypeData.map((d, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                  {d.name}
                </span>
                <span className="font-semibold">{d.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
