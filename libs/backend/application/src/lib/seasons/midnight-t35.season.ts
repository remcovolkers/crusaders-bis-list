import { ArmorType } from '@crusaders-bis-list/shared-domain';
import { SeasonDefinition } from './season-definition.types';

/**
 * Midnight — Season 1 (Tier 35)
 *
 * Three raid instances released with The War Within patch 11.2.
 * Update this file if Blizzard adjusts encounter / instance data mid-season.
 *
 * Tier token names for Tier 35:
 *   - Riftbloom         → Chest
 *   - Hungering Nullcore → Hands
 *   - Unraveled Nullcore → Shoulders
 *   - Fanatical Nullcore → Head
 *   - Corrupted Nullcore → Legs
 *   - Void Curio         → All slots (catalyst-style universal token)
 */
export const MIDNIGHT_T35_SEASON: SeasonDefinition = {
  slug: 'midnight-s1-t35',
  name: 'Midnight — Season 1 (Tier 35)',

  raids: [
    {
      instanceId: 1307,
      name: 'The Voidspire',
      accentColor: '#8b5cf6',
      // The journal-instance endpoint returns HTTP 500 for this instance.
      // Encounter IDs resolved manually from the journal-encounter API.
      // Order: Imperator, Vorasius, Salhadaar, Vaelgor & Ezzorak, Lightblinded Vanguard, Crown of the Cosmos
      fallbackEncounterIds: [2733, 2734, 2736, 2735, 2737, 2738],
    },
    {
      instanceId: 1314,
      name: 'The Dreamrift',
      accentColor: '#10b981',
    },
    {
      instanceId: 1308,
      name: "March on Quel'Danas",
      accentColor: '#f59e0b',
    },
  ],

  tierTokenPatterns: [
    { match: /riftbloom/i, slot: 'Tier: Chest' },
    { match: /hungering nullcore/i, slot: 'Tier: Hands' },
    { match: /unraveled nullcore/i, slot: 'Tier: Shoulders' },
    { match: /fanatical nullcore/i, slot: 'Tier: Head' },
    { match: /corrupted nullcore/i, slot: 'Tier: Legs' },
    { match: /void curio/i, slot: 'Tier: All' },
  ],

  /**
   * Name prefixes that determine which armor type a tier token belongs to.
   * T35 naming convention:
   *   Aln/Void prefix → armor type; no prefix match = universal (Void Curio).
   */
  tierArmorTypePrefixes: [
    { match: /alnforged|voidforged/i, armorType: ArmorType.PLATE },
    { match: /alnwoven|voidwoven/i, armorType: ArmorType.CLOTH },
    { match: /alncured|voidcured/i, armorType: ArmorType.LEATHER },
    { match: /alncast|voidcast/i, armorType: ArmorType.MAIL },
  ],

  /**
   * Toggle trinkets that appear as two separate Blizzard items but are one
   * in-game item. Reserving the primary counts as one reservation.
   *
   *   - Radiant Plume: https://www.wowhead.com/item=249806/radiant-plume
   *   - Umbral Plume:  https://www.wowhead.com/item=260235/umbral-plume
   */
  mergedItems: [
    {
      itemIds: [249806, 260235], // Radiant Plume, Umbral Plume
      displayName: 'Radiant / Umbral Plume',
    },
  ],
};
