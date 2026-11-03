import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Assignment } from './assignment.entity';
import { Submission, SubmissionStatus } from './submission.entity';
import { Program } from '../programs/program.entity';
import { NotificationsService } from '../mail/notifications.service';

/** Where an assignment lives: its track, or (older assignments) only its cohort. */
export interface AssignmentScope {
  programId?: string;
  cohortId?: string;
}

const EDITABLE = ['title', 'description', 'dueDate', 'maxScore', 'isCapstone'] as const;

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(Assignment) private assignmentRepo: Repository<Assignment>,
    @InjectRepository(Submission) private submissionRepo: Repository<Submission>,
    @InjectRepository(Program) private programRepo: Repository<Program>,
    private notifications: NotificationsService,
  ) {}

  private pick(data: any) {
    return Object.fromEntries(EDITABLE.filter((k) => data?.[k] !== undefined).map((k) => [k, data[k]]));
  }

  private async programWithCohort(programId: string) {
    const program = await this.programRepo.findOne({ where: { id: programId }, relations: { cohort: true } });
    if (!program) throw new NotFoundException('Program not found');
    return program;
  }

  private async assertOneCapstone(programId: string, exceptId?: string) {
    const other = await this.assignmentRepo.findOne({
      where: { program: { id: programId }, isCapstone: true, ...(exceptId && { id: Not(exceptId) }) },
    });
    if (other) {
      throw new BadRequestException(`This track already has a capstone ("${other.title}"). Unmark it first.`);
    }
  }

  async createAssignment(programId: string, data: any) {
    const program = await this.programWithCohort(programId);
    const fields = this.pick(data);
    if (fields.isCapstone) await this.assertOneCapstone(programId);
    return this.assignmentRepo.save(
      this.assignmentRepo.create({ ...fields, program: { id: program.id }, cohort: { id: program.cohort?.id } } as any),
    );
  }

  async updateAssignment(id: string, data: any) {
    const a = await this.assignmentRepo.findOne({ where: { id }, relations: { program: true } });
    if (!a) throw new NotFoundException('Assignment not found');
    const fields = this.pick(data);
    if (fields.isCapstone && a.program?.id) await this.assertOneCapstone(a.program.id, id);
    await this.assignmentRepo.update(id, fields);
    return this.assignmentRepo.findOne({ where: { id }, relations: { program: true } });
  }

  async removeAssignment(id: string) {
    const a = await this.assignmentRepo.findOneBy({ id });
    if (!a) throw new NotFoundException('Assignment not found');
    if (await this.submissionRepo.count({ where: { assignment: { id } } })) {
      throw new BadRequestException('Learners have already submitted work for this assignment, so it cannot be deleted.');
    }
    await this.assignmentRepo.delete(id);
    return { deleted: true };
  }

  /** A track's assignments, plus older cohort-wide ones that predate per-track assignments. */
  async findByProgram(programId: string) {
    const program = await this.programWithCohort(programId);
    return this.assignmentRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.program', 'program')
      .leftJoin('a.cohort', 'cohort')
      .where('program.id = :programId', { programId })
      .orWhere('(a.programId IS NULL AND cohort.id = :cohortId)', { cohortId: program.cohort?.id ?? null })
      .orderBy('a.dueDate', 'ASC')
      .getMany();
  }

  /** Staff view of a whole cohort (every track). */
  findByCohort(cohortId: string) {
    return this.assignmentRepo.find({
      where: { cohort: { id: cohortId } },
      relations: { program: true },
      order: { dueDate: 'ASC' },
    });
  }

  async findOne(id: string) {
    const a = await this.assignmentRepo.findOne({ where: { id }, relations: ['submissions', 'program'] });
    if (!a) throw new NotFoundException('Assignment not found');
    return a;
  }

  async scopeOfAssignment(id: string): Promise<AssignmentScope> {
    const a = await this.assignmentRepo.findOne({ where: { id }, relations: { cohort: true, program: true } });
    if (!a) throw new NotFoundException('Assignment not found');
    return { programId: a.program?.id, cohortId: a.cohort?.id };
  }

  async scopeOfSubmission(id: string): Promise<AssignmentScope> {
    const s = await this.submissionRepo.findOne({ where: { id }, relations: { assignment: { cohort: true, program: true } } });
    if (!s) throw new NotFoundException('Submission not found');
    return { programId: s.assignment?.program?.id, cohortId: s.assignment?.cohort?.id };
  }

  /** One submission per learner per assignment: resubmitting replaces it until it has been graded. */
  async submit(assignmentId: string, learnerId: string, content: { submissionUrl?: string; submissionText?: string }) {
    if (!content.submissionUrl && !content.submissionText) {
      throw new BadRequestException('Add a link or some text to submit');
    }
    const existing = await this.submissionRepo.findOne({
      where: { assignment: { id: assignmentId }, learner: { id: learnerId } },
    });
    if (existing?.status === SubmissionStatus.GRADED) {
      throw new BadRequestException('This assignment has already been graded, so it can no longer be changed.');
    }
    if (existing) {
      await this.submissionRepo.update(existing.id, {
        submissionUrl: content.submissionUrl ?? null,
        submissionText: content.submissionText ?? null,
      } as any);
      return this.submissionRepo.findOneBy({ id: existing.id });
    }
    return this.submissionRepo.save(
      this.submissionRepo.create({ ...content, assignment: { id: assignmentId }, learner: { id: learnerId } } as any),
    );
  }

  findSubmissionsByAssignment(assignmentId: string) {
    return this.submissionRepo.find({ where: { assignment: { id: assignmentId } } });
  }

  findSubmissionsByLearner(learnerId: string) {
    return this.submissionRepo.find({ where: { learner: { id: learnerId } }, relations: ['assignment'] });
  }

  async gradeSubmission(submissionId: string, score: number, feedback: string) {
    const submission = await this.submissionRepo.findOne({ where: { id: submissionId }, relations: { assignment: true } });
    if (!submission) throw new NotFoundException('Submission not found');
    const max = submission.assignment?.maxScore ?? 100;
    if (typeof score !== 'number' || isNaN(score) || score < 0 || score > max) {
      throw new BadRequestException(`Score must be between 0 and ${max}`);
    }
    const graded = await this.submissionRepo.save({ ...submission, score, feedback, status: SubmissionStatus.GRADED });
    this.notifications.submissionGraded(submissionId);
    return graded;
  }
}
