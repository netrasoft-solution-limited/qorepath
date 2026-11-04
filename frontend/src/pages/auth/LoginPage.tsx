import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { safeNext } from './RegisterPage';
import { AuthShell, Field, FormError, FormHeader, SubmitButton } from './AuthShell';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = safeNext(searchParams.get('next'));
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'instructor' || user.role === 'assistant') navigate('/instructor/dashboard');
      else navigate(next ?? '/learner/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      below={<>Don't have an account?{' '}
        <Link to={next ? `/register?next=${encodeURIComponent(next)}` : '/register'} className="font-semibold text-white hover:text-qore-highlight">Sign up</Link></>}
    >
      <FormHeader title="Sign in to NetraNova" subtitle="Learners, instructors and admins all sign in here." />
      {error && <FormError>{error}</FormError>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="Email address" icon={Mail} type="email" required autoComplete="email" autoFocus
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com"
        />
        <Field
          label="Password" icon={Lock} type="password" required autoComplete="current-password"
          aside={<Link to="/forgot-password" className="text-white/50 hover:text-white">Forgot password?</Link>}
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Your password"
        />
        <SubmitButton loading={loading} loadingText="Signing in…">Sign In</SubmitButton>
      </form>
    </AuthShell>
  );
}
