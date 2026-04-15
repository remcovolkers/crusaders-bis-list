import {
  AssignmentStatus,
  ArmorType,
  ItemCategory,
  PrimaryStat,
  UserRole,
  WowClass,
  WowSpec,
  RaiderStatus,
  WeaponType,
} from './enums';

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
  realm?: string;
  wowClass: WowClass;
  spec: WowSpec;
  status: RaiderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReceivedItem {
  id: string;
  raiderId: string;
  itemId: string;
  tier: AssignmentStatus;
  createdAt: Date;
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
  raidId?: number;
  raidName?: string;
  raidAccentColor?: string;
  wowEncounterId?: number;
  order: number;
}

export interface IItem {
  id: string;
  name: string;
  wowItemId?: number;
  category: ItemCategory;
  armorType: ArmorType;
  slot: string;
  itemLevel?: number;
  primaryStat?: PrimaryStat;
  weaponType?: WeaponType;
  bossId: string;
  bossName: string;
  iconUrl?: string;
  isPrioritizable: boolean;
  isSuperRare?: boolean;
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
  reservationId?: string;
  assignment?: { id: string; status: AssignmentStatus; assignedAt: Date } | null;
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
  [ItemCategory.OFFHAND]: 2,
  [ItemCategory.CLOTH]: 0,
  [ItemCategory.LEATHER]: 0,
  [ItemCategory.MAIL]: 0,
  [ItemCategory.PLATE]: 0,
  [ItemCategory.JEWELRY]: 1,
  [ItemCategory.OTHER]: 1,
};

export interface ISeasonConfig {
  id: string;
  raidSeasonId: string;
  trinketLimit: number;
  weaponLimit: number;
  jewelryLimit: number;
  armorLimit: number;
  superrareLimit: number;
}

export interface UpdateSeasonConfigDto {
  trinketLimit: number;
  weaponLimit: number;
  jewelryLimit: number;
  armorLimit: number;
  superrareLimit: number;
}
