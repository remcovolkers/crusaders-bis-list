import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export type AuditAction =
  | 'reservation_created'
  | 'reservation_cancelled'
  | 'reservation_reset_all'
  | 'loot_assigned'
  | 'assignment_updated'
  | 'received_item_marked';

@Entity('audit_log')
export class AuditLogOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  action!: AuditAction;

  @Column({ name: 'actor_id' })
  @Index()
  actorId!: string;

  @Column({ name: 'actor_name' })
  actorName!: string;

  @Column({ name: 'raider_name', nullable: true, type: 'varchar' })
  raiderName!: string | null;

  @Column({ name: 'item_name', nullable: true, type: 'varchar' })
  itemName!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  details!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt!: Date;
}
