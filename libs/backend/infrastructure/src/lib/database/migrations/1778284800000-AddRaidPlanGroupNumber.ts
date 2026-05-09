import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRaidPlanGroupNumber1778284800000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE raid_plan_participants
        ADD COLUMN IF NOT EXISTS group_number INT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE raid_plan_participants DROP COLUMN IF EXISTS group_number
    `);
  }
}
