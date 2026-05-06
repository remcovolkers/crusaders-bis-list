import { WowClass } from '@crusaders-bis-list/shared-domain';
import { SeasonDefinition } from './season-definition.types';

/**
 * The War Within — Season 3 (Tier 34): Manaforge Omega
 * Patch 11.2 — released 12 August 2025
 *
 * Instance and encounter IDs verified via Blizzard Game Data API (region: eu).
 * Run `node --env-file=.env scripts/find-blizzard-instance.mjs` to re-verify.
 *
 * Tier tokens (slot → matching partial name, common across all 4 token groups):
 *   Loom'ithar          → Legs       ("Silken Offering")
 *   Soulbinder Naazindhri → Hands    ("Binding Agent")
 *   Forgeweaver Araz    → Head       ("Foreboding Beaker")
 *   The Soul Hunters    → Shoulders  ("Yearning Cursemark")
 *   Fractillus          → Chest      ("Voidglass Contaminant")
 *   Dimensius           → Any slot   ("Hungering Void Curio")
 *
 * T34 tokens are class-group restricted (Dreadful / Mystic / Venerated / Zenith)
 * but each group covers multiple armor types, so no prefix → ArmorType mapping
 * is possible. All tokens are treated as universal (ArmorType.NONE).
 *
 * To activate this season:
 *   - Change `ACTIVE_SEASON` in `active-season.ts` to `MANAFORGE_T34_SEASON`.
 *   - Trigger the admin Blizzard-sync to populate bosses + items.
 *   - Old T33/T35 DB rows are NOT affected (seasons are keyed by slug).
 * To revert:
 *   - Change `ACTIVE_SEASON` back to the previous season constant.
 */
export const MANAFORGE_T34_SEASON: SeasonDefinition = {
  slug: 'tww-s3-manaforge',
  name: 'The War Within — Manaforge Omega (Tier 34)',

  raids: [
    {
      instanceId: 1302,
      name: 'Manaforge Omega',
      accentColor: '#06b6d4',
      // Encounter IDs in boss order (from Blizzard journal-instance API):
      // Plexus Sentinel, Loom'ithar, Soulbinder Naazindhri, Forgeweaver Araz,
      // The Soul Hunters, Fractillus, Nexus-King Salhadaar, Dimensius
      fallbackEncounterIds: [2684, 2686, 2685, 2687, 2688, 2747, 2690, 2691],
    },
  ],

  tierTokenPatterns: [
    { match: /silken offering/i, slot: 'Tier: Legs' },
    { match: /binding agent/i, slot: 'Tier: Hands' },
    { match: /foreboding beaker/i, slot: 'Tier: Head' },
    { match: /yearning cursemark/i, slot: 'Tier: Shoulders' },
    { match: /voidglass contaminant/i, slot: 'Tier: Chest' },
    { match: /hungering void curio/i, slot: 'Tier: All' },
  ],

  /**
   * T34 class group prefixes — mirrors the T35 tierArmorTypePrefixes pattern,
   * but maps each Blizzard class-group name to the WoW classes it covers.
   * "Hungering Void Curio" matches no prefix → available to all classes.
   */
  tierClassGroupPrefixes: [
    { match: /dreadful/i, allowedClasses: [WowClass.DEATH_KNIGHT, WowClass.DEMON_HUNTER, WowClass.WARLOCK] },
    { match: /mystic/i, allowedClasses: [WowClass.DRUID, WowClass.HUNTER, WowClass.MAGE] },
    { match: /venerated/i, allowedClasses: [WowClass.PALADIN, WowClass.PRIEST, WowClass.SHAMAN] },
    { match: /zenith/i, allowedClasses: [WowClass.EVOKER, WowClass.MONK, WowClass.ROGUE, WowClass.WARRIOR] },
  ],
};
