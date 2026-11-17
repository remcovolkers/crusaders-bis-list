import { EquipmentSlot, IEquippedItem, IItem, ItemCategory, WeaponType } from '@crusaders-bis-list/shared-domain';

/**
 * World of Warcraft "character pane" (paperdoll) layout: which gear slot an item belongs to and how a list of
 * reserved / chased items is spread over the slots. Pure functions only, so it is fully unit-testable.
 */

/** Item slots (a ring or trinket item can sit in either of the two slots; see {@link PaperdollSlotKey}). */
export type PaperdollSlot =
  | 'head'
  | 'neck'
  | 'shoulder'
  | 'back'
  | 'chest'
  | 'wrist'
  | 'hands'
  | 'waist'
  | 'legs'
  | 'feet'
  | 'finger'
  | 'trinket'
  | 'mainhand'
  | 'offhand';

/** Slots as drawn on the pane (rings and trinkets have two). */
export type PaperdollSlotKey =
  | Exclude<PaperdollSlot, 'finger' | 'trinket'>
  | 'finger1'
  | 'finger2'
  | 'trinket1'
  | 'trinket2';

export interface PaperdollSlotDef {
  /** Shirt and tabard only exist as empty placeholders (to keep the layout of the in-game pane). */
  key: PaperdollSlotKey | 'shirt' | 'tabard';
  label: string;
  placeholder?: boolean;
}

/** Left column, top to bottom (as in the in-game character pane). */
export const PAPERDOLL_LEFT: PaperdollSlotDef[] = [
  { key: 'head', label: 'Head' },
  { key: 'neck', label: 'Neck' },
  { key: 'shoulder', label: 'Shoulders' },
  { key: 'back', label: 'Back' },
  { key: 'chest', label: 'Chest' },
  { key: 'shirt', label: 'Shirt', placeholder: true },
  { key: 'tabard', label: 'Tabard', placeholder: true },
  { key: 'wrist', label: 'Wrists' },
];

/** Right column, top to bottom. */
export const PAPERDOLL_RIGHT: PaperdollSlotDef[] = [
  { key: 'hands', label: 'Hands' },
  { key: 'waist', label: 'Waist' },
  { key: 'legs', label: 'Legs' },
  { key: 'feet', label: 'Feet' },
  { key: 'finger1', label: 'Ring' },
  { key: 'finger2', label: 'Ring' },
  { key: 'trinket1', label: 'Trinket' },
  { key: 'trinket2', label: 'Trinket' },
];

/** Bottom row, centred under the character. */
export const PAPERDOLL_BOTTOM: PaperdollSlotDef[] = [
  { key: 'mainhand', label: 'Main Hand' },
  { key: 'offhand', label: 'Off Hand' },
];

/** Weapon types that occupy both hands. Built lazily: the shared-domain barrel is not fully initialised at import time in every runtime. */
const isTwoHanded = (type: WeaponType | undefined): boolean =>
  type !== undefined &&
  [
    WeaponType.AXE_2H,
    WeaponType.MACE_2H,
    WeaponType.SWORD_2H,
    WeaponType.POLEARM,
    WeaponType.STAFF,
    WeaponType.BOW,
    WeaponType.CROSSBOW,
    WeaponType.GUN,
  ].includes(type);

/**
 * Which slot an item goes in, or null when it has none (e.g. the "any slot" tier token).
 * Tolerant of the slot names Blizzard uses ("Head", "Shoulder", "Back", "Held In Off-hand", ...) and of the
 * tier-token slots ("Tier: Chest").
 */
export function paperdollSlotOf(item: Pick<IItem, 'slot' | 'category' | 'weaponType'>): PaperdollSlot | null {
  if (item.category === ItemCategory.TRINKET) return 'trinket';
  if (item.category === ItemCategory.OFFHAND) return 'offhand';
  const s = (item.slot ?? '').toLowerCase().replace(/^tier:\s*/, '').trim();
  if (item.category === ItemCategory.WEAPON) return /off/.test(s) && !/main/.test(s) ? 'offhand' : 'mainhand';

  if (/\b(head|helm)/.test(s)) return 'head';
  if (/neck/.test(s)) return 'neck';
  if (/shoulder/.test(s)) return 'shoulder';
  if (/back|cloak/.test(s)) return 'back';
  if (/chest|robe|body/.test(s)) return 'chest';
  if (/wrist|bracer/.test(s)) return 'wrist';
  if (/hand|glove/.test(s)) return 'hands';
  if (/waist|belt/.test(s)) return 'waist';
  if (/leg/.test(s)) return 'legs';
  if (/feet|boot/.test(s)) return 'feet';
  if (/finger|ring/.test(s)) return 'finger';
  if (/trinket/.test(s)) return 'trinket';
  return null;
}

/** Worn item slot → slot on the pane. */
export function equipmentSlotKey(slot: EquipmentSlot): PaperdollSlotKey {
  switch (slot) {
    case 'HEAD':
      return 'head';
    case 'NECK':
      return 'neck';
    case 'SHOULDER':
      return 'shoulder';
    case 'BACK':
      return 'back';
    case 'CHEST':
      return 'chest';
    case 'WRIST':
      return 'wrist';
    case 'HANDS':
      return 'hands';
    case 'WAIST':
      return 'waist';
    case 'LEGS':
      return 'legs';
    case 'FEET':
      return 'feet';
    case 'FINGER_1':
      return 'finger1';
    case 'FINGER_2':
      return 'finger2';
    case 'TRINKET_1':
      return 'trinket1';
    case 'TRINKET_2':
      return 'trinket2';
    case 'MAIN_HAND':
      return 'mainhand';
    case 'OFF_HAND':
      return 'offhand';
  }
}

/** Minimal shape {@link buildPaperdoll} needs. Reserved entries are listed before chased ones within a slot. */
export interface PaperdollInput {
  item: IItem;
  kind: 'reserved' | 'chased';
  /** The worn item this entry is (the same item, at some tier). It then sits in the slot it is worn in. */
  equippedItem?: IEquippedItem | null;
}

/** What one slot of the pane shows. */
export interface PaperdollCell<T extends PaperdollInput> {
  /** What the character wears there, unless that is one of the reserved / chased entries (those carry it). */
  equipped: IEquippedItem | null;
  /** Reserved items first, then chased ones. */
  entries: T[];
}

export interface PaperdollLayout<T extends PaperdollInput> {
  /** Slots that have something to show; the others are absent. */
  slots: Partial<Record<PaperdollSlotKey, PaperdollCell<T>>>;
  /** Items that have no gear slot (they cannot be drawn on the pane). */
  unplaced: T[];
}

/**
 * Spread worn, reserved and chased items over the slots of the pane. A slot can hold the worn item plus reserved /
 * chased candidates for it (e.g. boots on and other boots chased). A reserved / chased item that is the worn item
 * itself sits in its worn slot and is not listed twice. Rings and trinkets that are not worn alternate between their
 * two slots; a second one-handed weapon fills the off-hand slot (unless a two-hander is involved). Anything that does
 * not fit stacks in the slot it belongs to.
 */
export function buildPaperdoll<T extends PaperdollInput>(entries: T[], worn: IEquippedItem[] = []): PaperdollLayout<T> {
  const ordered = [...entries].sort((a, b) => Number(a.kind === 'chased') - Number(b.kind === 'chased'));
  const slots: Partial<Record<PaperdollSlotKey, PaperdollCell<T>>> = {};
  const unplaced: T[] = [];
  const cell = (key: PaperdollSlotKey): PaperdollCell<T> => (slots[key] ??= { equipped: null, entries: [] });

  for (const piece of worn) cell(equipmentSlotKey(piece.slot)).equipped = piece;

  const counters: Partial<Record<PaperdollSlot, number>> = {};
  const weapons: T[] = [];

  for (const entry of ordered) {
    if (entry.equippedItem) {
      const target = cell(equipmentSlotKey(entry.equippedItem.slot));
      target.entries.push(entry);
      if (target.equipped?.itemId === entry.equippedItem.itemId) target.equipped = null; // the entry shows it
      continue;
    }
    const slot = paperdollSlotOf(entry.item);
    if (slot === null) {
      unplaced.push(entry);
    } else if (slot === 'mainhand') {
      weapons.push(entry);
    } else if (slot === 'finger' || slot === 'trinket') {
      const n = counters[slot] ?? 0;
      counters[slot] = n + 1;
      cell(`${slot}${(n % 2) + 1}` as PaperdollSlotKey).entries.push(entry);
    } else {
      cell(slot).entries.push(entry);
    }
  }

  for (const entry of weapons) {
    const main = slots.mainhand?.entries ?? [];
    const mainIsTwoHanded = isTwoHanded(main[0]?.item.weaponType);
    const offhandTaken = (slots.offhand?.entries.length ?? 0) > 0;
    if (main.length === 0) cell('mainhand').entries.push(entry);
    else if (!offhandTaken && !mainIsTwoHanded && !isTwoHanded(entry.item.weaponType)) cell('offhand').entries.push(entry);
    else cell('mainhand').entries.push(entry);
  }

  return { slots, unplaced };
}
