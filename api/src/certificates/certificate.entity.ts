import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Cohort } from '../cohorts/cohort.entity';
import { Enrollment } from '../enrollments/enrollment.entity';

@Entity('certificates')
@Index('UQ_certificates_enrollment', ['enrollment'], { unique: true })
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.certificates, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Cohort, { eager: true })
  @JoinColumn({ name: 'cohortId' })
  cohort: Cohort;

  // The enrollment (learner + track) whose approved graduation this certificate is for.
  // One certificate per enrollment; null only for certificates issued before graduation was required.
  @ManyToOne(() => Enrollment, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'enrollmentId' })
  enrollment: Enrollment | null;

  @Column({ unique: true })
  certificateNumber: string;

  @Column({ type: 'date' })
  issuedDate: Date;

  @Column({ nullable: true })
  downloadUrl: string;

  // Optional certificate file uploaded by an admin (PDF/PNG/JPEG). Stored in the database
  // because the API's disk is wiped on every deploy. Never selected unless asked for.
  @Column({ type: 'varchar', nullable: true })
  fileName: string | null;

  @Column({ type: 'varchar', nullable: true })
  fileType: string | null;

  @Column({ type: 'int', nullable: true })
  fileSize: number | null;

  @Column({ type: 'bytea', nullable: true, select: false })
  fileData: Buffer | null;

  @CreateDateColumn()
  createdAt: Date;
}
