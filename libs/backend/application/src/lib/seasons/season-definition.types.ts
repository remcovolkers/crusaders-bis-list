import { ArmorType } from '@crusaders-bis-list/shared-domain';

/**
 * Generic types for describing a WoW raid season.
 *
 * To add a new season:
 *  1. Create a new file in this folder (e.g. `midnight-t36.season.ts`).
 *  2. Export a `SeasonDefinition` constant from it.
 *  3. Re-point `ACTIVE_SEASON` in `active-season.ts`.
 *
 * Nothing else should need to change in the sync use case.
 */

export interface RaidDefinition {
  /** Blizzard journal-instance ID. */
  instanceId: number;
  /** Display name shown in the UI sidebar. */
  name: string;
  /** Hex colour used as the raid's accent colour in the UI. */
  accentColor: string;
  /**
   * Hard-coded encounter IDs used as fallback when the Blizzard
   * journal-instance endpoint is unavailable (e.g. PTR season not yet live).
   * Listed in boss-order.
   */
  fallbackEncounterIds?: number[];
}

export interface TierTokenPattern {
  /** Partial name match (case-insensitive) for this tier token. */
  match: RegExp;
  /** Human-readable slot label stored on the item (e.g. "Tier: Chest"). */
  slot: string;
}

/**
 * Maps a name prefix to the armor type for that tier token variant.
 * Tokens whose name matches no prefix are treated as universal (ArmorType.NONE).
 * Example: /alnforged|voidforged/i → ArmorType.PLATE
 */
export interface TierArmorTypePrefix {
  /** Regex matched against the full item name. */
  match: RegExp;
  armorType: ArmorType;
}

export interface SeasonDefinition {
  /** Stored in the DB — change only if you deliberately want a new season row. */
  slug: string;
  /** Display name shown in the UI and the DB. */
  name: string;
  /** The raids that belong to this season, in sidebar order. */
  raids: RaidDefinition[];
  /**
   * Patterns that identify tier-set tokens by item name.
   * Each season uses different token names, so they live here rather than in
   * generic mapping code.
   */
  tierTokenPatterns: TierTokenPattern[];
  /**
   * Optional: maps name prefixes to armor types for class-restricted tier tokens.
   * Tokens not matching any prefix are treated as universal (ArmorType.NONE).
   * Omit this array for seasons where all tokens are universal.
   */
  tierArmorTypePrefixes?: TierArmorTypePrefix[];
}
