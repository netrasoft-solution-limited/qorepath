import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Enrollment } from '../enrollments/enrollment.entity';

export enum WithdrawalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  DENIED = 'denied',
}

@Entity('withdrawal_requests')
export class WithdrawalRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Enrollment, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enrollmentId' })
  enrollment: Enrollment;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'learnerId' })
  learner: User;

  // Denormalized program reference for easy listing (program is also on enrollment).
  @ManyToOne('Program', { eager: true, nullable: true })
  @JoinColumn({ name: 'programId' })
  program: any;

  @Column({ type: 'enum', enum: WithdrawalStatus, default: WithdrawalStatus.PENDING })
  status: WithdrawalStatus;

  // Snapshots captured at withdrawal time.
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amountPaid: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  suggestedRefund: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  approvedRefund: number;

  // Cohort progress at time of withdrawal (0 = not yet started).
  @Column({ type: 'int', nullable: true })
  cohortWeek: number;

  @Column({ type: 'int', nullable: true })
  cohortTotalWeeks: number;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'text', nullable: true })
  adminNote: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;
}
