import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { GraduationService } from './graduation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RequirePermission } from '../auth/permissions';
import { UserRole } from '../users/user.entity';
import { GraduationStatus } from './graduation.entity';
import { AccessService } from '../access/access.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('graduation')
export class GraduationController {
  constructor(private service: GraduationService, private access: AccessService) {}

  @Roles(UserRole.INSTRUCTOR, UserRole.ASSISTANT)
  @Post('recommend')
  async recommend(
    @Body() body: { enrollmentId: string; recommendation: string; notes?: string },
    @Request() req: any,
  ) {
    await this.access.assert(this.access.canStaffProgram(req.user, await this.service.programIdOfEnrollment(body.enrollmentId)), 'You can only recommend learners in programs you teach');
    return this.service.upsert(body.enrollmentId, req.user.id, body.recommendation, body.notes ?? '');
  }

  @Get('my')
  getMine(@Request() req: any) {
    return this.service.findByLearner(req.user.id);
  }

  @Roles(UserRole.INSTRUCTOR, UserRole.ASSISTANT, UserRole.ADMIN)
  @Get('cohort/:cohortId')
  async getByCohort(@Param('cohortId') cohortId: string, @Request() req: any) {
    await this.access.assert(this.access.canStaffCohort(req.user, cohortId));
    return this.service.findByCohort(cohortId);
  }

  @Roles(UserRole.ADMIN)
  @RequirePermission('graduation', 'audit_log')
  @Get('all')
  getAll() {
    return this.service.findAll();
  }

  @Roles(UserRole.ADMIN)
  @RequirePermission('graduation')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: GraduationStatus) {
    return this.service.updateStatus(id, status);
  }
}
