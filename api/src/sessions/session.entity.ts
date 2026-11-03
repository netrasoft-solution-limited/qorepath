import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { Attendance } from './attendance.entity';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamp' })
  scheduledAt: Date;

  @Column({ nullable: true })
  durationMinutes: number;

  @Column({ nullable: true })
  zoomLink: string;

  @Column({ nullable: true })
  recordingUrl: string;

  @Column({ default: false })
  isCompleted: boolean;

  // Session belongs to a specific program (track) within a cohort
  @ManyToOne('Program', { eager: true, nullable: true })
  @JoinColumn({ name: 'programId' })
  program: any;

  @OneToMany(() => Attendance, (a) => a.session)
  attendances: Attendance[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
