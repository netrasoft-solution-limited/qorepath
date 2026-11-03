import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment, PaymentStatus, PaymentMethod } from './payment.entity';
import { Enrollment, EnrollmentStatus } from '../enrollments/enrollment.entity';
import { Program } from '../programs/program.entity';
import { PaystackService } from './paystack.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment) private repo: Repository<Payment>,
    @InjectRepository(Enrollment) private enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Program) private programRepo: Repository<Program>,
    private dataSource: DataSource,
    private paystack: PaystackService,
    private config: ConfigService,
  ) {}

  create(data: Partial<Payment>) {
    return this.repo.save(this.repo.create(data));
  }

  findAll() {
    return this.repo.find();
  }

  findByUser(userId: string) {
    return this.repo.find({ where: { user: { id: userId } } });
  }

  findByCohort(cohortId: string) {
    return this.repo.find({ where: { cohort: { id: cohortId } } });
  }

  async findOne(id: string) {
    const payment = await this.repo.findOneBy({ id });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async updateStatus(id: string, status: PaymentStatus, reference?: string) {
    await this.findOne(id);
    await this.repo.update(id, {
      status,
      ...(reference && { paystackReference: reference }),
    });
    return this.findOne(id);
  }

  // ── Paystack: initialize ───────────────────────────────────────────────────
  /**
   * Creates a PENDING payment and a Paystack transaction. Returns the data the
   * frontend popup needs (access code + public key). The amount is taken from
   * the program's price on the server — never trusted from the client.
   */
  async initialize(
    userId: string,
    email: string,
    programId: string,
    plan: 'full' | 'installments' = 'full',
  ) {
    const program = await this.programRepo.findOne({
      where: { id: programId },
      relations: { cohort: true },
    });
    if (!program) throw new NotFoundException('Program not found');

    // One active program at a time: look at the learner's approved enrollments.
    const approved = await this.enrollmentRepo
      .createQueryBuilder('e')
      .leftJoin('e.learner', 'learner')
      .leftJoinAndSelect('e.program', 'program')
      .leftJoinAndSelect('program.cohort', 'cohort')
      .where('learner.id = :userId', { userId })
      .andWhere('e.status = :status', { status: EnrollmentStatus.APPROVED })
      .getMany();

    if (approved.some((e) => e.program?.id === programId)) {
      throw new BadRequestException('You are already enrolled in this program');
    }
    // Block a new enrollment while a current one is still running (cohort not finished).
    const ongoing = approved.find((e) =>
      ['active', 'upcoming'].includes(e.program?.cohort?.status),
    );
    if (ongoing) {
      throw new BadRequestException(
        'Finish your current program before enrolling in another.',
      );
    }

    const amount = Number(program.price);
    if (!amount || amount <= 0) {
      throw new BadRequestException('This program has no payable price set');
    }

    // Capacity: a seat is taken by each approved enrollment.
    if (program.maxLearners) {
      const taken = await this.enrollmentRepo.count({
        where: { program: { id: programId }, status: EnrollmentStatus.APPROVED },
      });
      if (taken >= program.maxLearners) {
        throw new BadRequestException('This program is full.');
      }
    }

    const common = {
      user: { id: userId } as any,
      program: { id: programId } as any,
      cohort: program.cohort ? ({ id: program.cohort.id } as any) : null,
      status: PaymentStatus.PENDING,
      method: PaymentMethod.PAYSTACK,
    };

    // Installments: pay 50% now to enroll, the remaining 50% becomes a pending
    // balance the learner settles later from their Payments page.
    if (plan === 'installments') {
      const planReference = `PLAN-${this.randomSuffix()}`;
      const firstAmount = Math.round(amount / 2);
      const secondAmount = amount - firstAmount;
      const ref1 = this.newReference();

      const first = await this.repo.save(
        this.repo.create({
          ...common,
          amount: firstAmount,
          reference: ref1,
          paystackReference: ref1,
          planReference,
          installmentNumber: 1,
          totalInstallments: 2,
          notes: `Installment 1/2 for ${program.track}`,
        }),
      );
      // Balance — initialized for payment later via /payments/:id/checkout.
      await this.repo.save(
        this.repo.create({
          ...common,
          amount: secondAmount,
          planReference,
          installmentNumber: 2,
          totalInstallments: 2,
          notes: `Installment 2/2 (balance) for ${program.track}`,
        }),
      );

      const init = await this.paystack.initialize({
        email,
        amount: Math.round(firstAmount * 100),
        reference: ref1,
        metadata: { userId, programId, paymentId: first.id, plan: 'installments' },
        callbackUrl: this.config.get<string>('PAYSTACK_CALLBACK_URL'),
      });

      return {
        reference: init.reference,
        accessCode: init.accessCode,
        authorizationUrl: init.authorizationUrl,
        publicKey: this.paystack.publicKey,
        amount: firstAmount,
      };
    }

    // Full one-off payment.
    const reference = this.newReference();
    const payment = await this.repo.save(
      this.repo.create({
        ...common,
        amount,
        reference,
        paystackReference: reference,
        notes: `Paystack checkout for ${program.track}`,
      }),
    );

    const init = await this.paystack.initialize({
      email,
      amount: Math.round(amount * 100), // NGN -> kobo
      reference,
      metadata: { userId, programId, paymentId: payment.id },
      callbackUrl: this.config.get<string>('PAYSTACK_CALLBACK_URL'),
    });

    return {
      reference: init.reference,
      accessCode: init.accessCode,
      authorizationUrl: init.authorizationUrl,
      publicKey: this.paystack.publicKey,
      amount,
    };
  }

  private randomSuffix() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
  }

  private newReference() {
    return `QP-${this.randomSuffix()}`;
  }

  /**
   * Starts a Paystack checkout for an existing PENDING payment — used to settle
   * an installment balance. Re-uses the same settle path on verification.
   */
  async checkoutPayment(userId: string, email: string, paymentId: string) {
    const payment = await this.repo.findOne({
      where: { id: paymentId },
      relations: { user: true, program: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.user?.id !== userId) {
      throw new ForbiddenException('This payment does not belong to you');
    }
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('This payment is not awaiting checkout');
    }
    const amount = Number(payment.amount);
    if (!amount || amount <= 0) {
      throw new BadRequestException('Nothing to pay on this item');
    }

    const reference = this.newReference();
    payment.reference = reference;
    payment.paystackReference = reference;
    payment.method = PaymentMethod.PAYSTACK;
    await this.repo.save(payment);

    const init = await this.paystack.initialize({
      email,
      amount: Math.round(amount * 100),
      reference,
      metadata: { userId, programId: payment.program?.id, paymentId: payment.id },
      callbackUrl: this.config.get<string>('PAYSTACK_CALLBACK_URL'),
    });

    return {
      reference: init.reference,
      accessCode: init.accessCode,
      authorizationUrl: init.authorizationUrl,
      publicKey: this.paystack.publicKey,
      amount,
    };
  }

  /** Admin-only: issue a real Paystack refund, then mark the payment refunded. */
  async refundPayment(paymentId: string) {
    const payment = await this.findOne(paymentId);
    if (payment.status !== PaymentStatus.PAID) {
      throw new BadRequestException('Only paid payments can be refunded');
    }
    if (!payment.paystackReference) {
      throw new BadRequestException('This payment has no Paystack transaction to refund');
    }
    await this.paystack.refund(
      payment.paystackReference,
      Math.round(Number(payment.amount) * 100),
    );
    await this.repo.update(paymentId, { status: PaymentStatus.REFUNDED });
    return this.findOne(paymentId);
  }

  // ── Paystack: verify (called on return from checkout) ────────────────────────
  async verifyAndSettle(reference: string) {
    const result = await this.paystack.verify(reference);

    if (result.status !== 'success') {
      await this.repo.update(
        { paystackReference: reference },
        { status: PaymentStatus.FAILED },
      );
      return { status: 'failed' as const };
    }

    const settled = await this.settlePaidTransaction(reference, {
      expectedAmountKobo: result.amount,
    });
    return { status: 'success' as const, payment: settled };
  }

  // ── Paystack: webhook (server-to-server, source of truth) ────────────────────
  async handleWebhook(rawBody: Buffer | string, signature?: string) {
    if (!this.paystack.verifySignature(rawBody, signature)) {
      throw new BadRequestException('Invalid signature');
    }

    const event = JSON.parse(rawBody.toString());
    if (event?.event === 'charge.success') {
      const reference: string = event.data?.reference;
      if (reference) {
        await this.settlePaidTransaction(reference, {
          expectedAmountKobo: event.data?.amount,
        }).catch((err) =>
          this.logger.error(`Webhook settle failed for ${reference}`, err),
        );
      }
    }
    return { received: true };
  }

  /**
   * Idempotently marks a payment PAID and creates an APPROVED enrollment.
   * Safe to call from both the verify endpoint and the webhook — it no-ops if
   * the payment is already settled.
   */
  private async settlePaidTransaction(
    reference: string,
    opts: { expectedAmountKobo?: number } = {},
  ) {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const payment = await manager.findOne(Payment, {
        where: { paystackReference: reference },
        relations: { user: true, program: true },
      });
      if (!payment) {
        throw new NotFoundException(`No payment for reference ${reference}`);
      }

      // Already settled — idempotent no-op.
      if (payment.status === PaymentStatus.PAID) return payment;

      // Guard against amount tampering.
      if (
        opts.expectedAmountKobo != null &&
        Math.round(Number(payment.amount) * 100) !== opts.expectedAmountKobo
      ) {
        this.logger.warn(
          `Amount mismatch for ${reference}: expected ${Math.round(
            Number(payment.amount) * 100,
          )} kobo, Paystack reported ${opts.expectedAmountKobo} kobo`,
        );
        throw new BadRequestException('Payment amount mismatch');
      }

      payment.status = PaymentStatus.PAID;
      payment.method = PaymentMethod.PAYSTACK;
      await manager.save(payment);

      const userId = payment.user?.id;
      const programId = payment.program?.id;
      if (userId && programId) {
        const existing = await manager.findOne(Enrollment, {
          where: {
            learner: { id: userId },
            program: { id: programId },
          },
        });
        if (existing) {
          if (existing.status !== EnrollmentStatus.APPROVED) {
            existing.status = EnrollmentStatus.APPROVED;
            existing.notes = `Auto-approved after payment ${reference}`;
            await manager.save(existing);
          }
        } else {
          await manager.save(
            manager.create(Enrollment, {
              learner: { id: userId } as any,
              program: { id: programId } as any,
              status: EnrollmentStatus.APPROVED,
              notes: `Auto-approved after payment ${reference}`,
            }),
          );
        }
      }

      return payment;
    });
  }
}
