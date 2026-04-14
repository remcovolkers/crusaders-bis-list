import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('season_configs')
export class SeasonConfigOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'raid_season_id', unique: true })
  raidSeasonId!: string;

  @Column({ name: 'trinket_limit', type: 'int', default: 2 })
  trinketLimit!: number;

  @Column({ name: 'weapon_limit', type: 'int', default: 2 })
  weaponLimit!: number;

  @Column({ name: 'jewelry_limit', type: 'int', default: 1 })
  jewelryLimit!: number;

  @Column({ name: 'other_limit', type: 'int', default: 1 })
  otherLimit!: number;

  @Column({ name: 'superrare_limit', type: 'int', default: 0 })
  superrareLimit!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
