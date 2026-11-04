import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment, EnrollmentStatus } from './enrollment.entity';
import { NotificationsService } from '../mail/notifications.service';
import { User, UserRole } from '../users/user.entity';
import { Program } from '../programs/program.entity';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment) private repo: Repository<Enrollment>,
    private notifications: NotificationsService,
  ) {}

  /** Admin enrolls a learner by hand (e.g. paid by bank transfer, or a scholarship). Approved, capacity-checked. */
  async create(data: Partial<Enrollment> & { notes?: string; learnerEmail?: string }) {
    const programId = (data.program as any)?.id;
    const email = data.learnerEmail?.trim().toLowerCase();
    const learner = email
      ? await this.repo.manager.findOneBy(User, { email })
      : (data.learner as any)?.id ? await this.repo.manager.findOneBy(User, { id: (data.learner as any).id }) : null;
    if (!programId) throw new BadRequestException('Choose a track');
    if (!learner) throw new BadRequestException(email ? `No account found for ${email}. Ask them to sign up first.` : 'Choose a learner');
    if (learner.role !== UserRole.LEARNER) throw new BadRequestException('Only learner accounts can be enrolled');
    const learnerId = learner.id;
    const program = await this.repo.manager.findOneBy(Program, { id: programId });
    if (!program) throw new NotFoundException('Track not found');
    const existing = await this.repo.findOne({ where: { learner: { id: learnerId }, program: { id: programId } } });
    if (existing?.status === EnrollmentStatus.APPROVED) throw new BadRequestException('This learner is already enrolled in this track');
    if (existing) throw new BadRequestException(`This learner already has a ${existing.status} enrollment in this track. Use Reinstate or Approve on it instead.`);
    const status = (data.status as EnrollmentStatus) ?? EnrollmentStatus.APPROVED;
    if (status === EnrollmentStatus.APPROVED && program.maxLearners) {
      const taken = await this.repo.count({ where: { program: { id: programId }, status: EnrollmentStatus.APPROVED } });
      if (taken >= program.maxLearners) throw new BadRequestException('This track is full. Raise its seat limit first.');
    }
    const saved = await this.repo.save(this.repo.create({
      learner: { id: learnerId } as any, program: { id: programId } as any, status,
      notes: data.notes?.trim() || 'Enrolled by an admin',
    }));
    if (status === EnrollmentStatus.APPROVED) this.notifications.enrollmentStatusChanged(saved.id);
    return saved;
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
