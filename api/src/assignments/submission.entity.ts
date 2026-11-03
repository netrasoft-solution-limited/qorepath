import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Assignment } from './assignment.entity';

export enum SubmissionStatus {
  SUBMITTED = 'submitted',
  GRADED = 'graded',
  LATE = 'late',
  MISSING = 'missing',
}

@Entity('submissions')
export class Submission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'learnerId' })
  learner: User;

  @ManyToOne(() => Assignment, (a) => a.submissions)
  @JoinColumn({ name: 'assignmentId' })
  assignment: Assignment;

  @Column({ nullable: true })
  submissionUrl: string;

  @Column({ type: 'text', nullable: true })
  submissionText: string;

  @Column({ type: 'enum', enum: SubmissionStatus, default: SubmissionStatus.SUBMITTED })
  status: SubmissionStatus;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score: number;

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @CreateDateColumn()
  submittedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
