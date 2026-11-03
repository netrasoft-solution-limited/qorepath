// Central definition of every permission key, its label, and which roles get it by default.

export interface Permission {
  key: string;
  label: string;
  desc: string;
}

export const ADMIN_PERMISSIONS: Permission[] = [
  { key: 'cohorts',      label: 'Cohorts',           desc: 'Create and manage cohorts & programs' },
  { key: 'enrollments',  label: 'Enrollments',        desc: 'View and approve learner enrollments' },
  { key: 'payments',     label: 'Payments',           desc: 'View and record payment transactions' },
  { key: 'at_risk',      label: 'At-Risk Learners',   desc: 'View learners with low attendance' },
  { key: 'instructors',  label: 'Teaching Staff',     desc: 'Manage instructors and TAs' },
  { key: 'graduation',   label: 'Graduation',         desc: 'Approve or reject graduation recommendations' },
  { key: 'certificates', label: 'Certificates',       desc: 'Issue and manage certificates' },
  { key: 'revenue',      label: 'Revenue',            desc: 'View revenue analytics and summaries' },
  { key: 'reports',      label: 'Reports',            desc: 'Generate and export platform reports' },
  { key: 'settings',     label: 'Platform Settings',  desc: 'Configure program pricing and platform rules' },
  { key: 'users',        label: 'User Management',    desc: 'Create, suspend, and manage user accounts and permissions' },
  { key: 'audit_log',    label: 'Audit Log',          desc: 'View all system activity and changes' },
];

export const INSTRUCTOR_PERMISSIONS: Permission[] = [
  { key: 'sessions',      label: 'Sessions',       desc: 'Schedule and manage live sessions' },
  { key: 'calendar',      label: 'Calendar',       desc: 'View session calendar' },
  { key: 'attendance',    label: 'Attendance',     desc: 'Mark and review learner attendance' },
  { key: 'assignments',   label: 'Assignments',    desc: 'Create and grade assignments' },
  { key: 'roster',        label: 'Learner Roster', desc: 'View enrolled learners in your program' },
  { key: 'announcements', label: 'Announcements',  desc: 'Send announcements to learners' },
  { key: 'materials',     label: 'Materials',      desc: 'Upload and manage learning resources' },
  { key: 'graduation',    label: 'Graduation',     desc: 'Submit graduation recommendations' },
];

export const LEARNER_PERMISSIONS: Permission[] = [
  { key: 'sessions',     label: 'Sessions',     desc: 'View and join live sessions' },
  { key: 'calendar',     label: 'Calendar',     desc: 'View session calendar' },
  { key: 'assignments',  label: 'Assignments',  desc: 'View and submit assignments' },
  { key: 'capstone',     label: 'Capstone',     desc: 'Access capstone project area' },
  { key: 'progress',     label: 'Progress',     desc: 'View attendance and progress stats' },
  { key: 'payments',     label: 'Payments',     desc: 'View payment history' },
  { key: 'certificate',  label: 'Certificate',  desc: 'View and download certificate' },
  { key: 'profile',      label: 'Profile',      desc: 'Edit personal profile' },
];

export const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  admin:      ADMIN_PERMISSIONS.map((p) => p.key),
  instructor: INSTRUCTOR_PERMISSIONS.map((p) => p.key),
  assistant:  INSTRUCTOR_PERMISSIONS.map((p) => p.key),
  learner:    LEARNER_PERMISSIONS.map((p) => p.key),
};

export const ROLE_PERMISSION_DEFS: Record<string, Permission[]> = {
  admin:      ADMIN_PERMISSIONS,
  instructor: INSTRUCTOR_PERMISSIONS,
  assistant:  INSTRUCTOR_PERMISSIONS,
  learner:    LEARNER_PERMISSIONS,
};

export function hasPermission(user: any, key: string): boolean {
  if (!user) return false;
  const perms: string[] = user.permissions ?? ROLE_DEFAULT_PERMISSIONS[user.role] ?? [];
  return perms.includes(key);
}
