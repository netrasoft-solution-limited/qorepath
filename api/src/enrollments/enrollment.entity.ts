import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum EnrollmentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

@Entity('enrollments')
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.enrollments, { eager: true })
  @JoinColumn({ name: 'learnerId' })
  learner: User;

  // Learner enrolls in a specific program (track) within a cohort
  @ManyToOne('Program', { eager: true, nullable: true })
  @JoinColumn({ name: 'programId' })
  program: any;

  @Column({ type: 'enum', enum: EnrollmentStatus, default: EnrollmentStatus.PENDING })
  status: EnrollmentStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  enrolledAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
