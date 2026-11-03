import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, LessThan, Repository } from 'typeorm';
import { AuditEntry } from './audit-entry.entity';
import { User } from '../users/user.entity';

export interface AuditActor {
  id: string;
  email?: string;
  role?: string;
}

export interface AuditRecord {
  actor?: AuditActor | null;
  action: string;
  entity: string;
  entityId?: string | null;
  summary: string;
  changes?: Record<string, [unknown, unknown]> | null;
  ip?: string | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditEntry) private repo: Repository<AuditEntry>,
    @InjectRepository(User) private users: Repository<User>,
  ) {}

  /** Never throws: a failure to write the log must not undo or fail the action itself. */
  async record(r: AuditRecord) {
    try {
      let actorName: string | null = null;
      let actorEmail = r.actor?.email ?? null;
      let actorRole = r.actor?.role ?? null;
      if (r.actor?.id) {
        const u = await this.users.findOne({ where: { id: r.actor.id }, select: ['id', 'firstName', 'lastName', 'email', 'role'] });
        if (u) {
          actorName = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || null;
          actorEmail = u.email;
          actorRole = u.role;
        }
      }
      await this.repo.insert({
        actorId: r.actor?.id ?? null,
        actorName,
        actorEmail,
        actorRole,
        action: r.action,
        entity: r.entity,
        entityId: r.entityId ?? null,
        summary: r.summary.slice(0, 2000),
        changes: (r.changes && Object.keys(r.changes).length ? r.changes : null) as any,
        ip: r.ip ?? null,
      });
    } catch (err) {
      this.logger.error(`Could not write audit entry ${r.action}`, err as Error);
    }
  }

  /** Newest first. `before` is the createdAt of the last row already shown (for "load more"). */
  list(q: { search?: string; action?: string; before?: string; limit?: number }) {
    const take = Math.min(Math.max(Number(q.limit) || 100, 1), 500);
    const qb = this.repo.createQueryBuilder('a').orderBy('a.createdAt', 'DESC').take(take);
    if (q.action) qb.andWhere('a.action = :action', { action: q.action });
    if (q.before && !isNaN(Date.parse(q.before))) qb.andWhere({ createdAt: LessThan(new Date(q.before)) });
    if (q.search?.trim()) {
      const s = `%${q.search.trim().toLowerCase()}%`;
      qb.andWhere(new Brackets((w) => {
        w.where('LOWER(a.summary) LIKE :s', { s })
          .orWhere('LOWER(a.actorName) LIKE :s', { s })
          .orWhere('LOWER(a.actorEmail) LIKE :s', { s });
      }));
    }
    return qb.getMany();
  }

  async actions(): Promise<string[]> {
    const rows = await this.repo.createQueryBuilder('a').select('DISTINCT a.action', 'action').orderBy('action').getRawMany();
    return rows.map((r) => r.action);
  }
}
