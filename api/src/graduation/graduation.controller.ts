import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { GraduationService } from './graduation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { GraduationStatus } from './graduation.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('graduation')
export class GraduationController {
  constructor(private service: GraduationService) {}

  @Roles(UserRole.INSTRUCTOR, UserRole.ASSISTANT)
  @Post('recommend')
  recommend(
    @Body() body: { enrollmentId: string; recommendation: string; notes?: string },
    @Request() req: any,
  ) {
    return this.service.upsert(body.enrollmentId, req.user.id, body.recommendation, body.notes ?? '');
  }

  @Get('my')
  getMine(@Request() req: any) {
    return this.service.findByLearner(req.user.id);
  }

  @Roles(UserRole.INSTRUCTOR, UserRole.ASSISTANT, UserRole.ADMIN)
  @Get('cohort/:cohortId')
  getByCohort(@Param('cohortId') cohortId: string) {
    return this.service.findByCohort(cohortId);
  }

  @Roles(UserRole.ADMIN)
  @Get('all')
  getAll() {
    return this.service.findAll();
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: GraduationStatus) {
    return this.service.updateStatus(id, status);
  }
}
