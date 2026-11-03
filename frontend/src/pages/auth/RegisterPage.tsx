import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight, CheckCircle, Star } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const highlights = [
  { stat: '500+', label: 'Learners trained' },
  { stat: '85%', label: 'Placement rate' },
  { stat: '12', label: 'Cohorts completed' },
];

const steps = [
  { title: 'Create your account', desc: 'Takes less than 2 minutes.' },
  { title: 'Choose your track', desc: 'Frontend, Backend, or Product Design.' },
  { title: 'Join your cohort', desc: 'Live sessions, real projects, real mentors.' },
  { title: 'Graduate & get hired', desc: 'Certificate + career support included.' },
];

const testimonial = {
  quote: '"I was hesitant at first, but from day one NetraNova felt different. The live classes, the community, the mentorship — it all clicked. I got hired before I even graduated."',
  name: 'Amina Yusuf',
  role: 'UI/UX Designer · Graduated Cohort 11',
};

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
  ];
  if (!password) return null;
  return (
    <div className="flex items-center gap-3 mt-2">
      {checks.map((c, i) => (
        <span key={i} className={`flex items-center gap-1 text-[11px] font-medium ${c.pass ? 'text-green-600' : 'text-gray-400'}`}>
          <CheckCircle size={10} className={c.pass ? 'text-green-500' : 'text-gray-300'} />
          {c.label}
        </span>
      ))}
    </div>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: searchParams.get('email') ?? '',
    password: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ ...form, role: 'learner' });
      navigate('/learner/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[46%] bg-qore-dark flex-col justify-between p-12 relative overflow-hidden">
        {/* Background blobs + grid */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-100px] right-[-100px] w-[380px] h-[380px] rounded-full bg-qore-medium/30 blur-3xl" />
          <div className="absolute bottom-[-60px] left-[-80px] w-[280px] h-[280px] rounded-full bg-qore-medium/20 blur-3xl" />
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
              Start your tech<br />career today.
            </h2>
            <p className="text-white/60 text-base leading-relaxed max-w-xs">
              Create your free account and take the first step toward becoming a job-ready tech professional in Africa.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-7 h-7 rounded-full bg-qore-medium/40 border border-qore-highlight/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-qore-highlight text-xs font-extrabold">{i + 1}</span>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold leading-none mb-0.5">{step.title}</p>
                  <p className="text-white/50 text-xs">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex gap-0.5 mb-3">
              {[1,2,3,4,5].map((s) => <Star key={s} size={12} className="text-yellow-400 fill-current" />)}
            </div>
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
          {highlights.map((s) => (
            <div key={s.label}>
              <p className="text-white font-extrabold text-lg leading-none">{s.stat}</p>
              <p className="text-white/50 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col justify-center bg-white px-6 sm:px-12 lg:px-16 py-12 overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 text-center">
          <Link to="/public/home">
            <img src="/netranova-logo.webp" alt="NetraNova" className="h-8 inline" />
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[440px] mx-auto"
        >
          <div className="mb-7">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-1.5">Create your account</h1>
            <p className="text-gray-400 text-sm">Join NetraNova — it's free to get started.</p>
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

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  First name
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    required
                    value={form.firstName}
                    onChange={(e) => field('firstName', e.target.value)}
                    placeholder="Ada"
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium focus:border-transparent bg-gray-50 focus:bg-white transition-shadow"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Last name
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    required
                    value={form.lastName}
                    onChange={(e) => field('lastName', e.target.value)}
                    placeholder="Okonkwo"
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium focus:border-transparent bg-gray-50 focus:bg-white transition-shadow"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => field('email', e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium focus:border-transparent bg-gray-50 focus:bg-white transition-shadow"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Phone <span className="text-gray-300 font-normal normal-case tracking-normal">(optional)</span>
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => field('phone', e.target.value)}
                  placeholder="+234 800 000 0000"
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium focus:border-transparent bg-gray-50 focus:bg-white transition-shadow"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => field('password', e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-12 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium focus:border-transparent bg-gray-50 focus:bg-white transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
            </div>

            {/* Terms notice */}
            <p className="text-xs text-gray-400 leading-relaxed pt-1">
              By creating an account you agree to our{' '}
              <Link to="/public/about" className="text-qore-medium hover:underline font-medium">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/public/about" className="text-qore-medium hover:underline font-medium">Privacy Policy</Link>.
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-qore-dark hover:bg-qore-medium text-white py-3.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Creating account…
                </>
              ) : (
                <>Create Free Account <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-qore-dark font-bold hover:text-qore-medium transition-colors">
              Sign in →
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
