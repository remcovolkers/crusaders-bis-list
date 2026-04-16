import { MigrationInterface, QueryRunner } from 'typeorm';

export class PrimaryStatToArray1744848000000 implements MigrationInterface {
  name = 'PrimaryStatToArray1744848000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename primary_stat → primary_stats only if the old column still exists.
    const oldColExists = await queryRunner.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name='items' AND column_name='primary_stat'`,
    );
    if (oldColExists.length > 0) {
      await queryRunner.query(`ALTER TABLE "items" RENAME COLUMN "primary_stat" TO "primary_stats"`);
    }

    // Ensure no NULLs remain (TypeORM simple-array stores [] as empty string).
    await queryRunner.query(`UPDATE "items" SET "primary_stats" = '' WHERE "primary_stats" IS NULL`);
    await queryRunner.query(`ALTER TABLE "items" ALTER COLUMN "primary_stats" SET DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "items" ALTER COLUMN "primary_stats" SET NOT NULL`);

    // Remove is_multi_primary column if it exists (added in an earlier dev iteration).
    await queryRunner.query(`ALTER TABLE "items" DROP COLUMN IF EXISTS "is_multi_primary"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "is_multi_primary" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "items" ALTER COLUMN "primary_stats" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "items" ALTER COLUMN "primary_stats" DROP DEFAULT`);
    await queryRunner.query(`UPDATE "items" SET "primary_stats" = NULL WHERE "primary_stats" = ''`);
    await queryRunner.query(`ALTER TABLE "items" RENAME COLUMN "primary_stats" TO "primary_stat"`);
  }
}
