import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GraduationRecord, GraduationStatus } from './graduation.entity';
import { Enrollment } from '../enrollments/enrollment.entity';
import { NotificationsService } from '../mail/notifications.service';

@Injectable()
export class GraduationService {
  constructor(
    @InjectRepository(GraduationRecord)
    private repo: Repository<GraduationRecord>,
    private notifications: NotificationsService,
  ) {}

  async programIdOfEnrollment(enrollmentId: string): Promise<string | undefined> {
    const e = await this.repo.manager.findOne(Enrollment, { where: { id: enrollmentId }, relations: { program: true } });
    if (!e) throw new NotFoundException('Enrollment not found');
    return e.program?.id;
  }

  async upsert(enrollmentId: string, submittedById: string, recommendation: string, notes: string) {
    const existing = await this.repo.findOne({
      where: { enrollment: { id: enrollmentId } },
    });
    if (existing) {
      await this.repo.update(existing.id, { recommendation: recommendation as any, notes });
      return this.repo.findOne({ where: { id: existing.id } });
    }
    const record = this.repo.create({
      enrollment: { id: enrollmentId } as any,
      submittedBy: { id: submittedById } as any,
      recommendation: recommendation as any,
      notes,
    });
    return this.repo.save(record);
  }

  findByCohort(cohortId: string) {
    return this.repo
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.enrollment', 'enrollment')
      .leftJoinAndSelect('enrollment.learner', 'learner')
      .leftJoinAndSelect('enrollment.program', 'program')
      .leftJoinAndSelect('program.cohort', 'cohort')
      .where('cohort.id = :cohortId', { cohortId })
      .getMany();
  }

  async updateStatus(id: string, status: GraduationStatus) {
    const before = await this.repo.findOne({ where: { id } });
    await this.repo.update(id, { status });
    if (before && before.status !== status) this.notifications.graduationDecided(id);
    return this.repo.findOne({ where: { id } });
  }

  findByLearner(learnerId: string) {
    return this.repo
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.enrollment', 'enrollment')
      .leftJoinAndSelect('enrollment.learner', 'learner')
      .leftJoinAndSelect('enrollment.program', 'program')
      .leftJoinAndSelect('program.cohort', 'cohort')
      .leftJoinAndSelect('g.submittedBy', 'submittedBy')
      .where('learner.id = :learnerId', { learnerId })
      .getOne();
  }

  findAll() {
    return this.repo
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.enrollment', 'enrollment')
      .leftJoinAndSelect('enrollment.learner', 'learner')
      .leftJoinAndSelect('enrollment.program', 'program')
      .leftJoinAndSelect('program.cohort', 'cohort')
      .leftJoinAndSelect('g.submittedBy', 'submittedBy')
      .orderBy('g.createdAt', 'DESC')
      .getMany();
  }
}
