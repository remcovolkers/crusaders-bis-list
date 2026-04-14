import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('raid_seasons')
export class RaidSeasonOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ name: 'is_active', default: false })
  isActive: boolean;

  @Column({ name: 'start_date', type: 'timestamp' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate?: Date;
}

@Entity('bosses')
export class BossOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'raid_season_id' })
  raidSeasonId: string;

  @Column({ type: 'int' })
  order: number;
}

@Entity('items')
export class ItemOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'wow_item_id', type: 'int', nullable: true })
  wowItemId?: number;

  @Column({ type: 'varchar' })
  category: string; // ItemCategory

  @Column({ name: 'boss_id' })
  bossId: string;

  @Column({ name: 'icon_url', nullable: true })
  iconUrl?: string;

  @Column({ name: 'is_prioritizable', default: true })
  isPrioritizable: boolean;
}
