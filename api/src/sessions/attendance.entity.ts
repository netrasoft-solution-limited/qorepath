import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Session } from './session.entity';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  EXCUSED = 'excused',
}

@Entity('attendances')
@Index('UQ_attendance_session_learner', ['session', 'learner'], { unique: true })
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'learnerId' })
  learner: User;

  @ManyToOne(() => Session, (s) => s.attendances)
  @JoinColumn({ name: 'sessionId' })
  session: Session;

  @Column({ type: 'enum', enum: AttendanceStatus, default: AttendanceStatus.ABSENT })
  status: AttendanceStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  markedAt: Date;
}
