import { MigrationInterface, QueryRunner } from 'typeorm';

export class BeastMasterySpecFix1744761600000 implements MigrationInterface {
  name = 'BeastMasterySpecFix1744761600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE raider_profiles SET spec = 'Beast Mastery' WHERE spec = 'BeastMastery'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE raider_profiles SET spec = 'BeastMastery' WHERE spec = 'Beast Mastery'`,
    );
  }
}
