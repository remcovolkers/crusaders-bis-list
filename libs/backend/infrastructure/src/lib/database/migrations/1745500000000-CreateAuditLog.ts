import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLog1745500000000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "audit_log" (
        "id"           uuid        NOT NULL DEFAULT gen_random_uuid(),
        "action"       varchar     NOT NULL,
        "actor_id"     varchar     NOT NULL,
        "actor_name"   varchar     NOT NULL,
        "raider_name"  varchar,
        "item_name"    varchar,
        "details"      jsonb,
        "created_at"   timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_log" PRIMARY KEY ("id")
      )
    `);
    await runner.query(`CREATE INDEX "IDX_audit_log_created_at" ON "audit_log" ("created_at" DESC)`);
    await runner.query(`CREATE INDEX "IDX_audit_log_actor_id"   ON "audit_log" ("actor_id")`);
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query(`DROP TABLE IF EXISTS "audit_log"`);
  }
}
