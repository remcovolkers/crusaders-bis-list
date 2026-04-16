import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFeedbackResolved1745100000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE feedback
        ADD COLUMN IF NOT EXISTS resolved BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE feedback
        DROP COLUMN IF EXISTS resolved,
        DROP COLUMN IF EXISTS resolved_at
    `);
  }
}
