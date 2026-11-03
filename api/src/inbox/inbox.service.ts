import { Injectable } from '@nestjs/common';
import { DataSource, In, MoreThan, Between } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { WithdrawalRequest, WithdrawalStatus } from '../withdrawals/withdrawal-request.entity';
import { GraduationRecord, GraduationStatus } from '../graduation/graduation.entity';
import { Enrollment, EnrollmentStatus } from '../enrollments/enrollment.entity';
import { Payment, PaymentStatus } from '../payments/payment.entity';
import { Submission, SubmissionStatus } from '../assignments/submission.entity';
import { Session } from '../sessions/session.entity';
import { Announcement } from '../announcements/announcement.entity';
import { Certificate } from '../certificates/certificate.entity';
import { AccessService, Caller } from '../access/access.service';
import { effectivePermissions } from '../auth/permissions';

export interface InboxItem {
  id: string;
  kind: 'action' | 'info' | 'success' | 'reminder';
  title: string;
  detail: string;
  link: string;
  at: string;
  unread?: boolean;
}

const DAY = 864e5;
const ago = (days: number) => new Date(Date.now() - days * DAY);
const naira = (n: unknown) => `₦${Number(n ?? 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
const name = (u?: Partial<User> | null) => (u ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email || 'Someone' : 'Someone');
const iso = (d: unknown) => new Date(d as any).toISOString();
/** A reminder becomes "new" once, when the session enters the reminder window (or when created, if later). */
const remindAt = (s: { createdAt: Date; scheduledAt: Date } | any, windowMs: number) => iso(Math.max(+new Date(s.createdAt), +new Date(s.scheduledAt) - windowMs));

/**
 * The in-app notification feed behind the portal bell. Items are computed live from
 * existing records (no separate notifications table), tailored to the caller's role;
 * "unread" = newer than the last time this user opened the bell.
 */
@Injectable()
export class InboxService {
  constructor(private dataSource: DataSource, private access: AccessService) {}

  private repo<T>(entity: new () => T) {
    return this.dataSource.getRepository(entity);
  }

  async feed(caller: Caller) {
    const user = await this.repo(User).findOneBy({ id: caller.id });
    const items =
      caller.role === UserRole.ADMIN ? await this.forAdmin(user)
      : caller.role === UserRole.LEARNER ? await this.forLearner(caller)
      : await this.forStaff(caller);
    const seen = user?.notificationsSeenAt ? +new Date(user.notificationsSeenAt) : 0;
    const sorted = items
      .sort((a, b) => +new Date(b.at) - +new Date(a.at))
      .slice(0, 25)
      .map((i) => ({ ...i, unread: +new Date(i.at) > seen }));
    return { items: sorted, unread: sorted.filter((i) => i.unread).length };
  }

  async markSeen(userId: string) {
    await this.repo(User).update(userId, { notificationsSeenAt: new Date() });
    return { ok: true };
  }

  // ── Admin ───────────────────────────────────────────────────────────────────

  private async forAdmin(user: any): Promise<InboxItem[]> {
    // Only show what this admin is allowed to act on (super admins see everything).
    const perms = user?.isSuperAdmin ? null : effectivePermissions(user ?? { role: 'admin', permissions: null });
    const can = (p: string) => !perms || perms.includes(p);
    const [withdrawals, graduations, enrollments, payments, signups] = await Promise.all([
      this.repo(WithdrawalRequest).find({ where: { status: WithdrawalStatus.PENDING }, order: { createdAt: 'DESC' }, take: 10 }),
      this.repo(GraduationRecord).find({ where: { status: GraduationStatus.PENDING }, order: { createdAt: 'DESC' }, take: 10 }),
      this.repo(Enrollment).find({ where: { status: EnrollmentStatus.PENDING }, order: { enrolledAt: 'DESC' }, take: 10 }),
      this.repo(Payment).find({ where: { status: PaymentStatus.PAID, updatedAt: MoreThan(ago(7)) }, order: { updatedAt: 'DESC' }, take: 10 }),
      this.repo(User).find({ where: { role: UserRole.LEARNER, createdAt: MoreThan(ago(7)) }, order: { createdAt: 'DESC' }, take: 10 }),
    ]);
    return [
      ...(can('payments') ? withdrawals : []).map((w) => ({
        id: `wd-${w.id}`, kind: 'action' as const,
        title: 'Withdrawal needs review',
        detail: `${name(w.learner)} left ${w.program?.track ?? 'a program'} — suggested refund ${naira(w.suggestedRefund)}`,
        link: '/admin/withdrawals', at: iso(w.createdAt),
      })),
      ...(can('graduation') ? graduations : []).map((g) => ({
        id: `gr-${g.id}`, kind: 'action' as const,
        title: 'Graduation awaiting approval',
        detail: `${name(g.enrollment?.learner)} · ${g.enrollment?.program?.track ?? ''} — recommended "${g.recommendation}"`,
        link: '/admin/graduation', at: iso(g.createdAt),
      })),
      ...(can('enrollments') ? enrollments : []).map((e) => ({
        id: `en-${e.id}`, kind: 'action' as const,
        title: 'Enrollment awaiting review',
        detail: `${name(e.learner)} · ${e.program?.track ?? 'a program'}`,
        link: '/admin/enrollments', at: iso(e.enrolledAt),
      })),
      ...(can('payments') || can('revenue') ? payments : []).map((p) => ({
        id: `pay-${p.id}`, kind: 'success' as const,
        title: `Payment received — ${naira(p.amount)}`,
        detail: `${name(p.user)} · ${p.program?.track ?? ''}${p.totalInstallments ? ` (instalment ${p.installmentNumber}/${p.totalInstallments})` : ''}`,
        link: '/admin/payments', at: iso(p.updatedAt),
      })),
      ...(can('users') ? signups : []).map((u) => ({
        id: `su-${u.id}`, kind: 'info' as const,
        title: 'New learner signed up',
        detail: `${name(u)} · ${u.email}`,
        link: '/admin/users', at: iso(u.createdAt),
      })),
    ];
  }

  // ── Instructor / assistant ─────────────────────────────────────────────────

  private async forStaff(caller: Caller): Promise<InboxItem[]> {
    const programIds = await this.access.staffProgramIds(caller.id);
    const cohortIds = await this.access.cohortIdsFor(caller, false);
    if (!programIds.length) return [];
    const [ungraded, sessions, joins] = await Promise.all([
      cohortIds.length
        ? this.repo(Submission).find({
            where: { status: SubmissionStatus.SUBMITTED, assignment: { cohort: { id: In(cohortIds) } } },
            relations: { assignment: true },
            order: { submittedAt: 'DESC' },
            take: 15,
          })
        : [],
      this.repo(Session).find({
        where: { program: { id: In(programIds) }, scheduledAt: Between(new Date(), new Date(Date.now() + DAY)) },
        order: { scheduledAt: 'ASC' },
      }),
      this.repo(Enrollment).find({
        where: { program: { id: In(programIds) }, status: EnrollmentStatus.APPROVED, updatedAt: MoreThan(ago(7)) },
        order: { updatedAt: 'DESC' },
        take: 10,
      }),
    ]);
    return [
      ...ungraded.map((s) => ({
        id: `sub-${s.id}`, kind: 'action' as const,
        title: 'Submission to grade',
        detail: `${name(s.learner)} · ${s.assignment?.title ?? 'an assignment'}`,
        link: '/instructor/assignments', at: iso(s.submittedAt),
      })),
      ...sessions.map((s) => ({
        id: `ses-${s.id}`, kind: 'reminder' as const,
        title: 'Session starting soon',
        detail: `${s.title} · ${new Date(s.scheduledAt).toLocaleString('en-GB', { timeZone: 'Africa/Lagos', weekday: 'short', hour: '2-digit', minute: '2-digit' })}`,
        link: '/instructor/sessions', at: remindAt(s, DAY),
      })),
      ...joins.map((e) => ({
        id: `join-${e.id}`, kind: 'info' as const,
        title: 'New learner in your program',
        detail: `${name(e.learner)} joined ${e.program?.track ?? ''}`,
        link: '/instructor/roster', at: iso(e.updatedAt),
      })),
    ];
  }

  // ── Learner ─────────────────────────────────────────────────────────────────

  private async forLearner(caller: Caller): Promise<InboxItem[]> {
    const programIds = await this.access.learnerProgramIds(caller.id);
    const cohortIds = await this.access.cohortIdsFor(caller, true);
    const [announcements, sessions, graded, balances, certs] = await Promise.all([
      this.repo(Announcement)
        .createQueryBuilder('a')
        .leftJoinAndSelect('a.author', 'author')
        .leftJoin('a.cohort', 'cohort')
        .where('a.createdAt > :since', { since: ago(14) })
        .andWhere(cohortIds.length ? '(cohort.id IS NULL OR cohort.id IN (:...cohortIds))' : 'cohort.id IS NULL', { cohortIds })
        .orderBy('a.createdAt', 'DESC')
        .take(10)
        .getMany(),
      programIds.length
        ? this.repo(Session).find({
            where: { program: { id: In(programIds) }, scheduledAt: Between(new Date(), new Date(Date.now() + 2 * DAY)) },
            order: { scheduledAt: 'ASC' },
          })
        : [],
      this.repo(Submission).find({
        where: { learner: { id: caller.id }, status: SubmissionStatus.GRADED, updatedAt: MoreThan(ago(14)) },
        relations: { assignment: true },
        order: { updatedAt: 'DESC' },
        take: 10,
      }),
      this.repo(Payment).find({ where: { user: { id: caller.id }, status: PaymentStatus.PENDING, installmentNumber: 2 } }),
      this.repo(Certificate).find({ where: { user: { id: caller.id } }, order: { createdAt: 'DESC' }, take: 5 }),
    ]);
    return [
      ...announcements.map((a) => ({
        id: `ann-${a.id}`, kind: 'info' as const,
        title: a.title,
        detail: `${a.body.slice(0, 90)}${a.body.length > 90 ? '…' : ''}`,
        link: '/learner/dashboard', at: iso(a.createdAt),
      })),
      ...sessions.map((s) => ({
        id: `ses-${s.id}`, kind: 'reminder' as const,
        title: 'Upcoming live session',
        detail: `${s.title} · ${new Date(s.scheduledAt).toLocaleString('en-GB', { timeZone: 'Africa/Lagos', weekday: 'short', hour: '2-digit', minute: '2-digit' })}`,
        link: '/learner/sessions', at: remindAt(s, 2 * DAY),
      })),
      ...graded.map((s) => ({
        id: `grd-${s.id}`, kind: 'success' as const,
        title: `Graded: ${s.assignment?.title ?? 'assignment'}`,
        detail: `You scored ${Number(s.score)}${s.assignment?.maxScore ? ` / ${s.assignment.maxScore}` : ''}`,
        link: '/learner/assignments', at: iso(s.updatedAt),
      })),
      ...balances.map((p) => ({
        id: `bal-${p.id}`, kind: 'action' as const,
        title: 'Instalment balance due',
        detail: `${naira(p.amount)} left to pay for ${p.program?.track ?? 'your program'}`,
        link: '/learner/payments', at: iso(p.createdAt),
      })),
      ...certs.map((c) => ({
        id: `cert-${c.id}`, kind: 'success' as const,
        title: 'Your certificate is ready 🎓',
        detail: c.certificateNumber,
        link: '/learner/certificate', at: iso(c.createdAt),
      })),
    ];
  }
}
