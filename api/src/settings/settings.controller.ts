import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { SettingsService, RefundPolicy } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private settings: SettingsService) {}

  @Roles(UserRole.ADMIN)
  @Get('refund-policy')
  getRefundPolicy() {
    return this.settings.getRefundPolicy();
  }

  @Roles(UserRole.ADMIN)
  @Patch('refund-policy')
  setRefundPolicy(@Body() body: Partial<RefundPolicy>) {
    return this.settings.setRefundPolicy(body);
  }
}
