import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * - raider_chase_items.methods: a chase can now be for a boss drop, a bonus roll, or both (comma separated). Filled
 *   from the old single `method` column.
 * - raider_bis_marks: the raider's own "best in slot" mark on the item worn in a slot (crafted pieces, dungeon items,
 *   catalysed tier pieces).
 */
export class ChaseMethodsAndBisMarks1779321600000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE raider_chase_items ADD COLUMN IF NOT EXISTS methods text NOT NULL DEFAULT 'boss_drop'`);
    await queryRunner.query(`UPDATE raider_chase_items SET methods = method WHERE method IS NOT NULL`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS raider_bis_marks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        raider_id varchar NOT NULL,
        slot varchar NOT NULL,
        item_id integer NOT NULL,
        reason varchar NOT NULL DEFAULT 'manual',
        note varchar,
        created_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_raider_bis_marks_raider_slot" UNIQUE (raider_id, slot)
      )
    `);
    await queryRunner.query(`ALTER TABLE raider_bis_marks ENABLE ROW LEVEL SECURITY`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS raider_bis_marks`);
    await queryRunner.query(`ALTER TABLE raider_chase_items DROP COLUMN IF EXISTS methods`);
  }
}
