import { ItemCategory } from '../enums/item-category.enum';

export const ITEM_CATEGORY_LABELS: Record<ItemCategory, string> = {
  [ItemCategory.TRINKET]: 'Trinket',
  [ItemCategory.WEAPON]: 'Weapon',
  [ItemCategory.OFFHAND]: 'Off-Hand',
  [ItemCategory.CLOTH]: 'Cloth',
  [ItemCategory.LEATHER]: 'Leather',
  [ItemCategory.MAIL]: 'Mail',
  [ItemCategory.PLATE]: 'Plate',
  [ItemCategory.JEWELRY]: 'Jewelry',
  [ItemCategory.OTHER]: 'Other',
};

const SLOT_LABELS: Record<string, string> = {
  head: 'Head',
  neck: 'Neck',
  shoulder: 'Shoulders',
  shoulders: 'Shoulders',
  chest: 'Chest',
  robe: 'Chest',
  waist: 'Waist',
  legs: 'Legs',
  feet: 'Feet',
  wrist: 'Wrists',
  wrists: 'Wrists',
  hands: 'Hands',
  hand: 'Hands',
  finger: 'Ring',
  back: 'Back',
  cloak: 'Back',
};

/** "Tier: Head" (tier token) -> "Tier · Head". */
const TIER_SLOT = /^tier:\s*(.+)$/i;

/**
 * What kind of item this is, for the badge on a card. Armor pieces are stored with the category "other" (the armor
 * type is a separate field), which tells you nothing: for those the slot is shown instead ("Head", "Wrists", ...).
 */
export function itemTypeLabel(item: { category: ItemCategory; slot?: string | null }): string {
  if (item.category !== ItemCategory.OTHER) return ITEM_CATEGORY_LABELS[item.category];
  const slot = (item.slot ?? '').trim();
  if (!slot || slot.toLowerCase() === 'unknown') return ITEM_CATEGORY_LABELS[ItemCategory.OTHER];
  const tier = TIER_SLOT.exec(slot);
  if (tier) return `Tier · ${SLOT_LABELS[tier[1].toLowerCase()] ?? tier[1]}`;
  return SLOT_LABELS[slot.toLowerCase()] ?? slot;
}

export const ARMOR_TYPE_LABELS: Record<string, string> = {
  cloth: 'Cloth',
  leather: 'Leather',
  mail: 'Mail',
  plate: 'Plate',
};
