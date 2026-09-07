import { MigrationInterface, QueryRunner } from 'typeorm';

/** Super-rare becomes a per-team override; the shared `items.is_super_rare` column stays as legacy/default only. */
export class AddItemSuperRareOverrides1778716800000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS item_super_rare_overrides (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        item_id uuid NOT NULL,
        team varchar NOT NULL,
        is_super_rare boolean NOT NULL DEFAULT false,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_item_super_rare_overrides_item_team" UNIQUE (item_id, team)
      )
    `);
    // Existing super-rare flags predate the Templars team — preserve them as Crusaders-only overrides.
    await queryRunner.query(`
      INSERT INTO item_super_rare_overrides (item_id, team, is_super_rare)
      SELECT id, 'crusaders', true FROM items WHERE is_super_rare = true
      ON CONFLICT (item_id, team) DO NOTHING
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS item_super_rare_overrides`);
  }
}
