import { AssignmentStatus } from '../enums/assignment-status.enum';
import { WowClass } from '../enums/wow-class.enum';
import { WowSpec } from '../enums/wow-spec.enum';
import { IBoss, IItem } from './raid.model';

export interface IReceivedItem {
  id: string;
  raiderId: string;
  itemId: string;
  tier: AssignmentStatus;
  createdAt: Date;
}

export interface IReservation {
  id: string;
  raiderId: string;
  raiderName: string;
  itemId: string;
  itemName: string;
  raidSeasonId: string;
  createdAt: Date;
  assignment?: { status: AssignmentStatus } | null;
}

export interface IAssignment {
  id: string;
  raiderId: string;
  raiderName: string;
  itemId: string;
  itemName: string;
  bossId: string;
  bossName: string;
  raidSeasonId: string;
  status: AssignmentStatus;
  assignedByUserId: string;
  assignedAt: Date;
}

export interface IEligibleRaider {
  raiderId: string;
  raiderName: string;
  characterName: string;
  wowClass: WowClass;
  spec: WowSpec;
  hasReservation: boolean;
  reservationCreatedAt?: Date;
  reservationId?: string;
  assignment?: { id: string; status: AssignmentStatus; assignedAt: Date } | null;
  /** Tier at which this raider already received the item via "mijn loot" self-report */
  receivedTier?: AssignmentStatus | null;
}

export interface IBossLootView {
  boss: IBoss;
  drops: {
    item: IItem;
    eligibleRaiders: IEligibleRaider[];
  }[];
}
