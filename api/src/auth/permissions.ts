import { SetMetadata } from '@nestjs/common';

// Admin permission keys (must match frontend/src/lib/permissions.ts).
export const ADMIN_PERMISSIONS = [
  'cohorts', 'enrollments', 'payments', 'at_risk', 'instructors', 'graduation',
  'certificates', 'revenue', 'reports', 'settings', 'users', 'audit_log',
] as const;
export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  admin: [...ADMIN_PERMISSIONS],
  instructor: ['sessions', 'calendar', 'attendance', 'assignments', 'roster', 'announcements', 'materials', 'graduation'],
  assistant: ['sessions', 'calendar', 'attendance', 'assignments', 'roster', 'announcements', 'materials', 'graduation'],
  learner: ['sessions', 'calendar', 'assignments', 'capstone', 'progress', 'payments', 'certificate', 'profile'],
};

export const PERMISSIONS_KEY = 'adminPermissions';

/**
 * For admin callers, require at least one of these permission keys (super admins
 * always pass). Non-admin roles are unaffected — their access is governed by
 * @Roles and AccessService. Enforced by RolesGuard.
 */
export const RequirePermission = (...anyOf: AdminPermission[]) => SetMetadata(PERMISSIONS_KEY, anyOf);

/** An admin's effective permissions: their saved list, or the role defaults if none was ever set. */
export function effectivePermissions(user: { role: string; permissions?: string[] | null }): string[] {
  return Array.isArray(user.permissions) ? user.permissions : ROLE_DEFAULT_PERMISSIONS[user.role] ?? [];
}
