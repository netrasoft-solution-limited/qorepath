import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

// Simple key/value settings store. Values are JSON-encoded strings.
@Entity('settings')
export class Setting {
  @PrimaryColumn()
  key: string;

  @Column({ type: 'text' })
  value: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
