import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';
import { AssignmentStatus } from '@crusaders-bis-list/shared-domain';

@Entity('raider_received_items')
@Unique(['raiderId', 'itemId'])
export class RaiderReceivedItemOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'raider_id' })
  raiderId!: string;

  @Column({ name: 'item_id' })
  itemId!: string;

  @Column({ type: 'varchar' })
  tier!: AssignmentStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
