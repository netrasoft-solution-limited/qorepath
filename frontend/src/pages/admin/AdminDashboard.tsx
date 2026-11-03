import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, AlertTriangle, DollarSign, ArrowUpRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

export function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeCohorts: 0,
    enrolledLearners: 0,
    pendingEnrollments: 0,
    totalPayments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Independent so an admin without e.g. the payments permission still sees the rest.
        const [cohortsRes, enrollmentsRes, paymentsRes] = await Promise.allSettled([
          api.get('/cohorts'),
          api.get('/enrollments'),
          api.get('/payments'),
        ]);
        const data = (r: PromiseSettledResult<any>) => (r.status === 'fulfilled' ? r.value.data : []);
        const cohorts = data(cohortsRes);
        const enrollments = data(enrollmentsRes);
        const payments = data(paymentsRes);

        setStats({
          activeCohorts: cohorts.filter((c: any) => c.status === 'active').length,
          enrolledLearners: enrollments.filter((e: any) => e.status === 'approved').length,
          pendingEnrollments: enrollments.filter((e: any) => e.status === 'pending').length,
          totalPayments: payments
            .filter((p: any) => p.status === 'paid')
            .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0),
        });
      } catch {
        // silently keep zeros on error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statCards = [
    {
      label: 'Active Cohorts',
      value: loading ? '…' : String(stats.activeCohorts),
      icon: BookOpen,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      trend: 'Live cohorts',
      path: '/admin/cohorts',
    },
    {
      label: 'Enrolled Learners',
      value: loading ? '…' : String(stats.enrolledLearners),
      icon: Users,
      color: 'text-qore-medium',
      bg: 'bg-qore-light',
      trend: 'Approved enrollments',
      path: '/admin/enrollments',
    },
    {
      label: 'Pending Enrollments',
      value: loading ? '…' : String(stats.pendingEnrollments),
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      trend: 'Requires action',
      path: '/admin/enrollments',
    },
    {
      label: 'At-Risk Learners',
      value: '—',
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      trend: 'Manual review',
      path: '/admin/at-risk',
    },
    {
      label: 'Revenue (Paid)',
      value: loading ? '…' : `₦${(stats.totalPayments / 1000).toFixed(0)}K`,
      icon: DollarSign,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      trend: 'Total paid',
      path: '/admin/revenue',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-qore-text">Admin Dashboard</h1>
        <p className="text-gray-500">Platform overview and quick actions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => navigate(stat.path)}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-qore-highlight transition-colors cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon size={24} />
              </div>
              <ArrowUpRight size={20} className="text-gray-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-qore-text mb-1">{stat.value}</p>
              <p className="text-sm font-medium text-gray-600 mb-2">{stat.label}</p>
              <p className="text-xs text-gray-400">{stat.trend}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <h2 className="text-lg font-bold text-qore-text mb-6">Getting Started</h2>
          <p className="text-gray-500 text-sm">
            The platform is live and connected to the database. Create your first cohort, enroll learners, and start managing sessions from the sidebar.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <h2 className="text-lg font-bold text-qore-text mb-6">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { label: 'Create New Cohort', path: '/admin/cohorts' },
              { label: 'Review Enrollments', path: '/admin/enrollments' },
              { label: 'Process Graduations', path: '/admin/graduation' },
              { label: 'Manage Users', path: '/admin/users' },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="w-full text-left px-4 py-3 rounded-xl border border-gray-100 hover:border-qore-medium hover:bg-qore-light/30 transition-colors text-sm font-medium text-qore-text flex items-center justify-between group"
              >
                {action.label}
                <ArrowUpRight size={16} className="text-gray-400 group-hover:text-qore-medium" />
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
