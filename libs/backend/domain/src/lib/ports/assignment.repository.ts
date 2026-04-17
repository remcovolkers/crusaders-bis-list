import { Assignment } from '../entities/loot.entity';
import { AssignmentStatus } from '@crusaders-bis-list/shared-domain';

export interface CreateAssignmentData {
  raiderId: string;
  itemId: string;
  bossId: string;
  raidSeasonId: string;
  status: AssignmentStatus;
  assignedByUserId: string;
}

export interface IAssignmentRepository {
  findByRaider(raiderId: string, raidSeasonId: string): Promise<Assignment[]>;
  findByRaiderAndItem(raiderId: string, itemId: string): Promise<Assignment | null>;
  findByBossAndSeason(bossId: string, raidSeasonId: string): Promise<Assignment[]>;
  findAllBySeason(raidSeasonId: string): Promise<Assignment[]>;
  save(assignment: CreateAssignmentData): Promise<Assignment>;
  updateStatus(id: string, status: AssignmentStatus): Promise<Assignment>;
  deleteByRaiderAndItem(raiderId: string, itemId: string): Promise<void>;
}

export const ASSIGNMENT_REPOSITORY = Symbol('IAssignmentRepository');
