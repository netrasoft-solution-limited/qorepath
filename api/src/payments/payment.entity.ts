import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Cohort } from '../cohorts/cohort.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  PAYSTACK = 'paystack',
  BANK_TRANSFER = 'bank_transfer',
  CARD = 'card',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.payments, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Cohort, { eager: true, nullable: true })
  @JoinColumn({ name: 'cohortId' })
  cohort: Cohort;

  @ManyToOne('Program', { eager: true, nullable: true })
  @JoinColumn({ name: 'programId' })
  program: any;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  method: PaymentMethod;

  @Column({ nullable: true })
  reference: string;

  @Column({ nullable: true })
  paystackReference: string;

  // Installment plan support. For a full one-off payment these stay null.
  // Installments of the same plan share a planReference; installmentNumber is
  // 1-based and totalInstallments is the number of parts (e.g. 2 for 50/50).
  @Column({ nullable: true })
  planReference: string;

  @Column({ type: 'int', nullable: true })
  installmentNumber: number;

  @Column({ type: 'int', nullable: true })
  totalInstallments: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
