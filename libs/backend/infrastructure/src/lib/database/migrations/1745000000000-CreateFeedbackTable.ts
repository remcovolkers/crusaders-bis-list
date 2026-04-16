import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFeedbackTable1745000000000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "feedback" (
        "id"           uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id"      varchar NOT NULL,
        "user_email"   varchar NOT NULL,
        "user_name"    varchar NOT NULL,
        "message"      text NOT NULL,
        "page_context" varchar NOT NULL,
        "created_at"   timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_feedback" PRIMARY KEY ("id")
      )
    `);
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query(`DROP TABLE IF EXISTS "feedback"`);
  }
}
