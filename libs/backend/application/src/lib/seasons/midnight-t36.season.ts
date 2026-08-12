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
