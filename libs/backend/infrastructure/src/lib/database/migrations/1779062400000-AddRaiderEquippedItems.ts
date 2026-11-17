import { MigrationInterface, QueryRunner } from 'typeorm';

/** Gear each raider currently wears (synced from the Blizzard armory), used to tick off reserved / chased items. */
export class AddRaiderEquippedItems1779062400000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS raider_equipped_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        raider_id varchar NOT NULL,
        slot varchar NOT NULL,
        item_id integer NOT NULL,
        item_name varchar NOT NULL,
        item_level integer NOT NULL DEFAULT 0,
        tier varchar,
        tier_label varchar,
        icon_url varchar,
        synced_at timestamp NOT NULL,
        CONSTRAINT "UQ_raider_equipped_items_raider_slot" UNIQUE (raider_id, slot)
      )
    `);
    await queryRunner.query(`ALTER TABLE raider_equipped_items ENABLE ROW LEVEL SECURITY`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS raider_equipped_items`);
  }
}
