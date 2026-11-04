import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Check, CreditCard, Landmark, Lock, ShieldCheck, Smartphone, Users } from 'lucide-react';
import api from '../../lib/api';
import { toSlug } from './trackSlug';
import { FALLBACK_TRACKS, naira, trackIcon } from './home/data';

interface RefundPolicy { fullRefundBeforeStart: boolean; graceDays: number; gracePercent: number; afterPercent: number }

const shortDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

const INCLUDED = ['All live classes for the cohort', 'Recordings of every class', 'Weekly projects with graded feedback', 'Course materials', 'Verifiable certificate on graduation'];

export function TrackListing() {
  const [cohorts, setCohorts] = useState<any[] | null>(null);
  const [policy, setPolicy] = useState<RefundPolicy | null>(null);
  const [pick, setPick] = useState(0);
  const [payPlan, setPayPlan] = useState({ allowInstallments: true, firstInstallmentPercent: 50 });

  useEffect(() => {
    api.get('/cohorts').then(({ data }) => setCohorts(data.filter((c: any) => c.status === 'active' || c.status === 'upcoming'))).catch(() => setCohorts([]));
    api.get('/settings/refund-policy').then(({ data }) => setPolicy(data)).catch(() => {});
    api.get('/settings/enrollment-rules').then(({ data }) => setPayPlan(data.paymentPlan)).catch(() => {});
    document.title = 'Pricing · NetraNova';
    return () => { document.title = 'NetraNova Live Learning Platform'; };
  }, []);

  // Price examples: live programs when available, otherwise the standard track prices.
  const live = (cohorts ?? []).flatMap((c) => (c.programs ?? []).filter((p: any) => Number(p.price) > 0).map((p: any) => ({ track: p.track, price: Number(p.price) })));
  const seen = new Set<string>();
  const examples = (live.length ? live : FALLBACK_TRACKS).filter((t) => (seen.has(t.track) ? false : (seen.add(t.track), true)));
  const ex = examples[Math.min(pick, examples.length - 1)];
  const pct = payPlan.firstInstallmentPercent;
  const half = ex ? Math.round((ex.price * pct) / 100) : 0;
  const firstShare = pct === 50 ? 'Half' : `${pct}%`;

  return (
    <div className="min-h-screen bg-[#F5F8FF]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-qore-dark pb-40 pt-20 text-white">
        <div className="nn-stars pointer-events-none absolute inset-0 opacity-60" />
        <div className="pointer-events-none absolute -right-32 -top-40 h-[520px] w-[520px] rounded-full bg-qore-medium/30 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-qore-highlight">Pricing</p>
            <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              One price.{' '}
              <span className="bg-gradient-to-r from-[#FFB020] to-[#FF6A00] bg-clip-text text-transparent">Two ways to pay.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-white/60">No subscriptions, no hidden fees. Pay for the whole cohort up front{payPlan.allowInstallments ? `, or start with ${firstShare.toLowerCase()} and pay the rest later` : ''}.</p>
          </motion.div>
          {examples.length > 1 && (
            <div className="mt-9 inline-flex flex-wrap justify-center gap-2 rounded-2xl bg-white/10 p-1.5 backdrop-blur">
              {examples.map((t, i) => (
                <button key={t.track} onClick={() => setPick(i)} className={`relative rounded-xl px-4 py-2 text-xs font-bold transition-colors ${pick === i ? 'text-qore-dark' : 'text-white/70 hover:text-white'}`}>
                  {pick === i && <motion.span layoutId="nn-price-pick" className="absolute inset-0 rounded-xl bg-white" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                  <span className="relative">{t.track.replace(' (UI/UX)', '')}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Plans */}
      {ex && (
        <section className={`relative z-10 mx-auto -mt-28 grid grid-cols-1 gap-6 px-4 sm:px-6 lg:px-8 ${payPlan.allowInstallments ? 'max-w-5xl md:grid-cols-2' : 'max-w-xl'}`}>
          {[
            { name: 'Pay in full', now: ex.price, later: 0, note: 'One payment, done.', featured: false },
            ...(payPlan.allowInstallments
              ? [{ name: 'Two instalments', now: half, later: ex.price - half, note: `${firstShare} to secure your seat, the rest from your dashboard.`, featured: true }]
              : []),
          ].map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className={`relative overflow-hidden rounded-[28px] p-8 shadow-xl ${plan.featured ? 'bg-qore-dark text-white shadow-qore-dark/25' : 'border border-gray-100 bg-white shadow-qore-dark/5'}`}
            >
              {plan.featured && <span className="absolute right-6 top-6 rounded-full bg-gradient-to-r from-[#FFB020] to-[#FF6A00] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Most flexible</span>}
              {plan.featured && <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-qore-medium/40 blur-3xl" />}
              <p className={`relative text-sm font-bold ${plan.featured ? 'text-qore-highlight' : 'text-qore-medium'}`}>{plan.name}</p>
              <p className="relative mt-1 text-xs opacity-60">{ex.track}</p>
              <motion.p key={`${ex.track}-${plan.now}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="relative mt-5 font-display text-5xl font-extrabold">
                {naira(plan.now)}
              </motion.p>
              <p className="relative mt-1 text-sm opacity-60">{plan.later ? `today, then ${naira(plan.later)} later` : 'today — nothing more to pay'}</p>
              <p className="relative mt-5 text-sm opacity-80">{plan.note}</p>
              <ul className="relative mt-6 space-y-2.5 text-sm">
                {INCLUDED.map((x) => (
                  <li key={x} className="flex items-center gap-2.5">
                    <Check size={15} className={plan.featured ? 'text-[#FFB020]' : 'text-qore-medium'} /> <span className="opacity-85">{x}</span>
                  </li>
                ))}
              </ul>
              <Link to={`/public/tracks/${toSlug(ex.track)}`} className={`relative mt-8 flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold transition-colors ${plan.featured ? 'bg-gradient-to-r from-[#FFB020] to-[#FF6A00] text-white' : 'bg-qore-dark text-white hover:bg-qore-medium'}`}>
                See {ex.track.replace(' (UI/UX)', '')} <ArrowRight size={15} />
              </Link>
            </motion.div>
          ))}
        </section>
      )}

      {/* Open cohorts */}
      <section className="mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-qore-medium">Open cohorts</p>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-qore-dark sm:text-4xl">Enrolling now</h2>
        </div>
        {cohorts === null && <div className="h-40 animate-pulse rounded-3xl bg-qore-dark/10" />}
        {cohorts?.length === 0 && (
          <div className="rounded-3xl border border-dashed border-qore-medium/30 bg-white p-12 text-center">
            <CalendarDays size={28} className="mx-auto text-qore-medium" />
            <p className="mt-4 font-display text-xl font-bold text-qore-dark">No cohort is open right now</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">Create a free account and we'll email you the moment the next cohort opens.</p>
            <Link to="/register" className="mt-6 inline-flex items-center gap-2 rounded-full bg-qore-dark px-6 py-3 text-sm font-bold text-white hover:bg-qore-medium">
              Get notified <ArrowRight size={15} />
            </Link>
          </div>
        )}
        <div className="space-y-6">
          {(cohorts ?? []).map((c) => (
            <div key={c.id} className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
              <div className="flex flex-col gap-2 border-b border-gray-100 bg-gradient-to-r from-qore-dark to-[#0E2B78] px-7 py-5 text-white sm:flex-row sm:items-center sm:justify-between">
                <p className="font-display text-xl font-bold">{c.name}</p>
                <p className="flex items-center gap-2 text-sm text-white/70"><CalendarDays size={14} /> {shortDate(c.startDate)} → {shortDate(c.endDate)}</p>
              </div>
              {(c.programs ?? []).length === 0 && <p className="px-7 py-6 text-sm text-gray-400">Tracks for this cohort are being finalised.</p>}
              {(c.programs ?? []).map((p: any) => {
                const Icon = trackIcon(p.track);
                const left = p.maxLearners ? Math.max(0, p.maxLearners - (p.seatsTaken ?? 0)) : null;
                return (
                  <div key={p.id} className="flex flex-col gap-4 border-b border-gray-50 px-7 py-5 last:border-0 sm:flex-row sm:items-center">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-qore-light"><Icon size={18} className="text-qore-medium" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-qore-dark">{p.track}</p>
                      {left !== null && (
                        <p className={`mt-0.5 flex items-center gap-1.5 text-xs ${left === 0 ? 'text-red-500' : left <= 5 ? 'text-[#FF6A00]' : 'text-gray-400'}`}>
                          <Users size={12} /> {left === 0 ? 'Full' : `${left} seat${left === 1 ? '' : 's'} left`}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-display text-xl font-extrabold text-qore-dark">{Number(p.price) > 0 ? naira(Number(p.price)) : 'TBA'}</p>
                      {Number(p.price) > 0 && payPlan.allowInstallments && <p className="text-[11px] text-[#FF6A00]">or {naira(Math.round((Number(p.price) * pct) / 100))} to start</p>}
                    </div>
                    <Link to={`/public/tracks/${toSlug(p.track)}?cohort=${c.id}&program=${p.id}`} className="rounded-xl border border-gray-200 px-4 py-2.5 text-center text-xs font-bold text-qore-dark transition-colors hover:border-qore-medium hover:text-qore-medium">
                      View track
                    </Link>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      {/* Refund policy + payment methods */}
      <section className="bg-white py-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-qore-medium">If plans change</p>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-qore-dark">Our refund policy</h2>
            <p className="mt-3 text-gray-500">Withdraw any time from your dashboard. Your refund depends on when you withdraw, and every refund is reviewed by our team before money moves.</p>
            {policy && (
              <ol className="relative mt-8 space-y-6 border-l-2 border-dashed border-qore-medium/30 pl-8">
                {[
                  { when: 'Before the cohort starts', what: policy.fullRefundBeforeStart ? '100%' : `${policy.gracePercent}%` },
                  { when: `First ${policy.graceDays} day${policy.graceDays === 1 ? '' : 's'} after it starts`, what: `${policy.gracePercent}%` },
                  { when: 'After that', what: `${policy.afterPercent}%` },
                ].map((s, i) => (
                  <li key={s.when} className="relative">
                    <span className={`absolute -left-[41px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white ${i === 0 ? 'bg-green-500' : i === 1 ? 'bg-[#FFB020]' : 'bg-gray-300'}`} />
                    <p className="text-sm text-gray-500">{s.when}</p>
                    <p className="font-display text-2xl font-extrabold text-qore-dark">{s.what} <span className="text-base font-semibold text-gray-400">refund of what you've paid</span></p>
                  </li>
                ))}
              </ol>
            )}
            <p className="mt-6 text-xs text-gray-400">If we cancel a cohort, you're always refunded in full.</p>
          </div>

          <div className="rounded-[28px] bg-[#F5F8FF] p-8">
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-qore-medium"><Lock size={13} /> Secure checkout</p>
            <h3 className="font-display text-2xl font-extrabold text-qore-dark">Pay the way you prefer</h3>
            <p className="mt-2 text-sm text-gray-500">Payments are processed by Paystack. We never see or store your card details.</p>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[[CreditCard, 'Card'], [Landmark, 'Bank transfer'], [Smartphone, 'USSD']].map(([I, t]: any) => (
                <div key={t} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
                  <I size={18} className="text-qore-medium" /> <span className="text-sm font-semibold text-qore-dark">{t}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-4 border-t border-gray-200 pt-6 text-sm">
              {[
                ['When do I pay the second instalment?', "Whenever you're ready — it shows as a balance on your Payments page until it's paid."],
                ['Do I get a receipt?', 'Yes. A receipt is emailed to you as soon as your payment is confirmed.'],
                ['Is my seat guaranteed?', 'Your seat is secured the moment your first payment is confirmed.'],
              ].map(([q, a]) => (
                <div key={q}>
                  <p className="flex items-center gap-2 font-semibold text-qore-dark"><ShieldCheck size={15} className="text-[#FF6A00]" /> {q}</p>
                  <p className="mt-1 pl-6 text-gray-500">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
