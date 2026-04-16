import { AssignmentStatus } from '../enums/assignment-status.enum';

export interface ReserveItemRequest {
  itemId: string;
  raidSeasonId: string;
}

export interface AssignItemRequest {
  raiderId: string;
  itemId: string;
  bossId: string;
  raidSeasonId: string;
  status: AssignmentStatus;
}

export interface BossLootQueryParams {
  bossId: string;
  raidSeasonId: string;
}
