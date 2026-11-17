import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * - raider_chase_items.method: how the raider hopes to get a chased item (boss_drop | bonus_roll).
 * - season_configs: per season/team item level caps that tell the Hero and Myth tracks apart, and whether the season
 *   has bonus rolls. Caps are nullable: null = use the defaults of the season definition in code.
 */
export class AddChaseMethodAndSeasonRules1779148800000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE raider_chase_items ADD COLUMN IF NOT EXISTS method varchar NOT NULL DEFAULT 'boss_drop'`);
    await queryRunner.query(`ALTER TABLE season_configs ADD COLUMN IF NOT EXISTS myth_item_level_from integer`);
    await queryRunner.query(`ALTER TABLE season_configs ADD COLUMN IF NOT EXISTS ambiguous_item_level_from integer`);
    await queryRunner.query(`ALTER TABLE season_configs ADD COLUMN IF NOT EXISTS bonus_roll_enabled boolean NOT NULL DEFAULT true`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE season_configs DROP COLUMN IF EXISTS bonus_roll_enabled`);
    await queryRunner.query(`ALTER TABLE season_configs DROP COLUMN IF EXISTS ambiguous_item_level_from`);
    await queryRunner.query(`ALTER TABLE season_configs DROP COLUMN IF EXISTS myth_item_level_from`);
    await queryRunner.query(`ALTER TABLE raider_chase_items DROP COLUMN IF EXISTS method`);
  }
}
