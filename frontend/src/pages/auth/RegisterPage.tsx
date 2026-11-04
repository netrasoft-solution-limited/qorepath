import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, Phone, CheckCircle2, CalendarDays, Sparkles, Video, BadgeCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSiteInfo } from '../../lib/siteInfo';
import { useOpenPrograms, usePaymentPlan, firstPayment, shortDate } from '../public/home/useOpenPrograms';
import { naira } from '../public/home/data';
import { AuthShell, Field, FloatCard, FormError, FormHeader, SubmitButton, Divider } from './AuthShell';

/** Only allow same-site relative paths, so ?next= can't send people to another site. */
export function safeNext(next: string | null): string | null {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : null;
}

const STEPS = ['Create your account', 'Choose your track', 'Learn live', 'Graduate'];

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
          <span key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? (score === 3 ? 'bg-green-500' : score === 2 ? 'bg-[#FFB020]' : 'bg-red-400') : 'bg-gray-100'}`} />
        ))}
      </span>
      <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
        {checks.map((c) => (
          <span key={c.label} className={`flex items-center gap-1 text-[11px] font-medium ${c.pass ? 'text-green-600' : 'text-gray-400'}`}>
            <CheckCircle2 size={11} /> {c.label}
          </span>
        ))}
      </span>
    </span>
  );
}

/** The scene on the left: the real next open cohort, plus what's included. */
function RegisterScene() {
  const programs = useOpenPrograms();
  const plan = usePaymentPlan();
  const next = programs?.[0];
  return (
    <>
      <FloatCard className="left-[7%] top-[16%]" delay={0}>
        {next ? (
          <div className="w-60">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#FFD27A]"><Sparkles size={11} /> Enrolling now</p>
            <p className="mt-1 font-display text-base font-bold leading-snug">{next.track}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/70">
              <CalendarDays size={12} /> {next.cohort}{next.startDate ? ` · starts ${shortDate(next.startDate)}` : ''}
            </p>
            {next.price > 0 && (
              <p className="mt-2 text-sm font-semibold">
                {naira(next.price)}
                {plan.allowInstallments && <span className="font-normal text-white/60"> · or {naira(firstPayment(next.price, plan.firstInstallmentPercent))} to start</span>}
              </p>
            )}
          </div>
        ) : (
          <div className="w-56">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#FFD27A]">Next cohort</p>
            <p className="mt-1 text-sm font-semibold">Dates announced soon — sign up to be told first.</p>
          </div>
        )}
      </FloatCard>
      <FloatCard className="right-[6%] top-[46%]" delay={0.15}>
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-qore-medium"><Video size={16} /></span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-qore-highlight">Every week</p>
            <p className="text-sm font-semibold">Live classes + recordings</p>
          </div>
        </div>
      </FloatCard>
      <FloatCard className="bottom-[18%] left-[12%]" delay={0.3}>
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/90"><BadgeCheck size={16} /></span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-green-200">At the finish</p>
            <p className="text-sm font-semibold">A certificate anyone can verify</p>
          </div>
        </div>
      </FloatCard>
    </>
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
      eyebrow="Start your journey"
      headline="Launch your tech career,"
      accent="live."
      blurb="Learn with an expert tutor and a small cohort. Build real projects every week and graduate with a certificate employers can check."
      scene={<RegisterScene />}
      footer={
        <ol className="mt-7 flex flex-wrap items-center gap-2 text-xs text-white/80">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-qore-highlight/20 text-[10px] font-bold text-qore-highlight">{i + 1}</span>
                {s}
              </span>
              {i < STEPS.length - 1 && <span className="h-px w-3 bg-white/20" />}
            </li>
          ))}
        </ol>
      }
    >
      <FormHeader title="Create your account" subtitle="Free to join. You'll pick a track and pay only when you enroll." />
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
          <p className="pt-1 text-xs leading-relaxed text-gray-400">
            By creating an account you agree to our{' '}
            {site.termsText && <Link to="/public/terms" target="_blank" className="font-medium text-qore-medium hover:underline">Terms of Service</Link>}
            {site.termsText && site.privacyText && ' and '}
            {site.privacyText && <Link to="/public/privacy" target="_blank" className="font-medium text-qore-medium hover:underline">Privacy Policy</Link>}.
          </p>
        )}

        <SubmitButton loading={loading} loadingText="Creating account…">Create Free Account</SubmitButton>
      </form>

      <Divider>Already learning with us?</Divider>
      <Link
        to={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}
        className="flex w-full items-center justify-center rounded-2xl border border-gray-200 py-3.5 text-sm font-bold text-qore-dark transition hover:border-qore-medium hover:bg-qore-light/40"
      >
        Sign in
      </Link>
    </AuthShell>
  );
}
