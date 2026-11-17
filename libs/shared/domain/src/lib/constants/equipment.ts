import { AssignmentStatus } from '../enums/assignment-status.enum';

/** Equipment slot names as Blizzard's character-equipment endpoint reports them (shirt and tabard are ignored). */
export type EquipmentSlot =
  | 'HEAD'
  | 'NECK'
  | 'SHOULDER'
  | 'BACK'
  | 'CHEST'
  | 'WRIST'
  | 'HANDS'
  | 'WAIST'
  | 'LEGS'
  | 'FEET'
  | 'FINGER_1'
  | 'FINGER_2'
  | 'TRINKET_1'
  | 'TRINKET_2'
  | 'MAIN_HAND'
  | 'OFF_HAND';

export const EQUIPMENT_SLOTS: readonly EquipmentSlot[] = [
  'HEAD',
  'NECK',
  'SHOULDER',
  'BACK',
  'CHEST',
  'WRIST',
  'HANDS',
  'WAIST',
  'LEGS',
  'FEET',
  'FINGER_1',
  'FINGER_2',
  'TRINKET_1',
  'TRINKET_2',
  'MAIN_HAND',
  'OFF_HAND',
];

/**
 * Slots that have a tier set: only there an item can be catalysed into a tier piece (an item with favourable stats is
 * converted into the tier item that gives the set bonus).
 */
export const CATALYST_SLOTS: readonly EquipmentSlot[] = ['HEAD', 'SHOULDER', 'CHEST', 'HANDS', 'LEGS'];

/**
 * Item level caps that tell the raid tracks apart for one season. Blizzard's own description of an item
 * ("Heroic", "Mythic") is the difficulty it dropped on, not the upgrade track it is on now: a Heroic drop upgraded to
 * Myth level still says "Heroic". The item level is what is reliable.
 *
 * Champion is deliberately not tracked: those items are upgraded within no time.
 */
export interface TrackItemLevels {
  /** From this item level up an item is Myth for sure. */
  mythFrom: number;
  /**
   * From this item level up an item can be either the top of the Hero track or the start of the Myth track; below it
   * the item can only be Hero (or Champion). At and above this level (but below `mythFrom`) the description decides.
   */
  ambiguousFrom: number;
}

const MYTH_LABEL = /\bmythic\b|:\s*myth\b|\bmyth\b/i;
const HERO_LABEL = /\bheroic\b|\bhero\b/i;

/**
 * Which raid track (Hero / Myth) a worn item is on, or null when it is not a Hero/Myth raid item we track
 * (Champion, crafted, vendor, no description).
 *
 * With `levels`: Myth from `mythFrom`; in the ambiguous band the description decides (a "Mythic" item is Myth,
 * anything else Hero); below it only items described as Heroic count, as Hero.
 * Without `levels` (a season that has none configured) the description alone decides.
 */
export function equippedItemTier(
  itemLevel: number,
  description: string | null | undefined,
  levels?: TrackItemLevels,
): AssignmentStatus | null {
  const text = description ?? '';
  if (/\bcrafted\b/i.test(text)) return null;
  const mythLabel = MYTH_LABEL.test(text);
  const heroLabel = HERO_LABEL.test(text);

  if (levels) {
    if (itemLevel >= levels.mythFrom) return AssignmentStatus.MYTH_TIER;
    if (itemLevel >= levels.ambiguousFrom) {
      if (mythLabel) return AssignmentStatus.MYTH_TIER;
      return heroLabel ? AssignmentStatus.HERO_TIER : null;
    }
    return heroLabel ? AssignmentStatus.HERO_TIER : null;
  }
  if (mythLabel) return AssignmentStatus.MYTH_TIER;
  return heroLabel ? AssignmentStatus.HERO_TIER : null;
}
