import { AssignmentStatus, ItemCategory, UserRole, WowClass, WowSpec, RaiderStatus } from './enums';

export interface IUser {
  id: string;
  email: string;
  googleId: string;
  displayName: string;
  avatarUrl?: string;
  roles: UserRole[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IRaiderProfile {
  id: string;
  userId: string;
  characterName: string;
  wowClass: WowClass;
  spec: WowSpec;
  status: RaiderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRaidSeason {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
}

export interface IBoss {
  id: string;
  name: string;
  raidSeasonId: string;
  order: number;
}

export interface IItem {
  id: string;
  name: string;
  wowItemId?: number;
  category: ItemCategory;
  bossId: string;
  bossName: string;
  iconUrl?: string;
  isPrioritizable: boolean;
}

export interface IReservation {
  id: string;
  raiderId: string;
  raiderName: string;
  itemId: string;
  itemName: string;
  raidSeasonId: string;
  createdAt: Date;
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
}

export interface IBossLootView {
  boss: IBoss;
  drops: {
    item: IItem;
    eligibleRaiders: IEligibleRaider[];
  }[];
}

// Request / Response DTOs shared between front and back
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

export const RESERVATION_LIMITS: Record<ItemCategory, number> = {
  [ItemCategory.TRINKET]: 2,
  [ItemCategory.WEAPON]: 2,
  [ItemCategory.OTHER]: 0,
};
