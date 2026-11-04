import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Video, BookOpenCheck, Award } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { safeNext } from './RegisterPage';
import { AuthShell, Field, FormError, FormHeader, SubmitButton, Divider } from './AuthShell';

const PERKS = [
  { icon: Video, label: 'Live classes' },
  { icon: BookOpenCheck, label: 'Graded projects' },
  { icon: Award, label: 'Verified certificate' },
];

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
      eyebrow="Welcome back"
      headline="Pick up right where you"
      accent="left off."
      blurb="Your classes, projects, recordings and progress are all waiting inside your portal."
      footer={
        <div className="mt-7 flex flex-wrap gap-2">
          {PERKS.map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80">
              <Icon size={13} className="text-qore-highlight" /> {label}
            </span>
          ))}
        </div>
      }
    >
      <FormHeader title="Sign in" subtitle="Learners, instructors and admins all sign in here." />
      {error && <FormError>{error}</FormError>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="Email address" icon={Mail} type="email" required autoComplete="email" autoFocus
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com"
        />
        <Field
          label="Password" icon={Lock} type="password" required autoComplete="current-password"
          aside={<Link to="/forgot-password" className="font-semibold text-qore-medium hover:underline">Forgot password?</Link>}
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Your password"
        />
        <SubmitButton loading={loading} loadingText="Signing in…">Sign In</SubmitButton>
      </form>

      <Divider>New to NetraNova?</Divider>
      <Link
        to={next ? `/register?next=${encodeURIComponent(next)}` : '/register'}
        className="flex w-full items-center justify-center rounded-2xl border border-gray-200 py-3.5 text-sm font-bold text-qore-dark transition hover:border-qore-medium hover:bg-qore-light/40"
      >
        Create a free account
      </Link>
    </AuthShell>
  );
}
