import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../../lib/api';

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
        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-qore-light flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={28} className="text-qore-medium" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Check your email</h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              If an account exists for <span className="font-semibold text-gray-700">{email}</span>, we've sent a link
              to reset your password. It expires in 1 hour.
            </p>
            <p className="text-gray-400 text-xs mt-4">Didn't get it? Check your spam folder, or try again in a minute.</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold text-gray-900 mb-1.5">Forgot password?</h1>
              <p className="text-gray-400 text-sm">Enter your email and we'll send you a link to reset it.</p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium focus:border-transparent transition-shadow bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-qore-dark hover:bg-qore-medium text-white py-3.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'Sending…' : <>Send reset link <ArrowRight size={15} /></>}
              </button>
            </form>
          </>
        )}

        <p className="mt-8 text-center text-sm">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-qore-dark font-bold hover:text-qore-medium transition-colors">
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
