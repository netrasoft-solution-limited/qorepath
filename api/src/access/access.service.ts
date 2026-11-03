import { ForbiddenException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Program } from '../programs/program.entity';
import { Enrollment, EnrollmentStatus } from '../enrollments/enrollment.entity';
import { User } from '../users/user.entity';
import { effectivePermissions } from '../auth/permissions';

export interface Caller {
  id: string;
  role: string;
}

/**
 * Resource-level authorization: role guards say *what kind* of user you are,
 * this says whether you belong to *this* program/cohort. Admins always pass.
 *  - staff   = the program's instructor or one of its assistants
 *  - learner = an approved enrollment in the program
 */
@Injectable()
export class AccessService {
  constructor(private dataSource: DataSource) {}

  private isAdmin(user: Caller) {
    return user.role === 'admin';
  }

  /** Program ids this user teaches or assists on. */
  async staffProgramIds(userId: string): Promise<string[]> {
    const rows = await this.dataSource
      .getRepository(Program)
      .createQueryBuilder('p')
      .leftJoin('p.instructor', 'instructor')
      .leftJoin('p.assistants', 'assistant')
      .where('instructor.id = :userId OR assistant.id = :userId', { userId })
      .select('p.id', 'id')
      .getRawMany();
    return [...new Set(rows.map((r) => r.id as string))];
  }

  /** Program ids this learner is approved in. */
  async learnerProgramIds(userId: string): Promise<string[]> {
    const rows = await this.dataSource
      .getRepository(Enrollment)
      .createQueryBuilder('e')
      .leftJoin('e.program', 'program')
      .leftJoin('e.learner', 'learner')
      .where('learner.id = :userId', { userId })
      .andWhere('e.status = :status', { status: EnrollmentStatus.APPROVED })
      .select('program.id', 'id')
      .getRawMany();
    return rows.map((r) => r.id as string).filter(Boolean);
  }

  private async cohortIdsOfPrograms(programIds: string[]): Promise<string[]> {
    if (!programIds.length) return [];
    const rows = await this.dataSource
      .getRepository(Program)
      .createQueryBuilder('p')
      .leftJoin('p.cohort', 'cohort')
      .where('p.id IN (:...ids)', { ids: programIds })
      .select('cohort.id', 'cohortId')
      .getRawMany();
    return [...new Set(rows.map((r) => r.cohortId as string).filter(Boolean))];
  }

  /** Cohorts the user is connected to (as staff, and optionally as a learner). */
  async cohortIdsFor(user: Caller, includeLearner = true): Promise<string[]> {
    const programs = [...(await this.staffProgramIds(user.id)), ...(includeLearner ? await this.learnerProgramIds(user.id) : [])];
    return this.cohortIdsOfPrograms(programs);
  }

  async canStaffProgram(user: Caller, programId?: string | null): Promise<boolean> {
    if (this.isAdmin(user)) return true;
    if (!programId) return false;
    return (await this.staffProgramIds(user.id)).includes(programId);
  }

  async canViewProgram(user: Caller, programId?: string | null): Promise<boolean> {
    if (await this.canStaffProgram(user, programId)) return true;
    if (!programId) return false;
    return (await this.learnerProgramIds(user.id)).includes(programId);
  }

  async canStaffCohort(user: Caller, cohortId?: string | null): Promise<boolean> {
    if (this.isAdmin(user)) return true;
    if (!cohortId) return false;
    return (await this.cohortIdsFor(user, false)).includes(cohortId);
  }

  async canViewCohort(user: Caller, cohortId?: string | null): Promise<boolean> {
    if (this.isAdmin(user)) return true;
    if (!cohortId) return false;
    return (await this.cohortIdsFor(user, true)).includes(cohortId);
  }

  /** For admins: does this one hold any of these permission keys? Super admins always do. */
  async adminHas(userId: string, ...anyOf: string[]): Promise<boolean> {
    const u = await this.dataSource.getRepository(User).findOneBy({ id: userId });
    if (!u || u.role !== 'admin' || !u.isActive) return false;
    if (u.isSuperAdmin) return true;
    const mine = effectivePermissions(u);
    return anyOf.some((p) => mine.includes(p));
  }

  async assert(allowed: Promise<boolean> | boolean, message = 'You do not have access to this resource') {
    if (!(await allowed)) throw new ForbiddenException(message);
  }
}
