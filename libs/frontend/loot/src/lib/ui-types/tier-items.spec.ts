import { ItemCategory, IItem, WowClass, ArmorType } from '@crusaders-bis-list/shared-domain';
import { presentTierCatalog, presentTierItem } from './tier-items';

const token = {
  id: 't1',
  name: 'Venomforged Effigy',
  iconUrl: 'token.jpg',
  category: ItemCategory.OTHER,
  armorType: ArmorType.PLATE,
  slot: 'Tier: Head',
  primaryStats: [],
  bossId: 'b1',
  bossName: 'Boss',
  isPrioritizable: true,
  tierSetItems: {
    [WowClass.WARRIOR]: { wowItemId: 900, name: "Jade Warlord's Helm", iconUrl: 'warrior.jpg' },
    [WowClass.PALADIN]: { wowItemId: 901, name: 'Consecrated Helm' },
  },
} as IItem;

describe('presentTierItem', () => {
  it('shows the set piece of the raider class instead of the token, and remembers the token', () => {
    const shown = presentTierItem(token, WowClass.WARRIOR);
    expect(shown.name).toBe("Jade Warlord's Helm");
    expect(shown.iconUrl).toBe('warrior.jpg');
    expect(shown.tierTokenName).toBe('Venomforged Effigy');
    expect(shown.tierPiece?.wowItemId).toBe(900);
    expect(shown.id).toBe('t1'); // the reservation stays on the token
  });

  it('keeps the icon of the token when the set piece has none', () => {
    expect(presentTierItem(token, WowClass.PALADIN).iconUrl).toBe('token.jpg');
  });

  it('leaves the token alone when the class has no piece, the class is unknown or the item is no token', () => {
    expect(presentTierItem(token, WowClass.MAGE)).toBe(token);
    expect(presentTierItem(token, undefined)).toBe(token);
    const plain = { ...token, tierSetItems: undefined } as IItem;
    expect(presentTierItem(plain, WowClass.WARRIOR)).toBe(plain);
  });
});

describe('presentTierCatalog', () => {
  it('presents every item of every boss', () => {
    const catalog = { season: 's', bosses: [{ id: 'b1', items: [token] }] } as never as { bosses: { id: string; items: IItem[] }[] };
    const shown = presentTierCatalog(catalog as never, WowClass.WARRIOR) as typeof catalog;
    expect(shown.bosses[0].items[0].name).toBe("Jade Warlord's Helm");
  });
});
