import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RequirePermission } from '../auth/permissions';
import { UserRole } from '../users/user.entity';
import { EnrollmentStatus } from './enrollment.entity';
import { AccessService } from '../access/access.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private enrollmentsService: EnrollmentsService, private access: AccessService) {}

  // Admin-only manual enrollment. Learners are enrolled automatically once payment settles.
  @Roles(UserRole.ADMIN)
  @RequirePermission('enrollments')
  @Post()
  create(@Body() body: any) {
    return this.enrollmentsService.create(body);
  }

  @Roles(UserRole.ADMIN)
  @RequirePermission('enrollments', 'reports', 'audit_log')
  @Get()
  findAll() {
    return this.enrollmentsService.findAll();
  }

  @Get('my')
  findMine(@Request() req: any) {
    return this.enrollmentsService.findByLearner(req.user.id);
  }

  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.ASSISTANT)
  @Get('cohort/:cohortId')
  async findByCohort(@Param('cohortId') cohortId: string, @Request() req: any) {
    await this.access.assert(this.access.canStaffCohort(req.user, cohortId));
    return this.enrollmentsService.findByCohort(cohortId);
  }

  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.ASSISTANT)
  @Get('program/:programId')
  async findByProgram(@Param('programId') programId: string, @Request() req: any) {
    await this.access.assert(this.access.canStaffProgram(req.user, programId));
    return this.enrollmentsService.findByProgram(programId);
  }

  @Roles(UserRole.ADMIN)
  @RequirePermission('enrollments')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: EnrollmentStatus) {
    return this.enrollmentsService.updateStatus(id, status);
  }

  @Roles(UserRole.ADMIN)
  @RequirePermission('enrollments')
  @Patch(':id/reinstate')
  reinstate(@Param('id') id: string) {
    return this.enrollmentsService.reinstate(id);
  }

  // Learner self-service withdrawal (admins may withdraw anyone).
  @Patch(':id/withdraw')
  withdraw(@Param('id') id: string, @Body('reason') reason: string, @Request() req: any) {
    return this.enrollmentsService.withdraw(
      id,
      req.user.id,
      req.user.role === UserRole.ADMIN,
      reason,
    );
  }
}
