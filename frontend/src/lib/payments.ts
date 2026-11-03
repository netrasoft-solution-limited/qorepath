import api from './api';

/**
 * Asks the server to re-check this learner's unconfirmed payments with Paystack.
 * Called when payment-related pages load, so a payment still settles even if the
 * browser closed before checkout finished. Never throws — the page loads either way.
 */
export function reconcilePayments(): Promise<unknown> {
  return api.post('/payments/reconcile').catch(() => null);
}
