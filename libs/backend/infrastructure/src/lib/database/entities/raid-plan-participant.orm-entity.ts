import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { RaidPlanOrmEntity } from './raid-plan.orm-entity';

@Entity('raid_plan_participants')
export class RaidPlanParticipantOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'raid_plan_id' })
  raidPlanId!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'display_name' })
  displayName!: string;

  @Column({ name: 'character_name' })
  characterName!: string;

  @Column({ name: 'wow_class', type: 'varchar' })
  wowClass!: string;

  @Column({ type: 'varchar' })
  spec!: string;

  @Column({ type: 'varchar' })
  role!: string;

  @Column({ name: 'group_number', type: 'int', nullable: true })
  groupNumber?: number | null;

  @ManyToOne(() => RaidPlanOrmEntity, (plan) => plan.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'raid_plan_id' })
  raidPlan?: RaidPlanOrmEntity;
}
