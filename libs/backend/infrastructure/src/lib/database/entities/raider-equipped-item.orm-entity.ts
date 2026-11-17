import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';
import { AssignmentStatus, EquipmentSlot, IItemTooltip } from '@crusaders-bis-list/shared-domain';

/** Gear a raider currently wears, synced from the Blizzard armory. One row per raider + slot. */
@Entity('raider_equipped_items')
@Unique(['raiderId', 'slot'])
export class RaiderEquippedItemOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'raider_id' })
  raiderId!: string;

  @Column({ type: 'varchar' })
  slot!: EquipmentSlot;

  @Column({ name: 'item_id', type: 'int' })
  itemId!: number;

  @Column({ name: 'item_name', type: 'varchar' })
  itemName!: string;

  @Column({ name: 'item_level', type: 'int', default: 0 })
  itemLevel!: number;

  @Column({ type: 'varchar', nullable: true })
  tier!: AssignmentStatus | null;

  @Column({ name: 'tier_label', type: 'varchar', nullable: true })
  tierLabel!: string | null;

  @Column({ name: 'icon_url', type: 'varchar', nullable: true })
  iconUrl!: string | null;

  @Column({ name: 'tooltip', type: 'simple-json', nullable: true })
  tooltip!: IItemTooltip | null;

  @Column({ name: 'synced_at', type: 'timestamp' })
  syncedAt!: Date;
}
