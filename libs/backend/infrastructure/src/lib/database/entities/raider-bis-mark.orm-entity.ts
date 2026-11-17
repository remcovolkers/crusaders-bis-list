import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';
import { BisMarkReason, EquipmentSlot } from '@crusaders-bis-list/shared-domain';

/** The raider's own "best in slot" mark on the item worn in a slot. One row per raider + slot. */
@Entity('raider_bis_marks')
@Unique(['raiderId', 'slot'])
export class RaiderBisMarkOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'raider_id' })
  raiderId!: string;

  @Column({ type: 'varchar' })
  slot!: EquipmentSlot;

  /** Blizzard item id of the marked item; the mark only counts while that item is worn in the slot. */
  @Column({ name: 'item_id', type: 'int' })
  itemId!: number;

  @Column({ type: 'varchar', default: 'manual' })
  reason!: BisMarkReason;

  @Column({ type: 'varchar', nullable: true })
  note!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
