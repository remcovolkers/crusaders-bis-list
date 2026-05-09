import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { RaidPlanParticipantOrmEntity } from './raid-plan-participant.orm-entity';

export { RaidPlanParticipantOrmEntity } from './raid-plan-participant.orm-entity';

@Entity('raid_plans')
export class RaidPlanOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'raid_season_id' })
  raidSeasonId!: string;

  @Column({ name: 'raid_name' })
  raidName!: string;

  @Column({ type: 'varchar' })
  difficulty!: string;

  @Column({ name: 'scheduled_at', type: 'timestamp' })
  scheduledAt!: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'scheduled_discord_at', type: 'timestamp', nullable: true })
  scheduledDiscordAt?: Date | null;

  @Column({ name: 'discord_sent_at', type: 'timestamp', nullable: true })
  discordSentAt?: Date | null;

  @OneToMany(() => RaidPlanParticipantOrmEntity, (p) => p.raidPlan, {
    cascade: true,
    eager: true,
  })
  participants!: RaidPlanParticipantOrmEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
