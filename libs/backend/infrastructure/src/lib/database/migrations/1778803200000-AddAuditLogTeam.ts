import { MigrationInterface, QueryRunner } from 'typeorm';

/** Audit log becomes filterable per team; existing rows predate Templars, so they default to Crusaders. */
export class AddAuditLogTeam1778803200000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE audit_log
        ADD COLUMN IF NOT EXISTS team VARCHAR NOT NULL DEFAULT 'crusaders'
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_log_team" ON audit_log ("team")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_log_team"`);
    await queryRunner.query(`
      ALTER TABLE audit_log
        DROP COLUMN IF EXISTS team
    `);
  }
}
