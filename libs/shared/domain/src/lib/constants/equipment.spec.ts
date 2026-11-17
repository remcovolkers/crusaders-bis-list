import { AssignmentStatus } from '../enums/assignment-status.enum';
import { equippedItemTier, TrackItemLevels } from './equipment';

const LEVELS: TrackItemLevels = { mythFrom: 322, ambiguousFrom: 321 };
const { HERO_TIER, MYTH_TIER } = AssignmentStatus;

describe('equippedItemTier (with item level caps)', () => {
  it('treats everything from the Myth cap up as Myth, whatever the description says', () => {
    // a Heroic drop that has been upgraded to Myth level still says "Heroic"
    expect(equippedItemTier(334, 'Heroic', LEVELS)).toBe(MYTH_TIER);
    expect(equippedItemTier(334, 'Mythic', LEVELS)).toBe(MYTH_TIER);
    expect(equippedItemTier(341, 'Heroic Ascendant Venomforged: Myth', LEVELS)).toBe(MYTH_TIER);
    expect(equippedItemTier(322, null, LEVELS)).toBe(MYTH_TIER);
  });

  it('lets the description decide in the ambiguous band (Hero 6/6 and Myth 2/6 share an item level)', () => {
    expect(equippedItemTier(321, 'Mythic', LEVELS)).toBe(MYTH_TIER);
    expect(equippedItemTier(321, 'Heroic Ascendant Venomforged: Myth', LEVELS)).toBe(MYTH_TIER);
    expect(equippedItemTier(321, 'Heroic', LEVELS)).toBe(HERO_TIER);
    expect(equippedItemTier(321, 'Normal', LEVELS)).toBeNull();
  });

  it('counts only Heroic items below the ambiguous band, as Hero; Champion is not tracked', () => {
    expect(equippedItemTier(310, 'Heroic', LEVELS)).toBe(HERO_TIER);
    expect(equippedItemTier(310, 'Normal', LEVELS)).toBeNull();
    expect(equippedItemTier(300, null, LEVELS)).toBeNull();
    expect(equippedItemTier(300, 'Champion 4/6', LEVELS)).toBeNull();
  });

  it('ignores crafted items, even at a high item level', () => {
    expect(equippedItemTier(331, 'Tidal Crafted', LEVELS)).toBeNull();
  });
});

describe('equippedItemTier (without item level caps)', () => {
  it('falls back to the description', () => {
    expect(equippedItemTier(334, 'Mythic')).toBe(MYTH_TIER);
    expect(equippedItemTier(334, 'Heroic')).toBe(HERO_TIER);
    expect(equippedItemTier(334, 'Heroic Ascendant Venomforged: Myth')).toBe(MYTH_TIER);
    expect(equippedItemTier(334, 'Normal')).toBeNull();
    expect(equippedItemTier(334, undefined)).toBeNull();
  });

  it('is case insensitive and does not match part of a word', () => {
    expect(equippedItemTier(1, 'MYTHIC')).toBe(MYTH_TIER);
    expect(equippedItemTier(1, 'Heroicsomething')).toBeNull();
  });
});
