import { MigrationInterface, QueryRunner } from 'typeorm';

/** Introduces multi-team support: replaces the is_crusaders_member boolean with a team column. */
export class AddTeamColumn1778544000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS team VARCHAR NOT NULL DEFAULT 'crusaders'
    `);
    // All existing users predate the Templars team — keep them on Crusaders.
    await queryRunner.query(`UPDATE users SET team = 'crusaders'`);
    await queryRunner.query(`
      ALTER TABLE users
        DROP COLUMN IF EXISTS is_crusaders_member
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS is_crusaders_member BOOLEAN NOT NULL DEFAULT FALSE
    `);
    await queryRunner.query(`
      ALTER TABLE users
        DROP COLUMN IF EXISTS team
    `);
  }
}
