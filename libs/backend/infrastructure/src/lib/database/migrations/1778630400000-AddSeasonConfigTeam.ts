import { MigrationInterface, QueryRunner } from 'typeorm';

/** Season config becomes per-team: drops the season-only unique constraint in favor of (season, team). */
export class AddSeasonConfigTeam1778630400000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE season_configs
        ADD COLUMN IF NOT EXISTS team VARCHAR NOT NULL DEFAULT 'crusaders'
    `);
    // Drop whatever unique constraint currently covers raid_season_id alone — its auto-generated
    // name varies, so look it up instead of hardcoding it.
    await queryRunner.query(`
      DO $$
      DECLARE
        constraint_name text;
      BEGIN
        SELECT tc.constraint_name INTO constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'season_configs'
          AND tc.constraint_type = 'UNIQUE'
          AND ccu.column_name = 'raid_season_id'
        LIMIT 1;
        IF constraint_name IS NOT NULL THEN
          EXECUTE format('ALTER TABLE season_configs DROP CONSTRAINT %I', constraint_name);
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      ALTER TABLE season_configs
        ADD CONSTRAINT UQ_season_configs_season_team UNIQUE (raid_season_id, team)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE season_configs
        DROP CONSTRAINT IF EXISTS UQ_season_configs_season_team
    `);
    // Only the first row per season can be restored to a season-wide unique constraint.
    await queryRunner.query(`
      DELETE FROM season_configs a USING season_configs b
      WHERE a.raid_season_id = b.raid_season_id AND a.ctid < b.ctid
    `);
    await queryRunner.query(`
      ALTER TABLE season_configs
        ADD CONSTRAINT UQ_season_configs_season UNIQUE (raid_season_id)
    `);
    await queryRunner.query(`
      ALTER TABLE season_configs
        DROP COLUMN IF EXISTS team
    `);
  }
}
