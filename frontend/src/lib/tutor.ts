import api from './api';

// The instructor/assistant is assigned to a PROGRAM (a track), and the cohort
// is nested under it (program.cohort). Tutor pages must resolve their program
// via /programs/mine — never via cohort.instructor (cohorts have no instructor).

export async function fetchMyPrograms(): Promise<any[]> {
  const { data } = await api.get('/programs/mine');
  return Array.isArray(data) ? data : [];
}

/** The tutor's primary program — prefers one in an active cohort, else the most recent. */
export function pickPrimaryProgram(programs: any[]): any | null {
  if (!programs?.length) return null;
  return programs.find((p) => p.cohort?.status === 'active') ?? programs[0];
}

export async function getMyProgram(): Promise<any | null> {
  return pickPrimaryProgram(await fetchMyPrograms());
}
