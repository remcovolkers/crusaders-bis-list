import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { Team } from '@crusaders-bis-list/shared-domain';

@Entity('season_configs')
@Unique(['raidSeasonId', 'team'])
export class SeasonConfigOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'raid_season_id' })
  raidSeasonId!: string;

  @Column({ type: 'varchar', default: Team.CRUSADERS })
  team!: Team;

  @Column({ name: 'trinket_limit', type: 'int', default: 2 })
  trinketLimit!: number;

  @Column({ name: 'weapon_limit', type: 'int', default: 2 })
  weaponLimit!: number;

  @Column({ name: 'jewelry_limit', type: 'int', default: 1 })
  jewelryLimit!: number;

  @Column({ name: 'other_limit', type: 'int', default: 1 })
  armorLimit!: number;

  @Column({ name: 'superrare_limit', type: 'int', default: 0 })
  superrareLimit!: number;

  /** Item level caps for reading the Hero / Myth track of worn gear. Null = defaults of the season definition. */
  @Column({ name: 'myth_item_level_from', type: 'int', nullable: true })
  mythItemLevelFrom!: number | null;

  @Column({ name: 'ambiguous_item_level_from', type: 'int', nullable: true })
  ambiguousItemLevelFrom!: number | null;

  @Column({ name: 'bonus_roll_enabled', default: true })
  bonusRollEnabled!: boolean;

  /** Highest item level a boss drop gives. Null = default of the season definition. */
  @Column({ name: 'max_item_level', type: 'int', nullable: true })
  maxItemLevel!: number | null;

  /** { [encounterId]: item level } for bosses whose bonus roll gives more than a drop. Null = season default. */
  @Column({ name: 'bonus_roll_item_levels', type: 'simple-json', nullable: true })
  bonusRollItemLevels!: Record<string, number> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
