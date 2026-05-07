import { MigrationInterface, QueryRunner } from 'typeorm';

export class RaidPlanFeature1746662400000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS raid_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        raid_season_id UUID NOT NULL,
        raid_name VARCHAR NOT NULL,
        difficulty VARCHAR NOT NULL,
        scheduled_at TIMESTAMP NOT NULL,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS raid_plan_participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        raid_plan_id UUID NOT NULL REFERENCES raid_plans(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        display_name VARCHAR NOT NULL,
        character_name VARCHAR NOT NULL,
        wow_class VARCHAR NOT NULL,
        spec VARCHAR NOT NULL,
        role VARCHAR NOT NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        discord_webhook_url TEXT,
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS app_settings`);
    await queryRunner.query(`DROP TABLE IF EXISTS raid_plan_participants`);
    await queryRunner.query(`DROP TABLE IF EXISTS raid_plans`);
  }
}
