import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRaidPlanDiscordSchedule1778457600000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE raid_plans
        ADD COLUMN IF NOT EXISTS scheduled_discord_at TIMESTAMP NULL,
        ADD COLUMN IF NOT EXISTS discord_sent_at TIMESTAMP NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE raid_plans
        DROP COLUMN IF EXISTS scheduled_discord_at,
        DROP COLUMN IF EXISTS discord_sent_at
    `);
  }
}
