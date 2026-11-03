import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { Cohort } from '../cohorts/cohort.entity';
import { Submission } from './submission.entity';

@Entity('assignments')
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'timestamp' })
  dueDate: Date;

  @Column({ default: 100 })
  maxScore: number;

  @ManyToOne(() => Cohort)
  @JoinColumn({ name: 'cohortId' })
  cohort: Cohort;

  // The track this assignment belongs to. Null only for assignments created before
  // assignments were per track; those still show to every track in the cohort.
  @ManyToOne('Program', { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'programId' })
  program: any;

  // At most one per track: the final project that graduation is assessed on.
  @Column({ default: false })
  isCapstone: boolean;

  @OneToMany(() => Submission, (s) => s.assignment)
  submissions: Submission[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
