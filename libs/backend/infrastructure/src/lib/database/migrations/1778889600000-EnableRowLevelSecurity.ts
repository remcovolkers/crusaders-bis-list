import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Supabase exposes every public table via PostgREST; without RLS the anon key can read/write all data.
 * The backend connects as the table owner (bypasses RLS), so enabling RLS without policies only blocks PostgREST.
 */
export class EnableRowLevelSecurity1778889600000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE t record;
      BEGIN
        FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
          EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
        END LOOP;
      END $$;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE t record;
      BEGIN
        FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
          EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', t.tablename);
        END LOOP;
      END $$;
    `);
  }
}
