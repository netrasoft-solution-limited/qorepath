import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RequirePermission } from '../auth/permissions';
import { UserRole } from '../users/user.entity';
import { AccessService } from '../access/access.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private sessionsService: SessionsService, private access: AccessService) {}

  private async programOf(sessionId: string): Promise<string | undefined> {
    return (await this.sessionsService.findOne(sessionId)).program?.id;
  }

  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.ASSISTANT)
  @Post()
  async create(@Body() body: any, @Request() req: any) {
    await this.access.assert(this.access.canStaffProgram(req.user, body?.program?.id), 'You can only schedule sessions for programs you teach');
    return this.sessionsService.create(body);
  }

  @Roles(UserRole.ADMIN)
  @RequirePermission('reports')
  @Get()
  findAll() {
    return this.sessionsService.findAll();
  }

  @Roles(UserRole.ADMIN)
  @RequirePermission('reports')
  @Get('cohort/:cohortId')
  findByCohort(@Param('cohortId') cohortId: string) {
    return this.sessionsService.findByCohort(cohortId);
  }

  @Get('program/:programId')
  async findByProgram(@Param('programId') programId: string, @Request() req: any) {
    await this.access.assert(this.access.canViewProgram(req.user, programId));
    return this.sessionsService.findByProgram(programId);
  }

  @Roles(UserRole.ADMIN)
  @RequirePermission('at_risk', 'reports')
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

  // Includes every learner's attendance, so staff only.
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.ASSISTANT)
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    await this.access.assert(this.access.canStaffProgram(req.user, await this.programOf(id)));
    return this.sessionsService.findOne(id);
  }

  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.ASSISTANT)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    await this.access.assert(this.access.canStaffProgram(req.user, await this.programOf(id)), 'You can only edit sessions for programs you teach');
    // Only admins may move a session to a different program.
    if (req.user.role !== UserRole.ADMIN) delete body.program;
    return this.sessionsService.update(id, body);
  }

  @Roles(UserRole.INSTRUCTOR, UserRole.ASSISTANT, UserRole.ADMIN)
  @Post(':id/attendance')
  async markAttendance(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    await this.access.assert(this.access.canStaffProgram(req.user, await this.programOf(id)), 'You can only mark attendance for programs you teach');
    return this.sessionsService.markAttendance({ ...body, session: { id } });
  }

  @Roles(UserRole.INSTRUCTOR, UserRole.ASSISTANT, UserRole.ADMIN)
  @Get(':id/attendance')
  async getAttendance(@Param('id') id: string, @Request() req: any) {
    await this.access.assert(this.access.canStaffProgram(req.user, await this.programOf(id)));
    return this.sessionsService.getAttendance(id);
  }
}
