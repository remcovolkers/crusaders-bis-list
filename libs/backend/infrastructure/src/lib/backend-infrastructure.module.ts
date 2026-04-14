import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserOrmEntity } from './database/entities/user.orm-entity';
import { RaiderProfileOrmEntity } from './database/entities/raider-profile.orm-entity';
import { RaidSeasonOrmEntity, BossOrmEntity, ItemOrmEntity } from './database/entities/catalog.orm-entity';
import { ReservationOrmEntity, AssignmentOrmEntity } from './database/entities/loot.orm-entity';

import { UserRepository } from './database/repositories/user.repository';
import { RaiderRepository } from './database/repositories/raider.repository';
import { ReservationRepository, AssignmentRepository } from './database/repositories/loot.repository';
import { LootQueryRepository } from './database/repositories/loot-query.repository';
import { RaidCatalogRepository } from './database/repositories/raid-catalog.repository';

import { GoogleStrategy } from './auth/google.strategy';
import { JwtStrategy } from './auth/jwt.strategy';

import {
  USER_REPOSITORY,
  RAIDER_REPOSITORY,
  RESERVATION_REPOSITORY,
  ASSIGNMENT_REPOSITORY,
  LOOT_QUERY_REPOSITORY,
  RAID_CATALOG_REPOSITORY,
} from '@crusaders-bis-list/backend-domain';

const ORM_ENTITIES = [
  UserOrmEntity,
  RaiderProfileOrmEntity,
  RaidSeasonOrmEntity,
  BossOrmEntity,
  ItemOrmEntity,
  ReservationOrmEntity,
  AssignmentOrmEntity,
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
    GoogleStrategy,
    JwtStrategy,
  ],
  exports: [
    USER_REPOSITORY,
    RAIDER_REPOSITORY,
    RESERVATION_REPOSITORY,
    ASSIGNMENT_REPOSITORY,
    LOOT_QUERY_REPOSITORY,
    RAID_CATALOG_REPOSITORY,
    GoogleStrategy,
    JwtStrategy,
  ],
})
export class BackendInfrastructureModule {}

