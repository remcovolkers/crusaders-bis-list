import { AssignmentStatus } from '../enums/assignment-status.enum';

export const RECEIVABLE_TIERS: AssignmentStatus[] = [
  AssignmentStatus.CHAMPION_TIER,
  AssignmentStatus.HERO_TIER,
  AssignmentStatus.MYTH_TIER,
];

/**
 * Tiers a reservation covers, given the "already received" floor stored with it:
 * everything above the floor (no floor = all tiers).
 */
export function reservedTiersAboveFloor(floor?: AssignmentStatus | null): AssignmentStatus[] {
  const idx = floor ? RECEIVABLE_TIERS.indexOf(floor) : -1;
  return RECEIVABLE_TIERS.slice(idx + 1);
}
