import { Module } from '@nestjs/common';
import { ReserveItemUseCase, CancelReservationUseCase } from './use-cases/reservation.use-case';
import { AssignLootUseCase, UpdateAssignmentStatusUseCase } from './use-cases/assignment.use-case';
import { GetBossLootViewUseCase, GetRaidCatalogUseCase } from './use-cases/raid-catalog.use-case';
import { FindOrCreateUserUseCase, ManageUserRolesUseCase, LinkBnetUseCase } from './use-cases/user.use-case';
import { SyncRaidCatalogFromBlizzardUseCase } from './use-cases/sync-raid-catalog.use-case';
import { ResetCatalogAndSyncUseCase } from './use-cases/reset-catalog-and-sync.use-case';
import {
  GetSeasonConfigUseCase,
  UpdateSeasonConfigUseCase,
  UpdateItemSuperRareUseCase,
} from './use-cases/season-config.use-case';
import { GetAllRaiderReservationsUseCase } from './use-cases/raider-reservations.use-case';
import { ResetAllReservationsUseCase } from './use-cases/reset-all-reservations.use-case';
import { RollSessionService } from './use-cases/roll-session.service';
import { BackendInfrastructureModule } from '@crusaders-bis-list/backend-infrastructure';

@Module({
  imports: [BackendInfrastructureModule],
  providers: [
    ReserveItemUseCase,
    CancelReservationUseCase,
    AssignLootUseCase,
    UpdateAssignmentStatusUseCase,
    GetBossLootViewUseCase,
    GetRaidCatalogUseCase,
    FindOrCreateUserUseCase,
    LinkBnetUseCase,
    ManageUserRolesUseCase,
    SyncRaidCatalogFromBlizzardUseCase,
    ResetCatalogAndSyncUseCase,
    GetSeasonConfigUseCase,
    UpdateSeasonConfigUseCase,
    UpdateItemSuperRareUseCase,
    GetAllRaiderReservationsUseCase,
    ResetAllReservationsUseCase,
    RollSessionService,
  ],
  exports: [
    BackendInfrastructureModule,
    ReserveItemUseCase,
    CancelReservationUseCase,
    AssignLootUseCase,
    UpdateAssignmentStatusUseCase,
    GetBossLootViewUseCase,
    GetRaidCatalogUseCase,
    FindOrCreateUserUseCase,
    LinkBnetUseCase,
    ManageUserRolesUseCase,
    SyncRaidCatalogFromBlizzardUseCase,
    ResetCatalogAndSyncUseCase,
    GetSeasonConfigUseCase,
    UpdateSeasonConfigUseCase,
    UpdateItemSuperRareUseCase,
    GetAllRaiderReservationsUseCase,
    ResetAllReservationsUseCase,
    RollSessionService,
  ],
})
export class BackendApplicationModule {}
