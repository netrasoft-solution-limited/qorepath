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
import { UserRole } from '../users/user.entity';
import { PaymentStatus } from './payment.entity';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

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

  // Admin-only manual record (e.g. a bank transfer). Learners pay via /initialize.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() body: any) {
    return this.paymentsService.create(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
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
  @Get('cohort/:cohortId')
  findByCohort(@Param('cohortId') cohortId: string) {
    return this.paymentsService.findByCohort(cohortId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: PaymentStatus,
    @Body('reference') reference?: string,
  ) {
    return this.paymentsService.updateStatus(id, status, reference);
  }
}
