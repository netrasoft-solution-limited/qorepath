import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { safeNext } from './RegisterPage';

const perks = [
  'Live expert-led cohort sessions',
  'Weekly projects with tutor feedback',
  'Every class recorded for replay',
  'Verifiable certificate of completion',
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = safeNext(searchParams.get('next'));
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[46%] bg-qore-dark flex-col justify-between p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-120px] right-[-120px] w-[400px] h-[400px] rounded-full bg-qore-medium/30 blur-3xl" />
          <div className="absolute bottom-[-80px] left-[-80px] w-[300px] h-[300px] rounded-full bg-qore-medium/20 blur-3xl" />
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <Link to="/public/home">
            <span className="flex items-center gap-2"><img src="/netranova-icon.webp" alt="" className="h-9 w-9" /><span className="text-white font-extrabold text-xl tracking-tight">NetraNova</span></span>
          </Link>
        </div>

        {/* Mid content */}
        <div className="relative z-10 space-y-10">
          <div>
            <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
              Your next chapter<br />starts here.
            </h2>
            <p className="text-white/60 text-base leading-relaxed max-w-xs">
              Pick up where you left off — your classes, projects and progress are waiting.
            </p>
          </div>

          <ul className="space-y-3">
            {perks.map((perk, i) => (
              <li key={i} className="flex items-center gap-3 text-white/80 text-sm">
                <div className="w-5 h-5 rounded-full bg-qore-highlight/20 flex items-center justify-center shrink-0">
                  <CheckCircle size={12} className="text-qore-highlight" />
                </div>
                {perk}
              </li>
            ))}
          </ul>

          {/* Founding cohort */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-[#FFB020] text-xs font-bold uppercase tracking-wider mb-2">Founding cohort</p>
            <p className="text-white/80 text-sm leading-relaxed">
              Be among the first NetraNova graduates — learn live with a small cohort and help shape the program as it grows.
            </p>
          </div>
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 flex items-center gap-8 pt-8 border-t border-white/10">
          {[{ value: 'Live', label: 'Expert-led classes' }, { value: '50 / 50', label: 'Instalment option' }, { value: 'Verified', label: 'Certificates' }].map((s) => (
            <div key={s.label}>
              <p className="text-white font-extrabold text-lg leading-none">{s.value}</p>
              <p className="text-white/50 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col justify-center bg-white px-6 sm:px-12 lg:px-16 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10 text-center">
          <Link to="/public/home">
            <img src="/netranova-logo.webp" alt="NetraNova" className="h-8 inline" />
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[420px] mx-auto"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-1.5">Welcome back</h1>
            <p className="text-gray-400 text-sm">Sign in to continue your learning journey.</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2"
            >
              <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                <span className="text-white text-[10px] font-bold">!</span>
              </div>
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium focus:border-transparent transition-shadow bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-qore-medium hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-xl pl-11 pr-12 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium focus:border-transparent transition-shadow bg-gray-50 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-qore-dark hover:bg-qore-medium text-white py-3.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>Sign In <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link
              to={next ? `/register?next=${encodeURIComponent(next)}` : '/register'}
              className="text-qore-dark font-bold hover:text-qore-medium transition-colors"
            >
              Create one free →
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
