import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { WithdrawalsService } from './withdrawals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RequirePermission } from '../auth/permissions';
import { UserRole } from '../users/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('withdrawals')
export class WithdrawalsController {
  constructor(private withdrawals: WithdrawalsService) {}

  // Learner self-service withdrawal (admins may withdraw anyone).
  @Post()
  request(@Body() body: { enrollmentId: string; reason?: string }, @Request() req: any) {
    return this.withdrawals.requestWithdrawal(
      req.user.id,
      req.user.role === UserRole.ADMIN,
      body.enrollmentId,
      body.reason,
    );
  }

  @Roles(UserRole.ADMIN)
  @RequirePermission('payments')
  @Get()
  findAll() {
    return this.withdrawals.findAll();
  }

  @Roles(UserRole.ADMIN)
  @RequirePermission('payments')
  @Patch(':id/resolve')
  resolve(
    @Param('id') id: string,
    @Body() body: { decision: 'approved' | 'denied'; amount?: number; adminNote?: string },
  ) {
    return this.withdrawals.resolve(id, body.decision, body.amount, body.adminNote);
  }
}
