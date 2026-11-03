import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assignments')
export class AssignmentsController {
  constructor(private assignmentsService: AssignmentsService) {}

  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.ASSISTANT)
  @Post()
  create(@Body() body: any) {
    return this.assignmentsService.createAssignment(body);
  }

  @Get('cohort/:cohortId')
  findByCohort(@Param('cohortId') cohortId: string) {
    return this.assignmentsService.findByCohort(cohortId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assignmentsService.findOne(id);
  }

  @Post(':id/submit')
  submit(@Param('id') id: string, @Body() body: any, @Request() req: any) {
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
  getSubmissions(@Param('id') id: string) {
    return this.assignmentsService.findSubmissionsByAssignment(id);
  }

  @Get('submissions/my')
  getMySubmissions(@Request() req: any) {
    return this.assignmentsService.findSubmissionsByLearner(req.user.id);
  }

  @Roles(UserRole.INSTRUCTOR, UserRole.ASSISTANT, UserRole.ADMIN)
  @Patch('submissions/:submissionId/grade')
  grade(@Param('submissionId') id: string, @Body() body: { score: number; feedback: string }) {
    return this.assignmentsService.gradeSubmission(id, body.score, body.feedback);
  }
}
