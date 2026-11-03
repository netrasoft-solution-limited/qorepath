import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';
import api from '../../lib/api';

// Used both for "forgot password" links and for staff setting their first password (?welcome=1).
export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const isWelcome = params.get('welcome') === '1';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const inputClass =
    'w-full border border-gray-200 rounded-xl pl-11 pr-12 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium focus:border-transparent transition-shadow bg-gray-50 focus:bg-white';

  return (
    <div className="min-h-screen flex flex-col justify-center bg-white px-6 sm:px-12 py-12">
      <div className="mb-10 text-center">
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
        {!token ? (
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Invalid link</h1>
            <p className="text-gray-500 text-sm">This password link is missing its token. Please request a new one.</p>
            <Link to="/forgot-password" className="inline-block mt-6 text-qore-dark font-bold hover:text-qore-medium">
              Request a new link →
            </Link>
          </div>
        ) : done ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-qore-light flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={28} className="text-qore-medium" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Password {isWelcome ? 'set' : 'updated'}</h1>
            <p className="text-gray-500 text-sm">You can now sign in with your new password.</p>
            <Link
              to="/login"
              className="mt-6 w-full bg-qore-dark hover:bg-qore-medium text-white py-3.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              Sign in <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold text-gray-900 mb-1.5">
                {isWelcome ? 'Set your password' : 'Choose a new password'}
              </h1>
              <p className="text-gray-400 text-sm">At least 8 characters.</p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                {error}
                {/expired|invalid/i.test(error) && (
                  <Link to="/forgot-password" className="block mt-1 font-semibold underline">
                    Request a new link
                  </Link>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  New password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputClass}
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

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className={inputClass}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-qore-dark hover:bg-qore-medium text-white py-3.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'Saving…' : <>{isWelcome ? 'Set password' : 'Update password'} <ArrowRight size={15} /></>}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
