import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBnetId1745300000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS bnet_id VARCHAR UNIQUE
    `);
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS battletag VARCHAR
    `);
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS bnet_access_token TEXT
    `);
    await queryRunner.query(`
      ALTER TABLE users
        ALTER COLUMN google_id DROP NOT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        ALTER COLUMN google_id SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE users
        DROP COLUMN IF EXISTS bnet_access_token
    `);
    await queryRunner.query(`
      ALTER TABLE users
        DROP COLUMN IF EXISTS battletag
    `);
    await queryRunner.query(`
      ALTER TABLE users
        DROP COLUMN IF EXISTS bnet_id
    `);
  }
}
