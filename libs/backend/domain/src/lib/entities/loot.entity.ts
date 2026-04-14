import { AssignmentStatus, ItemCategory, RESERVATION_LIMITS } from '@crusaders-bis-list/shared-domain';

export class Reservation {
  id: string;
  raiderId: string;
  itemId: string;
  itemCategory: ItemCategory;
  raidSeasonId: string;
  createdAt: Date;
}

export class Assignment {
  id: string;
  raiderId: string;
  itemId: string;
  bossId: string;
  raidSeasonId: string;
  status: AssignmentStatus;
  assignedByUserId: string;
  assignedAt: Date;

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

/** Core business rules for the loot system. */
export class LootDomainRules {
  /**
   * Determine whether a raider can reserve an item.
   * Enforces per-category reservation limits.
   */
  static canReserve(
    category: ItemCategory,
    existingReservationsInCategory: number,
  ): { allowed: boolean; reason?: string } {
    if (category === ItemCategory.OTHER) {
      return { allowed: false, reason: 'Only trinkets and weapons can be reserved.' };
    }
    const limit = RESERVATION_LIMITS[category];
    if (existingReservationsInCategory >= limit) {
      return {
        allowed: false,
        reason: `You can reserve at most ${limit} ${category}(s) per season.`,
      };
    }
    return { allowed: true };
  }

  /**
   * Determine whether a raider is eligible to receive a loot assignment.
   * Ineligible when they already have an active assignment or marked
   * as "niet meer nodig" for this specific item.
   */
  static isEligibleForAssignment(existingAssignment: Assignment | null): boolean {
    if (!existingAssignment) return true;
    // Already received this item or explicitly declined
    return false;
  }
}
