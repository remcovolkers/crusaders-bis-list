import { AssignmentStatus, ItemCategory } from '@crusaders-bis-list/shared-domain';

export class Reservation {
  id!: string;
  raiderId!: string;
  itemId!: string;
  itemCategory!: ItemCategory;
  isSuperRare!: boolean;
  raidSeasonId!: string;
  createdAt!: Date;
}

export class Assignment {
  id!: string;
  raiderId!: string;
  itemId!: string;
  bossId!: string;
  raidSeasonId!: string;
  status!: AssignmentStatus;
  assignedByUserId!: string;
  assignedAt!: Date;

  isAcquired(): boolean {
    return (
      this.status === AssignmentStatus.CHAMPION_TIER ||
      this.status === AssignmentStatus.HERO_TIER ||
      this.status === AssignmentStatus.MYTH_TIER
    );
  }
}

export interface ReservationLimits {
  trinketLimit: number;
  weaponLimit: number;
  jewelryLimit: number;
  armorLimit: number;
  superrareLimit: number;
}

/** Maps each item category to its corresponding limit key in ReservationLimits. */
const CATEGORY_LIMIT_MAP: Record<ItemCategory, keyof ReservationLimits> = {
  [ItemCategory.TRINKET]: 'trinketLimit',
  [ItemCategory.WEAPON]: 'weaponLimit',
  [ItemCategory.OFFHAND]: 'weaponLimit',
  [ItemCategory.JEWELRY]: 'jewelryLimit',
  [ItemCategory.CLOTH]: 'armorLimit',
  [ItemCategory.LEATHER]: 'armorLimit',
  [ItemCategory.MAIL]: 'armorLimit',
  [ItemCategory.PLATE]: 'armorLimit',
  [ItemCategory.OTHER]: 'armorLimit',
};

/** Core business rules for the loot system. */
export class LootDomainRules {
  /**
   * Determine whether a raider can reserve an item.
   * Enforces per-category reservation limits from the season config.
   */
  static canReserve(
    category: ItemCategory,
    existingReservationsInCategory: number,
    limits: ReservationLimits = { trinketLimit: 2, weaponLimit: 2, jewelryLimit: 1, armorLimit: 1, superrareLimit: 0 },
    isSuperRare = false,
    existingSuperRareReservations = 0,
  ): { allowed: boolean; reason?: string } {
    const limit = limits[CATEGORY_LIMIT_MAP[category]];

    if (limit === 0) {
      // A superrare bypasses a zero category limit — it uses the superrare slot instead
      if (isSuperRare && limits.superrareLimit > 0) {
        if (existingSuperRareReservations >= limits.superrareLimit) {
          return {
            allowed: false,
            reason: `You can reserve at most ${limits.superrareLimit} superrare item(s) per season.`,
          };
        }
        return { allowed: true };
      }
      return { allowed: false, reason: 'This item type cannot be reserved this season.' };
    }

    if (existingReservationsInCategory >= limit) {
      return {
        allowed: false,
        reason: `You can reserve at most ${limit} ${category}(s) per season.`,
      };
    }

    if (isSuperRare && limits.superrareLimit > 0 && existingSuperRareReservations >= limits.superrareLimit) {
      return {
        allowed: false,
        reason: `You can reserve at most ${limits.superrareLimit} superrare item(s) per season.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Determine whether a raider is eligible to receive a loot assignment.
   */
  static isEligibleForAssignment(existingAssignment: Assignment | null): boolean {
    if (!existingAssignment) return true;
    return false;
  }
}
