import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Headers,
  UseGuards,
  Request,
  Req,
  HttpCode,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RequirePermission } from '../auth/permissions';
import { UserRole } from '../users/user.entity';
import { PaymentStatus } from './payment.entity';
import { Audit, fullName, naira } from '../audit/audit.decorator';
import { Payment } from './payment.entity';
import { InstalmentRemindersService } from './instalment-reminders.service';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService, private reminders: InstalmentRemindersService) {}

  // ── Paystack webhook — PUBLIC, verified by signature, must come before guards ─
  @Post('webhook')
  @HttpCode(200)
  webhook(
    @Req() req: RawBodyRequest<ExpressRequest>,
    @Headers('x-paystack-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(
      req.rawBody ?? Buffer.from(JSON.stringify(req.body)),
      signature,
    );
  }

  // ── Paystack: start a checkout ───────────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Post('initialize')
  initialize(
    @Body() body: { programId: string; plan?: 'full' | 'installments' },
    @Request() req: any,
  ) {
    return this.paymentsService.initialize(
      req.user.id,
      req.user.email,
      body.programId,
      body.plan === 'installments' ? 'installments' : 'full',
    );
  }

  // Start checkout for an existing pending payment (e.g. an installment balance).
  @UseGuards(JwtAuthGuard)
  @Post(':id/checkout')
  checkout(@Param('id') id: string, @Request() req: any) {
    return this.paymentsService.checkoutPayment(req.user.id, req.user.email, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermission('payments')
  @Audit({
    action: 'PAYMENT_REFUNDED', entity: 'Payment', load: Payment,
    summary: ({ after }) => `Refunded ${naira(after?.amount)} to ${fullName(after?.user)} (${after?.program?.track ?? 'program'}) via Paystack`,
  })
  @Post(':id/refund')
  refund(@Param('id') id: string) {
    return this.paymentsService.refundPayment(id);
  }

  // ── Paystack: confirm a checkout on return ───────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Get('verify')
  verify(@Query('reference') reference: string) {
    return this.paymentsService.verifyAndSettle(reference);
  }

  // Re-checks the caller's unconfirmed payments with Paystack, so a payment still
  // settles if the browser closed before the popup's verify call ran.
  @UseGuards(JwtAuthGuard)
  @Post('reconcile')
  @HttpCode(200)
  reconcileMine(@Request() req: any) {
    return this.paymentsService.reconcileForUser(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermission('payments')
  @Audit({
    action: 'PAYMENTS_RECHECKED', entity: 'Payment',
    summary: ({ result: r }) => `Re-checked ${r?.checked ?? 0} pending payments with Paystack: ${r?.confirmed ?? 0} confirmed, ${r?.closed ?? 0} closed, ${r?.stillPending ?? 0} still pending`,
  })
  @Post('reconcile-all')
  @HttpCode(200)
  reconcileAll() {
    return this.paymentsService.reconcileAll();
  }

  /** Send any instalment reminders that are due now, instead of waiting for the hourly run. */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermission('payments')
  @Post('reminders/run')
  @HttpCode(200)
  sendReminders() {
    return this.reminders.run();
  }

  // Admin-only manual record (e.g. a bank transfer). Learners pay via /initialize.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermission('payments')
  @Audit({
    action: 'PAYMENT_RECORDED', entity: 'Payment', load: Payment,
    summary: ({ after }) => `Manually recorded a ${after?.status} payment of ${naira(after?.amount)} for ${fullName(after?.user)}`,
  })
  @Post()
  create(@Body() body: any) {
    return this.paymentsService.create(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermission('payments', 'revenue', 'reports', 'audit_log')
  @Get()
  findAll() {
    return this.paymentsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMine(@Request() req: any) {
    return this.paymentsService.findByUser(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermission('payments', 'revenue', 'reports')
  @Get('cohort/:cohortId')
  findByCohort(@Param('cohortId') cohortId: string) {
    return this.paymentsService.findByCohort(cohortId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermission('payments')
  @Audit({
    action: 'PAYMENT_STATUS_CHANGED', entity: 'Payment', load: Payment, track: ['status', 'paystackReference'],
    summary: ({ before, after }) => `Changed ${naira(after?.amount)} payment by ${fullName(after?.user)} from ${before?.status} to ${after?.status}`,
  })
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: PaymentStatus,
    @Body('reference') reference?: string,
  ) {
    return this.paymentsService.updateStatus(id, status, reference);
  }
}
