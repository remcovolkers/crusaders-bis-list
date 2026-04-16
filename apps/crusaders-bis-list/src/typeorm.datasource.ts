/**
 * TypeORM DataSource used exclusively by the TypeORM CLI.
 * (not imported by the NestJS app itself – that uses app.module.ts)
 *
 * Usage:
 *   npx nx run crusaders-bis-list:migration:run
 *   npx nx run crusaders-bis-list:migration:generate --name=MyMigration
 *   npx nx run crusaders-bis-list:migration:revert
 */
import 'dotenv/config';
import { DataSource } from 'typeorm';

import { UserOrmEntity } from '@crusaders-bis-list/backend-infrastructure';
import { RaiderProfileOrmEntity } from '@crusaders-bis-list/backend-infrastructure';
import { RaidSeasonOrmEntity, BossOrmEntity, ItemOrmEntity } from '@crusaders-bis-list/backend-infrastructure';
import { ReservationOrmEntity, AssignmentOrmEntity } from '@crusaders-bis-list/backend-infrastructure';
import { SeasonConfigOrmEntity } from '@crusaders-bis-list/backend-infrastructure';
import { RaiderReceivedItemOrmEntity } from '@crusaders-bis-list/backend-infrastructure';
import { MIGRATIONS } from '@crusaders-bis-list/backend-infrastructure';

export default new DataSource({
  type: 'postgres',
  url: process.env['DATABASE_URL'],
  entities: [
    UserOrmEntity,
    RaiderProfileOrmEntity,
    RaidSeasonOrmEntity,
    BossOrmEntity,
    ItemOrmEntity,
    ReservationOrmEntity,
    AssignmentOrmEntity,
    SeasonConfigOrmEntity,
    RaiderReceivedItemOrmEntity,
  ],
  migrations: MIGRATIONS,
  migrationsTableName: 'typeorm_migrations',
  ssl: process.env['DATABASE_SSL'] === 'true' ? { rejectUnauthorized: false } : false,
});
