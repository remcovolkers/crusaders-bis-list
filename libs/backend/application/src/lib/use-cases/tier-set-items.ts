import { ITierSetPiece, WowClass } from '@crusaders-bis-list/shared-domain';

/**
 * Tier tokens turn into a set piece of the class that uses them ("Create a soulbound set head item appropriate for
 * your class"). These pure helpers link a token to the piece it gives per class, from the season's item sets.
 */

/** "Tier: Head", "HEAD", "Shoulder" -> "head", "shoulders": one key for the slot of a token and of a set piece. */
export function tierSlotKey(slot: string): string {
  const key = slot.replace(/^tier:\s*/i, '').trim().toLowerCase();
  if (key === 'shoulder') return 'shoulders';
  if (key === 'hand') return 'hands';
  if (key === 'robe') return 'chest';
  return key;
}

/** A piece of a class set, as read from the Blizzard item API. */
export interface TierSetPieceSource {
  wowClass: WowClass;
  /** Blizzard inventory type (HEAD, SHOULDER, CHEST, ROBE, HANDS, LEGS) or its name. */
  slot: string;
  piece: ITierSetPiece;
}

/** A tier token found in the loot tables. */
export interface TierTokenSource {
  wowItemId: number;
  /** Slot label of the token, e.g. "Tier: Head". */
  slot: string;
  /** Classes the token is for (from Blizzard); null = unknown, then every class that has a piece qualifies. */
  classes: WowClass[] | null;
}

/** Per class the set piece in the token's slot, or null when no class has one (the token is shown as it is). */
export function tierSetItemsFor(
  token: TierTokenSource,
  pieces: TierSetPieceSource[],
): Partial<Record<WowClass, ITierSetPiece>> | null {
  const slot = tierSlotKey(token.slot);
  const result: Partial<Record<WowClass, ITierSetPiece>> = {};
  for (const p of pieces) {
    if (tierSlotKey(p.slot) !== slot) continue;
    if (token.classes && !token.classes.includes(p.wowClass)) continue;
    result[p.wowClass] = p.piece;
  }
  return Object.keys(result).length ? result : null;
}
