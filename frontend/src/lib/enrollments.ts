// Helpers for choosing the learner's "current" enrollment.
//
// An enrollment links a learner to a PROGRAM (a track), and the cohort is
// nested under the program: enrollment.program.cohort. There is no top-level
// enrollment.cohort — always read cohort via the program.

const ONGOING_COHORT_STATUSES = ['active', 'upcoming'];

/**
 * Picks the enrollment a learner is currently working through:
 *  1. an approved enrollment whose cohort is still running, else
 *  2. any approved enrollment, else
 *  3. any pending enrollment, else null.
 * Avoids arbitrarily grabbing enrollments[0] (which could be withdrawn/old).
 */
export function pickCurrentEnrollment(enrollments: any[] | undefined | null): any | null {
  if (!enrollments?.length) return null;
  return (
    enrollments.find(
      (e) => e.status === 'approved' && ONGOING_COHORT_STATUSES.includes(e.program?.cohort?.status),
    ) ??
    enrollments.find((e) => e.status === 'approved') ??
    enrollments.find((e) => e.status === 'pending') ??
    null
  );
}

/** The cohort id for an enrollment, read through the program. */
export function enrollmentCohortId(enrollment: any): string | undefined {
  return enrollment?.program?.cohort?.id;
}
