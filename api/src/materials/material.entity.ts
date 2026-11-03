import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('materials')
export class Material {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  url: string;

  @Column({ default: 'link' })
  type: string;

  @Column({ default: 1 })
  week: number;

  @ManyToOne('Program', { eager: true, nullable: true })
  @JoinColumn({ name: 'programId' })
  program: any;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;

  @CreateDateColumn()
  createdAt: Date;
}
