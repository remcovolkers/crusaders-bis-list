import { Module } from '@nestjs/common';
import { ReserveItemUseCase, CancelReservationUseCase } from './use-cases/reservation.use-case';
import { AssignLootUseCase, UpdateAssignmentStatusUseCase } from './use-cases/assignment.use-case';
import { GetBossLootViewUseCase, GetRaidCatalogUseCase } from './use-cases/raid-catalog.use-case';
import { FindOrCreateUserUseCase, ManageUserRolesUseCase } from './use-cases/user.use-case';
import { SyncRaidCatalogFromBlizzardUseCase } from './use-cases/sync-raid-catalog.use-case';
import { ResetCatalogAndSyncUseCase } from './use-cases/reset-catalog-and-sync.use-case';
import {
  GetSeasonConfigUseCase,
  UpdateSeasonConfigUseCase,
  UpdateItemSuperRareUseCase,
} from './use-cases/season-config.use-case';
import { GetAllRaiderReservationsUseCase } from './use-cases/raider-reservations.use-case';
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
    ManageUserRolesUseCase,
    SyncRaidCatalogFromBlizzardUseCase,
    ResetCatalogAndSyncUseCase,
    GetSeasonConfigUseCase,
    UpdateSeasonConfigUseCase,
    UpdateItemSuperRareUseCase,
    GetAllRaiderReservationsUseCase,
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
    ManageUserRolesUseCase,
    SyncRaidCatalogFromBlizzardUseCase,
    ResetCatalogAndSyncUseCase,
    GetSeasonConfigUseCase,
    UpdateSeasonConfigUseCase,
    UpdateItemSuperRareUseCase,
    GetAllRaiderReservationsUseCase,
  ],
})
export class BackendApplicationModule {}
