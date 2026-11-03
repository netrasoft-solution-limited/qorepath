import { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { toSlug } from '../CourseListing';

export interface OpenProgram {
  id: string;
  track: string;
  description?: string;
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
    api
      .get('/cohorts')
      .then(({ data }) => {
        const open: OpenProgram[] = [];
        for (const cohort of data ?? []) {
          if (cohort.status !== 'active' && cohort.status !== 'upcoming') continue;
          for (const p of cohort.programs ?? []) {
            open.push({
              id: p.id,
              track: p.track,
              description: p.description,
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
