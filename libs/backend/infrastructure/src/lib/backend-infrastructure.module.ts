import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedbackOrmEntity } from './database/entities/feedback.orm-entity';
import { FeedbackRepository } from './database/repositories/feedback.repository';

import { UserOrmEntity } from './database/entities/user.orm-entity';
import { RaiderProfileOrmEntity } from './database/entities/raider-profile.orm-entity';
import { RaidSeasonOrmEntity, BossOrmEntity, ItemOrmEntity } from './database/entities/catalog.orm-entity';
import { ReservationOrmEntity, AssignmentOrmEntity } from './database/entities/loot.orm-entity';
import { SeasonConfigOrmEntity } from './database/entities/season-config.orm-entity';
import { RaiderReceivedItemOrmEntity } from './database/entities/raider-received-item.orm-entity';
import { RaidPlanOrmEntity, RaidPlanParticipantOrmEntity } from './database/entities/raid-plan.orm-entity';

import { UserRepository } from './database/repositories/user.repository';
import { RaiderRepository } from './database/repositories/raider.repository';
import { ReservationRepository, AssignmentRepository } from './database/repositories/loot.repository';
import { LootQueryRepository } from './database/repositories/loot-query.repository';
import { RaidCatalogRepository } from './database/repositories/raid-catalog.repository';
import { SeasonConfigRepository } from './database/repositories/season-config.repository';
import { ReceivedItemRepository } from './database/repositories/received-item.repository';
import { AuditLogService } from './database/repositories/audit-log.service';
import { AuditLogOrmEntity } from './database/entities/audit-log.orm-entity';
import { BlizzardApiService } from './blizzard/blizzard-api.service';
import { EmailService } from './email/email.service';
import { RaidPlanRepository } from './database/repositories/raid-plan.repository';
import { DiscordWebhookService } from './discord/discord-webhook.service';

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
  RAID_PLAN_REPOSITORY,
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
  FeedbackOrmEntity,
  AuditLogOrmEntity,
  RaidPlanOrmEntity,
  RaidPlanParticipantOrmEntity,
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
    { provide: RAID_PLAN_REPOSITORY, useClass: RaidPlanRepository },
    FeedbackRepository,
    EmailService,
    AuditLogService,
    DiscordWebhookService,
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
    RAID_PLAN_REPOSITORY,
    FeedbackRepository,
    EmailService,
    AuditLogService,
    DiscordWebhookService,
  ],
})
export class BackendInfrastructureModule {}
