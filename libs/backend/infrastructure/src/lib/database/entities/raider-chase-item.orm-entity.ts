import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';
import { ChaseMethod } from '@crusaders-bis-list/shared-domain';

/** An item a raider "chases" (wants, but does not reserve). Separate from reservations: never counts against a limit. */
@Entity('raider_chase_items')
@Unique(['raiderId', 'itemId', 'raidSeasonId'])
export class RaiderChaseItemOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'raider_id' })
  raiderId!: string;

  @Column({ name: 'item_id' })
  itemId!: string;

  @Column({ name: 'raid_season_id' })
  raidSeasonId!: string;

  /** One or both of boss_drop / bonus_roll. (The old single `method` column is no longer used.) */
  @Column({ type: 'simple-array', default: ChaseMethod.BOSS_DROP })
  methods!: ChaseMethod[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
