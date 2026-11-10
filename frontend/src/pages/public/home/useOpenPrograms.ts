import { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { toSlug } from '../trackSlug';

export interface OpenProgram {
  id: string;
  track: string;
  description?: string;
  duration?: string;
  schedule?: string;
  cohort: string;
  startDate?: string;
  price: number;
  slug: string;
}

/** Programs in active/upcoming cohorts, soonest first. `null` while loading; `[]` if none or on error. */
export function useOpenPrograms(): OpenProgram[] | null {
  const [programs, setPrograms] = useState<OpenProgram[] | null>(null);

  useEffect(() => {
    let alive = true;
    // The free API server can take up to a minute to wake; retry instead of showing the sample tracks.
    const fetchCohorts = async () => {
      for (let attempt = 0; ; attempt++) {
        try {
          return await api.get('/cohorts', { timeout: 30000 });
        } catch (err) {
          if (attempt >= 3 || !alive) throw err;
          await new Promise((r) => setTimeout(r, 5000));
        }
      }
    };
    fetchCohorts()
      .then(({ data }) => {
        const open: OpenProgram[] = [];
        for (const cohort of data ?? []) {
          if (cohort.status !== 'active' && cohort.status !== 'upcoming') continue;
          for (const p of cohort.programs ?? []) {
            open.push({
              id: p.id,
              track: p.track,
              description: p.description,
              duration: p.duration || undefined,
              schedule: p.schedule || undefined,
              cohort: cohort.name,
              startDate: cohort.startDate,
              price: Number(p.price) || 0,
              slug: toSlug(p.track),
            });
          }
        }
        open.sort((a, b) => +new Date(a.startDate ?? 0) - +new Date(b.startDate ?? 0));
        if (alive) setPrograms(open);
      })
      .catch(() => alive && setPrograms([]));
    return () => {
      alive = false;
    };
  }, []);

  return programs;
}

export const shortDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

/** Instalment rules from Settings → Payment Rules (defaults match the server's). */
export function usePaymentPlan() {
  const [plan, setPlan] = useState({ allowInstallments: true, firstInstallmentPercent: 50 });
  useEffect(() => {
    api.get('/settings/enrollment-rules').then(({ data }) => setPlan(data.paymentPlan)).catch(() => {});
  }, []);
  return plan;
}

export const firstPayment = (price: number, percent: number) => Math.round((price * percent) / 100);
