import { ArmorType, IEquippedItem, IItem, ItemCategory, WeaponType } from '@crusaders-bis-list/shared-domain';
import { buildPaperdoll, paperdollSlotOf, PaperdollInput } from './paperdoll';

const item = (name: string, slot: string, category = ItemCategory.OTHER, weaponType?: WeaponType): IItem => ({
  id: name,
  name,
  category,
  armorType: ArmorType.CLOTH,
  slot,
  primaryStats: [],
  weaponType,
  bossId: 'b',
  bossName: 'Boss',
  isPrioritizable: true,
});
const entry = (i: IItem, kind: PaperdollInput['kind'] = 'reserved'): PaperdollInput => ({ item: i, kind });

describe('paperdollSlotOf', () => {
  it.each([
    ['Head', 'head'],
    ['Neck', 'neck'],
    ['Shoulder', 'shoulder'],
    ['Shoulders', 'shoulder'],
    ['Back', 'back'],
    ['Chest', 'chest'],
    ['Robe', 'chest'],
    ['Wrist', 'wrist'],
    ['Hands', 'hands'],
    ['Waist', 'waist'],
    ['Legs', 'legs'],
    ['Feet', 'feet'],
    ['Finger', 'finger'],
    ['Tier: Chest', 'chest'],
    ['Tier: Head', 'head'],
    ['Tier: Hands', 'hands'],
    ['Tier: Shoulders', 'shoulder'],
    ['Tier: Legs', 'legs'],
  ])('maps the armor/jewelry slot "%s" to %s', (slot, expected) => {
    expect(paperdollSlotOf(item('x', slot))).toBe(expected);
  });

  it('has no slot for the any-slot tier token or unknown slots', () => {
    expect(paperdollSlotOf(item('x', 'Tier: All'))).toBeNull();
    expect(paperdollSlotOf(item('x', 'Misc'))).toBeNull();
  });

  it('maps trinkets, weapons and off-hands by category, not by the slot text ("One-Hand" is not "Hands")', () => {
    expect(paperdollSlotOf(item('x', 'Trinket', ItemCategory.TRINKET))).toBe('trinket');
    expect(paperdollSlotOf(item('x', 'One-Hand', ItemCategory.WEAPON, WeaponType.SWORD_1H))).toBe('mainhand');
    expect(paperdollSlotOf(item('x', 'Two-Hand', ItemCategory.WEAPON, WeaponType.STAFF))).toBe('mainhand');
    expect(paperdollSlotOf(item('x', 'Off Hand', ItemCategory.WEAPON, WeaponType.DAGGER))).toBe('offhand');
    expect(paperdollSlotOf(item('x', 'Held In Off-hand', ItemCategory.OFFHAND))).toBe('offhand');
    expect(paperdollSlotOf(item('x', 'Shield', ItemCategory.OFFHAND, WeaponType.SHIELD))).toBe('offhand');
  });
});

describe('buildPaperdoll', () => {
  it('puts reserved items before chased items within a slot', () => {
    const chased = entry(item('Chased Helm', 'Head'), 'chased');
    const reserved = entry(item('Reserved Helm', 'Head'), 'reserved');
    const { slots } = buildPaperdoll([chased, reserved]);
    expect(slots.head?.entries.map((e) => e.item.name)).toEqual(['Reserved Helm', 'Chased Helm']);
  });

  it('alternates rings and trinkets over their two slots', () => {
    const rings = ['A', 'B', 'C'].map((n) => entry(item(`Ring ${n}`, 'Finger')));
    const trinkets = ['A', 'B'].map((n) => entry(item(`Trinket ${n}`, 'Trinket', ItemCategory.TRINKET)));
    const { slots } = buildPaperdoll([...rings, ...trinkets]);
    expect(slots.finger1?.entries.map((e) => e.item.name)).toEqual(['Ring A', 'Ring C']);
    expect(slots.finger2?.entries.map((e) => e.item.name)).toEqual(['Ring B']);
    expect(slots.trinket1?.entries.map((e) => e.item.name)).toEqual(['Trinket A']);
    expect(slots.trinket2?.entries.map((e) => e.item.name)).toEqual(['Trinket B']);
  });

  it('puts a second one-handed weapon in the off-hand slot', () => {
    const a = entry(item('Sword', 'One-Hand', ItemCategory.WEAPON, WeaponType.SWORD_1H));
    const b = entry(item('Dagger', 'One-Hand', ItemCategory.WEAPON, WeaponType.DAGGER));
    const { slots } = buildPaperdoll([a, b]);
    expect(slots.mainhand?.entries[0].item.name).toBe('Sword');
    expect(slots.offhand?.entries[0].item.name).toBe('Dagger');
  });

  it('keeps a second weapon in the main-hand slot when a two-hander is involved', () => {
    const staff = entry(item('Staff', 'Two-Hand', ItemCategory.WEAPON, WeaponType.STAFF));
    const sword = entry(item('Sword', 'One-Hand', ItemCategory.WEAPON, WeaponType.SWORD_1H));
    const { slots } = buildPaperdoll([staff, sword]);
    expect(slots.mainhand?.entries.map((e) => e.item.name)).toEqual(['Staff', 'Sword']);
    expect(slots.offhand?.entries ?? []).toEqual([]);
  });

  it('returns items without a slot as unplaced', () => {
    const token = entry(item('Void Curio', 'Tier: All'));
    const { slots, unplaced } = buildPaperdoll([token]);
    expect(unplaced).toEqual([token]);
    expect(Object.keys(slots)).toHaveLength(0);
  });
});

describe('buildPaperdoll with worn gear', () => {
  const worn = (slot: IEquippedItem['slot'], itemId: number, name = `Worn ${itemId}`): IEquippedItem => ({
    slot,
    itemId,
    name,
    itemLevel: 334,
    tier: null,
    tierLabel: null,
    iconUrl: null,
    syncedAt: new Date(),
  });

  it('shows the worn item and a chased item of the same slot together', () => {
    const boots = worn('FEET', 1, 'Old Boots');
    const chased = entry(item('New Boots', 'Feet'), 'chased');
    const { slots } = buildPaperdoll([chased], [boots]);
    expect(slots.feet?.equipped?.name).toBe('Old Boots');
    expect(slots.feet?.entries.map((e) => e.item.name)).toEqual(['New Boots']);
  });

  it('puts every worn item in the slot it is worn in, including both rings and both trinkets', () => {
    const { slots } = buildPaperdoll(
      [],
      [worn('FINGER_1', 1), worn('FINGER_2', 2), worn('TRINKET_1', 3), worn('TRINKET_2', 4), worn('MAIN_HAND', 5), worn('OFF_HAND', 6)],
    );
    expect(slots.finger1?.equipped?.itemId).toBe(1);
    expect(slots.finger2?.equipped?.itemId).toBe(2);
    expect(slots.trinket1?.equipped?.itemId).toBe(3);
    expect(slots.trinket2?.equipped?.itemId).toBe(4);
    expect(slots.mainhand?.equipped?.itemId).toBe(5);
    expect(slots.offhand?.equipped?.itemId).toBe(6);
  });

  it('does not list a reserved item twice when it is the worn item: the entry takes its place in the worn slot', () => {
    const ring = worn('FINGER_2', 7, 'Band');
    const reserved: PaperdollInput = { item: item('Band', 'Finger'), kind: 'reserved', equippedItem: ring };
    const { slots } = buildPaperdoll([reserved], [worn('FINGER_1', 1), ring]);
    expect(slots.finger2?.equipped).toBeNull();
    expect(slots.finger2?.entries).toEqual([reserved]);
    expect(slots.finger1?.equipped?.itemId).toBe(1);
  });
});
