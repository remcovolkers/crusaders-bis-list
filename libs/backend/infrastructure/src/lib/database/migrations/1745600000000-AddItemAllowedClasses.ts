import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddItemAllowedClasses1745600000000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      ALTER TABLE "items"
        ADD COLUMN IF NOT EXISTS "allowed_classes" text
    `);
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query(`ALTER TABLE "items" DROP COLUMN IF EXISTS "allowed_classes"`);
  }
}
