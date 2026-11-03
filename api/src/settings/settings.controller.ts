import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { SettingsService, RefundPolicy } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RequirePermission } from '../auth/permissions';
import { UserRole } from '../users/user.entity';
import { Audit, fullName, naira } from '../audit/audit.decorator';

@Controller('settings')
export class SettingsController {
  constructor(private settings: SettingsService) {}

  // Public: the pricing page shows learners the refund terms before they pay.
  @Get('refund-policy')
  getRefundPolicy() {
    return this.settings.getRefundPolicy();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermission('settings')
  @Audit({
    action: 'SETTINGS_CHANGED', entity: 'Setting',
    summary: ({ body }) => `Changed refund policy: ${Object.entries(body ?? {}).map(([k, v]) => `${k} = ${JSON.stringify(v)}`).join(', ')}`,
  })
  @Patch('refund-policy')
  setRefundPolicy(@Body() body: Partial<RefundPolicy>) {
    return this.settings.setRefundPolicy(body);
  }
}
