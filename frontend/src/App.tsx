import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { FeedbackProvider } from './components/feedback';
import ProtectedRoute from './components/ProtectedRoute';
import RootRedirect from './components/RootRedirect';
import NotFoundPage from './pages/NotFoundPage';
import { hasPermission } from './lib/permissions';
// Layouts
import { PortalLayout } from './layouts/PortalLayout';
import { PublicLayout } from './layouts/PublicLayout';
// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
// Public Pages
import { PublicHome } from './pages/public/PublicHome';
import { PublicAbout } from './pages/public/PublicAbout';
import { PublicVerify } from './pages/public/PublicVerify';
import { PublicContact } from './pages/public/PublicContact';
import { PublicLegal } from './pages/public/PublicLegal';
import { CourseListing } from './pages/public/CourseListing';
import { TrackListing } from './pages/public/TrackListing';
import { TrackDetail } from './pages/public/TrackDetail';
// Virtual Classroom
import { VirtualClassroom } from './pages/VirtualClassroom';
// Calendar Pages
import { InstructorCalendar } from './pages/instructor/InstructorCalendar';
import { LearnerCalendar } from './pages/learner/LearnerCalendar';
// Learner Pages
import { LearnerDashboard } from './pages/learner/LearnerDashboard';
import { LearnerPrograms } from './pages/learner/LearnerPrograms';
import { LearnerSessions } from './pages/learner/LearnerSessions';
import { LearnerAssignments } from './pages/learner/LearnerAssignments';
import { LearnerCapstone } from './pages/learner/LearnerCapstone';
import { LearnerProgress } from './pages/learner/LearnerProgress';
import { LearnerPayments } from './pages/learner/LearnerPayments';
import { LearnerCertificate } from './pages/learner/LearnerCertificate';
import { LearnerProfile } from './pages/learner/LearnerProfile';
// Instructor Pages
import { InstructorDashboard } from './pages/instructor/InstructorDashboard';
import { InstructorSessions } from './pages/instructor/InstructorSessions';
import { InstructorAttendance } from './pages/instructor/InstructorAttendance';
import { InstructorAssignments } from './pages/instructor/InstructorAssignments';
import { InstructorRoster } from './pages/instructor/InstructorRoster';
import { InstructorAnnouncements } from './pages/instructor/InstructorAnnouncements';
import { InstructorMaterials } from './pages/instructor/InstructorMaterials';
import { InstructorGraduation } from './pages/instructor/InstructorGraduation';
// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminRevenue } from './pages/admin/AdminRevenue';
import { AdminCohorts } from './pages/admin/AdminCohorts';
import { AdminEnrollments } from './pages/admin/AdminEnrollments';
import { AdminPayments } from './pages/admin/AdminPayments';
import { AdminWithdrawals } from './pages/admin/AdminWithdrawals';
import { AdminAtRisk } from './pages/admin/AdminAtRisk';
import { AdminInstructors } from './pages/admin/AdminInstructors';
import { AdminGraduation } from './pages/admin/AdminGraduation';
import { AdminCertificates } from './pages/admin/AdminCertificates';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminAuditLog } from './pages/admin/AdminAuditLog';
import { AdminGuide } from './pages/admin/guide/AdminGuide';
// Icons
import {
  LayoutDashboard, Calendar, CalendarDays, FileText, Award, TrendingUp, CreditCard,
  User, Users, ClipboardList, Megaphone, Folder, CheckSquare, Shield,
  BookOpen, DollarSign, BarChart, Settings, Activity, Undo2, LifeBuoy,
} from 'lucide-react';

const learnerNav = [
  { name: 'Dashboard', path: '/learner/dashboard', icon: LayoutDashboard },
  { name: 'Programs', path: '/learner/programs', icon: BookOpen },
  { name: 'Sessions', path: '/learner/sessions', icon: Calendar, permission: 'sessions' },
  { name: 'Calendar', path: '/learner/calendar', icon: CalendarDays, permission: 'calendar' },
  { name: 'Assignments', path: '/learner/assignments', icon: FileText, permission: 'assignments' },
  { name: 'Capstone', path: '/learner/capstone', icon: Award, permission: 'capstone' },
  { name: 'Progress', path: '/learner/progress', icon: TrendingUp, permission: 'progress' },
  { name: 'Payments', path: '/learner/payments', icon: CreditCard, permission: 'payments' },
  { name: 'Certificate', path: '/learner/certificate', icon: Award, permission: 'certificate' },
  { name: 'Profile', path: '/learner/profile', icon: User, permission: 'profile' },
];

const instructorNav = [
  { name: 'Dashboard', path: '/instructor/dashboard', icon: LayoutDashboard },
  { name: 'Sessions', path: '/instructor/sessions', icon: Calendar, permission: 'sessions' },
  { name: 'Calendar', path: '/instructor/calendar', icon: CalendarDays, permission: 'calendar' },
  { name: 'Attendance', path: '/instructor/attendance', icon: ClipboardList, permission: 'attendance' },
  { name: 'Assignments', path: '/instructor/assignments', icon: FileText, permission: 'assignments' },
  { name: 'Learner Roster', path: '/instructor/roster', icon: Users, permission: 'roster' },
  { name: 'Announcements', path: '/instructor/announcements', icon: Megaphone, permission: 'announcements' },
  { name: 'Materials', path: '/instructor/materials', icon: Folder, permission: 'materials' },
  { name: 'Graduation', path: '/instructor/graduation', icon: CheckSquare, permission: 'graduation' },
];

const adminNav = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Cohorts', path: '/admin/cohorts', icon: BookOpen, permission: 'cohorts' },
  { name: 'Enrollments', path: '/admin/enrollments', icon: Users, permission: 'enrollments' },
  { name: 'Payments', path: '/admin/payments', icon: CreditCard, permission: 'payments' },
  { name: 'Withdrawals', path: '/admin/withdrawals', icon: Undo2, permission: 'payments' },
  { name: 'At-Risk', path: '/admin/at-risk', icon: Activity, permission: 'at_risk' },
  { name: 'Instructors', path: '/admin/instructors', icon: User, permission: 'instructors' },
  { name: 'Graduation', path: '/admin/graduation', icon: CheckSquare, permission: 'graduation' },
  { name: 'Certificates', path: '/admin/certificates', icon: Award, permission: 'certificates' },
  { name: 'Revenue', path: '/admin/revenue', icon: DollarSign, permission: 'revenue' },
  { name: 'Reports', path: '/admin/reports', icon: BarChart, permission: 'reports' },
  { name: 'Settings', path: '/admin/settings', icon: Settings, permission: 'settings' },
  { name: 'Users', path: '/admin/users', icon: Shield, permission: 'users' },
  { name: 'Audit Log', path: '/admin/audit', icon: Activity, permission: 'audit_log' },
  { name: 'Guide', path: '/admin/guide', icon: LifeBuoy, superAdminOnly: true },
];

function filterNav(nav: any[], user: any) {
  return nav.filter((item) => (item.superAdminOnly ? !!user?.isSuperAdmin : !item.permission || hasPermission(user, item.permission)));
}

function LearnerPortal() {
  const { user } = useAuth();
  return (
    <ProtectedRoute roles={['learner']}>
      <PortalLayout navItems={filterNav(learnerNav, user)} portalName="Learner Portal" userName="" userRole="Learner">
        <Routes>
          <Route path="dashboard" element={<LearnerDashboard />} />
          <Route path="programs" element={<LearnerPrograms />} />
          <Route path="sessions" element={<LearnerSessions />} />
          <Route path="calendar" element={<LearnerCalendar />} />
          <Route path="assignments" element={<LearnerAssignments />} />
          <Route path="capstone" element={<LearnerCapstone />} />
          <Route path="progress" element={<LearnerProgress />} />
          <Route path="payments" element={<LearnerPayments />} />
          <Route path="certificate" element={<LearnerCertificate />} />
          <Route path="profile" element={<LearnerProfile />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Routes>
      </PortalLayout>
    </ProtectedRoute>
  );
}

function InstructorPortal() {
  const { user } = useAuth();
  return (
    <ProtectedRoute roles={['instructor', 'assistant']}>
      <PortalLayout navItems={filterNav(instructorNav, user)} portalName="Instructor Portal" userName="" userRole="Instructor">
        <Routes>
          <Route path="dashboard" element={<InstructorDashboard />} />
          <Route path="sessions" element={<InstructorSessions />} />
          <Route path="calendar" element={<InstructorCalendar />} />
          <Route path="attendance" element={<InstructorAttendance />} />
          <Route path="assignments" element={<InstructorAssignments />} />
          <Route path="roster" element={<InstructorRoster />} />
          <Route path="announcements" element={<InstructorAnnouncements />} />
          <Route path="materials" element={<InstructorMaterials />} />
          <Route path="graduation" element={<InstructorGraduation />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Routes>
      </PortalLayout>
    </ProtectedRoute>
  );
}

function AdminPortal() {
  const { user } = useAuth();
  return (
    <ProtectedRoute roles={['admin']}>
      <PortalLayout navItems={filterNav(adminNav, user)} portalName="Admin Dashboard" userName="" userRole="Admin">
        <Routes>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="cohorts" element={<AdminCohorts />} />
          <Route path="enrollments" element={<AdminEnrollments />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="withdrawals" element={<AdminWithdrawals />} />
          <Route path="at-risk" element={<AdminAtRisk />} />
          <Route path="instructors" element={<AdminInstructors />} />
          <Route path="graduation" element={<AdminGraduation />} />
          <Route path="certificates" element={<AdminCertificates />} />
          <Route path="revenue" element={<AdminRevenue />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="audit" element={<AdminAuditLog />} />
          <Route path="guide" element={user?.isSuperAdmin ? <AdminGuide /> : <Navigate to="/admin/dashboard" replace />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Routes>
      </PortalLayout>
    </ProtectedRoute>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FeedbackProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Public Website */}
          <Route path="/public/home" element={<PublicLayout><PublicHome /></PublicLayout>} />
          <Route path="/public/about" element={<PublicLayout><PublicAbout /></PublicLayout>} />
          <Route path="/public/verify" element={<PublicLayout><PublicVerify /></PublicLayout>} />
          <Route path="/public/contact" element={<PublicLayout><PublicContact /></PublicLayout>} />
          <Route path="/public/terms" element={<PublicLayout><PublicLegal kind="terms" /></PublicLayout>} />
          <Route path="/public/privacy" element={<PublicLayout><PublicLegal kind="privacy" /></PublicLayout>} />
          <Route path="/public/verify/:certificateNumber" element={<PublicLayout><PublicVerify /></PublicLayout>} />
          <Route path="/public/courses" element={<PublicLayout><CourseListing /></PublicLayout>} />
          <Route path="/public/tracks" element={<PublicLayout><TrackListing /></PublicLayout>} />
          <Route path="/public/tracks/:slug" element={<PublicLayout><TrackDetail /></PublicLayout>} />

          {/* Virtual Classroom — full screen, no portal layout */}
          <Route path="/classroom/:sessionId" element={
            <ProtectedRoute roles={['learner', 'instructor', 'assistant', 'admin']}>
              <VirtualClassroom />
            </ProtectedRoute>
          } />

          {/* Portals */}
          <Route path="/learner/*" element={<LearnerPortal />} />
          <Route path="/instructor/*" element={<InstructorPortal />} />
          <Route path="/admin/*" element={<AdminPortal />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </FeedbackProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
