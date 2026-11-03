import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Lock, ShieldCheck, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import api from '../lib/api';
import PaystackPop from '@paystack/inline-js';

type Plan = 'full' | 'installments';

// ── Paystack Payment Modal ──────────────────────────────────────────────────
// Two modes:
//   • program mode  (pass `program`): choose full or 2×50% installments → /payments/initialize
//   • balance mode  (pass `payment`): pay a pending installment balance     → /payments/:id/checkout
export function PaymentModal({
  program,
  payment,
  onClose,
  onSuccess,
}: {
  program?: any;
  payment?: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isBalance = !!payment;
  const [plan, setPlan] = useState<Plan>('full');
  // confirm → opening → paying (Paystack popup) → verifying → success | error
  const [step, setStep] = useState<'confirm' | 'opening' | 'paying' | 'verifying' | 'success' | 'error'>('confirm');
  const [error, setError] = useState('');

  const track = isBalance ? payment.program?.track : program?.track;
  const cohortName = isBalance
    ? payment.program?.cohort?.name ?? payment.cohort?.name
    : program?.cohortName;

  const basePrice = Number(program?.price ?? 0);
  const firstInstallment = Math.round(basePrice / 2);
  const secondInstallment = basePrice - firstInstallment;
  const chargeNow = isBalance
    ? Number(payment.amount)
    : plan === 'installments'
    ? firstInstallment
    : basePrice;

  const naira = (n: number) => `₦${n.toLocaleString()}`;
  const busy = step === 'opening' || step === 'paying' || step === 'verifying';

  const verify = async (reference: string) => {
    setStep('verifying');
    try {
      const { data } = await api.get('/payments/verify', { params: { reference } });
      if (data.status === 'success') {
        setStep('success');
        setTimeout(onSuccess, 1800);
      } else {
        setStep('error');
        setError('Your payment could not be confirmed. If you were charged, contact support.');
      }
    } catch (err: any) {
      setStep('error');
      setError(err.response?.data?.message || 'We could not confirm your payment. Please try again.');
    }
  };

  const handlePay = async () => {
    setError('');
    setStep('opening');
    try {
      const { data } = isBalance
        ? await api.post(`/payments/${payment.id}/checkout`)
        : await api.post('/payments/initialize', { programId: program.id, plan });
      const { accessCode, reference } = data;

      setStep('paying');
      const popup = new PaystackPop();
      popup.resumeTransaction(accessCode, {
        onSuccess: () => verify(reference),
        onCancel: () => { setStep('confirm'); },
        onError: (err) => {
          setStep('error');
          setError(err?.message || 'Payment was interrupted. Please try again.');
        },
      });
    } catch (err: any) {
      setStep('error');
      setError(err.response?.data?.message || 'Could not start checkout. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={!busy ? onClose : undefined}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header bar */}
        <div className="bg-[#0A1F5C] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <Lock size={14} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">{isBalance ? 'Pay Balance' : 'Secure Checkout'}</p>
              <p className="text-blue-200/70 text-xs">Powered by Paystack</p>
            </div>
          </div>
          {!busy && (
            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Order summary */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">
            {isBalance ? 'Outstanding balance for' : 'You are enrolling in'}
          </p>
          <p className="font-bold text-gray-900">{track}</p>
          <p className="text-xs text-gray-400">{cohortName}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-gray-500">{isBalance ? 'Balance due' : 'Amount due now'}</span>
            <span className="text-xl font-extrabold text-gray-900">{naira(chargeNow)}</span>
          </div>
          {!isBalance && plan === 'installments' && (
            <p className="text-[10px] text-qore-medium font-semibold mt-1">
              {naira(firstInstallment)} now · {naira(secondInstallment)} balance due later
            </p>
          )}
          {isBalance && (
            <p className="text-[10px] text-qore-medium font-semibold mt-1">Installment 2 of 2</p>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {(step === 'confirm' || step === 'error') && (
            <div className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 text-xs rounded-xl px-3 py-2.5">
                  <AlertCircle size={14} className="shrink-0" /> {error}
                </div>
              )}

              {/* Plan selector (program mode only) */}
              {!isBalance && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPlan('full')}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      plan === 'full' ? 'border-qore-medium bg-qore-light/40 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="text-xs font-semibold text-gray-500">Pay in full</p>
                    <p className="font-bold text-gray-900 text-sm mt-0.5">{naira(basePrice)}</p>
                  </button>
                  <button
                    onClick={() => setPlan('installments')}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      plan === 'installments' ? 'border-qore-medium bg-qore-light/40 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="text-xs font-semibold text-gray-500">2 installments</p>
                    <p className="font-bold text-gray-900 text-sm mt-0.5">{naira(firstInstallment)} <span className="font-normal text-gray-400">now</span></p>
                  </button>
                </div>
              )}

              <p className="text-sm text-gray-500">
                You'll complete your payment securely through Paystack — card, bank transfer, or USSD.
                {isBalance ? ' This clears your remaining balance.' : ' You get access as soon as your first payment is confirmed.'}
              </p>

              <button
                onClick={handlePay}
                className="w-full bg-[#0A1F5C] hover:bg-[#0B5CF0] text-white py-3.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Lock size={14} /> {step === 'error' ? 'Try Again' : `Pay ${naira(chargeNow)} with Paystack`}
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <ShieldCheck size={13} className="text-gray-300" />
                Payments are processed securely by Paystack
              </div>
            </div>
          )}

          {(step === 'opening' || step === 'paying' || step === 'verifying') && (
            <div className="py-10 flex flex-col items-center gap-4">
              <div className="w-14 h-14 bg-qore-light rounded-full flex items-center justify-center">
                <Loader2 size={26} className="text-qore-medium animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900">
                  {step === 'verifying' ? 'Confirming your payment…' : step === 'paying' ? 'Complete your payment…' : 'Starting secure checkout…'}
                </p>
                <p className="text-sm text-gray-400 mt-1">Please do not close this window</p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-10 flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <div className="text-center">
                <p className="font-extrabold text-gray-900 text-lg">Payment Successful!</p>
                <p className="text-sm text-gray-500 mt-1">
                  {isBalance ? <>Your balance for <strong>{track}</strong> is cleared.</> : <>You are now enrolled in <strong>{track}</strong>.</>}
                </p>
                <p className="text-xs text-gray-400 mt-1">Redirecting…</p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default PaymentModal;
