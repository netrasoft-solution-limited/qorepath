import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, MailCheck } from 'lucide-react';
import api from '../../lib/api';
import { AuthShell, Field, FormError, FormHeader, SubmitButton } from './AuthShell';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      {sent ? (
        <div className="py-4 text-center">
          <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
            <MailCheck size={26} className="text-qore-highlight" />
          </span>
          <h1 className="font-display text-2xl font-bold">Check your email</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/60">
            If an account exists for <span className="font-semibold text-white">{email}</span>, we've sent a link
            to reset your password. It expires in 1 hour.
          </p>
          <p className="mt-4 text-xs text-white/40">Didn't get it? Check your spam folder, or try again in a minute.</p>
        </div>
      ) : (
        <>
          <FormHeader title="Reset your password" subtitle="Enter your email and we'll send you a link to choose a new one." />
          {error && <FormError>{error}</FormError>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email address" icon={Mail} type="email" required autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <SubmitButton loading={loading} loadingText="Sending…">Send reset link</SubmitButton>
          </form>
        </>
      )}
      <p className="mt-7 text-center text-sm">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-white/60 transition-colors hover:text-white">
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
