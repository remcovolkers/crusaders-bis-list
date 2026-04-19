import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMergedItemsAndCleanReservations1745400000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Add merged-item columns to items table ────────────────────────────
    await queryRunner.query(`
      ALTER TABLE items
        ADD COLUMN IF NOT EXISTS merged_with_item_id INTEGER,
        ADD COLUMN IF NOT EXISTS merged_display_name VARCHAR
    `);

    // ── 2. Remove duplicate reservations for secondary merged items ──────────
    // When a raider has reserved both a primary item and its secondary (merged)
    // counterpart, delete the secondary reservation so only the primary remains.
    //
    // Strategy: for each reservation on a secondary item (merged_with_item_id IS NOT NULL),
    // delete it if the same raider already has a reservation on the primary item
    // (identified via the primary's DB id matched through wow_item_id).
    await queryRunner.query(`
      DELETE FROM reservations r
      USING items secondary_item
        JOIN items primary_item
          ON primary_item.wow_item_id = secondary_item.merged_with_item_id
      WHERE r.item_id = secondary_item.id::varchar
        AND secondary_item.merged_with_item_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM reservations r2
          WHERE r2.item_id = primary_item.id::varchar
            AND r2.raider_id = r.raider_id
            AND r2.raid_season_id = r.raid_season_id
        )
    `);

    // ── 3. Also clean up received_items for the same secondary duplicates ────
    await queryRunner.query(`
      DELETE FROM raider_received_items ri
      USING items secondary_item
        JOIN items primary_item
          ON primary_item.wow_item_id = secondary_item.merged_with_item_id
      WHERE ri.item_id = secondary_item.id::varchar
        AND secondary_item.merged_with_item_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM raider_received_items ri2
          WHERE ri2.item_id = primary_item.id::varchar
            AND ri2.raider_id = ri.raider_id
        )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Column removal only — deleted reservations cannot be restored
    await queryRunner.query(`
      ALTER TABLE items
        DROP COLUMN IF EXISTS merged_display_name,
        DROP COLUMN IF EXISTS merged_with_item_id
    `);
  }
}
