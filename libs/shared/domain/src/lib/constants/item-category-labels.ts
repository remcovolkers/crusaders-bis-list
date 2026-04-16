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
