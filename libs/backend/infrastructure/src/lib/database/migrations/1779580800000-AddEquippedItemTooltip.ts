import { MigrationInterface, QueryRunner } from 'typeorm';

/** Hover text of the gear a raider wears (JSON, nullable): filled by the gear sync, from the catalog or the Blizzard item API. */
export class AddEquippedItemTooltip1779580800000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE raider_equipped_items ADD COLUMN IF NOT EXISTS tooltip text`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE raider_equipped_items DROP COLUMN IF EXISTS tooltip`);
  }
}
