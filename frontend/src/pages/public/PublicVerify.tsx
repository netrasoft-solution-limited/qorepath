import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Search, CheckCircle, XCircle, Award, User, Calendar, BookOpen } from 'lucide-react';
import api from '../../lib/api';

export function PublicVerify() {
  const { certificateNumber: paramCertNumber } = useParams<{ certificateNumber?: string }>();
  const navigate = useNavigate();
  const [input, setInput] = useState(paramCertNumber ?? '');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(!!paramCertNumber);

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const certNum = input.trim();
    if (!certNum) return;
    setLoading(true);
    setError('');
    setResult(null);
    setSearched(true);
    try {
      const { data } = await api.get(`/certificates/verify/${encodeURIComponent(certNum)}`);
      setResult(data);
      navigate(`/public/verify/${encodeURIComponent(certNum)}`, { replace: true });
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('No certificate found with that number. Please check and try again.');
      } else {
        setError('Verification service unavailable. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-verify if cert number came from URL param
  React.useEffect(() => {
    if (paramCertNumber) handleVerify();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <section className="bg-[#eef3ff] pt-14 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-16 h-16 bg-qore-light rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Award size={32} className="text-qore-medium" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
              Verify a <span className="text-qore-medium">QorePath Certificate</span>
            </h1>
            <p className="text-gray-500 text-base max-w-xl mx-auto">
              Enter a certificate number to confirm its authenticity. All QorePath certificates are uniquely numbered and permanently verifiable.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search */}
      <div className="max-w-xl mx-auto px-4 -mt-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl shadow-md border border-gray-100 p-6"
        >
          <form onSubmit={handleVerify} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. QP-1234567890-ABC12"
                className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-qore-medium hover:bg-qore-dark text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              {loading ? 'Checking…' : 'Verify'}
            </button>
          </form>
        </motion.div>
      </div>

      {/* Results */}
      <div className="max-w-xl mx-auto px-4 mt-6 pb-20">
        {searched && !loading && error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 flex items-start gap-4"
          >
            <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <XCircle size={24} className="text-red-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Certificate Not Found</h3>
              <p className="text-sm text-gray-500">{error}</p>
            </div>
          </motion.div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Valid banner */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <CheckCircle size={26} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-green-800 text-lg">Certificate Verified ✓</h3>
                <p className="text-sm text-green-700">This is a valid, authentic QorePath certificate.</p>
              </div>
            </div>

            {/* Details card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
                <div className="w-12 h-12 rounded-xl bg-qore-light flex items-center justify-center shrink-0">
                  <Award size={24} className="text-qore-medium" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Certificate of Completion</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{result.certificateNumber}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User size={16} className="text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Awarded To</p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {result.user?.firstName} {result.user?.lastName}
                    </p>
                  </div>
                </div>
                {result.cohort && (
                  <div className="flex items-center gap-3">
                    <BookOpen size={16} className="text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Programme</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {result.cohort?.track ?? result.cohort?.name}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Date Issued</p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {new Date(result.issuedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-center text-gray-400">
              Verified on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · QorePath Certificate Registry
            </p>
          </motion.div>
        )}

        {!searched && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400 mb-2">Looking for your own certificate?</p>
            <Link to="/login" className="text-qore-medium font-semibold text-sm hover:underline">
              Log in to your learner dashboard →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
