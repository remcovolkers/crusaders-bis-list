import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Best item level per season/team: the highest item level a boss drop gives and the (higher) item level a bonus roll
 * gives on certain bosses. "Best in slot" depends on it. Both nullable: null = defaults of the season definition.
 */
export class AddItemLevelCaps1779235200000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE season_configs ADD COLUMN IF NOT EXISTS max_item_level integer`);
    await queryRunner.query(`ALTER TABLE season_configs ADD COLUMN IF NOT EXISTS bonus_roll_item_levels text`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE season_configs DROP COLUMN IF EXISTS bonus_roll_item_levels`);
    await queryRunner.query(`ALTER TABLE season_configs DROP COLUMN IF EXISTS max_item_level`);
  }
}
