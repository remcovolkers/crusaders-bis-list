import { ArmorType } from '@crusaders-bis-list/shared-domain';
import { SeasonDefinition } from './season-definition.types';

/**
 * Midnight — Season 2 (Tier 36)
 *
 * Instance and encounter IDs verified via Blizzard Game Data API (region: eu).
 * Run `node --env-file=.env scripts/find-blizzard-instance.mjs` to re-verify.
 *
 * Raids:
 *   The Tidebound Grotto  (instanceId 1317) — 1 boss:  Nymrissa Wavecaller
 *   The Venomous Abyss    (instanceId 1320) — 8 bosses: Nek'zali the Soulcoiler,
 *     Entombed Sentinels, The Lost Explorers, Vashnik the Malignant, Sszorak,
 *     The Twin Fangs, The Coiled Altar, Ula'tek
 *   The Unbinding of Kith'ix (instanceId 1324) — 1 boss: Kith'ix (patch 12.1.5, no tier tokens)
 *
 * Tier token naming convention — "Venom<armor> <slot-name>":
 *   Venomforged  → Plate   |  Venomcured → Leather
 *   Venomcast    → Mail    |  Venomwoven → Cloth
 *
 *   Idol    (Entombed Sentinels)  → Hands
 *   Remnant (The Lost Explorers)  → Shoulders
 *   Icon    (Vashnik the Malignant) → Chest
 *   Relic   (Sszorak)             → Legs
 *   Effigy  (The Twin Fangs)      → Head
 *
 * Note: The Venomous Abyss Trophy items from Ula'tek are housing decorations,
 * not tier tokens, and are intentionally excluded from tierTokenPatterns.
 */
export const MIDNIGHT_T36_SEASON: SeasonDefinition = {
  slug: 'midnight-s2-t36',
  name: 'Midnight — Season 2 (Tier 36)',

  // Myth 334 and up is certainly Myth; 321 is either Hero 6/6 or Myth 2/6 (the item description decides there).
  // Champion is not tracked.
  trackItemLevels: { mythFrom: 322, ambiguousFrom: 321 },

  // Drops top out at 334 (trinkets/weapons can be upgraded to 341). A bonus roll on The Coiled Altar (encounter 2883)
  // and Ula'tek (2895) gives 344, so an item from those bosses is only best in slot at 344.
  itemLevelCaps: { maxItemLevel: 334, bonusRollItemLevels: { 2883: 344, 2895: 344 } },

  // The 13 class tier sets (item-set ids 2055-2067, one per class): what a Venom<armor> token turns into.
  tierSetIds: [2055, 2056, 2057, 2058, 2059, 2060, 2061, 2062, 2063, 2064, 2065, 2066, 2067],

  raids: [
    {
      instanceId: 1317,
      name: 'The Tidebound Grotto',
      accentColor: '#0ea5e9',
      // Only 1 encounter confirmed in the API at time of writing.
      fallbackEncounterIds: [2849],
    },
    {
      instanceId: 1320,
      name: 'The Venomous Abyss',
      accentColor: '#16a34a',
      // Encounter IDs in boss order (from Blizzard journal-instance API):
      // Nek'zali the Soulcoiler, Entombed Sentinels, The Lost Explorers,
      // Vashnik the Malignant, Sszorak, The Twin Fangs, The Coiled Altar, Ula'tek
      fallbackEncounterIds: [2888, 2874, 2894, 2882, 2871, 2887, 2883, 2895],
    },
    {
      instanceId: 1324,
      name: "The Unbinding of Kith'ix",
      accentColor: '#7c3aed',
      fallbackEncounterIds: [2896],
    },
  ],

  // Each tier token name is "Venom<armor> <slot-word>" — match on the slot word
  // prefixed with "venom" to avoid collisions with non-tier items.
  tierTokenPatterns: [
    { match: /venom\w+ idol/i, slot: 'Tier: Hands' },
    { match: /venom\w+ remnant/i, slot: 'Tier: Shoulders' },
    { match: /venom\w+ icon/i, slot: 'Tier: Chest' },
    { match: /venom\w+ relic/i, slot: 'Tier: Legs' },
    { match: /venom\w+ effigy/i, slot: 'Tier: Head' },
  ],

  tierArmorTypePrefixes: [
    { match: /venomforged/i, armorType: ArmorType.PLATE },
    { match: /venomcured/i, armorType: ArmorType.LEATHER },
    { match: /venomcast/i, armorType: ArmorType.MAIL },
    { match: /venomwoven/i, armorType: ArmorType.CLOTH },
  ],
};
