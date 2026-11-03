import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assignment } from './assignment.entity';
import { Submission } from './submission.entity';
import { NotificationsService } from '../mail/notifications.service';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(Assignment) private assignmentRepo: Repository<Assignment>,
    @InjectRepository(Submission) private submissionRepo: Repository<Submission>,
    private notifications: NotificationsService,
  ) {}

  createAssignment(data: Partial<Assignment>) {
    return this.assignmentRepo.save(this.assignmentRepo.create(data));
  }

  findByCohort(cohortId: string) {
    return this.assignmentRepo.find({ where: { cohort: { id: cohortId } } });
  }

  async findOne(id: string) {
    const a = await this.assignmentRepo.findOne({ where: { id }, relations: ['submissions'] });
    if (!a) throw new NotFoundException('Assignment not found');
    return a;
  }

  async cohortIdOfAssignment(id: string): Promise<string | undefined> {
    const a = await this.assignmentRepo.findOne({ where: { id }, relations: { cohort: true } });
    if (!a) throw new NotFoundException('Assignment not found');
    return a.cohort?.id;
  }

  async cohortIdOfSubmission(id: string): Promise<string | undefined> {
    const s = await this.submissionRepo.findOne({ where: { id }, relations: { assignment: { cohort: true } } });
    if (!s) throw new NotFoundException('Submission not found');
    return s.assignment?.cohort?.id;
  }

  submit(data: Partial<Submission>) {
    return this.submissionRepo.save(this.submissionRepo.create(data));
  }

  findSubmissionsByAssignment(assignmentId: string) {
    return this.submissionRepo.find({ where: { assignment: { id: assignmentId } } });
  }

  findSubmissionsByLearner(learnerId: string) {
    return this.submissionRepo.find({ where: { learner: { id: learnerId } }, relations: ['assignment'] });
  }

  async gradeSubmission(submissionId: string, score: number, feedback: string) {
    const submission = await this.submissionRepo.findOneBy({ id: submissionId });
    if (!submission) throw new NotFoundException('Submission not found');
    const graded = await this.submissionRepo.save({ ...submission, score, feedback, status: 'graded' as any });
    this.notifications.submissionGraded(submissionId);
    return graded;
  }
}
