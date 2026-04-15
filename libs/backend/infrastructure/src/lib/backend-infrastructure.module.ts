import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserOrmEntity } from './database/entities/user.orm-entity';
import { RaiderProfileOrmEntity } from './database/entities/raider-profile.orm-entity';
import { RaidSeasonOrmEntity, BossOrmEntity, ItemOrmEntity } from './database/entities/catalog.orm-entity';
import { ReservationOrmEntity, AssignmentOrmEntity } from './database/entities/loot.orm-entity';
import { SeasonConfigOrmEntity } from './database/entities/season-config.orm-entity';
import { RaiderReceivedItemOrmEntity } from './database/entities/raider-received-item.orm-entity';

import { UserRepository } from './database/repositories/user.repository';
import { RaiderRepository } from './database/repositories/raider.repository';
import { ReservationRepository, AssignmentRepository } from './database/repositories/loot.repository';
import { LootQueryRepository } from './database/repositories/loot-query.repository';
import { RaidCatalogRepository } from './database/repositories/raid-catalog.repository';
import { SeasonConfigRepository } from './database/repositories/season-config.repository';
import { ReceivedItemRepository } from './database/repositories/received-item.repository';
import { BlizzardApiService } from './blizzard/blizzard-api.service';

import {
  USER_REPOSITORY,
  RAIDER_REPOSITORY,
  RESERVATION_REPOSITORY,
  ASSIGNMENT_REPOSITORY,
  LOOT_QUERY_REPOSITORY,
  RAID_CATALOG_REPOSITORY,
  SEASON_CONFIG_REPOSITORY,
  BLIZZARD_API_SERVICE,
  RECEIVED_ITEM_REPOSITORY,
} from '@crusaders-bis-list/backend-domain';

const ORM_ENTITIES = [
  UserOrmEntity,
  RaiderProfileOrmEntity,
  RaidSeasonOrmEntity,
  BossOrmEntity,
  ItemOrmEntity,
  ReservationOrmEntity,
  AssignmentOrmEntity,
  SeasonConfigOrmEntity,
  RaiderReceivedItemOrmEntity,
];

@Module({
  imports: [TypeOrmModule.forFeature(ORM_ENTITIES)],
  providers: [
    { provide: USER_REPOSITORY, useClass: UserRepository },
    { provide: RAIDER_REPOSITORY, useClass: RaiderRepository },
    { provide: RESERVATION_REPOSITORY, useClass: ReservationRepository },
    { provide: ASSIGNMENT_REPOSITORY, useClass: AssignmentRepository },
    { provide: LOOT_QUERY_REPOSITORY, useClass: LootQueryRepository },
    { provide: RAID_CATALOG_REPOSITORY, useClass: RaidCatalogRepository },
    { provide: SEASON_CONFIG_REPOSITORY, useClass: SeasonConfigRepository },
    { provide: RECEIVED_ITEM_REPOSITORY, useClass: ReceivedItemRepository },
    { provide: BLIZZARD_API_SERVICE, useClass: BlizzardApiService },
  ],
  exports: [
    USER_REPOSITORY,
    RAIDER_REPOSITORY,
    RESERVATION_REPOSITORY,
    ASSIGNMENT_REPOSITORY,
    LOOT_QUERY_REPOSITORY,
    RAID_CATALOG_REPOSITORY,
    SEASON_CONFIG_REPOSITORY,
    RECEIVED_ITEM_REPOSITORY,
    BLIZZARD_API_SERVICE,
  ],
})
export class BackendInfrastructureModule {}
