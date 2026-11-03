import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  children: React.ReactNode;
  roles?: string[];
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-qore-light">
        <div className="w-8 h-8 border-4 border-qore-dark border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  // Signed in but wrong portal: send them to their own dashboard, not the login page.
  if (roles && !roles.includes(user.role)) {
    const home = user.role === 'admin' ? '/admin/dashboard' : user.role === 'learner' ? '/learner/dashboard' : '/instructor/dashboard';
    return <Navigate to={home} replace />;
  }

  return <>{children}</>;
}
