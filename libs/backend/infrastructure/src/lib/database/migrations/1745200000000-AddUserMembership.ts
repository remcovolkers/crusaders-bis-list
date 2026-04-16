import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserMembership1745200000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS is_crusaders_member BOOLEAN NOT NULL DEFAULT FALSE
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        DROP COLUMN IF EXISTS is_crusaders_member
    `);
  }
}
