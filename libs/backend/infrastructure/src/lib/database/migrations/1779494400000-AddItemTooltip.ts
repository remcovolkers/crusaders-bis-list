import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Hover text of an item (binding, type, stat names, Use/Equip effects, set bonuses) as read from the Blizzard item
 * API by the catalog sync. JSON, nullable: items synced before this migration get it on the next catalog sync.
 */
export class AddItemTooltip1779494400000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE items ADD COLUMN IF NOT EXISTS tooltip text`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE items DROP COLUMN IF EXISTS tooltip`);
  }
}
