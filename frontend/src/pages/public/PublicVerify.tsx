import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Search, XCircle, BadgeCheck, GraduationCap, ShieldCheck, Hash, Globe2, FileText } from 'lucide-react';
import api from '../../lib/api';

const longDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

export function PublicVerify() {
  const { certificateNumber: paramCertNumber } = useParams<{ certificateNumber?: string }>();
  const navigate = useNavigate();
  const [input, setInput] = useState(paramCertNumber ?? '');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const certNum = input.trim();
    if (!certNum) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await api.get(`/certificates/verify/${encodeURIComponent(certNum)}`);
      setResult(data);
      navigate(`/public/verify/${encodeURIComponent(certNum)}`, { replace: true });
    } catch (err: any) {
      setError(
        err.response?.status === 404
          ? 'No certificate found with that number. Check for typos — numbers look like NN-1234567890123-ABCDE.'
          : 'Verification service unavailable. Please try again in a moment.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramCertNumber) handleVerify();
    document.title = 'Verify a certificate · NetraNova';
    return () => { document.title = 'NetraNova Live Learning Platform'; };
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F8FF]">
      {/* Hero + search */}
      <section className="relative overflow-hidden bg-qore-dark pb-32 pt-16 text-white">
        <div className="nn-stars pointer-events-none absolute inset-0 opacity-60" />
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-qore-medium/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-[#FF6A00]/10 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
              <ShieldCheck size={30} className="text-qore-highlight" />
            </span>
            <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
              Verify a <span className="bg-gradient-to-r from-[#FFB020] to-[#FF6A00] bg-clip-text text-transparent">NetraNova Certificate</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-white/60">
              Every certificate carries a unique number. Enter it below to confirm it's genuine — no account needed.
            </p>
          </motion.div>

          <motion.form
            onSubmit={handleVerify}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mx-auto mt-10 flex max-w-xl flex-col gap-2 rounded-2xl bg-white/10 p-2 backdrop-blur sm:flex-row"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. NN-1793701087721-9QGEC"
                aria-label="Certificate number"
                className="w-full rounded-xl bg-white py-4 pl-11 pr-4 font-mono text-sm text-qore-dark focus:outline-none focus:ring-2 focus:ring-[#FFB020]"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="whitespace-nowrap rounded-xl bg-gradient-to-r from-[#FFB020] to-[#FF6A00] px-7 py-4 text-sm font-bold text-white shadow-lg shadow-orange-500/30 disabled:opacity-60"
            >
              {loading ? 'Checking…' : 'Verify'}
            </button>
          </motion.form>
        </div>
      </section>

      {/* Result */}
      <div className="relative z-10 mx-auto -mt-20 max-w-2xl px-4 pb-16">
        <AnimatePresence mode="wait">
          {error && !loading && (
            <motion.div key="err" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-start gap-4 rounded-3xl border border-red-100 bg-white p-7 shadow-xl">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50"><XCircle size={24} className="text-red-500" /></span>
              <div>
                <h3 className="font-display text-lg font-bold text-qore-dark">Certificate not found</h3>
                <p className="mt-1 text-sm text-gray-500">{error}</p>
              </div>
            </motion.div>
          )}

          {result && (
            <motion.div key="ok" initial={{ opacity: 0, y: 20, rotate: -1 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 16 }}>
              <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-qore-dark via-[#0E2B78] to-qore-medium p-8 text-white shadow-2xl shadow-qore-dark/30 sm:p-10">
                <div className="pointer-events-none absolute inset-3 rounded-[22px] border border-white/15" />
                <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#FFB020]/20 blur-3xl" />
                <div className="relative flex items-start justify-between">
                  <img src="/netranova-icon.webp" alt="" className="h-12 w-12 rounded-xl bg-white p-1.5" />
                  <motion.span
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.25, type: 'spring', stiffness: 260, damping: 14 }}
                    className="flex items-center gap-1.5 rounded-full bg-green-400/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-green-300 ring-1 ring-green-300/30"
                  >
                    <BadgeCheck size={14} /> Verified
                  </motion.span>
                </div>
                <p className="relative mt-10 text-[11px] uppercase tracking-[0.3em] text-white/50">Certificate of completion</p>
                <p className="relative mt-2 font-display text-3xl font-extrabold sm:text-4xl">
                  {result.user?.firstName} {result.user?.lastName}
                </p>
                {(result.track || result.cohort?.name) && (
                  <p className="relative mt-1 text-white/70">{[result.track, result.cohort?.name].filter(Boolean).join(' · ')}</p>
                )}
                <div className="relative mt-10 flex flex-wrap items-end justify-between gap-6">
                  <div className="space-y-1 text-sm">
                    <p className="text-white/50">Issued <span className="font-semibold text-white">{longDate(result.issuedDate)}</span></p>
                    <p className="font-mono text-xs text-qore-highlight">{result.certificateNumber}</p>
                  </div>
                  <GraduationCap size={40} className="text-[#FFB020]" />
                </div>
              </div>
              <p className="mt-5 text-center text-sm font-medium text-green-700">This is a valid, authentic NetraNova certificate.</p>
              {result.hasFile && (
                <p className="mt-3 text-center">
                  <a
                    href={`${api.defaults.baseURL}/certificates/verify/${encodeURIComponent(result.certificateNumber)}/file`}
                    target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-qore-dark px-5 py-2.5 text-sm font-semibold text-white hover:bg-qore-medium"
                  >
                    <FileText size={16} /> View the certificate
                  </a>
                </p>
              )}
              <p className="mt-1 text-center text-xs text-gray-400">Checked {longDate(new Date().toISOString())} · NetraNova certificate registry</p>
            </motion.div>
          )}

          {!result && !error && (
            <motion.div key="how" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-gray-100 bg-white p-8 shadow-xl">
              <h2 className="font-display text-xl font-bold text-qore-dark">How verification works</h2>
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
                {[
                  { icon: Hash, title: 'Unique number', desc: 'Each certificate gets its own number when it is issued.' },
                  { icon: Globe2, title: 'Public check', desc: 'Anyone can look it up here — employers included.' },
                  { icon: ShieldCheck, title: 'Private by design', desc: 'We confirm the name, cohort and date — nothing else.' },
                ].map(({ icon: I, title, desc }) => (
                  <div key={title}>
                    <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-qore-light"><I size={18} className="text-qore-medium" /></span>
                    <p className="text-sm font-bold text-qore-dark">{title}</p>
                    <p className="mt-1 text-sm text-gray-500">{desc}</p>
                  </div>
                ))}
              </div>
              <p className="mt-8 border-t border-gray-100 pt-5 text-sm text-gray-500">
                Looking for your own certificate?{' '}
                <Link to="/login" className="font-semibold text-qore-medium hover:underline">Log in to your dashboard →</Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
