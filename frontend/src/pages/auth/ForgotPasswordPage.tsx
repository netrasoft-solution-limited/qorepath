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
    <AuthShell
      eyebrow="Account help"
      headline="Locked out? We'll get you"
      accent="back in."
      blurb="Enter the email you signed up with and we'll send a secure link to choose a new password."
    >
      {sent ? (
        <div className="py-4 text-center">
          <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-qore-light">
            <MailCheck size={30} className="text-qore-medium" />
          </span>
          <h1 className="font-display text-2xl font-extrabold text-qore-dark">Check your email</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            If an account exists for <span className="font-semibold text-gray-700">{email}</span>, we've sent a link
            to reset your password. It expires in 1 hour.
          </p>
          <p className="mt-4 text-xs text-gray-400">Didn't get it? Check your spam folder, or try again in a minute.</p>
        </div>
      ) : (
        <>
          <FormHeader title="Forgot password?" subtitle="We'll email you a link to reset it." />
          {error && <FormError>{error}</FormError>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email address" icon={Mail} type="email" required autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <SubmitButton loading={loading} loadingText="Sending…">Send reset link</SubmitButton>
          </form>
        </>
      )}
      <p className="mt-7 text-center text-sm">
        <Link to="/login" className="inline-flex items-center gap-1.5 font-bold text-qore-dark transition-colors hover:text-qore-medium">
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
