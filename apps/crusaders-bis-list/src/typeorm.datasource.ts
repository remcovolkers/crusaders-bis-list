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

import { UserOrmEntity } from '../../../libs/backend/infrastructure/src/lib/database/entities/user.orm-entity';
import { RaiderProfileOrmEntity } from '../../../libs/backend/infrastructure/src/lib/database/entities/raider-profile.orm-entity';
import { RaidSeasonOrmEntity, BossOrmEntity, ItemOrmEntity } from '../../../libs/backend/infrastructure/src/lib/database/entities/catalog.orm-entity';
import { ReservationOrmEntity, AssignmentOrmEntity } from '../../../libs/backend/infrastructure/src/lib/database/entities/loot.orm-entity';
import { SeasonConfigOrmEntity } from '../../../libs/backend/infrastructure/src/lib/database/entities/season-config.orm-entity';
import { RaiderReceivedItemOrmEntity } from '../../../libs/backend/infrastructure/src/lib/database/entities/raider-received-item.orm-entity';
import { MIGRATIONS } from '../../../libs/backend/infrastructure/src/lib/database/migrations';

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
