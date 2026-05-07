import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropAppSettings1746748800000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS app_settings`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        discord_webhook_url TEXT,
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
  }
}
