import { WowClass } from '@crusaders-bis-list/shared-domain';

/**
 * Maps Blizzard's stable playable_class.id values to our internal WowClass enum.
 * IDs are permanent per Blizzard's API specification.
 */
export const BLIZZARD_CLASS_MAP: Record<number, WowClass> = {
  1: WowClass.WARRIOR,
  2: WowClass.PALADIN,
  3: WowClass.HUNTER,
  4: WowClass.ROGUE,
  5: WowClass.PRIEST,
  6: WowClass.DEATH_KNIGHT,
  7: WowClass.SHAMAN,
  8: WowClass.MAGE,
  9: WowClass.WARLOCK,
  10: WowClass.MONK,
  11: WowClass.DRUID,
  12: WowClass.DEMON_HUNTER,
  13: WowClass.EVOKER,
};

export function blizzardClassToWowClass(classId: number): WowClass | null {
  return BLIZZARD_CLASS_MAP[classId] ?? null;
}
