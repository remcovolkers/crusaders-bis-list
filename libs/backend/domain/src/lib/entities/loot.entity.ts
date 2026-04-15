import { AssignmentStatus, ItemCategory, RESERVABLE_CATEGORIES } from '@crusaders-bis-list/shared-domain';

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

  isNoLongerNeeded(): boolean {
    return this.status === AssignmentStatus.NIET_MEER_NODIG;
  }
}

export interface ReservationLimits {
  trinketLimit: number;
  weaponLimit: number;
  jewelryLimit: number;
  armorLimit: number;
  superrareLimit: number;
}

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
    if (!RESERVABLE_CATEGORIES.has(category)) {
      return { allowed: false, reason: 'This item type cannot be reserved.' };
    }

    let limit = 0;
    if (category === ItemCategory.TRINKET) {
      limit = limits.trinketLimit;
    } else if (category === ItemCategory.WEAPON || category === ItemCategory.OFFHAND) {
      limit = limits.weaponLimit;
    } else if (category === ItemCategory.JEWELRY) {
      limit = limits.jewelryLimit;
    } else if (
      category === ItemCategory.OTHER ||
      category === ItemCategory.CLOTH ||
      category === ItemCategory.LEATHER ||
      category === ItemCategory.MAIL ||
      category === ItemCategory.PLATE
    ) {
      limit = limits.armorLimit;
    }

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
