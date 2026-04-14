import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ArmorType } from '@crusaders-bis-list/shared-domain';

@Entity('raid_seasons')
export class RaidSeasonOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  slug!: string;

  @Column({ name: 'is_active', default: false })
  isActive!: boolean;

  @Column({ name: 'start_date', type: 'timestamp' })
  startDate!: Date;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate?: Date;
}

@Entity('bosses')
export class BossOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ name: 'raid_season_id' })
  raidSeasonId!: string;

  @Column({ name: 'raid_id', type: 'int', nullable: true })
  raidId?: number;

  @Column({ name: 'raid_name', nullable: true })
  raidName?: string;

  @Column({ name: 'raid_accent_color', nullable: true })
  raidAccentColor?: string;

  @Column({ name: 'wow_encounter_id', type: 'int', nullable: true, unique: true })
  wowEncounterId?: number;

  @Column({ type: 'int' })
  order!: number;
}

@Entity('items')
export class ItemOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ name: 'wow_item_id', type: 'int', nullable: true, unique: true })
  wowItemId?: number;

  @Column({ type: 'varchar' })
  category!: string;

  @Column({ name: 'armor_type', type: 'varchar', default: ArmorType.NONE })
  armorType!: string;

  @Column({ name: 'slot', type: 'varchar', default: 'Unknown' })
  slot!: string;

  @Column({ name: 'item_level', type: 'int', nullable: true })
  itemLevel?: number;

  @Column({ name: 'primary_stat', type: 'varchar', nullable: true })
  primaryStat?: string;

  @Column({ name: 'boss_id' })
  bossId!: string;

  @Column({ name: 'icon_url', nullable: true })
  iconUrl?: string;

  @Column({ name: 'is_prioritizable', default: true })
  isPrioritizable!: boolean;

  @Column({ name: 'is_super_rare', default: false })
  isSuperRare!: boolean;
}
