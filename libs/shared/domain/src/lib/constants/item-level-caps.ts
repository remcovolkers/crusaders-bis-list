import { RaidDifficulty } from '../enums/raid-difficulty.enum';

/**
 * What the best item levels are that a raider can get for an item, per season. A Myth boss drop gives at most
 * `maxItemLevel`, and that is what counts as best in slot. A bonus roll on a few bosses gives more (e.g. 344 on the
 * last two bosses): that is an upgrade of an item that is already best in slot, worth chasing but not required.
 */
export interface ItemLevelCaps {
  /** Highest item level a boss drop gives (top difficulty); from this level on an item is best in slot. */
  maxItemLevel: number;
  /**
   * Per boss (Blizzard encounter id): the item level a bonus roll can give when that is higher than `maxItemLevel`.
   * Bosses that are not listed give at most `maxItemLevel`.
   */
  bonusRollItemLevels: Record<string, number>;
  /** Whether the season has bonus rolls at all. */
  bonusRollEnabled: boolean;
  /**
   * Highest item level of the Hero track (what a Heroic drop tops out at). Only needed to tell which difficulty an
   * item can be gotten on; without it only Mythic is advised for drops.
   */
  heroMaxItemLevel?: number | null;
}

/** The best item level that can be obtained for an item of the given boss (a bonus roll can give more than a drop). */
export function bestObtainableItemLevel(caps: ItemLevelCaps, encounterId?: number | null): number {
  const viaBonusRoll =
    caps.bonusRollEnabled && encounterId != null ? caps.bonusRollItemLevels[String(encounterId)] : undefined;
  return Math.max(caps.maxItemLevel, viaBonusRoll ?? 0);
}

export interface ItemLevelState {
  /** Without caps (the season has none configured) the Myth tier is the best there is. */
  caps?: ItemLevelCaps | null;
  /** Blizzard encounter id of the boss that drops the item. */
  encounterId?: number | null;
  /** The raider has (reserved/received) this item on Myth tier. */
  mythReceived: boolean;
  /** Item level of the piece the raider currently wears, when known (armory sync). */
  wornItemLevel?: number | null;
}

/** The item level the raider has: the worn piece, else a received Myth drop counts as a top-difficulty drop. */
function itemLevelHad(state: ItemLevelState): number | null {
  if (state.wornItemLevel) return state.wornItemLevel;
  return state.mythReceived && state.caps ? state.caps.maxItemLevel : null;
}

/**
 * Best in slot: the raider has the item at the best item level a boss drop gives. A bonus roll that can give more
 * (see `bonusRollUpgradeTo`) does not stop an item from being best in slot.
 */
export function isBestInSlot(state: ItemLevelState): boolean {
  if (!state.caps) return state.mythReceived;
  const had = itemLevelHad(state);
  return had != null && had >= state.caps.maxItemLevel;
}

/**
 * The item level a bonus roll could still upgrade the raider's piece to, or null when there is no such upgrade
 * (not owned, already at the best, no bonus rolls, or the boss' bonus roll gives no more than a drop).
 */
export function bonusRollUpgradeTo(state: ItemLevelState): number | null {
  if (!state.caps || !state.caps.bonusRollEnabled) return null;
  const had = itemLevelHad(state);
  if (had == null) return null;
  const best = bestObtainableItemLevel(state.caps, state.encounterId);
  return best > had ? best : null;
}

/** The ways to get an item that depend on the difficulty of the kill. */
export type ChaseWay = 'drop' | 'bonus_roll';

/**
 * The item level a piece of this boss can have when it comes from the given way on the given difficulty:
 *  - a drop is Hero level on Heroic and the drop maximum on Mythic;
 *  - a bonus roll gives an item of a higher difficulty than the kill: a Mythic item (the drop maximum) when rolled on
 *    Heroic, and on Mythic the best a bonus roll gives on that boss (e.g. 344 on the last two bosses).
 * Null when the way does not exist (no bonus rolls this season, or no Hero maximum known).
 */
function yieldedItemLevel(caps: ItemLevelCaps, way: ChaseWay, difficulty: RaidDifficulty, encounterId?: number | null): number | null {
  if (way === 'drop') {
    if (difficulty === RaidDifficulty.MYTHIC) return caps.maxItemLevel;
    return caps.heroMaxItemLevel ?? null;
  }
  if (!caps.bonusRollEnabled) return null;
  return difficulty === RaidDifficulty.MYTHIC ? bestObtainableItemLevel(caps, encounterId) : caps.maxItemLevel;
}

/**
 * From which difficulty a drop or bonus roll can still improve the piece the raider has (`have`, null = nothing):
 *  - HEROIC: Heroic works, and so does Mythic ("Heroic or higher");
 *  - MYTHIC: only a Mythic kill gives something better;
 *  - null: nothing better can be gotten that way.
 * Examples (drops top out at 334, a bonus roll on Ula'tek gives 344 on Mythic): with a 341 piece only a Mythic bonus
 * roll helps; with a Hero (321) piece a Heroic bonus roll already gives a Mythic version (334), but a drop needs Mythic.
 */
export function minimumDifficulty(args: {
  caps: ItemLevelCaps;
  way: ChaseWay;
  have: number | null;
  encounterId?: number | null;
}): RaidDifficulty | null {
  const have = args.have ?? 0;
  for (const difficulty of [RaidDifficulty.HEROIC, RaidDifficulty.MYTHIC]) {
    const level = yieldedItemLevel(args.caps, args.way, difficulty, args.encounterId);
    if (level != null && level > have) return difficulty;
  }
  return null;
}
