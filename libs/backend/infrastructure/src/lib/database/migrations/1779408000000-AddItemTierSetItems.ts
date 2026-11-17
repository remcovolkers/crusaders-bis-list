import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tier tokens turn into a set piece of the raider's class. This column holds, per class, the piece a token gives
 * (JSON: { "Priest": { wowItemId, name, iconUrl } }), filled by the Blizzard catalog sync. Nullable: unknown = the
 * token is shown as it is.
 */
export class AddItemTierSetItems1779408000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE items ADD COLUMN IF NOT EXISTS tier_set_items text`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE items DROP COLUMN IF EXISTS tier_set_items`);
  }
}
