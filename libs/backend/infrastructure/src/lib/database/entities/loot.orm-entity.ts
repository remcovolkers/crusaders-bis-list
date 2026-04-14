import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique,
} from 'typeorm';
import { AssignmentStatus } from '@crusaders-bis-list/shared-domain';

@Entity('reservations')
@Unique(['raiderId', 'itemId', 'raidSeasonId'])
export class ReservationOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'raider_id' })
  raiderId: string;

  @Column({ name: 'item_id' })
  itemId: string;

  @Column({ name: 'item_category' })
  itemCategory: string;

  @Column({ name: 'raid_season_id' })
  raidSeasonId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity('assignments')
export class AssignmentOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'raider_id' })
  raiderId: string;

  @Column({ name: 'item_id' })
  itemId: string;

  @Column({ name: 'boss_id' })
  bossId: string;

  @Column({ name: 'raid_season_id' })
  raidSeasonId: string;

  @Column({ type: 'varchar' })
  status: AssignmentStatus;

  @Column({ name: 'assigned_by_user_id' })
  assignedByUserId: string;

  @CreateDateColumn({ name: 'assigned_at' })
  assignedAt: Date;
}
