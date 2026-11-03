import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cohort } from './cohort.entity';
import { Enrollment, EnrollmentStatus } from '../enrollments/enrollment.entity';

@Injectable()
export class CohortsService {
  constructor(@InjectRepository(Cohort) private repo: Repository<Cohort>) {}

  create(data: Partial<Cohort>) {
    return this.repo.save(this.repo.create(data));
  }

  /**
   * Public listing. Staff are reduced to their display fields (no email/phone/permissions),
   * and each program carries `seatsTaken` = approved enrollments, so pages can show real availability.
   */
  async findAll() {
    const cohorts = await this.repo.find({ relations: ['programs', 'programs.instructor', 'programs.assistants'] });
    const counts = await this.repo.manager
      .getRepository(Enrollment)
      .createQueryBuilder('e')
      .leftJoin('e.program', 'program')
      .where('e.status = :status', { status: EnrollmentStatus.APPROVED })
      .select('program.id', 'programId')
      .addSelect('COUNT(*)', 'taken')
      .groupBy('program.id')
      .getRawMany();
    const taken = new Map(counts.map((c) => [c.programId as string, Number(c.taken)]));
    const publicUser = (u: any) => (u ? { id: u.id, firstName: u.firstName, lastName: u.lastName, avatarUrl: u.avatarUrl } : null);
    return cohorts.map((c) => ({
      ...c,
      programs: (c.programs ?? []).map((p: any) => ({
        ...p,
        instructor: publicUser(p.instructor),
        assistants: (p.assistants ?? []).map(publicUser),
        seatsTaken: taken.get(p.id) ?? 0,
      })),
    }));
  }

  async findOne(id: string) {
    const cohort = await this.repo.findOne({
      where: { id },
      relations: ['programs', 'programs.instructor', 'programs.assistants'],
    });
    if (!cohort) throw new NotFoundException('Cohort not found');
    return cohort;
  }

  async update(id: string, data: any) {
    const cohort = await this.findOne(id);
    Object.assign(cohort, data);
    return this.repo.save(cohort);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.repo.delete(id);
  }
}
