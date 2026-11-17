import { AssignmentStatus } from '../enums/assignment-status.enum';
import { EquipmentSlot } from '../constants/equipment';
import { ChaseMethod } from '../enums/chase-method.enum';
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

/**
 * A "chase item" is an item a raider personally wants but cannot (or does not) reserve — e.g. an armor piece in a
 * category without a reservation limit. It is NOT a reservation: it never counts against a limit and only gives
 * officers an overview of which bosses still have to be cleared for gear upgrades.
 */
export interface IChaseItem {
  id: string;
  raiderId: string;
  itemId: string;
  raidSeasonId: string;
  /**
   * How the raider hopes to get the item: from the boss, with a bonus roll, or both (it does not matter how, as long
   * as the item comes). Never empty.
   */
  methods: ChaseMethod[];
  createdAt: Date;
}

/** Why a raider marked the item in a slot as best in slot. */
export type BisMarkReason = 'manual' | 'catalyst';

/**
 * The raider's own "this is best in slot" mark on the item they wear in a slot: a crafted piece, a dungeon item that
 * is not in the loot list, or a tier piece made by catalysing a chased item. It applies as long as that same item is
 * worn in that slot.
 */
export interface IBisMark {
  slot: EquipmentSlot;
  /** Blizzard item id of the marked (worn) item. */
  itemId: number;
  reason: BisMarkReason;
  /** For a catalyst: the name of the item that was catalysed. */
  note: string | null;
  createdAt: Date;
}

/** A piece of gear a raider currently wears, as last synced from the Blizzard armory. */
export interface IEquippedItem {
  slot: EquipmentSlot;
  /** Blizzard item id (matches `IItem.wowItemId`). */
  itemId: number;
  name: string;
  itemLevel: number;
  /** Raid track the item belongs to, or null when it is not a Champion/Hero/Myth item (crafted, vendor, ...). */
  tier: AssignmentStatus | null;
  /** Description Blizzard shows for the item, e.g. "Heroic" or "Mythic". */
  tierLabel: string | null;
  iconUrl: string | null;
  syncedAt: Date;
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
  /** True when the raider has this item on their chase list instead of a reservation (see IChaseItem). */
  isChase?: boolean;
  /** How a chaser hopes to get the item (one or both ways). Only set together with `isChase`. */
  chaseMethods?: ChaseMethod[];
  chaseCreatedAt?: Date;
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
