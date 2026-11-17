import { tierSetItemsFor, tierSlotKey, TierSetPieceSource } from '@crusaders-bis-list/backend-application';
import { WowClass } from '@crusaders-bis-list/shared-domain';

const piece = (wowClass: WowClass, slot: string, id: number): TierSetPieceSource => ({
  wowClass,
  slot,
  piece: { wowItemId: id, name: `${wowClass} ${slot}`, iconUrl: `https://icons/${id}.jpg` },
});

describe('tierSlotKey', () => {
  it('gives a token slot and a Blizzard inventory type the same key', () => {
    expect(tierSlotKey('Tier: Head')).toBe('head');
    expect(tierSlotKey('HEAD')).toBe('head');
    expect(tierSlotKey('Tier: Shoulders')).toBe('shoulders');
    expect(tierSlotKey('SHOULDER')).toBe('shoulders');
    expect(tierSlotKey('Tier: Hands')).toBe('hands');
    expect(tierSlotKey('ROBE')).toBe('chest');
  });
});

describe('tierSetItemsFor', () => {
  const pieces = [
    piece(WowClass.PRIEST, 'HEAD', 1),
    piece(WowClass.PRIEST, 'CHEST', 2),
    piece(WowClass.MAGE, 'HEAD', 3),
    piece(WowClass.WARRIOR, 'HEAD', 4),
    piece(WowClass.PALADIN, 'HEAD', 5),
  ];

  it('links a token to the piece of its slot, per class that can use the token', () => {
    const result = tierSetItemsFor({ wowItemId: 10, slot: 'Tier: Head', classes: [WowClass.WARRIOR, WowClass.PALADIN] }, pieces);
    expect(Object.keys(result ?? {}).sort()).toEqual([WowClass.PALADIN, WowClass.WARRIOR]);
    expect(result?.[WowClass.WARRIOR]?.wowItemId).toBe(4);
  });

  it('uses every class that has a piece when the classes of the token are unknown', () => {
    const result = tierSetItemsFor({ wowItemId: 10, slot: 'Tier: Head', classes: null }, pieces);
    expect(Object.keys(result ?? {})).toHaveLength(4);
    expect(result?.[WowClass.PRIEST]?.wowItemId).toBe(1);
  });

  it('only takes pieces from the slot of the token', () => {
    const result = tierSetItemsFor({ wowItemId: 11, slot: 'Tier: Chest', classes: null }, pieces);
    expect(result).toEqual({ [WowClass.PRIEST]: pieces[1].piece });
  });

  it('returns null when no class has a piece, so the token is shown as it is', () => {
    expect(tierSetItemsFor({ wowItemId: 12, slot: 'Tier: Legs', classes: null }, pieces)).toBeNull();
    expect(tierSetItemsFor({ wowItemId: 12, slot: 'Tier: Head', classes: [WowClass.DRUID] }, pieces)).toBeNull();
  });
});
