import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('raid_plan_boss_resources')
export class RaidPlanBossResourceOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'boss_note_id' })
  bossNoteId!: string;

  @Column({ type: 'varchar' })
  url!: string;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ name: 'thumbnail_url', type: 'varchar', nullable: true })
  thumbnailUrl?: string;

  @Column({ type: 'varchar' })
  type!: string;

  @ManyToOne(() => RaidPlanBossNoteOrmEntity, (note) => note.resources, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'boss_note_id' })
  bossNote?: unknown;
}

@Entity('raid_plan_boss_notes')
export class RaidPlanBossNoteOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'raid_plan_id' })
  raidPlanId!: string;

  @Column({ name: 'boss_id' })
  bossId!: string;

  @Column({ type: 'text', default: '' })
  notes!: string;

  @Column({ type: 'varchar', default: 'progression' })
  status!: string;

  @OneToMany(() => RaidPlanBossResourceOrmEntity, (r) => r.bossNote, { cascade: true, eager: true })
  resources!: RaidPlanBossResourceOrmEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
