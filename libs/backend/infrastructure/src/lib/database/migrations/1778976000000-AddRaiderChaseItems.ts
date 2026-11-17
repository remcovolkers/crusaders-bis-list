import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Chase items: items a raider wants but does not reserve (e.g. armor in a category without a reservation limit).
 * Gives officers an overview of which bosses still need clearing for gear upgrades. Not a reservation: no limits.
 */
export class AddRaiderChaseItems1778976000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS raider_chase_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        raider_id varchar NOT NULL,
        item_id varchar NOT NULL,
        raid_season_id varchar NOT NULL,
        created_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_raider_chase_items_raider_item_season" UNIQUE (raider_id, item_id, raid_season_id)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_raider_chase_items_item" ON raider_chase_items (item_id)
    `);
    // Match the other tables: expose nothing through PostgREST (see EnableRowLevelSecurity migration).
    await queryRunner.query(`ALTER TABLE raider_chase_items ENABLE ROW LEVEL SECURITY`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS raider_chase_items`);
  }
}
