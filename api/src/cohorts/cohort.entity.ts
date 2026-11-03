import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany,
} from 'typeorm';
import { Announcement } from '../announcements/announcement.entity';

export enum CohortStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('cohorts')
export class Cohort {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: CohortStatus, default: CohortStatus.UPCOMING })
  status: CohortStatus;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  // Programs live here — each program = one track within this cohort
  @OneToMany('Program', 'cohort', { eager: true, cascade: true })
  programs: any[];

  @OneToMany(() => Announcement, (a) => a.cohort)
  announcements: Announcement[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
