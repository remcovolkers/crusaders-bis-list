import { Module } from '@nestjs/common';
import { ReserveItemUseCase, CancelReservationUseCase } from './use-cases/reservation.use-case';
import { AssignLootUseCase, UpdateAssignmentStatusUseCase } from './use-cases/assignment.use-case';
import { GetBossLootViewUseCase, GetRaidCatalogUseCase } from './use-cases/raid-catalog.use-case';
import { FindOrCreateUserUseCase, ManageUserRolesUseCase } from './use-cases/user.use-case';

@Module({
  providers: [
    ReserveItemUseCase,
    CancelReservationUseCase,
    AssignLootUseCase,
    UpdateAssignmentStatusUseCase,
    GetBossLootViewUseCase,
    GetRaidCatalogUseCase,
    FindOrCreateUserUseCase,
    ManageUserRolesUseCase,
  ],
  exports: [
    ReserveItemUseCase,
    CancelReservationUseCase,
    AssignLootUseCase,
    UpdateAssignmentStatusUseCase,
    GetBossLootViewUseCase,
    GetRaidCatalogUseCase,
    FindOrCreateUserUseCase,
    ManageUserRolesUseCase,
  ],
})
export class BackendApplicationModule {}

