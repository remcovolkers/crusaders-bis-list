import { MigrationInterface } from 'typeorm';
import { BeastMasterySpecFix1744761600000 } from './1744761600000-BeastMasterySpecFix';

/**
 * All TypeORM migrations in chronological order.
 * Import MIGRATIONS in app.module.ts to ensure they run automatically on startup.
 * Add new migrations here after generating them with:
 *   npx nx run crusaders-bis-list:migration:generate --name=MyMigration
 */
export const MIGRATIONS: (new () => MigrationInterface)[] = [
  BeastMasterySpecFix1744761600000,
];
