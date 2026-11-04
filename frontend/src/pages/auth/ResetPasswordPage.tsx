import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Lock, ArrowRight, CheckCircle2, Link2Off } from 'lucide-react';
import api from '../../lib/api';
import { AuthShell, Field, FormError, FormHeader, SubmitButton } from './AuthShell';

// Used both for "forgot password" links and for staff setting their first password (?welcome=1).
export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const isWelcome = params.get('welcome') === '1';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow={isWelcome ? 'Welcome to the team' : 'Account help'}
      headline={isWelcome ? 'Your NetraNova account is' : 'Choose a new password and'}
      accent={isWelcome ? 'ready.' : 'carry on.'}
      blurb={isWelcome
        ? 'Set a password to finish setting up your account. You will land in your portal straight after signing in.'
        : 'Pick something you have not used before. You will use it to sign in from now on.'}
    >
      {!token ? (
        <div className="py-4 text-center">
          <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50"><Link2Off size={28} className="text-red-500" /></span>
          <h1 className="font-display text-2xl font-extrabold text-qore-dark">Invalid link</h1>
          <p className="mt-2 text-sm text-gray-500">This password link is missing its token. Please request a new one.</p>
          <Link to="/forgot-password" className="mt-6 inline-block font-bold text-qore-dark hover:text-qore-medium">Request a new link →</Link>
        </div>
      ) : done ? (
        <div className="py-4 text-center">
          <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50"><CheckCircle2 size={30} className="text-green-600" /></span>
          <h1 className="font-display text-2xl font-extrabold text-qore-dark">Password {isWelcome ? 'set' : 'updated'}</h1>
          <p className="mt-2 text-sm text-gray-500">You can now sign in with your new password.</p>
          <Link to="/login" className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF8A00] to-[#FF6A00] py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/30">
            Sign in <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <>
          <FormHeader title={isWelcome ? 'Set your password' : 'Choose a new password'} subtitle="At least 8 characters." />
          {error && (
            <FormError>
              {error}
              {/expired|invalid/i.test(error) && (
                <Link to="/forgot-password" className="mt-1 block font-semibold underline">Request a new link</Link>
              )}
            </FormError>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="New password" icon={Lock} type="password" required minLength={8} autoComplete="new-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
            <Field label="Confirm password" icon={Lock} type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Type it again" />
            <SubmitButton loading={loading} loadingText="Saving…">{isWelcome ? 'Set password' : 'Update password'}</SubmitButton>
          </form>
        </>
      )}
    </AuthShell>
  );
}
