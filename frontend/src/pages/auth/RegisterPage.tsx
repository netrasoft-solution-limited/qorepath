import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, Phone, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSiteInfo } from '../../lib/siteInfo';
import { useOpenPrograms, shortDate } from '../public/home/useOpenPrograms';
import { AuthShell, Badge, Field, FormError, FormHeader, SubmitButton } from './AuthShell';

/** Only allow same-site relative paths, so ?next= can't send people to another site. */
export function safeNext(next: string | null): string | null {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : null;
}


function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
  ];
  if (!password) return null;
  const score = checks.filter((c) => c.pass).length;
  return (
    <span className="mt-2 block">
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? (score === 3 ? 'bg-green-500' : score === 2 ? 'bg-[#FFB020]' : 'bg-red-400') : 'bg-white/10'}`} />
        ))}
      </span>
      <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
        {checks.map((c) => (
          <span key={c.label} className={`flex items-center gap-1 text-[11px] font-medium ${c.pass ? 'text-green-300' : 'text-white/40'}`}>
            <CheckCircle2 size={11} /> {c.label}
          </span>
        ))}
      </span>
    </span>
  );
}

/** Pill above the heading: the real next open cohort, from the cohorts admins set up. */
function NextCohort() {
  const programs = useOpenPrograms();
  const next = programs?.[0];
  if (!next) return null;
  return (
    <Badge>
      <span className="relative flex h-2 w-2"><span className="nn-pulse-ring absolute inset-0 rounded-full bg-[#FFB020]" /><span className="relative h-2 w-2 rounded-full bg-[#FFB020]" /></span>
      <span>
        <span className="text-white/50">Enrolling now · </span>
        <span className="font-semibold text-white">{next.track}</span>
        {next.startDate ? ` · starts ${shortDate(next.startDate)}` : ''}
      </span>
    </Badge>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const site = useSiteInfo();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: searchParams.get('email') ?? '',
    password: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ ...form, role: 'learner' });
      navigate(safeNext(searchParams.get('next')) ?? '/learner/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  const next = safeNext(searchParams.get('next'));

  return (
    <AuthShell
      badge={<NextCohort />}
      below={<>Already have an account?{' '}
        <Link to={next ? `/login?next=${encodeURIComponent(next)}` : '/login'} className="font-semibold text-white hover:text-qore-highlight">Sign in</Link></>}
    >
      <FormHeader title="Create your account" subtitle="Free to join. Pick a track and pay only when you enroll." />
      {error && <FormError>{error}</FormError>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="First name" icon={User} required autoComplete="given-name" value={form.firstName} onChange={(e) => field('firstName', e.target.value)} placeholder="Ada" />
          <Field label="Last name" icon={User} required autoComplete="family-name" value={form.lastName} onChange={(e) => field('lastName', e.target.value)} placeholder="Okonkwo" />
        </div>
        <Field label="Email address" icon={Mail} type="email" required autoComplete="email" value={form.email} onChange={(e) => field('email', e.target.value)} placeholder="you@example.com" />
        <Field
          label={<>Phone <span className="font-normal text-gray-400">(optional)</span></>}
          icon={Phone} type="tel" autoComplete="tel" value={form.phone} onChange={(e) => field('phone', e.target.value)} placeholder="+234 800 000 0000"
        />
        <Field
          label="Password" icon={Lock} type="password" required minLength={8} autoComplete="new-password"
          value={form.password} onChange={(e) => field('password', e.target.value)} placeholder="At least 8 characters"
          hint={<PasswordStrength password={form.password} />}
        />

        {/* Terms notice — only once the legal pages are published (Settings → Site & Contact) */}
        {(site?.termsText || site?.privacyText) && (
          <p className="pt-1 text-center text-xs leading-relaxed text-white/40">
            By creating an account you agree to our{' '}
            {site.termsText && <Link to="/public/terms" target="_blank" className="text-white/70 underline-offset-2 hover:underline">Terms of Service</Link>}
            {site.termsText && site.privacyText && ' and '}
            {site.privacyText && <Link to="/public/privacy" target="_blank" className="text-white/70 underline-offset-2 hover:underline">Privacy Policy</Link>}.
          </p>
        )}

        <SubmitButton loading={loading} loadingText="Creating account…">Create Free Account</SubmitButton>
      </form>

    </AuthShell>
  );
}
