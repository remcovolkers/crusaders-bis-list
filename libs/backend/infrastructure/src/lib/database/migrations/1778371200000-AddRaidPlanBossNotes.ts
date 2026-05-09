import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRaidPlanBossNotes1778371200000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS raid_plan_boss_notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        raid_plan_id UUID NOT NULL REFERENCES raid_plans(id) ON DELETE CASCADE,
        boss_id UUID NOT NULL,
        notes TEXT NOT NULL DEFAULT '',
        status VARCHAR NOT NULL DEFAULT 'progression',
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        UNIQUE (raid_plan_id, boss_id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS raid_plan_boss_resources (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        boss_note_id UUID NOT NULL REFERENCES raid_plan_boss_notes(id) ON DELETE CASCADE,
        url VARCHAR NOT NULL,
        title VARCHAR NOT NULL,
        thumbnail_url VARCHAR,
        type VARCHAR NOT NULL DEFAULT 'link'
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS raid_plan_boss_resources`);
    await queryRunner.query(`DROP TABLE IF EXISTS raid_plan_boss_notes`);
  }
}
