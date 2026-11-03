import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

// One row per staff/admin action. Rows are only ever inserted, never updated or deleted.
@Entity('audit_entries')
export class AuditEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @CreateDateColumn()
  createdAt: Date;

  // Null for actions taken by the system (e.g. a payment confirmed by Paystack).
  @Index()
  @Column({ type: 'uuid', nullable: true })
  actorId: string | null;

  // Copied at the time of the action, so the log still reads correctly if the account changes or is deleted.
  @Column({ nullable: true })
  actorName: string | null;

  @Column({ nullable: true })
  actorEmail: string | null;

  @Column({ nullable: true })
  actorRole: string | null;

  @Index()
  @Column()
  action: string;

  @Column()
  entity: string;

  @Column({ nullable: true })
  entityId: string | null;

  @Column({ type: 'text' })
  summary: string;

  // { field: [before, after] } for tracked, non-secret fields only.
  @Column({ type: 'jsonb', nullable: true })
  changes: Record<string, [unknown, unknown]> | null;

  @Column({ nullable: true })
  ip: string | null;
}
