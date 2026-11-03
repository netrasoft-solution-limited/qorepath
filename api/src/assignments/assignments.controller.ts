import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { AccessService } from '../access/access.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assignments')
export class AssignmentsController {
  constructor(private assignmentsService: AssignmentsService, private access: AccessService) {}

  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.ASSISTANT)
  @Post()
  async create(@Body() body: any, @Request() req: any) {
    await this.access.assert(this.access.canStaffCohort(req.user, body?.cohort?.id), 'You can only create assignments for cohorts you teach');
    return this.assignmentsService.createAssignment(body);
  }

  @Get('cohort/:cohortId')
  async findByCohort(@Param('cohortId') cohortId: string, @Request() req: any) {
    await this.access.assert(this.access.canViewCohort(req.user, cohortId));
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
    await this.access.assert(this.access.canStaffCohort(req.user, await this.assignmentsService.cohortIdOfAssignment(id)));
    return this.assignmentsService.findOne(id);
  }

  @Post(':id/submit')
  async submit(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    await this.access.assert(this.access.canViewCohort(req.user, await this.assignmentsService.cohortIdOfAssignment(id)), 'You are not enrolled in this cohort');
    // Only the submission content — never score/status/feedback, which are set by grading.
    return this.assignmentsService.submit({
      submissionUrl: body.submissionUrl,
      submissionText: body.submissionText,
      assignment: { id },
      learner: { id: req.user.id },
    } as any);
  }

  @Get(':id/submissions')
  @Roles(UserRole.INSTRUCTOR, UserRole.ASSISTANT, UserRole.ADMIN)
  async getSubmissions(@Param('id') id: string, @Request() req: any) {
    await this.access.assert(this.access.canStaffCohort(req.user, await this.assignmentsService.cohortIdOfAssignment(id)));
    return this.assignmentsService.findSubmissionsByAssignment(id);
  }

  @Roles(UserRole.INSTRUCTOR, UserRole.ASSISTANT, UserRole.ADMIN)
  @Patch('submissions/:submissionId/grade')
  async grade(@Param('submissionId') id: string, @Body() body: { score: number; feedback: string }, @Request() req: any) {
    await this.access.assert(this.access.canStaffCohort(req.user, await this.assignmentsService.cohortIdOfSubmission(id)), 'You can only grade work in cohorts you teach');
    return this.assignmentsService.gradeSubmission(id, body.score, body.feedback);
  }
}
