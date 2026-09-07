import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { Team } from '@crusaders-bis-list/shared-domain';

/** Per-team override of an item's super-rare flag — items/catalog stay shared, this stays team-scoped. */
@Entity('item_super_rare_overrides')
@Unique(['itemId', 'team'])
export class ItemSuperRareOverrideOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'item_id' })
  itemId!: string;

  @Column({ type: 'varchar' })
  team!: Team;

  @Column({ name: 'is_super_rare', default: false })
  isSuperRare!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
