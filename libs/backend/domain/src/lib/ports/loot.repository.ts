import { Assignment, Reservation } from '../entities/loot.entity';
import { AssignmentStatus, IBossLootView, IEligibleRaider, ItemCategory } from '@crusaders-bis-list/shared-domain';

export interface CreateReservationData {
  raiderId: string;
  itemId: string;
  itemCategory: ItemCategory;
  raidSeasonId: string;
}

export interface CreateAssignmentData {
  raiderId: string;
  itemId: string;
  bossId: string;
  raidSeasonId: string;
  status: AssignmentStatus;
  assignedByUserId: string;
}

export interface IReservationRepository {
  findByRaider(raiderId: string, raidSeasonId: string): Promise<Reservation[]>;
  findByRaiderAndCategory(raiderId: string, raidSeasonId: string, category: ItemCategory): Promise<Reservation[]>;
  findByItem(itemId: string, raidSeasonId: string): Promise<Reservation[]>;
  findExisting(raiderId: string, itemId: string, raidSeasonId: string): Promise<Reservation | null>;
  save(reservation: CreateReservationData): Promise<Reservation>;
  delete(id: string): Promise<void>;
}

export interface IAssignmentRepository {
  findByRaider(raiderId: string, raidSeasonId: string): Promise<Assignment[]>;
  findByRaiderAndItem(raiderId: string, itemId: string): Promise<Assignment | null>;
  findByBossAndSeason(bossId: string, raidSeasonId: string): Promise<Assignment[]>;
  save(assignment: CreateAssignmentData): Promise<Assignment>;
  updateStatus(id: string, status: AssignmentStatus): Promise<Assignment>;
}

export interface ILootQueryRepository {
  getBossLootView(bossId: string, raidSeasonId: string): Promise<IBossLootView>;
  getEligibleRaiders(itemId: string, raidSeasonId: string): Promise<IEligibleRaider[]>;
}

export const RESERVATION_REPOSITORY = Symbol('IReservationRepository');
export const ASSIGNMENT_REPOSITORY = Symbol('IAssignmentRepository');
export const LOOT_QUERY_REPOSITORY = Symbol('ILootQueryRepository');

