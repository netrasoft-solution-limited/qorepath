import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const perks = [
  'Live expert-led cohort sessions',
  'Real-world project portfolio',
  'Verifiable certificate of completion',
  'Lifetime community access',
];

const testimonial = {
  quote: '"QorePath gave me more than skills — it gave me a career. I landed my first dev job 3 weeks after graduating."',
  name: 'Chinedu Okafor',
  role: 'Frontend Engineer, Lagos',
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
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
      else if (user.role === 'instructor') navigate('/instructor/dashboard');
      else navigate('/learner/dashboard');
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
            <img src="/qorepath.webp" alt="QorePath" className="h-8 bg-white/10 rounded-lg px-2 py-1" />
          </Link>
        </div>

        {/* Mid content */}
        <div className="relative z-10 space-y-10">
          <div>
            <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
              Your next chapter<br />starts here.
            </h2>
            <p className="text-white/60 text-base leading-relaxed max-w-xs">
              Join hundreds of learners who've transformed their careers through live, expert-led cohort learning.
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

          {/* Testimonial */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-white/80 text-sm leading-relaxed italic mb-4">{testimonial.quote}</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-qore-medium flex items-center justify-center text-white font-bold text-sm shrink-0">
                {testimonial.name.charAt(0)}
              </div>
              <div>
                <p className="text-white text-sm font-semibold leading-none">{testimonial.name}</p>
                <p className="text-white/50 text-xs mt-0.5">{testimonial.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 flex items-center gap-8 pt-8 border-t border-white/10">
          {[{ value: '500+', label: 'Learners' }, { value: '85%', label: 'Placement' }, { value: '4.8★', label: 'Rating' }].map((s) => (
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
            <img src="/qorepath.webp" alt="QorePath" className="h-8 inline" />
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
            <Link to="/register" className="text-qore-dark font-bold hover:text-qore-medium transition-colors">
              Create one free →
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
