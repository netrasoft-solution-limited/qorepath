import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-qore-light">
        <div className="w-8 h-8 border-4 border-qore-dark border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/public/home" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'instructor') return <Navigate to="/instructor/dashboard" replace />;
  return <Navigate to="/learner/dashboard" replace />;
}
