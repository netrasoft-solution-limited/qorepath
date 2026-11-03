import { SetMetadata } from '@nestjs/common';

export interface AuditContext {
  params: Record<string, string>;
  body: any;
  result: any;
  // The row as it was before the handler ran (only when `load` is set).
  before: any;
  // The same row re-read after the handler ran (only when `load` is set and it existed).
  after: any;
  user: { id: string; email: string; role: string };
}

export interface AuditOptions {
  action: string;
  entity: string;
  /** Loads this entity by :id before the handler runs, so deletes and edits can be described. */
  load?: Function;
  /** Fields whose before/after values are stored. Never list secrets. */
  track?: string[];
  /** With `track`: don't log an edit that changed none of the tracked fields. */
  skipIfUnchanged?: boolean;
  summary: (ctx: AuditContext) => string;
  /** Return false to skip logging (e.g. a learner editing their own profile). */
  when?: (ctx: AuditContext) => boolean;
  /** Overrides the action name per call (e.g. SUSPEND vs UPDATE). */
  actionFor?: (ctx: AuditContext) => string;
}

export const AUDIT_KEY = 'audit';
export const Audit = (opts: AuditOptions) => SetMetadata(AUDIT_KEY, opts);

export const fullName = (u: any) =>
  u ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email || 'unknown' : 'unknown';

export const naira = (n: any) => `₦${Number(n || 0).toLocaleString('en-NG')}`;
