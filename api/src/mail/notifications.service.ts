import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { MailService, OutgoingEmail } from './mail.service';
import * as T from './mail.templates';
import { SettingsService } from '../settings/settings.service';
import { emailKind } from './email-catalog';
import { User, UserRole } from '../users/user.entity';
import { Enrollment, EnrollmentStatus } from '../enrollments/enrollment.entity';
import { Payment, PaymentStatus } from '../payments/payment.entity';
import { WithdrawalRequest, WithdrawalStatus } from '../withdrawals/withdrawal-request.entity';
import { Announcement } from '../announcements/announcement.entity';
import { Session } from '../sessions/session.entity';
import { Submission } from '../assignments/submission.entity';
import { Certificate } from '../certificates/certificate.entity';
import { GraduationRecord, GraduationStatus } from '../graduation/graduation.entity';
import { Program } from '../programs/program.entity';

type Recipient = Pick<User, 'email' | 'firstName'>;

/**
 * Turns domain events into emails. Every public method is fire-and-forget:
 * it returns immediately, loads what it needs in the background, and only
 * logs on failure — callers never wait on (or break because of) email.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private mail: MailService,
    private config: ConfigService,
    private dataSource: DataSource,
    private settings: SettingsService,
  ) {}

  private get appUrl() {
    return (this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173').replace(/\/$/, '');
  }

  // `label` is the email's key in EMAIL_CATALOG: admins can switch it off or add a note to it.
  private run(label: string, build: () => Promise<OutgoingEmail[]>): void {
    this.settings.getEmailSettings()
      .then(async (all) => {
        const setting = all[label];
        if (setting && !setting.enabled && !emailKind(label)?.locked) return;
        const emails = await build();
        return this.mail.send(setting?.note ? emails.map((e) => ({ ...e, ...T.withNote(e, setting.note) })) : emails.map((e) => ({ ...e, ...T.withNote(e) })));
      })
      .catch((err) => this.logger.error(`Notification "${label}" failed`, err as Error));
  }

  private toEach(recipients: Recipient[], content: (r: Recipient) => T.EmailContent): OutgoingEmail[] {
    return recipients.map((r) => ({ to: r.email, ...content(r) }));
  }

  // ── Recipient lists ─────────────────────────────────────────────────────────

  private unique(users: (Recipient | null | undefined)[]): Recipient[] {
    const seen = new Map<string, Recipient>();
    for (const u of users) if (u?.email && !seen.has(u.email)) seen.set(u.email, u);
    return [...seen.values()];
  }

  private async learnersOfProgram(programId: string): Promise<Recipient[]> {
    const rows = await this.dataSource
      .getRepository(Enrollment)
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.learner', 'learner')
      .leftJoin('e.program', 'program')
      .where('program.id = :programId', { programId })
      .andWhere('e.status = :status', { status: EnrollmentStatus.APPROVED })
      .andWhere('learner.isActive = true')
      .getMany();
    return this.unique(rows.map((r) => r.learner));
  }

  private async learnersOfCohort(cohortId: string): Promise<Recipient[]> {
    const rows = await this.dataSource
      .getRepository(Enrollment)
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.learner', 'learner')
      .leftJoin('e.program', 'program')
      .leftJoin('program.cohort', 'cohort')
      .where('cohort.id = :cohortId', { cohortId })
      .andWhere('e.status = :status', { status: EnrollmentStatus.APPROVED })
      .andWhere('learner.isActive = true')
      .getMany();
    return this.unique(rows.map((r) => r.learner));
  }

  private async allActiveLearners(): Promise<Recipient[]> {
    const users = await this.dataSource
      .getRepository(User)
      .find({ where: { role: UserRole.LEARNER, isActive: true } });
    return this.unique(users);
  }

  // ── Account ─────────────────────────────────────────────────────────────────

  welcome(user: Recipient): void {
    this.run('welcome', async () => [{ to: user.email, ...T.welcomeEmail({ firstName: user.firstName, appUrl: this.appUrl }) }]);
  }

  passwordReset(user: Recipient, token: string): void {
    const link = `${this.appUrl}/reset-password?token=${encodeURIComponent(token)}`;
    this.run('password reset', async () => [{ to: user.email, ...T.passwordResetEmail({ firstName: user.firstName, link }) }]);
  }

  staffAccountCreated(user: Recipient & { role: string }, token: string): void {
    const link = `${this.appUrl}/reset-password?token=${encodeURIComponent(token)}&welcome=1`;
    this.run('account created', async () => [
      { to: user.email, ...T.staffAccountEmail({ firstName: user.firstName, role: user.role, email: user.email, link }) },
    ]);
  }

  // ── Payments & enrollment ───────────────────────────────────────────────────

  paymentSettled(paymentId: string): void {
    this.run('payment receipt', async () => {
      const repo = this.dataSource.getRepository(Payment);
      const payment = await repo.findOne({
        where: { id: paymentId },
        relations: { user: true, program: { cohort: true } },
      });
      if (!payment?.user) return [];

      let balance = 0;
      if (payment.planReference && payment.installmentNumber < payment.totalInstallments) {
        const pending = await repo.find({
          where: { planReference: payment.planReference, status: PaymentStatus.PENDING },
        });
        balance = pending.reduce((s, p) => s + Number(p.amount), 0);
      }

      return [
        {
          to: payment.user.email,
          ...T.paymentReceiptEmail({
            firstName: payment.user.firstName,
            amount: payment.amount,
            reference: payment.paystackReference ?? payment.reference,
            track: payment.program?.track ?? 'your program',
            cohort: payment.program?.cohort?.name,
            startDate: payment.program?.cohort?.startDate,
            installment: payment.totalInstallments
              ? { number: payment.installmentNumber, total: payment.totalInstallments }
              : undefined,
            balance,
            appUrl: this.appUrl,
          }),
        },
      ];
    });
  }

  enrollmentStatusChanged(enrollmentId: string): void {
    this.run('enrollment status', async () => {
      const e = await this.dataSource.getRepository(Enrollment).findOne({
        where: { id: enrollmentId },
        relations: { learner: true, program: { cohort: true } },
      });
      if (!e?.learner) return [];
      if (e.status !== EnrollmentStatus.APPROVED && e.status !== EnrollmentStatus.REJECTED) return [];
      return [
        {
          to: e.learner.email,
          ...T.enrollmentStatusEmail({
            firstName: e.learner.firstName,
            approved: e.status === EnrollmentStatus.APPROVED,
            track: e.program?.track ?? 'your program',
            cohort: e.program?.cohort?.name,
            appUrl: this.appUrl,
          }),
        },
      ];
    });
  }

  withdrawalRequested(requestId: string): void {
    this.run('withdrawal received', async () => {
      const r = await this.dataSource.getRepository(WithdrawalRequest).findOneBy({ id: requestId });
      if (!r?.learner) return [];
      return [
        {
          to: r.learner.email,
          ...T.withdrawalReceivedEmail({
            firstName: r.learner.firstName,
            track: r.program?.track ?? 'your program',
            amountPaid: r.amountPaid,
            suggestedRefund: r.suggestedRefund,
          }),
        },
      ];
    });
  }

  withdrawalResolved(requestId: string): void {
    this.run('withdrawal resolved', async () => {
      const r = await this.dataSource.getRepository(WithdrawalRequest).findOneBy({ id: requestId });
      if (!r?.learner || r.status === WithdrawalStatus.PENDING) return [];
      return [
        {
          to: r.learner.email,
          ...T.withdrawalResolvedEmail({
            firstName: r.learner.firstName,
            track: r.program?.track ?? 'your program',
            approved: r.status === WithdrawalStatus.APPROVED,
            refund: r.approvedRefund,
            note: r.adminNote,
          }),
        },
      ];
    });
  }

  // ── Learning activity ───────────────────────────────────────────────────────

  announcementPosted(announcementId: string): void {
    this.run('announcement', async () => {
      const a = await this.dataSource.getRepository(Announcement).findOne({
        where: { id: announcementId },
        relations: { cohort: true },
      });
      if (!a) return [];
      // Cohort announcements go to that cohort's learners; platform-wide ones to everyone.
      const recipients = a.cohort ? await this.learnersOfCohort(a.cohort.id) : await this.allActiveLearners();
      const author = a.author ? `${a.author.firstName ?? ''} ${a.author.lastName ?? ''}`.trim() : undefined;
      return this.toEach(recipients, (r) =>
        T.announcementEmail({ firstName: r.firstName, title: a.title, body: a.body, author, appUrl: this.appUrl }),
      );
    });
  }

  sessionScheduled(sessionId: string): void {
    this.run('session scheduled', async () => {
      const s = await this.dataSource.getRepository(Session).findOneBy({ id: sessionId });
      if (!s?.program?.id) return [];
      const recipients = await this.learnersOfProgram(s.program.id);
      return this.toEach(recipients, (r) =>
        T.sessionScheduledEmail({
          firstName: r.firstName,
          title: s.title,
          description: s.description,
          track: s.program.track,
          scheduledAt: s.scheduledAt,
          durationMinutes: s.durationMinutes,
          appUrl: this.appUrl,
        }),
      );
    });
  }

  submissionGraded(submissionId: string): void {
    this.run('submission graded', async () => {
      const s = await this.dataSource.getRepository(Submission).findOne({
        where: { id: submissionId },
        relations: { learner: true, assignment: true },
      });
      if (!s?.learner) return [];
      return [
        {
          to: s.learner.email,
          ...T.submissionGradedEmail({
            firstName: s.learner.firstName,
            assignment: s.assignment?.title ?? 'Your assignment',
            score: s.score,
            maxScore: s.assignment?.maxScore,
            feedback: s.feedback,
            appUrl: this.appUrl,
          }),
        },
      ];
    });
  }

  certificateIssued(certificateId: string): void {
    this.run('certificate issued', async () => {
      const c = await this.dataSource.getRepository(Certificate).findOneBy({ id: certificateId });
      if (!c?.user) return [];
      return [
        {
          to: c.user.email,
          ...T.certificateIssuedEmail({
            firstName: c.user.firstName,
            cohort: c.cohort?.name,
            certificateNumber: c.certificateNumber,
            issuedDate: c.issuedDate,
            appUrl: this.appUrl,
          }),
        },
      ];
    });
  }

  graduationDecided(recordId: string): void {
    this.run('graduation decision', async () => {
      const g = await this.dataSource.getRepository(GraduationRecord).findOne({
        where: { id: recordId },
        relations: { enrollment: { learner: true, program: true } },
      });
      const learner = g?.enrollment?.learner;
      if (!g || !learner || g.status === GraduationStatus.PENDING) return [];
      return [
        {
          to: learner.email,
          ...T.graduationDecisionEmail({
            firstName: learner.firstName,
            track: g.enrollment.program?.track ?? 'your program',
            status: g.status as 'approved' | 'held' | 'rejected',
            appUrl: this.appUrl,
          }),
        },
      ];
    });
  }

  // ── New cohort alerts ───────────────────────────────────────────────────────

  /** A program (track) was added to a cohort — it's now open for enrollment. */
  programOpened(programId: string): void {
    this.run('program open', async () => {
      const p = await this.dataSource.getRepository(Program).findOne({
        where: { id: programId },
        relations: { cohort: true },
      });
      if (!p) return [];
      if (p.cohort && ['completed', 'cancelled'].includes(p.cohort.status)) return [];
      const recipients = await this.allActiveLearners();
      return this.toEach(recipients, (r) =>
        T.programOpenEmail({
          firstName: r.firstName,
          track: p.track,
          cohort: p.cohort?.name,
          startDate: p.cohort?.startDate,
          price: p.price,
          description: p.description,
          appUrl: this.appUrl,
        }),
      );
    });
  }
}
