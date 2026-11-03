import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { EnrollmentStatus } from './enrollment.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private enrollmentsService: EnrollmentsService) {}

  // Admin-only manual enrollment. Learners are enrolled automatically once payment settles.
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() body: any) {
    return this.enrollmentsService.create(body);
  }

  @Roles(UserRole.ADMIN)
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
  findByCohort(@Param('cohortId') cohortId: string) {
    return this.enrollmentsService.findByCohort(cohortId);
  }

  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.ASSISTANT)
  @Get('program/:programId')
  findByProgram(@Param('programId') programId: string) {
    return this.enrollmentsService.findByProgram(programId);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: EnrollmentStatus) {
    return this.enrollmentsService.updateStatus(id, status);
  }

  @Roles(UserRole.ADMIN)
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
