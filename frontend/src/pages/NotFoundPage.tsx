import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const home = !user
    ? '/public/home'
    : user.role === 'admin'
    ? '/admin/dashboard'
    : user.role === 'instructor' || user.role === 'assistant'
    ? '/instructor/dashboard'
    : '/learner/dashboard';

  return (
    <div className="min-h-screen bg-qore-light flex flex-col items-center justify-center text-center px-4">
      <p className="text-7xl font-bold text-qore-dark mb-4">404</p>
      <h1 className="text-2xl font-bold text-qore-text mb-2">Page not found</h1>
      <p className="text-gray-500 mb-8">The page you're looking for doesn't exist.</p>
      <button
        onClick={() => navigate(home)}
        className="bg-qore-dark text-white px-6 py-3 rounded-xl font-semibold hover:bg-qore-medium transition-colors"
      >
        Go home
      </button>
    </div>
  );
}
