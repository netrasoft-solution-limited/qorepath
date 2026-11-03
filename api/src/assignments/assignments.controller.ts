import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { AssignmentsService, AssignmentScope } from './assignments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { AccessService } from '../access/access.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assignments')
export class AssignmentsController {
  constructor(private assignmentsService: AssignmentsService, private access: AccessService) {}

  // Per-track assignments are checked against the track; older cohort-wide ones against the cohort.
  private canStaff(user: any, scope: AssignmentScope) {
    return scope.programId ? this.access.canStaffProgram(user, scope.programId) : this.access.canStaffCohort(user, scope.cohortId);
  }

  private canView(user: any, scope: AssignmentScope) {
    return scope.programId ? this.access.canViewProgram(user, scope.programId) : this.access.canViewCohort(user, scope.cohortId);
  }

  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.ASSISTANT)
  @Post()
  async create(@Body() body: any, @Request() req: any) {
    const programId = body?.program?.id ?? body?.programId;
    if (!programId) throw new BadRequestException('Choose the track this assignment is for');
    await this.access.assert(this.access.canStaffProgram(req.user, programId), 'You can only create assignments for tracks you teach');
    return this.assignmentsService.createAssignment(programId, body);
  }

  @Get('program/:programId')
  async findByProgram(@Param('programId') programId: string, @Request() req: any) {
    await this.access.assert(this.access.canViewProgram(req.user, programId));
    return this.assignmentsService.findByProgram(programId);
  }

  // Every track in the cohort, so staff only (learners use their own track's list).
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.ASSISTANT)
  @Get('cohort/:cohortId')
  async findByCohort(@Param('cohortId') cohortId: string, @Request() req: any) {
    await this.access.assert(this.access.canStaffCohort(req.user, cohortId));
    return this.assignmentsService.findByCohort(cohortId);
  }

  @Get('submissions/my')
  getMySubmissions(@Request() req: any) {
    return this.assignmentsService.findSubmissionsByLearner(req.user.id);
  }

  // Includes every learner's submission, so staff only.
  @Roles(UserRole.INSTRUCTOR, UserRole.ASSISTANT, UserRole.ADMIN)
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    await this.access.assert(this.canStaff(req.user, await this.assignmentsService.scopeOfAssignment(id)));
    return this.assignmentsService.findOne(id);
  }

  @Roles(UserRole.INSTRUCTOR, UserRole.ASSISTANT, UserRole.ADMIN)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    await this.access.assert(this.canStaff(req.user, await this.assignmentsService.scopeOfAssignment(id)), 'You can only edit assignments for tracks you teach');
    return this.assignmentsService.updateAssignment(id, body);
  }

  @Roles(UserRole.INSTRUCTOR, UserRole.ASSISTANT, UserRole.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.access.assert(this.canStaff(req.user, await this.assignmentsService.scopeOfAssignment(id)), 'You can only delete assignments for tracks you teach');
    return this.assignmentsService.removeAssignment(id);
  }

  @Roles(UserRole.LEARNER)
  @Post(':id/submit')
  async submit(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    await this.access.assert(this.canView(req.user, await this.assignmentsService.scopeOfAssignment(id)), 'This assignment is not part of your track');
    // Only the submission content — never score/status/feedback, which are set by grading.
    return this.assignmentsService.submit(id, req.user.id, {
      submissionUrl: body?.submissionUrl,
      submissionText: body?.submissionText,
    });
  }

  @Get(':id/submissions')
  @Roles(UserRole.INSTRUCTOR, UserRole.ASSISTANT, UserRole.ADMIN)
  async getSubmissions(@Param('id') id: string, @Request() req: any) {
    await this.access.assert(this.canStaff(req.user, await this.assignmentsService.scopeOfAssignment(id)));
    return this.assignmentsService.findSubmissionsByAssignment(id);
  }

  @Roles(UserRole.INSTRUCTOR, UserRole.ASSISTANT, UserRole.ADMIN)
  @Patch('submissions/:submissionId/grade')
  async grade(@Param('submissionId') id: string, @Body() body: { score: number; feedback: string }, @Request() req: any) {
    await this.access.assert(this.canStaff(req.user, await this.assignmentsService.scopeOfSubmission(id)), 'You can only grade work in tracks you teach');
    return this.assignmentsService.gradeSubmission(id, Number(body?.score), body?.feedback ?? '');
  }
}
