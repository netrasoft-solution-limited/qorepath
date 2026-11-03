import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RequirePermission } from '../auth/permissions';
import { UserRole } from '../users/user.entity';
import { AuditService } from './audit.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@RequirePermission('audit_log')
@Controller('audit')
export class AuditController {
  constructor(private audit: AuditService) {}

  @Get()
  list(
    @Query('search') search?: string,
    @Query('action') action?: string,
    @Query('before') before?: string,
    @Query('limit') limit?: number,
  ) {
    return this.audit.list({ search, action, before, limit });
  }

  @Get('actions')
  actions() {
    return this.audit.actions();
  }
}
