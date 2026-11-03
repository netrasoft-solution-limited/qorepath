import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Cohort } from '../cohorts/cohort.entity';

@Entity('certificates')
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.certificates, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Cohort, { eager: true })
  @JoinColumn({ name: 'cohortId' })
  cohort: Cohort;

  @Column({ unique: true })
  certificateNumber: string;

  @Column({ type: 'date' })
  issuedDate: Date;

  @Column({ nullable: true })
  downloadUrl: string;

  @CreateDateColumn()
  createdAt: Date;
}
