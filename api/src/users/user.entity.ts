import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany,
} from 'typeorm';
import { Enrollment } from '../enrollments/enrollment.entity';
import { Payment } from '../payments/payment.entity';
import { Certificate } from '../certificates/certificate.entity';

export enum UserRole {
  LEARNER = 'learner',
  INSTRUCTOR = 'instructor',
  ASSISTANT = 'assistant',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  // Never selected by default (including via eager relations); use findByEmailWithPassword.
  @Column({ select: false })
  password: string;

  // Password reset / first-login set-password token. Only the SHA-256 hash is stored.
  @Column({ type: 'varchar', nullable: true, select: false })
  resetTokenHash: string | null;

  @Column({ type: 'timestamp', nullable: true, select: false })
  resetTokenExpires: Date | null;

  @Column({ type: 'timestamp', nullable: true, select: false })
  resetTokenIssuedAt: Date | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.LEARNER })
  role: UserRole;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ default: true })
  isActive: boolean;

  // Super admins can manage platform credentials (Paystack, Resend) and other super admins.
  @Column({ default: false })
  isSuperAdmin: boolean;

  @Column({ type: 'simple-array', nullable: true })
  permissions: string[];

  @OneToMany(() => Enrollment, (e) => e.learner)
  enrollments: Enrollment[];

  @OneToMany(() => Payment, (p) => p.user)
  payments: Payment[];

  @OneToMany(() => Certificate, (c) => c.user)
  certificates: Certificate[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
