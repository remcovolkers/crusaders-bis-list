import { ItemCategory } from '../enums/item-category.enum';
import { itemTypeLabel } from './item-category-labels';

describe('itemTypeLabel', () => {
  it('keeps the category for items that have a real one', () => {
    expect(itemTypeLabel({ category: ItemCategory.TRINKET, slot: 'Trinket' })).toBe('Trinket');
    expect(itemTypeLabel({ category: ItemCategory.WEAPON, slot: 'Two-Hand' })).toBe('Weapon');
    expect(itemTypeLabel({ category: ItemCategory.JEWELRY, slot: 'Neck' })).toBe('Jewelry');
  });

  it('shows the slot for armor, which is stored as category "other"', () => {
    expect(itemTypeLabel({ category: ItemCategory.OTHER, slot: 'Head' })).toBe('Head');
    expect(itemTypeLabel({ category: ItemCategory.OTHER, slot: 'Wrist' })).toBe('Wrists');
    expect(itemTypeLabel({ category: ItemCategory.OTHER, slot: 'Shoulder' })).toBe('Shoulders');
    expect(itemTypeLabel({ category: ItemCategory.OTHER, slot: 'Waist' })).toBe('Waist');
    expect(itemTypeLabel({ category: ItemCategory.OTHER, slot: 'Feet' })).toBe('Feet');
  });

  it('marks tier tokens with their slot', () => {
    expect(itemTypeLabel({ category: ItemCategory.OTHER, slot: 'Tier: Chest' })).toBe('Tier · Chest');
    expect(itemTypeLabel({ category: ItemCategory.OTHER, slot: 'Tier: Shoulders' })).toBe('Tier · Shoulders');
  });

  it('falls back to "Other" when the slot is unknown', () => {
    expect(itemTypeLabel({ category: ItemCategory.OTHER, slot: 'Unknown' })).toBe('Other');
    expect(itemTypeLabel({ category: ItemCategory.OTHER })).toBe('Other');
  });
});
