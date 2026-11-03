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

  @OneToMany(() => Submission, (s) => s.assignment)
  submissions: Submission[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
