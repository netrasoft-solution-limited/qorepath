import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cohort, CohortStatus } from './cohort.entity';
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

  /** Only the cohort's own fields can be edited here; programs are managed through /programs. */
  async update(id: string, data: any) {
    const cohort = await this.findOne(id);
    const changes: Partial<Cohort> = {};
    if (data.name !== undefined) {
      const name = String(data.name).trim();
      if (!name) throw new BadRequestException('Cohort name cannot be empty');
      changes.name = name;
    }
    if (data.description !== undefined) changes.description = data.description ? String(data.description) : (null as any);
    if (data.status !== undefined) {
      if (!Object.values(CohortStatus).includes(data.status)) throw new BadRequestException('Unknown cohort status');
      changes.status = data.status;
    }
    for (const key of ['startDate', 'endDate'] as const) {
      if (data[key] === undefined) continue;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data[key])) || isNaN(Date.parse(data[key]))) {
        throw new BadRequestException(`${key === 'startDate' ? 'Start' : 'End'} date is not a valid date`);
      }
      changes[key] = data[key];
    }
    const day = (d: any) => (d ? new Date(d).toISOString().slice(0, 10) : '');
    const start = day(changes.startDate ?? cohort.startDate);
    const end = day(changes.endDate ?? cohort.endDate);
    if (start && end && end < start) throw new BadRequestException('End date must be on or after the start date');
    await this.repo.update(id, changes);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.repo.delete(id);
  }
}
