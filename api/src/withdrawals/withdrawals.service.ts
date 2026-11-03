import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WithdrawalRequest, WithdrawalStatus } from './withdrawal-request.entity';
import { Enrollment, EnrollmentStatus } from '../enrollments/enrollment.entity';
import { Payment, PaymentStatus } from '../payments/payment.entity';
import { SettingsService, RefundPolicy } from '../settings/settings.service';
import { PaystackService } from '../payments/paystack.service';
import { NotificationsService } from '../mail/notifications.service';

const DAY = 24 * 60 * 60 * 1000;
const round2 = (n: number) => Math.round(n * 100) / 100;

@Injectable()
export class WithdrawalsService {
  private readonly logger = new Logger(WithdrawalsService.name);

  constructor(
    @InjectRepository(WithdrawalRequest) private repo: Repository<WithdrawalRequest>,
    @InjectRepository(Enrollment) private enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    private settings: SettingsService,
    private paystack: PaystackService,
    private notifications: NotificationsService,
  ) {}

  // ── Learner (or admin) withdraws from a program ──────────────────────────────
  async requestWithdrawal(
    userId: string,
    isAdmin: boolean,
    enrollmentId: string,
    reason?: string,
  ) {
    const enrollment = await this.enrollmentRepo.findOne({
      where: { id: enrollmentId },
      relations: { learner: true, program: { cohort: true } },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (!isAdmin && enrollment.learner?.id !== userId) {
      throw new ForbiddenException('You can only withdraw from your own enrollment');
    }

    // Idempotent: if there's already a request for this enrollment, return it.
    const existing = await this.repo.findOne({
      where: { enrollment: { id: enrollmentId } },
    });
    if (existing) return existing;

    const learnerId = enrollment.learner?.id;
    const programId = enrollment.program?.id;
    const cohort = enrollment.program?.cohort;

    // Withdraw the enrollment + cancel any outstanding installment balance.
    await this.enrollmentRepo.update(enrollmentId, {
      status: EnrollmentStatus.WITHDRAWN,
      ...(reason ? { notes: reason } : {}),
    });
    if (learnerId && programId) {
      await this.paymentRepo.update(
        { user: { id: learnerId }, program: { id: programId }, status: PaymentStatus.PENDING },
        { status: PaymentStatus.CANCELLED },
      );
    }

    const amountPaid = await this.amountPaid(learnerId, programId);
    const policy = await this.settings.getRefundPolicy();
    const progress = this.cohortProgress(cohort);
    const suggestedRefund = this.suggestRefund(amountPaid, cohort, policy);

    const saved = await this.repo.save(
      this.repo.create({
        enrollment: { id: enrollmentId } as any,
        learner: learnerId ? ({ id: learnerId } as any) : undefined,
        program: programId ? ({ id: programId } as any) : undefined,
        status: WithdrawalStatus.PENDING,
        amountPaid,
        suggestedRefund,
        cohortWeek: progress.week,
        cohortTotalWeeks: progress.totalWeeks ?? undefined,
        reason: reason ?? undefined,
      }),
    );
    this.notifications.withdrawalRequested(saved.id);
    return saved;
  }

  // ── Admin queue ──────────────────────────────────────────────────────────────
  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const req = await this.repo.findOneBy({ id });
    if (!req) throw new NotFoundException('Withdrawal request not found');
    return req;
  }

  // ── Admin resolves a request ─────────────────────────────────────────────────
  async resolve(
    id: string,
    decision: 'approved' | 'denied',
    amount?: number,
    adminNote?: string,
  ) {
    const req = await this.findOne(id);
    if (req.status !== WithdrawalStatus.PENDING) {
      throw new BadRequestException('This request has already been resolved');
    }

    if (decision === 'denied') {
      await this.repo.update(id, {
        status: WithdrawalStatus.DENIED,
        approvedRefund: 0,
        adminNote: adminNote ?? undefined,
        resolvedAt: new Date(),
      });
      this.notifications.withdrawalResolved(id);
      return this.findOne(id);
    }

    // approved
    const requested = amount != null ? Number(amount) : Number(req.suggestedRefund);
    const approved = Math.min(Math.max(0, round2(requested)), Number(req.amountPaid));
    if (approved > 0) {
      await this.issueRefund(req.learner?.id, req.program?.id, approved);
    }
    await this.repo.update(id, {
      status: WithdrawalStatus.APPROVED,
      approvedRefund: approved,
      adminNote: adminNote ?? undefined,
      resolvedAt: new Date(),
    });
    this.notifications.withdrawalResolved(id);
    return this.findOne(id);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  private async amountPaid(userId?: string, programId?: string): Promise<number> {
    if (!userId || !programId) return 0;
    const paid = await this.paymentRepo.find({
      where: { user: { id: userId }, program: { id: programId }, status: PaymentStatus.PAID },
    });
    return round2(paid.reduce((s, p) => s + Number(p.amount), 0));
  }

  /** Refund `amountNaira` by allocating across the learner's paid transactions. */
  private async issueRefund(userId?: string, programId?: string, amountNaira = 0) {
    if (!userId || !programId || amountNaira <= 0) return;
    const paid = await this.paymentRepo.find({
      where: { user: { id: userId }, program: { id: programId }, status: PaymentStatus.PAID },
      order: { createdAt: 'DESC' },
    });

    let remainingKobo = Math.round(amountNaira * 100);
    for (const p of paid) {
      if (remainingKobo <= 0) break;
      if (!p.paystackReference) continue;
      const payKobo = Math.round(Number(p.amount) * 100);
      const refundKobo = Math.min(remainingKobo, payKobo);
      await this.paystack.refund(p.paystackReference, refundKobo);
      remainingKobo -= refundKobo;
      if (refundKobo >= payKobo) {
        await this.paymentRepo.update(p.id, { status: PaymentStatus.REFUNDED });
      }
    }
    if (remainingKobo > 0) {
      this.logger.warn(
        `Could not fully allocate refund for user ${userId} / program ${programId}: ₦${remainingKobo / 100} unrefunded`,
      );
    }
  }

  private cohortProgress(cohort: any): { week: number; totalWeeks: number | null } {
    const start = cohort?.startDate ? new Date(cohort.startDate) : null;
    const end = cohort?.endDate ? new Date(cohort.endDate) : null;
    const totalWeeks = start && end ? Math.max(1, Math.ceil((+end - +start) / (7 * DAY))) : null;

    // Cohort status is authoritative for "where are we": an upcoming cohort
    // hasn't begun even if a stale start date is in the past.
    if (cohort?.status === 'upcoming' || cohort?.status === 'cancelled') return { week: 0, totalWeeks };
    if (cohort?.status === 'completed') return { week: totalWeeks ?? 0, totalWeeks };

    if (!start) return { week: 0, totalWeeks };
    const now = new Date();
    if (now < start) return { week: 0, totalWeeks };
    let week = Math.max(1, Math.ceil((+now - +start) / (7 * DAY)));
    if (totalWeeks) week = Math.min(week, totalWeeks);
    return { week, totalWeeks };
  }

  private suggestRefund(amountPaid: number, cohort: any, policy: RefundPolicy): number {
    if (amountPaid <= 0) return 0;
    const status = cohort?.status;

    // Org cancelled the cohort → always refund in full.
    if (status === 'cancelled') return round2(amountPaid);
    // Hasn't started (by status or date) → before-start rule.
    const start = cohort?.startDate ? new Date(cohort.startDate) : null;
    const now = new Date();
    if (status === 'upcoming' || !start || now < start) {
      return round2(amountPaid * (policy.fullRefundBeforeStart ? 1 : policy.gracePercent / 100));
    }
    // Finished → after-grace rule.
    if (status === 'completed') return round2(amountPaid * (policy.afterPercent / 100));

    // Active → time-based grace window from the start date.
    const daysSinceStart = (+now - +start) / DAY;
    if (daysSinceStart <= policy.graceDays) {
      return round2(amountPaid * (policy.gracePercent / 100));
    }
    return round2(amountPaid * (policy.afterPercent / 100));
  }
}
