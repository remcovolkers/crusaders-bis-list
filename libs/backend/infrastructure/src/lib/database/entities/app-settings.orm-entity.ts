import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('app_settings')
export class AppSettingsOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'discord_webhook_url', type: 'text', nullable: true })
  discordWebhookUrl!: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
