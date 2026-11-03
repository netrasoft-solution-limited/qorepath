import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.ASSISTANT)
  @Post()
  create(@Body() body: any) {
    return this.sessionsService.create(body);
  }

  @Get()
  findAll() {
    return this.sessionsService.findAll();
  }

  @Get('cohort/:cohortId')
  findByCohort(@Param('cohortId') cohortId: string) {
    return this.sessionsService.findByCohort(cohortId);
  }

  @Get('program/:programId')
  findByProgram(@Param('programId') programId: string) {
    return this.sessionsService.findByProgram(programId);
  }

  @Roles(UserRole.ADMIN)
  @Get('at-risk')
  getAtRisk() {
    return this.sessionsService.getAtRiskLearners();
  }

  @Get('attendance/my')
  getMyAttendance(@Request() req: any) {
    return this.sessionsService.getAttendanceByLearner(req.user.id);
  }

  // Classroom access gate — returns the session only if the user may join.
  @Get(':id/access')
  getAccess(@Param('id') id: string, @Request() req: any) {
    return this.sessionsService.getAccess(id, req.user);
  }

  // Signed JaaS token to join the room (access-checked; moderator flag enforced).
  @Get(':id/jaas-token')
  jaasToken(@Param('id') id: string, @Request() req: any) {
    return this.sessionsService.getJaasToken(id, req.user);
  }

  // Auto-attendance: a learner marks themselves present on joining the room.
  @Roles(UserRole.LEARNER)
  @Post(':id/attend')
  attend(@Param('id') id: string, @Request() req: any) {
    return this.sessionsService.selfAttend(id, req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.ASSISTANT)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.sessionsService.update(id, body);
  }

  @Roles(UserRole.INSTRUCTOR, UserRole.ASSISTANT, UserRole.ADMIN)
  @Post(':id/attendance')
  markAttendance(@Param('id') id: string, @Body() body: any) {
    return this.sessionsService.markAttendance({ ...body, session: { id } });
  }

  @Get(':id/attendance')
  getAttendance(@Param('id') id: string) {
    return this.sessionsService.getAttendance(id);
  }
}
