import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment, EnrollmentStatus } from './enrollment.entity';
import { NotificationsService } from '../mail/notifications.service';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment) private repo: Repository<Enrollment>,
    private notifications: NotificationsService,
  ) {}

  create(data: Partial<Enrollment>) {
    return this.repo.save(this.repo.create(data));
  }

  findAll() {
    return this.repo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.learner', 'learner')
      .leftJoinAndSelect('e.program', 'program')
      .leftJoinAndSelect('program.cohort', 'cohort')
      .orderBy('e.enrolledAt', 'DESC')
      .getMany();
  }

  findByLearner(learnerId: string) {
    return this.repo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.learner', 'learner')
      .leftJoinAndSelect('e.program', 'program')
      .leftJoinAndSelect('program.cohort', 'cohort')
      .where('learner.id = :learnerId', { learnerId })
      .getMany();
  }

  findByProgram(programId: string) {
    return this.repo.find({ where: { program: { id: programId } } });
  }

  findByCohort(cohortId: string) {
    return this.repo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.learner', 'learner')
      .leftJoinAndSelect('e.program', 'program')
      .leftJoinAndSelect('program.cohort', 'cohort')
      .where('cohort.id = :cohortId', { cohortId })
      .getMany();
  }

  async findOne(id: string) {
    const enrollment = await this.repo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.learner', 'learner')
      .leftJoinAndSelect('e.program', 'program')
      .leftJoinAndSelect('program.cohort', 'cohort')
      .where('e.id = :id', { id })
      .getOne();
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    return enrollment;
  }

  async updateStatus(id: string, status: EnrollmentStatus) {
    const before = await this.findOne(id);
    await this.repo.update(id, { status });
    if (before.status !== status) this.notifications.enrollmentStatusChanged(id);
    return this.findOne(id);
  }

  /** Admin reinstates a withdrawn/rejected enrollment back to approved (capacity-checked). */
  async reinstate(id: string) {
    const enrollment = await this.findOne(id);
    if (enrollment.status === EnrollmentStatus.APPROVED) return enrollment;

    const programId = enrollment.program?.id;
    const max = enrollment.program?.maxLearners;
    if (programId && max) {
      const taken = await this.repo.count({
        where: { program: { id: programId }, status: EnrollmentStatus.APPROVED },
      });
      if (taken >= max) {
        throw new BadRequestException('Program is full — cannot reinstate.');
      }
    }
    await this.repo.update(id, { status: EnrollmentStatus.APPROVED });
    this.notifications.enrollmentStatusChanged(id);
    return this.findOne(id);
  }

  /** A learner withdraws from their own enrollment (admins may withdraw any). */
  async withdraw(id: string, userId: string, isAdmin: boolean, reason?: string) {
    const enrollment = await this.findOne(id);
    if (!isAdmin && enrollment.learner?.id !== userId) {
      throw new ForbiddenException('You can only withdraw from your own enrollment');
    }
    if (enrollment.status === EnrollmentStatus.WITHDRAWN) return enrollment;
    await this.repo.update(id, {
      status: EnrollmentStatus.WITHDRAWN,
      ...(reason ? { notes: reason } : {}),
    });
    return this.findOne(id);
  }
}
