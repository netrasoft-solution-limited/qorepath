import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, ManyToMany, OneToMany, JoinColumn, JoinTable,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Cohort } from '../cohorts/cohort.entity';

@Entity('programs')
export class Program {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  track: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ default: 30 })
  maxLearners: number;

  @Column({ nullable: true })
  duration: string;

  @Column({ nullable: true })
  format: string;

  @Column({ nullable: true })
  schedule: string;

  @Column({ type: 'simple-json', nullable: true })
  outcomes: string[];

  @Column({ type: 'simple-json', nullable: true })
  curriculum: { week: number; title: string; topics: string[] }[];

  @ManyToOne(() => Cohort, (c: any) => c.programs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cohortId' })
  cohort: Cohort;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'instructorId' })
  instructor: User | null;

  @ManyToMany(() => User, { eager: true })
  @JoinTable({ name: 'program_assistants' })
  assistants: User[];

  @CreateDateColumn()
  createdAt: Date;
}
