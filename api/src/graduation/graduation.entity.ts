import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Enrollment } from '../enrollments/enrollment.entity';
import { User } from '../users/user.entity';

export enum GraduationRecommendation {
  PASS = 'pass',
  CONDITIONAL = 'conditional',
  FAIL = 'fail',
}

export enum GraduationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  HELD = 'held',
  REJECTED = 'rejected',
}

@Entity('graduation_recommendations')
export class GraduationRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Enrollment, { eager: true })
  enrollment: Enrollment;

  @ManyToOne(() => User, { eager: true })
  submittedBy: User;

  @Column({ type: 'enum', enum: GraduationRecommendation, default: GraduationRecommendation.PASS })
  recommendation: GraduationRecommendation;

  @Column({ nullable: true })
  notes: string;

  @Column({ type: 'enum', enum: GraduationStatus, default: GraduationStatus.PENDING })
  status: GraduationStatus;

  @CreateDateColumn()
  createdAt: Date;
}
