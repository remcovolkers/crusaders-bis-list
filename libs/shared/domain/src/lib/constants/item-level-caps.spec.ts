import { RaidDifficulty } from '../enums/raid-difficulty.enum';
import { bestObtainableItemLevel, bonusRollUpgradeTo, isBestInSlot, ItemLevelCaps, minimumDifficulty } from './item-level-caps';

// Midnight S2: drops top out at 334; a bonus roll on the last two bosses (Coiled Altar 2883, Ula'tek 2895) gives 344
const CAPS: ItemLevelCaps = { maxItemLevel: 334, bonusRollItemLevels: { '2883': 344, '2895': 344 }, bonusRollEnabled: true };
const ULATEK = 2895;
const SSZORAK = 2871;

describe('bestObtainableItemLevel', () => {
  it('is the drop maximum, or the bonus roll level on bosses that give more', () => {
    expect(bestObtainableItemLevel(CAPS, SSZORAK)).toBe(334);
    expect(bestObtainableItemLevel(CAPS, ULATEK)).toBe(344);
    expect(bestObtainableItemLevel(CAPS, null)).toBe(334);
  });

  it('ignores the bonus roll levels when the season has no bonus rolls', () => {
    expect(bestObtainableItemLevel({ ...CAPS, bonusRollEnabled: false }, ULATEK)).toBe(334);
  });
});

describe('isBestInSlot', () => {
  it('is best in slot from the drop maximum on, also after a 334 -> 341 upgrade', () => {
    expect(isBestInSlot({ caps: CAPS, encounterId: SSZORAK, mythReceived: true, wornItemLevel: 334 })).toBe(true);
    expect(isBestInSlot({ caps: CAPS, encounterId: SSZORAK, mythReceived: true, wornItemLevel: 341 })).toBe(true);
  });

  it('is best in slot at 334 also on a boss whose bonus roll can give 344 (the bonus roll is only an upgrade)', () => {
    expect(isBestInSlot({ caps: CAPS, encounterId: ULATEK, mythReceived: true, wornItemLevel: 334 })).toBe(true);
    expect(isBestInSlot({ caps: CAPS, encounterId: ULATEK, mythReceived: true, wornItemLevel: 344 })).toBe(true);
  });

  it('is not best in slot below the drop maximum', () => {
    expect(isBestInSlot({ caps: CAPS, encounterId: SSZORAK, mythReceived: true, wornItemLevel: 321 })).toBe(false);
  });

  it('counts a received Myth drop as a top-difficulty drop when the worn item level is unknown', () => {
    expect(isBestInSlot({ caps: CAPS, encounterId: SSZORAK, mythReceived: true })).toBe(true);
    expect(isBestInSlot({ caps: CAPS, encounterId: ULATEK, mythReceived: true })).toBe(true);
    expect(isBestInSlot({ caps: CAPS, encounterId: SSZORAK, mythReceived: false })).toBe(false);
  });

  it('falls back to the Myth tier when the season has no item level caps', () => {
    expect(isBestInSlot({ caps: null, mythReceived: true })).toBe(true);
    expect(isBestInSlot({ caps: undefined, mythReceived: false })).toBe(false);
  });
});

describe('bonusRollUpgradeTo', () => {
  it('offers the bonus roll level for a Myth item that can still be upgraded', () => {
    expect(bonusRollUpgradeTo({ caps: CAPS, encounterId: ULATEK, mythReceived: true, wornItemLevel: 341 })).toBe(344);
    expect(bonusRollUpgradeTo({ caps: CAPS, encounterId: ULATEK, mythReceived: true })).toBe(344);
  });

  it('offers nothing when the item is at its best, not owned, or bonus rolls give no more than a drop', () => {
    expect(bonusRollUpgradeTo({ caps: CAPS, encounterId: ULATEK, mythReceived: true, wornItemLevel: 344 })).toBeNull();
    expect(bonusRollUpgradeTo({ caps: CAPS, encounterId: ULATEK, mythReceived: false })).toBeNull();
    expect(bonusRollUpgradeTo({ caps: CAPS, encounterId: SSZORAK, mythReceived: true, wornItemLevel: 334 })).toBeNull();
    expect(bonusRollUpgradeTo({ caps: { ...CAPS, bonusRollEnabled: false }, encounterId: ULATEK, mythReceived: true })).toBeNull();
    expect(bonusRollUpgradeTo({ caps: null, mythReceived: true })).toBeNull();
  });
});

describe('minimumDifficulty', () => {
  const CAPS_HERO: ItemLevelCaps = { ...CAPS, heroMaxItemLevel: 321 };
  const { HEROIC, MYTHIC } = RaidDifficulty;

  it('needs Mythic for a 344 bonus roll upgrade when the piece is 341: a Heroic bonus roll only gives 334', () => {
    expect(minimumDifficulty({ caps: CAPS_HERO, way: 'bonus_roll', have: 341, encounterId: ULATEK })).toBe(MYTHIC);
  });

  it('needs Mythic for a bonus roll when the piece is a catalysed 334 (the Mythic variant): only 344 is better', () => {
    expect(minimumDifficulty({ caps: CAPS_HERO, way: 'bonus_roll', have: 334, encounterId: 2883 })).toBe(MYTHIC);
  });

  it('lets a Heroic bonus roll help a Hero or Normal piece, because it gives a Mythic version', () => {
    expect(minimumDifficulty({ caps: CAPS_HERO, way: 'bonus_roll', have: 321, encounterId: ULATEK })).toBe(HEROIC);
    expect(minimumDifficulty({ caps: CAPS_HERO, way: 'bonus_roll', have: 300, encounterId: SSZORAK })).toBe(HEROIC);
  });

  it('needs Mythic for a drop once the piece is Hero level, and Heroic is enough when there is nothing yet', () => {
    expect(minimumDifficulty({ caps: CAPS_HERO, way: 'drop', have: 321 })).toBe(MYTHIC);
    expect(minimumDifficulty({ caps: CAPS_HERO, way: 'drop', have: 300 })).toBe(HEROIC);
    expect(minimumDifficulty({ caps: CAPS_HERO, way: 'drop', have: null })).toBe(HEROIC);
  });

  it('has nothing to gain when the piece is already the best that way can give', () => {
    expect(minimumDifficulty({ caps: CAPS_HERO, way: 'drop', have: 334 })).toBeNull();
    expect(minimumDifficulty({ caps: CAPS_HERO, way: 'bonus_roll', have: 334, encounterId: SSZORAK })).toBeNull();
    expect(minimumDifficulty({ caps: CAPS_HERO, way: 'bonus_roll', have: 344, encounterId: ULATEK })).toBeNull();
  });

  it('only advises Mythic for a drop when the Hero maximum is unknown, and has no bonus roll without bonus rolls', () => {
    expect(minimumDifficulty({ caps: CAPS, way: 'drop', have: null })).toBe(MYTHIC);
    expect(minimumDifficulty({ caps: { ...CAPS_HERO, bonusRollEnabled: false }, way: 'bonus_roll', have: null })).toBeNull();
  });
});
